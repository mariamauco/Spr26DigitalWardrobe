#use the pinterest API to find boards for different styles for each category
from bs4 import BeautifulSoup
import requests, json
import time

# SCRAPING HTML 
session = requests.Session()
session.headers.update({
    "User-Agent": random.choice(USER_AGENTS),
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "DNT": "1",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
})

# load first page
html = session.get('https://www.pinterest.com/imbervintage/y2k-aesthetic/', timeout=30).text
source_path = "/imbervintage/y2k-aesthetic/"
soup = BeautifulSoup(html, "html.parser")

# find script tag with the JSON data
SCRIPT_TAG = soup.find('script', {'id': '__PWS_INITIAL_PROPS__'})
data = json.loads(SCRIPT_TAG.string)

with open('data.json', 'w') as f:
    json.dump(data, f)



initial_state = data.get("initialReduxState", {})
feeds = data.get("initialReduxState", {}).get("feeds", {})

# get the board id from boardfeed
boardfeed_key = next((k for k in feeds if k.startswith("boardfeed:")), None)
if not boardfeed_key:
    raise RuntimeError("No board feed key found.")
board_id = boardfeed_key.split(":", 1)[1]

# first batch of ids
pin_ids = [
    x["id"] for x in feeds.get(boardfeed_key, [])
    if x.get("type") == "pin" and "id" in x
]

# find initial nextBookmark from resources
bookmark = None
for v in initial_state.get("resources", {}).get("BoardFeedResource", {}).values():
    time.sleep(2) 
    if isinstance(v, dict) and v.get("nextBookmark"):
        bookmark = v["nextBookmark"]
        break
# 2) Paginate until end
while bookmark and bookmark != "-end-":
    time.sleep(random.uniform(5, 10)) # wait 5-10 secs so it looks human-like lol
    payload = {
        "options": {
            "board_id": board_id,
            "bookmarks": [bookmark],
            "page_size": 25,
            "field_set_key": "react_grid_pin",
            "filter_section_pins": False,
            "sort": "default",
            "layout": "default",
        },
        "context": {}
    }

    r = session.get(
        "https://www.pinterest.com/resource/BoardFeedResource/get/",
        params={
            "source_url": source_path,
            "data": json.dumps(payload, separators=(",", ":")),
        },
        timeout=30,
    )
    # print(r)
    j = r.json()

    items = j.get("resource_response", {}).get("data", [])
    for item in items:
        if item.get("type") == "pin" and "id" in item:
            pin_ids.append(item["id"])

    # bookmark location can vary; check common spots
    bookmark = (
        j.get("resource", {}).get("options", {}).get("bookmarks", [None])[0]
        or j.get("bookmark")
        or "-end-"
    )

# dedupe while preserving order
pin_ids = list(dict.fromkeys(pin_ids))

print(f"Total pins found: {len(pin_ids)}")
print(pin_ids)

# FOR PINTEREST API ;-;

# headers = {
#     'Authorization': 'Bearer <access_token>',
#     'Content-Type': 'application/json',
#     'Accept': 'application/json',
# }

#(tops, bottoms,shoes,outwear,onepiece,accessories)for each category

#1 sporty style 

#2 Academia (needs segmentation script using SAM3 model)

#3 Earthy/Hippie/Boho

#4 Vintage/ Cottage Core

#5 Minimal / clean girl 

#6 coquette