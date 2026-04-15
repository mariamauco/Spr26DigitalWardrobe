#sort by wheather and styles of closet
#classifying using evaluate clip

import numpy as np

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

# if __name__ == '__main__':
#     app.run(debug=True)
