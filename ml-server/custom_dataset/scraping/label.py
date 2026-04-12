'''
Script used to clean the dataset and download

For all images:
- coarse,fine,color,sleeve,coverage = null 
    - use clip, if >70, change it to that.
- if all %s >70 -> set review to 0
- if all <70 --> delete image and continue

- if some <70 -> review

- add style specific: title/ description words that best match
'''

import time, os, json, random, re
import pandas as pd
import torch
import spacy
from PIL import Image
from transformers import CLIPModel, CLIPProcessor
import csv, json, sys, argparse, tempfile
from pathlib import Path

# Make ml-server/util importable
ML_SERVER_PATH = Path(__file__).parent.parent.parent
sys.path.insert(0, str(ML_SERVER_PATH))


from util.error_handling import validate_single_clothing_item

from util.remove_bg import remove_bg
from custom_dataset.pipeline import load_model

from util.prompts import (
    COARSE_PROMPTS, PERSON_CHECK_PROMPTS, FINE_CATEGORY_PROMPTS,
    SLEEVE_PROMPTS, LEG_COVERAGE_PROMPTS, OUTERWEAR_COVERAGE_PROMPTS,
    COLOR_PROMPTS
)
from util.analyze_img import clip_classify, get_img_embedding

MODEL_NAME = "patrickjohncyh/fashion-clip"
CLIP_CONFIDENCE_THRESHOLD = 0.70

DATASET_PATH = "/media/maria/ubuntu storage/dataset/"
CSV_PATH = "metadata_labeled.csv"

STYLES_SPECIFIC = ["y2k", "goth", "cottagecore", "athleisure", "coquette", "business casual"]

CATEGORIES = ["top", "bottom", "one_piece", "outerwear", "shoe", "accessory"]

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

CSV_COLUMNS = [
    "",
    "pin_id",
    "source_url",
    "image_url",
    "image_path",
    "title",
    "description",
    "style",
    "color",
    "coarse_category",
    "fine_tag",
    "coarse_conf",
    "sleeve_label",
    "coverage_label",
    "embedding",
    "metadata",
    "review"
]

nlp = spacy.load("en_core_web_sm")

def keywords(title, description):
    """
    Cleans text and extracts meaningful noun phrases or keywords 
    to be used for the 'style_specific' column.

    Uses the spacy library to get keywords from the title and description:
    1. combine title and description to one lowercase string
    2. use spacy to extract 'noun chunks' (like 'vintage goth dress', or 'y2k crop top')
    3. filter out noun chunks that have generic stop words, numbers, or are shorter than 3 characters
    4. use a set to not create dupes. if it's empty, just return an empty list

    """
    # clean and combine text
    text = (title + " " + description).lower().replace('"', '')
    
    # extract noun chunks with spacy
    doc = nlp(text)
    chunks = list(doc.noun_chunks)
    
    keywords_set = set()
    
    for chunk in chunks:
        # filter out stop words and numbers
        tokens = [token.text for token in chunk if not token.is_stop and not token.is_digit]
        
        # join back and filter by length
        phrase = " ".join(tokens).strip()
        if len(phrase) >= 3:
            keywords_set.add(phrase)
    
    return list(keywords_set) if keywords_set else []

def predict_clip_batch(model, processor, rows, prompts):
    """
    Takes a batch of images and a dictionary of prompts 
    (coarse, fine, sleeve, coverage, color).
    Returns the top predictions and their similarity scores.

    Process a batch of 32 images at once:
    1. iter through rows and for each row:
        1a. open the image. if it fails, mark the row status as 'error'
        2a. run remove_bg(). if it fails, mark as reject and delete the image.
        3a. if sucessful, replace the image in image_path with the removed bg, and add the cleaned rgb image to a valid_images
    2. for valid images:
        2a. run thorugh the keywords() to get the style_keywords
        2b. pass the list of images and the coarse prompts to the clip model. get the top
            coarse cat and confidence for each image
        2c. run the fine cats using the STYLE_FINE_CATEGORIES dict based on the image's style and coarse cat. run batch for these
        2d. run batch predictions for SLEEVE_PROMPTS, LEG_COVERAGE_PROMPTS, and COLOR_PROMPTS.
            only sleeve for outerwear and tops, and and leg only for bottom
        2e. run a final clop predict for each image against the keywords generated in 2a.
    3. return updated rows dict with all new labels
    """
    if not rows:
        return rows

    # set up
    prompt_sets = prompts or {}
    coarse_prompts = prompt_sets.get("coarse", COARSE_PROMPTS)
    sleeve_prompts = prompt_sets.get("sleeve", SLEEVE_PROMPTS)
    leg_coverage_prompts = prompt_sets.get("leg_coverage", LEG_COVERAGE_PROMPTS)
    outerwear_coverage_prompts = prompt_sets.get("outerwear_coverage", OUTERWEAR_COVERAGE_PROMPTS)
    color_prompts = prompt_sets.get("color", COLOR_PROMPTS)

    if hasattr(model, "device"):
        device = model.device
    else:
        device = next(model.parameters()).device

    # predict for a batch and prompts
    def _batch_predict(images, text_prompts):
        if not images or not text_prompts:
            return []

        labels = list(text_prompts.keys())
        prompt_list = list(text_prompts.values())
        inputs = processor(
            text=prompt_list,
            images=images,
            return_tensors="pt",
            padding=True,
        )
        inputs = {k: v.to(device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = model(**inputs)

        probs = outputs.logits_per_image.softmax(dim=1).detach().cpu()
        best_idxs = probs.argmax(dim=1).tolist()

        preds = []
        for img_i, best_idx in enumerate(best_idxs):
            conf = float(probs[img_i, best_idx].item())
            preds.append((labels[best_idx], conf))
        return preds


    valid_indices = []
    valid_images = []

    # go through the rows
    for i, row in enumerate(rows):
        # these are the cols we will change
        row.setdefault("coarse_category", "")
        row.setdefault("coarse_conf", 0.0)
        row.setdefault("fine_tag", "")
        row.setdefault("fine_conf", 0.0)
        row.setdefault("sleeve_label", "")
        row.setdefault("sleeve_conf", 0.0)
        row.setdefault("coverage_label", "")
        row.setdefault("coverage_conf", 0.0)
        row.setdefault("color", "")
        row.setdefault("color_conf", 0.0)
        row.setdefault("style_keywords", [])

        # open the image from each row
        image_path = row.get("image_path", "")
        if not image_path:
            row["status"] = "error"
            row["error"] = "missing image_path"
            continue

        image_path = DATASET_PATH + image_path
        # try to bg remove the image and save it if able
        try:
            image = Image.open(image_path).convert("RGB")
            bg_removed = remove_bg(image)
            # bg_removed.save(image_path)
        except Exception as exc:
            row["status"] = "error"
            row["error"] = f"preprocess_failed: {exc}"
            continue

        # store index and the image 
        row["status"] = "ok"
        valid_indices.append(i)
        valid_images.append(bg_removed)

        # use keywoards to get the style-specific keywords
        try:
            kws = keywords(row.get("title", ""), row.get("description", ""))
            row["style_keywords"] = kws if kws else []
        except Exception:
            row["style_keywords"] = []

    # if no images, return rows as is
    if not valid_images:
        return rows

    # predict the coarse cats first
    coarse_preds = _batch_predict(valid_images, coarse_prompts)
    for local_i, row_i in enumerate(valid_indices):
        rows[row_i]["coarse_category"], rows[row_i]["coarse_conf"] = coarse_preds[local_i]

    # predict the color next
    color_preds = _batch_predict(valid_images, color_prompts)
    for local_i, row_i in enumerate(valid_indices):
        rows[row_i]["color"], rows[row_i]["color_conf"] = color_preds[local_i]

    # not all images apply for these, so run them seperately
    sleeve_local_indices = []
    sleeve_images = []
    outerwear_cov_local_indices = []
    outerwear_cov_images = []
    leg_cov_local_indices = []
    leg_cov_images = []

    # for all rows
    for local_i, row_i in enumerate(valid_indices):
        coarse_label = rows[row_i]["coarse_category"] # save cat

        # if it's a top or outerwear, predict the sleeve
        if coarse_label in ("top", "outerwear"):
            sleeve_local_indices.append(local_i)
            sleeve_images.append(valid_images[local_i])
        
        # if it's outerwear, predict the coverage
        if coarse_label == "outerwear":
            outerwear_cov_local_indices.append(local_i)
            outerwear_cov_images.append(valid_images[local_i])

        # if it's bottom, predict the leg coverage
        elif coarse_label == "bottom":
            leg_cov_local_indices.append(local_i)
            leg_cov_images.append(valid_images[local_i])

    # run the sleeve predictions
    sleeve_preds = _batch_predict(sleeve_images, sleeve_prompts)
    for j, local_i in enumerate(sleeve_local_indices):
        row_i = valid_indices[local_i]
        rows[row_i]["sleeve_label"], rows[row_i]["sleeve_conf"] = sleeve_preds[j]

    # run the outerwear predictions
    outerwear_cov_preds = _batch_predict(outerwear_cov_images, outerwear_coverage_prompts)
    for j, local_i in enumerate(outerwear_cov_local_indices):
        row_i = valid_indices[local_i]
        rows[row_i]["coverage_label"], rows[row_i]["coverage_conf"] = outerwear_cov_preds[j]

    # run the leg coverage predictions
    leg_cov_preds = _batch_predict(leg_cov_images, leg_coverage_prompts)
    for j, local_i in enumerate(leg_cov_local_indices):
        row_i = valid_indices[local_i]
        rows[row_i]["coverage_label"], rows[row_i]["coverage_conf"] = leg_cov_preds[j]

    # for all the rows: run the fine predictions based on the coarse and style
    for local_i, row_i in enumerate(valid_indices):

        # get the coarse and style
        coarse_label = rows[row_i]["coarse_category"]
        style_raw = str(rows[row_i].get("style", "")).strip().lower()
        style_keys = [style_raw, style_raw.replace("_", " "), style_raw.replace(" ", "_")]

        # get the fine prompts that correspond it
        fine_prompts = None
        for style_key in style_keys:
            key = (style_key, coarse_label)
            if key in STYLE_FINE_CATEGORIES:
                fine_prompts = STYLE_FINE_CATEGORIES[key]
                break

        if fine_prompts is None:
            if isinstance(FINE_CATEGORY_PROMPTS, dict):
                fine_prompts = FINE_CATEGORY_PROMPTS.get(coarse_label, [])
            else:
                fine_prompts = FINE_CATEGORY_PROMPTS

        if isinstance(fine_prompts, list):
            coarse_prompt_map = FINE_CATEGORY_PROMPTS.get(coarse_label, {}) if isinstance(FINE_CATEGORY_PROMPTS, dict) else {}
            fine_prompts = {
                label: coarse_prompt_map[label]
                for label in fine_prompts
                if isinstance(coarse_prompt_map, dict) and label in coarse_prompt_map
            }

        # run the fine predictions
        fine_pred = _batch_predict([valid_images[local_i]], fine_prompts)
        if fine_pred:
            rows[row_i]["fine_tag"], rows[row_i]["fine_conf"] = fine_pred[0]

    return rows
    


def process_dataset(path):
    """
    Main loop:
    1. load the csv using pandas, filter any rows out that don't have image_path.

    2. Group into batches (e.g., 32 images).

    3. Run predict_clip_batch.

    4. Apply your review logic:
        4a. let x be list of confidence scores for an image
        4b. if all are < threshold --> delete the image and drop the row
        4c. if all are >= threshold: set review to 0
        4d. if some, set review to 1
    
    5. Save updated chunk to metadata_labeled.csv.
  
    """

    # Some scraped rows can contain broken quoting/newlines; skip only malformed rows.
    df = pd.read_csv(path, engine="python", on_bad_lines="skip")
    #num_rows = len(df)
    num_rows = 64

    batch_size = 32

    # load the model
    model, processor, _ = load_model()

    prompts = {
        "coarse": COARSE_PROMPTS,
        "sleeve": SLEEVE_PROMPTS,
        "leg_coverage": LEG_COVERAGE_PROMPTS,
        "outerwear_coverage": OUTERWEAR_COVERAGE_PROMPTS,
        "color": COLOR_PROMPTS,
    }

    # go through all paths
    for i in range(0, num_rows, batch_size):

        batch_rows = df.iloc[i : i+batch_size]
        rows = batch_rows.to_dict('records')

        # predict this batch
        updated = predict_clip_batch(model, processor, rows, prompts)

        print(updated)

    pass

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--path", type=str, default="metadata.csv",
                        help="Path of the metadata.csv file")
    args = parser.parse_args()

    process_dataset(args.path)



if __name__ == "__main__":
    main()