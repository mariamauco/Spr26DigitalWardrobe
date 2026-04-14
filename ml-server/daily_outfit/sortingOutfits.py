#sort by wheather and styles of closet
#classifying using evaluate clip

import numpy as np

# Maps weather tags to item subtypes that should be EXCLUDED WE NEED TO FIX THIS TO FIT WHAT WE HAVE 
WEATHER_EXCLUSIONS = {
    # Hot weather — remove heavy/warm items
    "hot": {
        "subtypes": ["jacket", "coat", "hoodie", "sweater", "cardigan", "parka", "blazer",
                      "boots", "long-sleeve", "thermal", "flannel", "turtleneck"],
        "types": ["outerwear"]
    },
    "warm": {
        "subtypes": ["coat", "parka", "thermal", "turtleneck"],
        "types": []
    },
    #cold weather, remove revealing/light items
    "cold": {
        "subtypes": ["tank-top", "crop-top", "sandals", "flip-flops", "shorts", "t-shirt",
                      "mini-skirt", "sleeveless"],
        "types": []
    },
    "freezing": {
        "subtypes": ["tank-top", "crop-top", "sandals", "flip-flops", "shorts",
                      "mini-skirt", "sleeveless", "t-shirt"],
        "types": []
    },
    #rain, remove items that shouldn't get wet
    "rainy": {
        "subtypes": ["suede-shoes", "canvas-shoes", "sandals", "flip-flops"],
        "types": []
    },
    "thunderstorm": {
        "subtypes": ["suede-shoes", "canvas-shoes", "sandals", "flip-flops"],
        "types": []
    },
    #snow
    "snowy": {
        "subtypes": ["sandals", "flip-flops", "sneakers", "loafers", "shorts", "t-shirt",
                      "mini-skirt", "tank-top", "crop-top"],
        "types": []
    },
}

#in order to make correct reccommendations we need to remove items that conflict with the current weather
def filter_by_wheather(closet, weather_tags):
    excluded_subtypes = set()
    excluded_types = set()

    for tag in weather_tags:
        tag_lower = tag.lower()

        if tag_lower in WEATHER_EXCLUSIONS:
            excluded_subtypes.update(WEATHER_EXCLUSIONS[tag_lower]["subtypes"])
            excluded_types.update(WEATHER_EXCLUSIONS[tag_lower]["types"])

    filtered = []
    for item in closet:
        if item.get("subtype", "").lower() in excluded_subtypes:
            continue
        if item.get("type", "").lower() in excluded_types:
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

if __name__ == '__main__':
    app.run(debug=True)
