#sort by wheather and styles of closet
#classifying using evaluate clip

import numpy as np
import torch
from PIL import Image
from transformers import CLIPModel, CLIPProcessor
from pathlib import Path
from util.prompts import STYLES, STYLE_FINE_CATEGORIES

#logic to use the fine_tuned model including loading and importing
FINE_TUNED_MODEL_PATH = Path(__file__).parent.parent / "util" / "fine_tuned_model2"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

_model = None
_processor = None

#helper functions to be able to use fine-tuned model
def _load_style_fashionclip():
    #why are we doing global vars?
    global _model, _processor
    if _model is None:
        _model = CLIPModel.from_pretrained(FINE_TUNED_MODEL_PATH).to(DEVICE)
        _processor = CLIPProcessor.from_pretrained(FINE_TUNED_MODEL_PATH)
        _model.eval()
    return _model, _processor
def _build_prompts_for_item(item_type:str, item_subtype:str) -> list[tuple[str, str]]:
    prompts = []
    item_type_lower = item_type.lower()
    item_subtype_lower = item_subtype.lower()

    for style in STYLES:
        key = (style, item_type_lower)
        fine_tags = STYLE_FINE_CATEGORIES.get(key, [])

        if item_type_lower in fine_tags:
            prompt = f"a photo of a {style} {item_subtype_lower}"
        elif fine_tags:
            prompt = f"a photo of a {style} {item_subtype_lower}"
        else:
            prompt = f"a photo of a {style} {item_type_lower}"

        prompts.append((style, prompt))
    return prompts

@torch.inference_mode()
def style_fashionclip(image_embedding: list[float], item_type: str, item_subtype: str) -> list[dict]:
    model, processor = _load_style_fashionclip()

    # Convert stored embedding to tensor
    img_emb = torch.tensor(image_embedding, dtype=torch.float32).unsqueeze(0).to(DEVICE)
    img_emb = img_emb / img_emb.norm(p=2, dim=-1, keepdim=True).clamp_min(1e-12)

    # Build and encode text prompts
    style_prompt_pairs = _build_prompts_for_item(item_type, item_subtype)
    styles = [s for s, _ in style_prompt_pairs]
    prompts = [p for _, p in style_prompt_pairs]

    text_inputs = processor(
        text=prompts,
        return_tensors="pt",
        padding="max_length",
        truncation=True,
        max_length=77,
    ).to(DEVICE)

    text_features = model.get_text_features(**text_inputs)
    text_features = text_features / text_features.norm(p=2, dim=-1, keepdim=True).clamp_min(1e-12)

    # Compute similarity: (1, embed_dim) @ (embed_dim, num_styles) -> (1, num_styles)
    similarity = (img_emb @ text_features.T) * model.logit_scale.exp()
    probs = similarity.softmax(dim=1).squeeze(0).cpu().tolist()

    results = [{"style": style, "score": round(score, 4)} for style, score in zip(styles, probs)]
    results.sort(key=lambda x: x["score"], reverse=True)

    return results


#Maps weather tags to item subtypes/types that should be EXCLUDED following the WEATHER API tags
WEATHER_EXCLUSIONS = {
    #Temperature tags from backend 
    "very hot": {
        "subtypes": ["jacket", "coat", "blazer", "vest", "sweater", "long sleeve shirt",
                      "boots", "jeans", "sweatpants", "scarf"],
        "types": ["outerwear"],
        "tags": ["winter"]
    },
    "hot": {
        "subtypes": ["jacket", "coat", "blazer", "sweater", "long sleeve shirt",
                      "boots", "sweatpants", "scarf"],
        "types": ["outerwear"],
        "tags": ["winter"]
    },
    "warm": {
        "subtypes": ["coat", "sweater", "scarf", "boots"],
        "types": [],
        "tags": ["winter"]
    },
    "cool": {
        "subtypes": ["tank top", "sandals", "shorts"],
        "types": [],
        "tags": ["summer"]
    },
    "cold": {
        "subtypes": ["tank top", "sandals", "shorts", "t-shirt", "skirt"],
        "types": [],
        "tags": ["summer"]
    },
    "freezing": {
        "subtypes": ["tank top", "sandals", "shorts", "t-shirt", "skirt"],
        "types": [],
        "tags": ["summer"]
    },

    #precipitation tags frombackend
    "wet weather": {
        "subtypes": ["sandals", "heels"],
        "types": [],
        "tags": []
    },
    "thunderstorm": {
        "subtypes": ["sandals", "heels"],
        "types": [],
        "tags": []
    },
    "snow weather": {
        "subtypes": ["sandals", "sneakers", "heels", "shorts", "t-shirt",
                      "tank top", "skirt"],
        "types": [],
        "tags": ["summer"]
    },
}

def filter_by_weather(closet, weather_tags):
    excluded_subtypes = set()
    excluded_types = set()
    excluded_item_tags = set()

    for tag in weather_tags:
        tag_lower = tag.lower()

        if tag_lower in WEATHER_EXCLUSIONS:
            excluded_subtypes.update(WEATHER_EXCLUSIONS[tag_lower]["subtypes"])
            excluded_types.update(WEATHER_EXCLUSIONS[tag_lower]["types"])
            excluded_item_tags.update(WEATHER_EXCLUSIONS[tag_lower].get("tags", []))

    filtered = []
    for item in closet:
        if item.get("subtype", "").lower() in excluded_subtypes:
            continue
        if item.get("type", "").lower() in excluded_types:
            continue
        if any(t in excluded_item_tags for t in item.get("tags", [])):
            continue
        filtered.append(item)

    return filtered
#group items by type in the closet
def group_by_type(closet):
    groups = {
        "top": [],
        "bottom": [],
        "footwear": [],
        "outerwear": [],
        "accessories": [],
        "one-piece": []
    }
    for item in closet:
        item_type = item.get("type", "").lower()
        if item_type in groups:
            groups[item_type].append(item)
    return groups

def group_by_style(closet: list[dict]) -> dict[str, list[dict]]:
    grouped = {style: [] for style in STYLES}

    for item in closet:
        image_embedding = item.get("imageEmbedding", [])
        item_type = item.get("type", "")
        item_subtype = item.get("subtype", "")

        if not image_embedding or not item_type or not item_subtype:
            continue

        scores = style_fashionclip(image_embedding, item_type, item_subtype)

        if scores:
            top_style = scores[0]["style"]
            item["style_scores"] = scores
            item["predicted_style"] = top_style
            grouped[top_style].append(item)

    return grouped
# if __name__ == '__main__':
#     app.run(debug=True)