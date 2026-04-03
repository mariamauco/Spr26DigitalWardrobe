# Pinterest Scraping Script version 2!
'''
this script attempts to reverse engineer the API

it works to solve the issue with the first script by:
1. set up fake user-agents to trick pinterest into thinking the script is someone using chrome or firefox
2. it requests the main page and looks for the first batch of pins
3. inside that, it looks for a bookmark, a password/token that tells Pinterest, "Hey, I'm at the end of page 1, give me page 2."
4. it sends the GET reqauest to the pinterest API endpoint to get the next pins, until all have been sent

current issue with script:
requests.exceptions.JSONDecodeError: Expecting value: line 1 column 1 (char 0)

pinterest's anti bot is blocking the attempt and returns a 403 forbidden error
'''

from bs4 import BeautifulSoup
import requests, json, time, random

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
]

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
    if not r.ok:
        print(f"Request failed with status {r.status_code}")
        print(r.text[:500])
        break

    content_type = r.headers.get("Content-Type", "")
    if "application/json" not in content_type:
        print(f"Expected JSON but got {content_type or 'no content type'}")
        print(r.text[:500])
        break

    try:
        j = r.json()
    except json.JSONDecodeError:
        print("Failed to decode JSON response")
        print(r.text[:500])
        break

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