#sort by wheather and styles of closet
#classifying using evaluate clip

from flask import Flask, request, jsonify

app = Flask(__name__)
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

    return jsonify({
        "userID": userID,
        "preferences": preferences,
        "closet": closet,
        "weatherTags": weatherTags,
        "is_valid": is_valid
    })
if __name__ == '__main__':
    app.run(debug=True)

#after doing this we can sort the closet based weather, and styles using evaluate clip in our file structure and the finetuned version of fashion clip by styles