# evaluate_clip.py
# ------------------------------------------------------------
# Evaluates Fashion-CLIP coarse + fine category classification
# against ground-truth labels in dataset/styles_clean.csv
#
# Requirements:
#   pip install pandas pillow numpy torch transformers rembg tqdm
#
# Folder layout expected:
#   dataset/
#     styles_clean.csv
#     images/
#       12345.jpg
#       ...
#
# Usage:
#   python evaluate_clip.py
# ------------------------------------------------------------

import os
from pathlib import Path
import numpy as np
import pandas as pd
from PIL import Image
from tqdm import tqdm

import torch
from transformers import CLIPProcessor, CLIPModel

# Optional background removal
USE_REMBG = False
if USE_REMBG:
    try:
        from rembg import remove
    except ImportError:
        raise SystemExit("rembg not installed. Run: pip install rembg   (or set USE_REMBG = False)")


# -------------------- PROMPTS --------------------

COARSE_PROMPTS = {
    "top": "a photo of an upper body base layer garment such as a t-shirt, blouse, sweater, or tank top, worn directly on the torso",
    "bottom": "a photo of a lower body garment such as jeans, trousers, shorts, leggings, or a skirt, worn on the legs or waist",
    "one_piece": "a photo of a single garment covering both the upper and lower body, such as a dress, jumpsuit, or romper, worn as a complete outfit",
    "outerwear": "a photo of a structured outer layer garment worn over other clothing, such as a jacket, coat, blazer, or cardigan",
    "shoe": "a photo of footwear worn on the feet, such as sneakers, boots, heels, sandals, or flats",
    "accessory": "a photo of a non-footwear fashion accessory such as a handbag, belt, hat, scarf, or jewelry",
}

FINE_CATEGORY_PROMPTS = {
    "top": {
        "t-shirt":          "a photo of a t-shirt or short sleeve top with no collar or buttons",
        "long sleeve shirt": "a photo of a long sleeve shirt or fitted long sleeve top",
        "shirt":            "a photo of a button-down shirt or woven shirt with a collar",
        "blouse":           "a photo of a blouse with soft fabric, feminine details or ruffles",
        "tank top":         "a photo of a sleeveless tank top or camisole with thin straps",
        "sweater":          "a photo of a knit sweater or pullover with no hood",
        "hoodie":           "a photo of a hoodie sweatshirt with a hood",
    },
    "bottom": {
        "jeans":        "a photo of denim jeans with visible stitching and pockets",
        "trousers":     "a photo of tailored trousers or dress pants with a clean drape",
        "pants":        "a photo of slim or relaxed fit chino or casual trousers",
        "leggings":     "a photo of form-fitting leggings or tights in stretchy fabric",
        "sweatpants":   "a photo of loose sweatpants or joggers in fleece or jersey fabric",
        "shorts":       "a photo of shorts above the knee",
        "skirt":        "a photo of a skirt, either mini, midi, or maxi length",
    },
    "one_piece": {
        "dress":        "a photo of a dress, either casual, midi, or formal length",
        "jumpsuit":     "a photo of a jumpsuit with long pants and a connected top",
        "romper":       "a photo of a short romper with shorts and a connected top",
        "overalls":     "a photo of overalls or dungarees with bib and straps",
        "bodysuit":     "a photo of a tight fitted bodysuit snapping at the crotch",
    },
    "outerwear": {
        "jacket":       "a photo of a casual jacket such as a bomber, denim, or zip-up jacket",
        "coat":         "a photo of a long coat or wool coat",
        "blazer":       "a photo of a tailored blazer with structured shoulders and lapels",
        "cardigan":     "a photo of a knit cardigan with buttons down the front",
        "vest":         "a photo of a sleeveless vest or gilet worn as outerwear",
        "trench coat":  "a photo of a long trench coat with a belt",
    },
    "shoe": {
        "sneakers":     "a photo of sneakers or athletic shoes with rubber soles",
        "boots":        "a photo of ankle or knee-high boots",
        "loafers":      "a photo of loafers or moccasins with a low flat sole",
        "flats":        "a photo of flat ballet flats or slip-on flats with no heel",
        "heels":        "a photo of high heels, stilettos, or block heels",
        "sandals":      "a photo of open-toe sandals or strappy sandals",
    },
    "accessory": {
        "handbag":      "a photo of a handbag, purse, or clutch carried by hand or on the shoulder",
        "backpack":     "a photo of a backpack worn on the back with two straps",
        "belt":         "a photo of a leather or fabric belt with a buckle",
        "hat":          "a photo of a hat, cap, or beanie worn on the head",
        "scarf":        "a photo of a scarf or wrap worn around the neck",
        "jewelry":      "a photo of jewelry such as earrings, necklace, bracelet, or ring",
        "sunglasses":   "a photo of sunglasses worn on the face",
    },
}


# -------------------- CONFIG --------------------

SCRIPT_DIR = Path(__file__).parent
DATASET_DIR = SCRIPT_DIR / "dataset"
CSV_PATH = DATASET_DIR / "styles_clean.csv"
IMAGES_DIR = DATASET_DIR / "images"
OUT_DIR = SCRIPT_DIR / "eval_out"
OUT_DIR.mkdir(parents=True, exist_ok=True)

MODEL_NAME = "patrickjohncyh/fashion-clip"

# Fine evaluation mode:
#   "true_coarse" = pick fine prompts based on ground-truth coarse_category (best-case for fine)
#   "pred_coarse" = pick fine prompts based on predicted coarse_category (end-to-end realistic)
FINE_MODE = "true_coarse"

# Only evaluate fine where a true fine label exists (recommended)
EVAL_FINE_ONLY_WHEN_TRUE_EXISTS = True

# Device
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


# -------------------- HELPERS --------------------

def load_image_rgb(path: Path) -> Image.Image:
    img = Image.open(path).convert("RGB")
    if USE_REMBG:
        # rembg works on bytes; returns bytes (usually PNG with alpha)
        # We'll composite onto white background to keep it RGB.
        import io
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        out_bytes = remove(buf.getvalue())
        out_img = Image.open(io.BytesIO(out_bytes))
        if out_img.mode in ("RGBA", "LA"):
            bg = Image.new("RGBA", out_img.size, (255, 255, 255, 255))
            out_img = Image.alpha_composite(bg, out_img.convert("RGBA")).convert("RGB")
        else:
            out_img = out_img.convert("RGB")
        return out_img
    return img


@torch.inference_mode()
def clip_classify(image: Image.Image, label_to_prompt: dict, model: CLIPModel, processor: CLIPProcessor):
    """
    label_to_prompt: dict[label] -> prompt(str)
    Returns: (best_label, confidence, probs_dict)
    """
    labels = list(label_to_prompt.keys())
    prompts = [label_to_prompt[l] for l in labels]

    inputs = processor(text=prompts, images=image, return_tensors="pt", padding=True).to(DEVICE)
    outputs = model(**inputs)
    probs = outputs.logits_per_image.softmax(dim=1).detach().cpu().numpy()[0]

    best_idx = int(probs.argmax())
    best_label = labels[best_idx]
    conf = float(probs[best_idx])
    probs_dict = {labels[i]: float(probs[i]) for i in range(len(labels))}
    return best_label, conf, probs_dict


@torch.inference_mode()
def clip_classify_fine(image: Image.Image, coarse_key: str, model: CLIPModel, processor: CLIPProcessor):
    """
    Fine prediction restricted to a coarse category.
    Returns: (best_fine_label, confidence, probs_dict)
    """
    label_to_prompt = FINE_CATEGORY_PROMPTS.get(coarse_key, {})
    if not label_to_prompt:
        return None, None, {}

    return clip_classify(image, label_to_prompt, model, processor)


def accuracy(y_true, y_pred):
    y_true = np.array(y_true)
    y_pred = np.array(y_pred)
    return float((y_true == y_pred).mean()) if len(y_true) else float("nan")


def macro_f1(y_true, y_pred, labels):
    # simple macro F1 without sklearn
    y_true = np.array(y_true)
    y_pred = np.array(y_pred)
    f1s = []
    for lab in labels:
        tp = np.sum((y_true == lab) & (y_pred == lab))
        fp = np.sum((y_true != lab) & (y_pred == lab))
        fn = np.sum((y_true == lab) & (y_pred != lab))
        if tp == 0 and (fp == 0 or fn == 0):
            # If there are no positives predicted/true, define F1 as 0 (common convention for macro)
            f1 = 0.0
        else:
            prec = tp / (tp + fp) if (tp + fp) else 0.0
            rec = tp / (tp + fn) if (tp + fn) else 0.0
            f1 = (2 * prec * rec / (prec + rec)) if (prec + rec) else 0.0
        f1s.append(f1)
    return float(np.mean(f1s)) if f1s else float("nan")


# -------------------- MAIN --------------------

def main():
    print("Device:", DEVICE)
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"Missing CSV: {CSV_PATH}")
    if not IMAGES_DIR.exists():
        raise FileNotFoundError(f"Missing images dir: {IMAGES_DIR}")

    df = pd.read_csv(CSV_PATH)
    df.columns = df.columns.str.strip()

    required = {"id", "coarse_category", "fine_category"}
    missing_cols = required - set(df.columns)
    if missing_cols:
        raise KeyError(f"CSV missing columns: {missing_cols}. Found: {df.columns.tolist()}")

    # Normalize labels
    df["coarse_category"] = df["coarse_category"].astype(str).str.strip()
    df["fine_category"] = df["fine_category"].astype(str).str.strip()
    df.loc[df["fine_category"].isin(["", "nan", "None", "NaN"]), "fine_category"] = np.nan

    # Load model
    model = CLIPModel.from_pretrained(MODEL_NAME).to(DEVICE)
    processor = CLIPProcessor.from_pretrained(MODEL_NAME)
    model.eval()

    coarse_label_to_prompt = COARSE_PROMPTS.copy()
    coarse_labels = list(coarse_label_to_prompt.keys())

    rows = []
    missing_images = 0

    for _, r in tqdm(df.iterrows(), total=len(df), desc="Evaluating"):
        img_id = str(int(r["id"])) if str(r["id"]).isdigit() else str(r["id"])
        img_path = IMAGES_DIR / f"{img_id}.jpg"
        if not img_path.exists():
            missing_images += 1
            continue

        image = load_image_rgb(img_path)

        true_coarse = r["coarse_category"]
        true_fine = r["fine_category"]  # may be NaN

        # --- Coarse ---
        pred_coarse, coarse_conf, _ = clip_classify(image, coarse_label_to_prompt, model, processor)

        # --- Fine ---
        if FINE_MODE == "true_coarse":
            fine_coarse_key = true_coarse
        elif FINE_MODE == "pred_coarse":
            fine_coarse_key = pred_coarse
        else:
            raise ValueError("FINE_MODE must be 'true_coarse' or 'pred_coarse'")

        pred_fine, fine_conf, _ = clip_classify_fine(image, fine_coarse_key, model, processor)

        rows.append({
            "id": img_id,
            "true_coarse": true_coarse,
            "pred_coarse": pred_coarse,
            "coarse_conf": coarse_conf,
            "fine_mode": FINE_MODE,
            "fine_pool_coarse": fine_coarse_key,
            "true_fine": true_fine,
            "pred_fine": pred_fine,
            "fine_conf": fine_conf,
        })

    pred_df = pd.DataFrame(rows)
    pred_csv = OUT_DIR / "predictions.csv"
    pred_df.to_csv(pred_csv, index=False)

    print("\nSaved predictions:", pred_csv)
    if missing_images:
        print("Missing images skipped:", missing_images)

    # ---------------- METRICS ----------------
    # Coarse metrics (all rows we evaluated)
    coarse_acc = accuracy(pred_df["true_coarse"], pred_df["pred_coarse"])
    coarse_f1 = macro_f1(pred_df["true_coarse"], pred_df["pred_coarse"], labels=coarse_labels)

    print("\n=== COARSE METRICS ===")
    print("N:", len(pred_df))
    print("Accuracy:", round(coarse_acc, 4))
    print("Macro-F1:", round(coarse_f1, 4))

    # Fine metrics
    fine_eval_df = pred_df.copy()
    if EVAL_FINE_ONLY_WHEN_TRUE_EXISTS:
        fine_eval_df = fine_eval_df[fine_eval_df["true_fine"].notna()]

    # also require a prediction to exist (some coarse pools may not have fine prompts)
    fine_eval_df = fine_eval_df[fine_eval_df["pred_fine"].notna()]

    print("\n=== FINE METRICS ===")
    print("Fine mode:", FINE_MODE)
    print("N (fine evaluated):", len(fine_eval_df))

    if len(fine_eval_df) == 0:
        print("No fine-evaluable rows (check your fine labels + prompt pools).")
        return

    fine_acc = accuracy(fine_eval_df["true_fine"], fine_eval_df["pred_fine"])
    # labels for macro-f1: union of all explicit fine label keys
    fine_labels = sorted({
        label
        for label_dict in FINE_CATEGORY_PROMPTS.values()
        for label in label_dict.keys()
    })
    fine_f1 = macro_f1(fine_eval_df["true_fine"], fine_eval_df["pred_fine"], labels=fine_labels)

    print("Accuracy:", round(fine_acc, 4))
    print("Macro-F1:", round(fine_f1, 4))

    # Helpful breakdown: coarse accuracy by class
    print("\n=== COARSE ACCURACY BY CLASS ===")
    for c in coarse_labels:
        sub = pred_df[pred_df["true_coarse"] == c]
        if len(sub) == 0:
            continue
        acc_c = accuracy(sub["true_coarse"], sub["pred_coarse"])
        print(f"{c:<10} N={len(sub):<5} acc={acc_c:.4f}")

    print("\nDone.")


if __name__ == "__main__":
    main()