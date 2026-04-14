#sort by wheather and styles of closet
#classifying using evaluate clip

import numpy as np
from flask import Flask, request, jsonify

app = Flask(__name__)

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
    # Cold weather — remove revealing/light items
    "cold": {
        "subtypes": ["tank-top", "crop-top", "sandals", "flip-flops", "shorts",
                      "mini-skirt", "sleeveless"],
        "types": []
    },
    "freezing": {
        "subtypes": ["tank-top", "crop-top", "sandals", "flip-flops", "shorts",
                      "mini-skirt", "sleeveless", "t-shirt"],
        "types": []
    },
    # Rain — remove items that shouldn't get wet
    "rainy": {
        "subtypes": ["suede-shoes", "canvas-shoes", "sandals", "flip-flops"],
        "types": []
    },
    "thunderstorm": {
        "subtypes": ["suede-shoes", "canvas-shoes", "sandals", "flip-flops"],
        "types": []
    },
    # Snow
    "snowy": {
        "subtypes": ["sandals", "flip-flops", "sneakers", "loafers", "shorts",
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


#MAIN ROUTE
# make a post request for a json file sent from the backend and return the boolean values of them
@app.post('/daily_outfit')
def daily_outfit():
    request_data = request.get_json()

    userID = request_data.get('userID')
    preferences = request_data.get('preferences')
    closet = request_data.get('closet')
    weatherTags = request_data.get('weatherTags')

    #check if every item is there and if so continue, if not then null
    is_valid = (
        isinstance(userID, int)
        and isinstance(preferences, list) and len(preferences) > 0
        and isinstance(closet, list) and len(closet) > 0
        and isinstance(weatherTags, list) and len(weatherTags) > 0
    )
    #the way that i am thinking to handle if there is something missing is by returning an error message for the item.
    if not is_valid:
        return jsonify({
            "error": "Missing or invalid fields",
            "received": {
                "userID": userID,
                "preferences": preferences,
                "closet": closet,
                "weatherTags": weatherTags
            }
        }), 400
    #filter by wheather
    filtered_closet = filter_by_wheather(closet, weatherTags)

    #group by type
    groups = group_by_type(filtered_closet)

    #rank items using style_fashionCLIP tuned version
    #ranking call
    # ranked_groups = style_fashionclip.rank(groups, preferences)
    ranked_groups = groups  # placeholder

    #PASS ranked groups to create_outfit
    #TODO: call create_outfit with ranked_groups, preferences, weather_tags

    return jsonify(ranked_groups)


if __name__ == '__main__':
    app.run(debug=True)

#after doing this we can sort the closet based weather, and styles using evaluate clip in our file structure and the finetuned version of fashion clip by styles