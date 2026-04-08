# ml-server/fine_tune.py
# ---------------------------------------------------------------
# Fine-tuning for patrickjohncyh/fashion-clip
# on our custom_dataset/ (built by pipeline.py / scraping)
#
# Key decisions:
#   - Only the TEXT encoder is unfrozen (image encoder is frozen)
#   - Very small lr (1e-6) to avoid catastrophic forgetting
#   - Symmetric contrastive loss (standard CLIP objective)
#   - Saves best checkpoint based on val accuracy
#
# Usage:
#   python fine_tune.py
#   python fine_tune.py --epochs 5 --lr 1e-6 --batch_size 16
# ---------------------------------------------------------------

import argparse
import csv
import json
import random
from pathlib import Path

import torch
import torch.nn.functional as F
from PIL import Image
from torch.utils.data import Dataset, DataLoader
from transformers import CLIPModel, CLIPProcessor

# -------------------- CONFIG --------------------

MODEL_NAME  = "patrickjohncyh/fashion-clip"
# metadata.csv is written by pipeline.py — one row per accepted image
METADATA_CSV = Path(__file__).parent / "custom_dataset" / "dataset" / "metadata.csv"
IMAGES_ROOT  = Path(__file__).parent / "custom_dataset" / "dataset"
SAVE_DIR     = Path(__file__).parent / "fine_tuned_model"
DEVICE       = "cuda" if torch.cuda.is_available() else "cpu"

# How much of the data to hold out for validation (0.15 = 15%)
VAL_SPLIT = 0.15


# -------------------- DATASET --------------------

class WardrobeDataset(Dataset):
    """
    Reads metadata.csv produced by pipeline.py.
    Each row gives us: image_path, style, coarse_category, fine_tag.

    We build a text prompt per image:
        "a photo of a {style} {fine_tag}"
    e.g. "a photo of a y2k tank top"

    The model learns to match each image to its prompt and push
    all other (image, prompt) pairs apart — the CLIP objective.
    """

    def __init__(self, rows: list[dict], processor: CLIPProcessor):
        self.rows      = rows
        self.processor = processor

    def __len__(self):
        return len(self.rows)

    def __getitem__(self, idx):
        row = self.rows[idx]

        # Build the text prompt from style + fine_tag stored in CSV
        style    = row["style"].strip().replace("_", " ")   # "business_casual" → "business casual"
        fine_tag = row["fine_tag"].strip()                  # e.g. "tank top"
        prompt   = f"a photo of a {style} {fine_tag}"      # "a photo of a y2k tank top"

        # Load image (pipeline.py saves PNGs with transparent bg — convert to RGB)
        img_path = IMAGES_ROOT / row["image_path"]
        image    = Image.open(img_path).convert("RGB")

        # CLIPProcessor tokenizes the text and resizes/normalizes the image
        # padding=True / truncation=True handles variable prompt lengths
        inputs = self.processor(
            text=[prompt],
            images=image,
            return_tensors="pt",
            padding="max_length",   # pad all prompts to the same length
            truncation=True,
            max_length=77,          # CLIP's max token length
        )

        # Squeeze out the batch dim the processor adds (DataLoader re-adds it)
        return {
            "input_ids":      inputs["input_ids"].squeeze(0),
            "attention_mask": inputs["attention_mask"].squeeze(0),
            "pixel_values":   inputs["pixel_values"].squeeze(0),
        }


def load_rows(csv_path: Path) -> list[dict]:
    """Read metadata.csv, skip rows with missing required fields."""
    required = {"image_path", "style", "coarse_category", "fine_tag"}
    rows = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if not required.issubset(row.keys()):
                continue
            # Skip rows where any required field is empty
            if any(row[k].strip() == "" for k in required):
                continue
            # Skip rows whose image file doesn't exist on disk
            if not (IMAGES_ROOT / row["image_path"]).exists():
                continue
            rows.append(row)
    return rows


def split_dataset(rows: list[dict], val_frac: float, seed: int = 42):
    """Randomly split rows into train / val lists."""
    rows = rows.copy()
    random.seed(seed)
    random.shuffle(rows)
    n_val   = max(1, int(len(rows) * val_frac))
    val     = rows[:n_val]
    train   = rows[n_val:]
    return train, val


# -------------------- LOSS --------------------

def contrastive_loss(logits_per_image: torch.Tensor) -> torch.Tensor:
    """
    Standard symmetric CLIP contrastive loss.

    logits_per_image shape: (batch, batch)
    The diagonal entries are the correct (image_i, text_i) pairs.
    We want those to be high and everything off-diagonal to be low.

    We compute cross-entropy in both directions (image→text, text→image)
    and average them — this is exactly how OpenAI trains CLIP.
    """
    batch_size = logits_per_image.shape[0]
    # Ground-truth: image i matches text i  →  labels = [0, 1, 2, ..., B-1]
    labels = torch.arange(batch_size, device=logits_per_image.device)

    # Image → text direction
    loss_img = F.cross_entropy(logits_per_image, labels)
    # Text → image direction  (transpose gives logits_per_text)
    loss_txt = F.cross_entropy(logits_per_image.T, labels)

    return (loss_img + loss_txt) / 2.0


# -------------------- FREEZE --------------------

def freeze_image_encoder(model: CLIPModel):
    """
    Freeze every parameter in the vision encoder.

    Why freeze the image encoder?
      - Our dataset is small (~hundreds of images).
      - Fashion-CLIP's image encoder already understands clothing shapes well.
      - What we want to improve is the TEXT side: teaching the model our
        specific style vocabulary (y2k, cottagecore, goth, etc.).
      - Freezing the image encoder also cuts GPU memory and training time in half.
    """
    for param in model.vision_model.parameters():
        param.requires_grad = False

    # Also freeze the visual projection layer
    if hasattr(model, "visual_projection"):
        for param in model.visual_projection.parameters():
            param.requires_grad = False

    frozen  = sum(p.numel() for p in model.parameters() if not p.requires_grad)
    total   = sum(p.numel() for p in model.parameters())
    print(f"Frozen {frozen:,} / {total:,} parameters  "
          f"({100 * frozen / total:.1f}% frozen, "
          f"{100 * (1 - frozen/total):.1f}% trainable)")


# -------------------- EVALUATE --------------------

@torch.inference_mode()
def evaluate(model: CLIPModel, dataloader: DataLoader) -> float:
    """
    Compute top-1 accuracy on the validation set.

    For each batch, the model produces a (B x B) similarity matrix.
    A prediction is correct when image_i is most similar to text_i
    — i.e. the argmax of each row equals its row index (the diagonal).
    """
    model.eval()
    correct = 0
    total   = 0

    for batch in dataloader:
        input_ids      = batch["input_ids"].to(DEVICE)
        attention_mask = batch["attention_mask"].to(DEVICE)
        pixel_values   = batch["pixel_values"].to(DEVICE)

        outputs = model(
            input_ids=input_ids,
            attention_mask=attention_mask,
            pixel_values=pixel_values,
        )

        # logits_per_image: (B, B) — row i = similarity of image i to all texts
        logits = outputs.logits_per_image          # (B, B)
        preds  = logits.argmax(dim=1)              # predicted text index per image
        labels = torch.arange(len(preds), device=DEVICE)

        correct += (preds == labels).sum().item()
        total   += len(labels)

    model.train()
    return correct / total if total > 0 else 0.0


# -------------------- TRAIN --------------------

def train(epochs: int, lr: float, batch_size: int):
    print(f"Device : {DEVICE}")
    print(f"Epochs : {epochs}  |  LR : {lr}  |  Batch : {batch_size}\n")

    # ── Load model + processor ──────────────────────────────────────────────
    print(f"Loading {MODEL_NAME}...")
    model     = CLIPModel.from_pretrained(MODEL_NAME).to(DEVICE)
    processor = CLIPProcessor.from_pretrained(MODEL_NAME)
    model.train()

    # ── Freeze image encoder ────────────────────────────────────────────────
    freeze_image_encoder(model)

    # ── Build dataset + dataloaders ─────────────────────────────────────────
    print(f"\nReading metadata from {METADATA_CSV}...")
    all_rows = load_rows(METADATA_CSV)
    if not all_rows:
        raise RuntimeError(
            f"No valid rows found in {METADATA_CSV}. "
            "Run pipeline.py first to build the dataset."
        )
    print(f"Total usable images: {len(all_rows)}")

    train_rows, val_rows = split_dataset(all_rows, VAL_SPLIT)
    print(f"Train: {len(train_rows)}  |  Val: {len(val_rows)}\n")

    train_ds = WardrobeDataset(train_rows, processor)
    val_ds   = WardrobeDataset(val_rows,   processor)

    # drop_last=True keeps every batch exactly batch_size
    # (a partial final batch can cause shape errors in contrastive loss)
    train_dl = DataLoader(train_ds, batch_size=batch_size, shuffle=True,  drop_last=True)
    val_dl   = DataLoader(val_ds,   batch_size=batch_size, shuffle=False, drop_last=False)

    # ── Optimizer ───────────────────────────────────────────────────────────
    # Only pass parameters that are NOT frozen (requires_grad=True)
    # Very small lr (1e-6) to avoid catastrophic forgetting of Fashion-CLIP's
    # existing fashion knowledge
    trainable_params = [p for p in model.parameters() if p.requires_grad]
    optimizer = torch.optim.AdamW(trainable_params, lr=lr, weight_decay=0.01)

    # ── Training loop ────────────────────────────────────────────────────────
    best_val_acc  = 0.0
    best_epoch    = 0

    for epoch in range(1, epochs + 1):
        model.train()
        total_loss   = 0.0
        num_batches  = 0

        for batch in train_dl:
            input_ids      = batch["input_ids"].to(DEVICE)
            attention_mask = batch["attention_mask"].to(DEVICE)
            pixel_values   = batch["pixel_values"].to(DEVICE)

            optimizer.zero_grad()

            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                pixel_values=pixel_values,
            )

            loss = contrastive_loss(outputs.logits_per_image)
            loss.backward()
            optimizer.step()

            total_loss  += loss.item()
            num_batches += 1

        avg_loss = total_loss / num_batches if num_batches else float("nan")
        val_acc  = evaluate(model, val_dl)

        print(f"Epoch {epoch}/{epochs}  |  loss={avg_loss:.4f}  |  val_acc={val_acc:.4f}")

        # Save the best checkpoint
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_epoch   = epoch
            save_model(model, processor, SAVE_DIR)
            print(f"  ✓ New best — saved to {SAVE_DIR}")

    print(f"\nTraining complete.")
    print(f"Best val accuracy: {best_val_acc:.4f} at epoch {best_epoch}")
    print(f"Best model saved to: {SAVE_DIR.resolve()}")
    print("\nNext step: run evaluate_clip.py pointing at the fine-tuned model")
    print("to compare accuracy before vs after fine-tuning.")


# -------------------- SAVE --------------------

def save_model(model: CLIPModel, processor: CLIPProcessor, path: Path):
    """
    Save model weights + processor config so the fine-tuned model
    can be loaded anywhere with CLIPModel.from_pretrained(path).
    """
    path.mkdir(parents=True, exist_ok=True)
    model.save_pretrained(path)
    processor.save_pretrained(path)


# -------------------- ENTRY POINT --------------------

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs",     type=int,   default=5)
    parser.add_argument("--lr",         type=float, default=1e-6)
    parser.add_argument("--batch_size", type=int,   default=16)
    args = parser.parse_args()
    train(args.epochs, args.lr, args.batch_size)


if __name__ == "__main__":
    main()