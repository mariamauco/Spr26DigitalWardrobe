"""
Dataset pipeline: scrape images by (style, category), filter, and save.

Filters applied per image:
  1. rembg background removal
  2. validate_single_clothing_item (contour-based, from ml-server/util/error_handling.py)
  3. FashionCLIP coarse category confidence check (noise filter)

Output structure:
  custom_dataset/dataset/{style}/{category}/{style}_{category}_{n:03d}.png
  custom_dataset/dataset/metadata.csv

Usage:
  python pipeline.py
  python pipeline.py --target 20   # change target per combo
"""

import csv
import json
import sys
import argparse
import tempfile
from pathlib import Path

# Make ml-server/util importable
ML_SERVER_PATH = Path(__file__).parent.parent
sys.path.insert(0, str(ML_SERVER_PATH))

import torch
from PIL import Image
from transformers import CLIPModel, CLIPProcessor

from util.error_handling import validate_single_clothing_item
from util.remove_bg import remove_bg
from util.prompts import (
    COARSE_PROMPTS, PERSON_CHECK_PROMPTS, FINE_CATEGORY_PROMPTS,
    SLEEVE_PROMPTS, LEG_COVERAGE_PROMPTS, OUTERWEAR_COVERAGE_PROMPTS,
)
from util.analyze_img import clip_classify, get_img_embedding

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

MODEL_NAME = "patrickjohncyh/fashion-clip"
CLIP_CONFIDENCE_THRESHOLD = 0.70

STYLES = ["y2k", "goth", "cottagecore", "athleisure", "coquette", "business_casual"]

# Categories map to coarse CLIP keys — must match keys in COARSE_PROMPTS and FINE_CATEGORY_PROMPTS
CATEGORIES = ["top", "bottom", "one_piece", "outerwear", "shoe"]

# Target images per (style, coarse_category) combo, divided evenly among fine subcategories
DEFAULT_TARGET = 20

# How many raw images to download per fine subcategory (losses expected from filtering)
DOWNLOAD_MULTIPLIER = 5

OUTPUT_DIR = Path(__file__).parent / "dataset"

CSV_PATH = OUTPUT_DIR / "metadata.csv"
CSV_COLUMNS = [
    "image_path", "style", "coarse_category", "fine_tag",
    "source_url", "coarse_conf",
    "sleeve_label", "coverage_label",
    "embedding",
]

# Fine subcategories to search per (style, coarse_category).
# Falls back to all fine subcategories if a combo is not listed.
STYLE_FINE_CATEGORIES: dict[tuple[str, str], list[str]] = {
    ("y2k", "one_piece"):  ["dress"],
    ("y2k", "top"):        ["t-shirt", "tank top", "blouse", "long sleeve shirt"],
    ("y2k", "bottom"):     ["jeans", "skirt", "shorts", "leggings"],
    ("y2k", "outerwear"):  ["jacket", "cardigan"],
    ("y2k", "shoe"):       ["sneakers", "heels", "boots", "sandals"],

    ("goth", "one_piece"):  ["dress", "jumpsuit"],
    ("goth", "top"):       ["t-shirt", "long sleeve shirt", "blouse"],
    ("goth", "bottom"):    ["jeans", "skirt", "trousers"],
    ("goth", "outerwear"): ["jacket", "coat", "trench coat", "blazer"],
    ("goth", "shoe"):      ["boots", "heels"],

    ("vintage", "one_piece"): ["dress", "romper", "overalls"],
    ("vintage", "top"):       ["blouse", "t-shirt", "sweater"],
    ("vintage", "bottom"):    ["skirt", "jeans", "trousers"],
    ("vintage", "outerwear"): ["cardigan", "jacket"],
    ("vintage", "shoe"):      ["flats", "sandals", "boots"],

    ("athleisure", "one_piece"): ["jumpsuit", "romper", "bodysuit"],
    ("athleisure", "top"):       ["t-shirt", "tank top", "long sleeve shirt"],
    ("athleisure", "bottom"):    ["leggings", "shorts", "sweatpants"],
    ("athleisure", "outerwear"): ["jacket"],
    ("athleisure", "shoe"):      ["sneakers"],

    ("old money", "one_piece"):  ["dress", "romper", "bodysuit"],
    ("old money", "top"):       ["blouse", "tank top", "t-shirt"],
    ("old money", "bottom"):    ["skirt", "shorts"],
    ("old money", "outerwear"): ["cardigan", "blazer"],
    ("old money", "shoe"):      ["heels", "flats", "sandals"],

    ("business_casual", "one_piece"): ["dress", "jumpsuit", "two-piece"],
    ("business_casual", "top"):       ["blouse", "long sleeve shirt", "shirt"],
    ("business_casual", "bottom"):    ["trousers", "skirt", "pants"],
    ("business_casual", "outerwear"): ["blazer", "trench coat"],
    ("business_casual", "shoe"):      ["heels", "loafers", "flats"],
}


# ---------------------------------------------------------------------------
# URL-capturing downloader
# ---------------------------------------------------------------------------

def make_url_capturing_downloader(url_map: dict):
    """
    Returns an ImageDownloader subclass that records filename → source_url
    into url_map as images are downloaded.
    """
    from icrawler import ImageDownloader

    class _URLCapturingDownloader(ImageDownloader):
        def get_filename(self, task, default_ext):
            filename = super().get_filename(task, default_ext)
            _URLCapturingDownloader.url_map[filename] = task.get("file_url", "")
            return filename

    _URLCapturingDownloader.url_map = url_map
    return _URLCapturingDownloader


# ---------------------------------------------------------------------------
# Model
# ---------------------------------------------------------------------------

def load_model() -> tuple[CLIPModel, CLIPProcessor, str]:
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Loading {MODEL_NAME} on {device}...")
    model = CLIPModel.from_pretrained(MODEL_NAME).to(device)
    processor = CLIPProcessor.from_pretrained(MODEL_NAME)
    model.eval()
    print("Model loaded.\n")
    return model, processor, device


# ---------------------------------------------------------------------------
# Per-image filter
# ---------------------------------------------------------------------------

def process_image(
    image_path: Path,
    model: CLIPModel,
    processor: CLIPProcessor,
) -> tuple[bool, str, Image.Image | None, str, float, str, str, list[float]]:
    """
    Returns:
        accepted        bool
        reason          str
        processed_image RGBA Image or None
        coarse_label    str   (e.g. "top")
        coarse_conf     float
        sleeve_label    str   (e.g. "short_sleeve" or "")
        coverage_label  str   (e.g. "pants" or "light_layer" or "")
        embedding       list[float] length 512 ([] on rejection)
    """
    _reject = lambda reason: (False, reason, None, "", 0.0, "", "", [])

    # Open
    try:
        raw = Image.open(image_path)
    except Exception as e:
        return _reject(f"cannot open: {e}")

    # Step 1: remove background
    try:
        bg_removed = remove_bg(raw)
    except Exception as e:
        return _reject(f"rembg failed: {e}")

    # Step 2: single-item contour check (reuses ml-server/util/error_handling.py)
    single, message = validate_single_clothing_item(bg_removed)
    if not single:
        return _reject(message)

    rgb = bg_removed.convert("RGB")

    # Step 3: person check — reject if FashionCLIP thinks a person is wearing it
    person_label, person_conf, _ = clip_classify(rgb, PERSON_CHECK_PROMPTS, model, processor)
    if person_label == "on_person" and person_conf > 0.60:
        return _reject(f"person detected (conf={person_conf:.2f})")

    # Step 4: FashionCLIP coarse confidence — reject if not clothing-like
    best_label, confidence, _ = clip_classify(rgb, COARSE_PROMPTS, model, processor)
    if confidence < CLIP_CONFIDENCE_THRESHOLD:
        return _reject(f"low clothing confidence {confidence:.2f} ('{best_label}')")

    # Step 5: sleeve label (top and one_piece)
    sleeve_label = ""
    if best_label in ("top", "one_piece"):
        sleeve_label, _, _ = clip_classify(rgb, SLEEVE_PROMPTS, model, processor)

    # Step 6: coverage label
    coverage_label = ""
    if best_label == "outerwear":
        coverage_label, _, _ = clip_classify(rgb, OUTERWEAR_COVERAGE_PROMPTS, model, processor)
    elif best_label in ("bottom", "one_piece"):
        coverage_label, _, _ = clip_classify(rgb, LEG_COVERAGE_PROMPTS, model, processor)

    # Step 7: embedding
    embedding = get_img_embedding(model, processor, rgb)

    return True, f"accepted as '{best_label}' conf={confidence:.2f}", bg_removed, best_label, confidence, sleeve_label, coverage_label, embedding


# ---------------------------------------------------------------------------
# Per-combo scrape + filter
# ---------------------------------------------------------------------------

def _count_saved(folder: Path) -> int:
    return len(list(folder.glob("*.png"))) + len(list(folder.glob("*.jpg")))


def scrape_combo(
    style: str,
    category: str,
    target: int,
    model: CLIPModel,
    processor: CLIPProcessor,
    csv_writer: "csv.DictWriter",
    csv_fh,
) -> int:
    out_dir = OUTPUT_DIR / style / category
    out_dir.mkdir(parents=True, exist_ok=True)

    already = _count_saved(out_dir)
    if already >= target:
        print(f"  [{style}/{category}] already has {already} images — skipping.")
        return already

    fine_cats = STYLE_FINE_CATEGORIES.get((style, category), list(FINE_CATEGORY_PROMPTS[category].keys()))
    per_fine = max(1, target // len(fine_cats))

    total_accepted = already
    rejections: dict[str, int] = {"multiple_items": 0, "no_item": 0, "person_detected": 0, "low_confidence": 0, "other": 0}

    for fine_cat in fine_cats:
        if total_accepted >= target:
            break

        fine_target = min(per_fine, target - total_accepted)
        query = f"{style} women's {fine_cat}"
        fine_accepted = 0

        print(f"  [{style}/{category}/{fine_cat}] searching: '{query}' (want {fine_target})")

        url_map: dict[str, str] = {}

        with tempfile.TemporaryDirectory() as tmp:
            from icrawler.builtin import BingImageCrawler
            tmp_path = Path(tmp)

            crawler = BingImageCrawler(
                downloader_cls=make_url_capturing_downloader(url_map),
                storage={"root_dir": str(tmp_path)},
                feeder_threads=1,
                parser_threads=1,
                downloader_threads=4,
            )
            crawler.crawl(keyword=query, max_num=fine_target * DOWNLOAD_MULTIPLIER)

            for img_path in sorted(tmp_path.iterdir()):
                if fine_accepted >= fine_target:
                    break
                if img_path.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"}:
                    continue

                ok, reason, processed, coarse_label, coarse_conf, sleeve_label, coverage_label, embedding = \
                    process_image(img_path, model, processor)

                if ok:
                    dest = out_dir / f"{style}_{category}_{total_accepted + 1:03d}.png"
                    processed.save(dest, format="PNG")
                    total_accepted += 1
                    fine_accepted += 1

                    source_url = url_map.get(img_path.name, "")
                    csv_writer.writerow({
                        "image_path":      f"{style}/{category}/{dest.name}",
                        "style":           style,
                        "coarse_category": coarse_label,
                        "fine_tag":        fine_cat,
                        "source_url":      source_url,
                        "coarse_conf":     f"{coarse_conf:.4f}",
                        "sleeve_label":    sleeve_label,
                        "coverage_label":  coverage_label,
                        "embedding":       json.dumps(embedding),
                    })
                    csv_fh.flush()

                    print(f"    [OK]   {img_path.name} → {dest.name}  ({reason})")
                else:
                    if "Multiple" in reason:
                        rejections["multiple_items"] += 1
                    elif "No clothing" in reason:
                        rejections["no_item"] += 1
                    elif "person detected" in reason:
                        rejections["person_detected"] += 1
                    elif "low clothing" in reason:
                        rejections["low_confidence"] += 1
                    else:
                        rejections["other"] += 1
                    print(f"    [SKIP] {img_path.name}: {reason}")

        print(f"    → {fine_cat}: {fine_accepted}/{fine_target} accepted")

    saved_this_run = total_accepted - already
    print(
        f"  → {style}/{category}: saved {saved_this_run} new images "
        f"(total {total_accepted}/{target}).  Rejections: {rejections}"
    )
    return total_accepted


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--target", type=int, default=DEFAULT_TARGET,
                        help="Target images per (style, category) combo")
    parser.add_argument("--styles", nargs="+", default=STYLES,
                        help="Subset of styles to run")
    parser.add_argument("--categories", nargs="+", default=CATEGORIES,
                        help="Subset of categories to run")
    args = parser.parse_args()

    model, processor, _ = load_model()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    csv_file_exists = CSV_PATH.exists()
    csv_fh = open(CSV_PATH, "a", newline="", encoding="utf-8")
    csv_writer = csv.DictWriter(csv_fh, fieldnames=CSV_COLUMNS)
    if not csv_file_exists:
        csv_writer.writeheader()
        csv_fh.flush()

    total = 0
    try:
        for style in args.styles:
            print(f"\n{'=' * 50}")
            print(f"  STYLE: {style.upper()}")
            print(f"{'=' * 50}")
            for category in args.categories:
                saved = scrape_combo(style, category, args.target, model, processor, csv_writer, csv_fh)
                total += saved
    finally:
        csv_fh.close()

    print(f"\nDone. Total images in dataset: {total}")
    print(f"Dataset location: {OUTPUT_DIR.resolve()}")
    print(f"Metadata CSV: {CSV_PATH.resolve()}")


if __name__ == "__main__":
    main()
