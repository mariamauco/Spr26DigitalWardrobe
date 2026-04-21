#sort by wheather and styles of closet
#classifying using evaluate clip

import numpy as np
import torch
from PIL import Image
from transformers import CLIPModel, CLIPProcessor
from pathlib import Path
from util.prompts import STYLES, STYLE_FINE_CATEGORIES

#logic to use the fine_tuned model including loading and importing
FINE_TUNED_MODEL_PATH = Path(__file__).parent.parent / "util" / "fine_tuned_model"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

_model = None
_processor = None

#helper functions to be able to use fine-tuned model
def _load_style_fashionclip():
    #why are we doing global vars?
    global _model, _processor
    if _model is None:
        print(f"[style_fashionclip] loading fine-tuned CLIP model from {FINE_TUNED_MODEL_PATH} on {DEVICE}")
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

    print(f"[style_fashionclip] scoring item type={item_type!r}, subtype={item_subtype!r}, embedding_dim={len(image_embedding) if image_embedding else 0}")

    # Convert stored embedding to tensor
    img_emb = torch.tensor(image_embedding, dtype=torch.float32).unsqueeze(0).to(DEVICE)
    img_emb = img_emb / img_emb.norm(p=2, dim=-1, keepdim=True).clamp_min(1e-12)

    # Build and encode text prompts
    style_prompt_pairs = _build_prompts_for_item(item_type, item_subtype)
    styles = [s for s, _ in style_prompt_pairs]
    prompts = [p for _, p in style_prompt_pairs]

    print(f"[style_fashionclip] built {len(prompts)} prompts for styles={styles}")

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

    print(f"[style_fashionclip] top scores={results[:3]}")

    return results


#Maps weather tags to item subtypes/types that should be EXCLUDED following the WEATHER API tags
WEATHER_EXCLUSIONS = {
    # Temperature tags from backend
    "very hot": {
        "subtypes": ["jacket", "coat", "blazer", "vest", "sweater", "long sleeve shirt",
                      "cardigan", "trench coat",  # all outerwear subtypes
                      "boots", "jeans", "sweatpants", "leggings", "scarf",
                      "pants"],  # full leg coverage too warm
        "types": ["outerwear"],
        "tags": ["winter"]
    },
    "hot": {
        "subtypes": ["jacket", "coat", "blazer", "sweater", "long sleeve shirt",
                      "cardigan", "trench coat",
                      "boots", "sweatpants", "scarf"],
        "types": ["outerwear"],
        "tags": ["winter"]
    },
    "warm": {
        "subtypes": ["coat", "sweater", "scarf", "boots",
                      "trench coat"],  # heavy layers only
        "types": [],
        "tags": ["winter"]
    },
    "cool": {
        "subtypes": ["tank top", "sandals", "shorts"],
        "types": [],
        "tags": ["summer"]
    },
    "cold": {
        "subtypes": ["tank top", "sandals", "shorts", "t-shirt", "skirt",
                      "romper", "flats"],  # sleeveless + short coverage
        "types": [],
        "tags": ["summer"]
    },
    "freezing": {
        "subtypes": ["tank top", "sandals", "shorts", "t-shirt", "skirt",
                      "romper", "flats", "sneakers", "loafers",
                      "dress"],  # only heavy coverage allowed
        "types": [],
        "tags": ["summer"]
    },

    # Precipitation tags
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
                      "tank top", "skirt", "flats", "loafers",
                      "romper"],
        "types": [],
        "tags": ["summer"]
    },
}
'''THE LOGIC OF FILTERING: every time that the JSON file is read and the weather is something
such as "cold, rainy", then we can exclude any clothing items that shouldnt be included in the list
we will then return a list of items in the closet that can be chosen and passed through the sort by style function

'''
def filter_by_weather(closet, weather_tags):
    excluded_subtypes = set()
    excluded_types = set()
    excluded_item_tags = set()

    print(f"[filter_by_weather] incoming closet_count={len(closet)} weather_tags={weather_tags}")

    for tag in weather_tags:
        tag_lower = tag.lower()

        if tag_lower in WEATHER_EXCLUSIONS:
            excluded_subtypes.update(WEATHER_EXCLUSIONS[tag_lower]["subtypes"])
            excluded_types.update(WEATHER_EXCLUSIONS[tag_lower]["types"])
            excluded_item_tags.update(WEATHER_EXCLUSIONS[tag_lower].get("tags", []))

    print(
        f"[filter_by_weather] excluded_subtypes={sorted(excluded_subtypes)} excluded_types={sorted(excluded_types)} excluded_item_tags={sorted(excluded_item_tags)}"
    )

    filtered = []
    for item in closet:
        if item.get("subtype", "").lower() in excluded_subtypes:
            continue
        if item.get("type", "").lower() in excluded_types:
            continue
        if any(t in excluded_item_tags for t in item.get("tags", [])):
            continue
        filtered.append(item)

    print(f"[filter_by_weather] filtered closet_count={len(filtered)}")

    return filtered

#group items by type in the closet
def group_by_type(closet):
    groups = {
        "top": [],
        "bottom": [],
        "shoe": [],
        "outerwear": [],
        "accessory": [],
        "one_piece": []
    }
    for item in closet:
        item_type = item.get("type", "").lower()
        if item_type in groups:
            groups[item_type].append(item)

    print(
        "[group_by_type] counts="
        + ", ".join(f"{group}:{len(items)}" for group, items in groups.items())
    )
    return groups

def group_by_style(closet: list[dict], preferences: dict, weather_tags: list[str]) -> list[dict]:
    """
    Return items from the closet that match the user's style preferences
    and are appropriate for the current weather.
    """
    # step 1: filter out items that don't fit the weather
    weather_filtered = filter_by_weather(closet, weather_tags)

    print(
        f"[group_by_style] after weather filter item_count={len(weather_filtered)} preference_styles={preferences.get('styleTags', [])}"
    )

    # step 2: normalize user style tags into comparable tokens.
    # Example: "formal, business casual" -> {"formal", "business casual"}
    def _style_tokens(label: str) -> set[str]:
        return {part.strip().lower() for part in str(label).split(",") if part.strip()}

    user_styles = set()
    for style in preferences.get("styleTags", []):
        user_styles.update(_style_tokens(style))

    #base case the user has no preference of style so you can make any kind of outfit combination
    if not user_styles:
        print("[group_by_style] no preferred styles provided; returning weather-filtered items")
        return weather_filtered  # no style preference, return all weather-appropriate items

    # step 3: score each item against the user's preferred styles
    CONFIDENCE_THRESHOLD = 0.25
    matching_items = []

    for item in weather_filtered:
        image_embedding = item.get("imageEmbedding", [])
        item_type = item.get("type", "")
        item_subtype = item.get("subtype", "")

        if not image_embedding or not item_type or not item_subtype:
            continue

        # get style scores from the fine-tuned model
        scores = style_fashionclip(image_embedding, item_type, item_subtype)

        if not scores:
            print(f"[group_by_style] no scores returned for item_id={item.get('_id')}")
            continue

        # check if any of the user's preferred styles score above threshold
        item["style_scores"] = scores
        for score_entry in scores:
            predicted_style_tokens = _style_tokens(score_entry["style"])
            if (
                score_entry["score"] >= CONFIDENCE_THRESHOLD
                and predicted_style_tokens.intersection(user_styles)
            ):
                item["predicted_style"] = score_entry["style"]
                matching_items.append(item)
                print(
                    f"[group_by_style] matched item_id={item.get('_id')} predicted_style={score_entry['style']} score={score_entry['score']}"
                )
                break  # item matched, no need to check other styles

    print(f"[group_by_style] matched_items_count={len(matching_items)}")

    # If style filtering is too strict to form any valid outfit, fallback to weather-only filtering.
    grouped_matches = group_by_type(matching_items)
    can_make_standard = bool(grouped_matches["top"] and grouped_matches["bottom"] and grouped_matches["shoe"])
    can_make_one_piece = bool(grouped_matches["one_piece"] and grouped_matches["shoe"])

    if not (can_make_standard or can_make_one_piece):
        print("[group_by_style] fallback: insufficient slot coverage after style filtering; using weather-filtered items")
        return weather_filtered

    return matching_items
# if __name__ == '__main__':
#     app.run(debug=True)