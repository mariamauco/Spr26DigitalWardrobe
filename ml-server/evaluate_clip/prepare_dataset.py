"""
prepare_dataset.py
------------------
Downloads a sample of the Fashion Product Images dataset from Kaggle,
cleans it, filters out menswear, and maps article types to the
coarse category labels used in test.py.

REQUIREMENTS:
    pip install kaggle pandas Pillow

SETUP (one-time):
    1. Go to https://www.kaggle.com/settings → API → Create New Token
    2. Place the downloaded kaggle.json at ~/.kaggle/kaggle.json
    3. Run: chmod 600 ~/.kaggle/kaggle.json

USAGE:
    python prepare_dataset.py

OUTPUT:
    dataset/
    ├── images/          ← sampled product images
    ├── styles_clean.csv ← cleaned + label-mapped metadata
    └── label_report.txt ← mapping coverage report
"""

import os
import shutil
import zipfile
import pandas as pd
from pathlib import Path
from collections import Counter

# ─── CONFIG ──────────────────────────────────────────────────────────────────

# How many images to sample per coarse category (set to None for all)
SAMPLES_PER_CATEGORY = 150

# Use the small dataset (recommended — same labels, much faster download)
# Set to False if you want the full high-res version
USE_SMALL_DATASET = True

DATASET_SLUG = (
    "paramaggarwal/fashion-product-images-small"
    if USE_SMALL_DATASET
    else "paramaggarwal/fashion-product-images-dataset"
)

# Always create dataset/ next to this script, regardless of where you run it from
SCRIPT_DIR = Path(__file__).parent
OUTPUT_DIR = SCRIPT_DIR / "dataset"
IMAGES_DIR = OUTPUT_DIR / "images"
RAW_DIR = OUTPUT_DIR / "raw"

# ─── LABEL MAPPING ───────────────────────────────────────────────────────────
# Maps dataset's `articleType` values → your coarse category labels.
# Any articleType not listed here will be dropped as unmappable.

# Maps dataset's `articleType` → your fine category label (matching FINE_CATEGORY_PROMPTS keys).
# Labels here should exactly match what you pass to CLIP as "a photo of {label}".
# None means there's no close fine-category match (coarse label is still kept).

ARTICLE_TYPE_TO_FINE = {
    # ── top ──────────────────────────────────────────────────────────────────
    "Tshirts":          "t-shirt",
    "Polo Tshirts":     "t-shirt",
    "Shirts":           "shirt",
    "Tops":             "shirt",
    "Blouses":          "blouse",
    "Tank":             "tank top",
    "Sweaters":         "sweater",
    "Sweatshirts":      "hoodie",
    "Henley":           "long sleeve shirt",

    # ── bottom ───────────────────────────────────────────────────────────────
    "Jeans":            "jeans",
    "Jeggings":         "jeans",
    "Trousers":         "trousers",
    "Cargos":           "trousers",
    "Shorts":           "shorts",
    "Capris":           "shorts",
    "Skirts":           "skirt",
    "Leggings":         "leggings",
    "Tights":           "leggings",
    "Stockings":        "leggings",
    "Track Pants":      "sweatpants",
    "Sweatpants":       "sweatpants",

    # ── one_piece ─────────────────────────────────────────────────────────────
    "Dresses":          "dress",
    "Jumpsuit":         "jumpsuit",
    "Rompers":          "romper",
    "Overalls":         "overalls",
    "Dungarees":        "overalls",
    "Bodysuit":         "bodysuit",

    # ── outerwear ─────────────────────────────────────────────────────────────
    "Jackets":          "jacket",
    "Denim Jacket":     "jacket",
    "Windcheater":      "jacket",
    "Rain Jacket":      "jacket",
    "Coats":            "coat",
    "Blazers":          "blazer",
    "Cardigan":         "cardigan worn as outerwear",
    "Shrug":            "cardigan worn as outerwear",
    "Waistcoat":        "vest",

    # ── shoe ─────────────────────────────────────────────────────────────────
    "Casual Shoes":     "sneakers",
    "Sports Shoes":     "sneakers",
    "Sneakers":         "sneakers",
    "Shoes":            "sneakers",
    "Formal Shoes":     "loafers",
    "Loafers":          "loafers",
    "Moccasins":        "loafers",
    "Flats":            "flats",
    "Heels":            "heels",
    "Wedges":           "heels",
    "Platforms":        "heels",
    "Sandals":          "sandals",
    "Flip Flops":       "sandals",
    "Boots":            "boots",

    # ── accessory ─────────────────────────────────────────────────────────────
    "Handbags":         "handbag",
    "Clutches":         "handbag",
    "Backpacks":        "backpack",
    "Belts":            "belt",
    "Caps":             "hat",
    "Hats":             "hat",
    "Scarves":          "scarf",
    "Stoles":           "scarf",
    "Sunglasses":       "sunglasses",
    "Jewellery Set":    "jewelry",
    "Necklace and Chains": "jewelry",
    "Earrings":         "jewelry",
    "Bracelet":         "jewelry",
    "Ring":             "jewelry",
    "Bangle":           "jewelry",
    "Pendant":          "jewelry",
    "Wallets":          None,              # no fine category equivalent
}

ARTICLE_TYPE_TO_COARSE = {
    # ── top ──────────────────────────────────────────────────────────────────
    "Tshirts":          "top",
    "Polo Tshirts":     "top",
    "Shirts":           "top",
    "Tops":             "top",
    "Blouses":          "top",
    "Tank":             "top",
    "Sweaters":         "top",
    "Sweatshirts":      "top",
    "Henley":           "top",

    # ── bottom ───────────────────────────────────────────────────────────────
    "Jeans":            "bottom",
    "Jeggings":         "bottom",
    "Trousers":         "bottom",
    "Cargos":           "bottom",
    "Shorts":           "bottom",
    "Capris":           "bottom",
    "Skirts":           "bottom",
    "Leggings":         "bottom",
    "Tights":           "bottom",
    "Stockings":        "bottom",
    "Track Pants":      "bottom",
    "Sweatpants":       "bottom",

    # ── one_piece ─────────────────────────────────────────────────────────────
    "Dresses":          "one_piece",
    "Jumpsuit":         "one_piece",
    "Rompers":          "one_piece",
    "Overalls":         "one_piece",
    "Dungarees":        "one_piece",
    "Bodysuit":         "one_piece",

    # ── outerwear ─────────────────────────────────────────────────────────────
    "Jackets":          "outerwear",
    "Denim Jacket":     "outerwear",
    "Windcheater":      "outerwear",
    "Rain Jacket":      "outerwear",
    "Coats":            "outerwear",
    "Blazers":          "outerwear",
    "Cardigan":         "outerwear",
    "Shrug":            "outerwear",
    "Waistcoat":        "outerwear",

    # ── shoe ─────────────────────────────────────────────────────────────────
    "Casual Shoes":     "shoe",
    "Sports Shoes":     "shoe",
    "Sneakers":         "shoe",
    "Shoes":            "shoe",
    "Formal Shoes":     "shoe",
    "Loafers":          "shoe",
    "Moccasins":        "shoe",
    "Flats":            "shoe",
    "Heels":            "shoe",
    "Wedges":           "shoe",
    "Platforms":        "shoe",
    "Sandals":          "shoe",
    "Flip Flops":       "shoe",
    "Boots":            "shoe",

    # ── accessory ─────────────────────────────────────────────────────────────
    "Handbags":         "accessory",
    "Clutches":         "accessory",
    "Backpacks":        "accessory",
    "Wallets":          "accessory",
    "Belts":            "accessory",
    "Caps":             "accessory",
    "Hats":             "accessory",
    "Scarves":          "accessory",
    "Stoles":           "accessory",
    "Sunglasses":       "accessory",
    "Jewellery Set":    "accessory",
    "Necklace and Chains": "accessory",
    "Earrings":         "accessory",
    "Bracelet":         "accessory",
    "Ring":             "accessory",
    "Bangle":           "accessory",
    "Pendant":          "accessory",
}

# Gender values to KEEP (drop everything else, i.e. "Men" and "Boys")
ALLOWED_GENDERS = {"Women", "Unisex"}

# Columns to keep after cleaning (everything else is dropped)
KEEP_COLUMNS = ["id", "gender", "articleType", "baseColour", "season", "usage", "coarse_category", "fine_category"]


# ─── HELPERS ─────────────────────────────────────────────────────────────────

def download_dataset():
    """Download and unzip the Kaggle dataset into RAW_DIR. Skips if already downloaded."""
    try:
        import kaggle  # noqa: F401 — triggers credential check
    except ImportError:
        raise SystemExit("❌  kaggle package not found. Run: pip install kaggle")

    # Check if already downloaded (styles.csv present in raw/)
    existing = list(RAW_DIR.rglob("styles.csv"))
    if existing:
        print(f"⏭️  Dataset already downloaded, skipping. (found {existing[0]})")
        return

    RAW_DIR.mkdir(parents=True, exist_ok=True)

    print(f"⬇️  Downloading dataset: {DATASET_SLUG} ...")
    os.system(f'kaggle datasets download -d "{DATASET_SLUG}" -p "{RAW_DIR}" --unzip')
    print("✅  Download complete.")


def find_csv(search_root: Path) -> Path:
    """Locate styles.csv anywhere under search_root."""
    matches = list(search_root.rglob("styles.csv"))
    if not matches:
        raise FileNotFoundError(f"Could not find styles.csv under {search_root}")
    return matches[0]


def find_images_folder(search_root: Path) -> Path:
    """Locate the images/ subfolder."""
    matches = [p for p in search_root.rglob("images") if p.is_dir()]
    if not matches:
        raise FileNotFoundError(f"Could not find an images/ folder under {search_root}")
    # prefer the one that actually contains files
    matches.sort(key=lambda p: -len(list(p.iterdir())))
    return matches[0]


def clean_and_map(csv_path: Path) -> pd.DataFrame:
    """Load, filter, and label-map the styles CSV."""
    print(f"📄  Loading {csv_path} ...")
    df = pd.read_csv(csv_path, on_bad_lines="skip")
    print(f"   Raw rows: {len(df)}")

    # ── 1. Drop menswear ──────────────────────────────────────────────────────
    df = df[df["gender"].isin(ALLOWED_GENDERS)]
    print(f"   After gender filter (keep {ALLOWED_GENDERS}): {len(df)} rows")

    # ── 2. Map to coarse + fine category ─────────────────────────────────────
    df["coarse_category"] = df["articleType"].map(ARTICLE_TYPE_TO_COARSE)
    unmapped = df["coarse_category"].isna().sum()
    df = df.dropna(subset=["coarse_category"])
    print(f"   Unmapped / dropped article types: {unmapped}")
    print(f"   After category mapping: {len(df)} rows")

    # Fine category: mapped where possible, NaN where there's no close match.
    # Rows with no fine label are still kept — valid for coarse eval,
    # just excluded when you run fine-category evaluation.
    df["fine_category"] = df["articleType"].map(ARTICLE_TYPE_TO_FINE)
    no_fine = df["fine_category"].isna().sum()
    print(f"   Items with no fine category (coarse-only): {no_fine}")

    # ── 3. Keep only relevant columns ─────────────────────────────────────────
    # NOTE: do this AFTER all mapping is done — articleType must still be present
    existing_cols = [c for c in KEEP_COLUMNS if c in df.columns]
    df = df[existing_cols]

    return df


def sample_balanced(df: pd.DataFrame, n: int) -> pd.DataFrame:
    """Sample up to n rows per coarse_category (stable across pandas versions)."""
    parts = []
    for _, g in df.groupby("coarse_category", sort=False):
        parts.append(g.sample(min(len(g), n), random_state=42))
    return pd.concat(parts, ignore_index=True)


def copy_images(df: pd.DataFrame, src_images_dir: Path):
    """Copy sampled images into OUTPUT_DIR/images/."""
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    missing = 0
    for img_id in df["id"]:
        src = src_images_dir / f"{img_id}.jpg"
        dst = IMAGES_DIR / f"{img_id}.jpg"
        if src.exists():
            shutil.copy2(src, dst)
        else:
            missing += 1
    if missing:
        print(f"  {missing} image files not found (IDs present in CSV but image missing)")


def write_report(df: pd.DataFrame, original_df: pd.DataFrame):
    """Write a coverage report to label_report.txt."""
    report_path = OUTPUT_DIR / "label_report.txt"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("=== LABEL MAPPING REPORT ===\n\n")

        f.write("── Coarse category distribution (final sample) ──\n")
        counts = df["coarse_category"].value_counts()
        for cat, count in counts.items():
            f.write(f"  {cat:<15} {count}\n")

        f.write("\n── Original articleType → coarse_category breakdown ──\n")
        breakdown = (
            original_df[original_df["coarse_category"].notna()]
            .groupby(["articleType", "coarse_category"])
            .size()
            .reset_index(name="count")
            .sort_values(["coarse_category", "count"], ascending=[True, False])
        )
        for _, row in breakdown.iterrows():
            f.write(f"  {row['coarse_category']:<15} ← {row['articleType']:<30} ({row['count']})\n")

        f.write("\n── Fine category distribution (final sample) ──\n")
        fine_counts = df["fine_category"].value_counts(dropna=False)
        for cat, count in fine_counts.items():
            label = str(cat) if pd.notna(cat) else "(no fine category)"
            f.write(f"  {label:<40} {count}\n")

        f.write("\n── articleType → fine_category mapping used ──\n")
        fine_breakdown = (
            original_df[original_df["fine_category"].notna()]
            .groupby(["articleType", "fine_category"])
            .size()
            .reset_index(name="count")
            .sort_values(["fine_category", "count"], ascending=[True, False])
        )
        for _, row in fine_breakdown.iterrows():
            f.write(f"  {row['fine_category']:<40} <- {row['articleType']:<30} ({row['count']})\n")

        f.write("\n── articleTypes with no fine category (coarse-only) ──\n")
        coarse_only = (
            original_df[original_df["coarse_category"].notna() & original_df["fine_category"].isna()]
            .groupby("articleType")
            .size()
            .sort_values(ascending=False)
        )
        for article_type, count in coarse_only.items():
            f.write(f"  {article_type:<40} ({count} items)\n")

        f.write("\n── Unmapped articleTypes (dropped entirely) ──\n")
        all_types = set(original_df["articleType"].dropna().unique())
        mapped_types = set(ARTICLE_TYPE_TO_COARSE.keys())
        unmapped = sorted(all_types - mapped_types)
        for t in unmapped:
            n = (original_df["articleType"] == t).sum()
            f.write(f"  {t:<40} ({n} items)\n")

    print(f"📊  Report written to {report_path}")


# ─── MAIN ────────────────────────────────────────────────────────────────────

def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Step 1: Download
    download_dataset()

    # Step 2: Locate files
    csv_path = find_csv(RAW_DIR)
    src_images_dir = find_images_folder(RAW_DIR)
    print(f"   CSV found:    {csv_path}")
    print(f"   Images found: {src_images_dir}")

    # Step 3: Clean + map labels
    df_clean = clean_and_map(csv_path)
    df_with_categories = df_clean.copy()  # keep full for report

    # Step 4: Sample
    if SAMPLES_PER_CATEGORY:
        df_sampled = sample_balanced(df_clean, SAMPLES_PER_CATEGORY)
        print(f"   Sampled {len(df_sampled)} rows ({SAMPLES_PER_CATEGORY} per category max)")
    else:
        df_sampled = df_clean

    # Step 5: Copy images
    print("🖼️  Copying images ...")
    copy_images(df_sampled, src_images_dir)

    # Step 6: Save cleaned CSV
    csv_out = OUTPUT_DIR / "styles_clean.csv"
    df_sampled.to_csv(csv_out, index=False)
    print(f"✅  Saved cleaned CSV → {csv_out}")

    # Step 7: Report
    write_report(df_sampled, df_with_categories)

    print("\n🎉  Done! Your dataset is ready in ./dataset/")
    print(f"    Images : {len(list(IMAGES_DIR.glob('*.jpg')))} files")
    print(f"    CSV    : {csv_out}")
    print(f"    Report : {OUTPUT_DIR / 'label_report.txt'}")


if __name__ == "__main__":
    main()