"""
Dataset pipeline: scrape images by (style, category), filter, and save.

Filters applied per image:
  1. rembg background removal
  2. validate_single_clothing_item (contour-based, from ml-server/util/error_handling.py)
  3. FashionCLIP coarse category confidence check (noise filter)

Output structure:
  custom_dataset/dataset/{style}/{category}/{style}_{category}_{n:03d}.png

Usage:
  python pipeline.py
  python pipeline.py --target 20   # change target per combo
"""

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
from util.prompts import COARSE_PROMPTS, PERSON_CHECK_PROMPTS, FINE_CATEGORY_PROMPTS
from util.analyze_img import clip_classify

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

MODEL_NAME = "patrickjohncyh/fashion-clip"
CLIP_CONFIDENCE_THRESHOLD = 0.70

STYLES = ["y2k", "goth", "cottagecore", "athleisure", "coquette", "business_casual"]

# Categories map to coarse CLIP keys — must match keys in COARSE_PROMPTS and FINE_CATEGORY_PROMPTS
CATEGORIES = ["top", "bottom", "outerwear", "shoe"]

# Target images per (style, coarse_category) combo, divided evenly among fine subcategories
DEFAULT_TARGET = 20

# How many raw images to download per fine subcategory (losses expected from filtering)
DOWNLOAD_MULTIPLIER = 5

OUTPUT_DIR = Path(__file__).parent / "dataset"

# Fine subcategories to search per (style, coarse_category).
# Falls back to all fine subcategories if a combo is not listed.
STYLE_FINE_CATEGORIES: dict[tuple[str, str], list[str]] = {
    ("y2k", "top"):        ["t-shirt", "tank top", "blouse", "long sleeve shirt"],
    ("y2k", "bottom"):     ["jeans", "skirt", "shorts", "leggings"],
    ("y2k", "outerwear"):  ["jacket", "cardigan"],
    ("y2k", "shoe"):       ["sneakers", "heels", "boots", "sandals"],

    ("goth", "top"):       ["t-shirt", "long sleeve shirt", "blouse"],
    ("goth", "bottom"):    ["jeans", "skirt", "trousers"],
    ("goth", "outerwear"): ["jacket", "coat", "trench coat", "blazer"],
    ("goth", "shoe"):      ["boots", "heels"],

    ("cottagecore", "top"):       ["blouse", "t-shirt", "sweater"],
    ("cottagecore", "bottom"):    ["skirt", "jeans", "trousers"],
    ("cottagecore", "outerwear"): ["cardigan", "jacket"],
    ("cottagecore", "shoe"):      ["flats", "sandals", "boots"],

    ("athleisure", "top"):       ["t-shirt", "tank top", "long sleeve shirt"],
    ("athleisure", "bottom"):    ["leggings", "shorts", "sweatpants"],
    ("athleisure", "outerwear"): ["jacket"],
    ("athleisure", "shoe"):      ["sneakers"],

    ("coquette", "top"):       ["blouse", "tank top", "t-shirt"],
    ("coquette", "bottom"):    ["skirt", "shorts"],
    ("coquette", "outerwear"): ["cardigan", "blazer"],
    ("coquette", "shoe"):      ["heels", "flats", "sandals"],

    ("business_casual", "top"):       ["blouse", "long sleeve shirt", "t-shirt"],
    ("business_casual", "bottom"):    ["trousers", "jeans", "skirt"],
    ("business_casual", "outerwear"): ["blazer", "cardigan", "trench coat"],
    ("business_casual", "shoe"):      ["heels", "loafers", "flats", "boots"],
}


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
) -> tuple[bool, str, Image.Image | None]:
    """
    Returns (accepted, reason, processed_image_or_None).
    processed_image is the background-removed RGBA image ready to save.
    """
    # Open
    try:
        raw = Image.open(image_path)
    except Exception as e:
        return False, f"cannot open: {e}", None

    # Step 1: remove background
    try:
        bg_removed = remove_bg(raw)
    except Exception as e:
        return False, f"rembg failed: {e}", None

    # Step 2: single-item contour check (reuses ml-server/util/error_handling.py)
    single, message = validate_single_clothing_item(bg_removed)
    if not single:
        return False, message, None

    rgb = bg_removed.convert("RGB")

    # Step 3: person check — reject if FashionCLIP thinks a person is wearing it
    person_label, person_conf, _ = clip_classify(rgb, PERSON_CHECK_PROMPTS, model, processor)
    if person_label == "on_person" and person_conf > 0.60:
        return False, f"person detected (conf={person_conf:.2f})", None

    # Step 4: FashionCLIP coarse confidence — reject if not clothing-like
    best_label, confidence, _ = clip_classify(rgb, COARSE_PROMPTS, model, processor)
    if confidence < CLIP_CONFIDENCE_THRESHOLD:
        return False, f"low clothing confidence {confidence:.2f} ('{best_label}')", None

    return True, f"accepted as '{best_label}' conf={confidence:.2f}", bg_removed


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

        with tempfile.TemporaryDirectory() as tmp:
            from icrawler.builtin import BingImageCrawler
            tmp_path = Path(tmp)

            crawler = BingImageCrawler(
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

                ok, reason, processed = process_image(img_path, model, processor)

                if ok:
                    dest = out_dir / f"{style}_{category}_{total_accepted + 1:03d}.png"
                    processed.save(dest, format="PNG")
                    total_accepted += 1
                    fine_accepted += 1
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

    total = 0
    for style in args.styles:
        print(f"\n{'=' * 50}")
        print(f"  STYLE: {style.upper()}")
        print(f"{'=' * 50}")
        for category in args.categories:
            saved = scrape_combo(style, category, args.target, model, processor)
            total += saved

    print(f"\nDone. Total images in dataset: {total}")
    print(f"Dataset location: {OUTPUT_DIR.resolve()}")


if __name__ == "__main__":
    main()
