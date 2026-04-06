# Pinterest Scraping Script version 3!
'''
new strategy: use Selinium to physically open a ewal browser, load the page, and
mimic a human pressing the page down key. the beowser will cause the javascript
trigger it needs for making pinterest think its a human scrolling through a board

to do this: install selenium `pip install selenium`
'''

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.common.exceptions import StaleElementReferenceException, NoSuchElementException
import time, os, json, random, re
import pandas as pd
import requests
from bs4 import BeautifulSoup

driver = None

def loadCookies():
    global driver # use and update the driver

    # Open a browser in the background
    options = webdriver.ChromeOptions()
    # options.add_argument('--headless=new')
    # options.add_argument('--no-sandbox')
    # options.add_argument('--disable-dev-shm-usage')
    
    driver = webdriver.Chrome(options=options)

    # 1. Go to the domain first before you can add cookies for it
    driver.get("https://www.pinterest.com/404") 
    time.sleep(2)

    # 1. saves the session of pinterest profile already logged into
    # profile_path = os.path.join(os.getcwd(), "pinterest_profile")
    # options.add_argument(f"user-data-dir={profile_path}")

    # 2. Load the cookies from your JSON file with credentials to log in
    with open("pinterest_cookies.json", "r") as file:
        cookies = json.load(file)
        for cookie in cookies:
            # Selenium can be strict about cookie formatting, so we filter out extra keys
            cookie_dict = {
                'name': cookie.get('name'),
                'value': cookie.get('value'),
                'domain': cookie.get('domain'),
                'path': cookie.get('path', '/')
            }
            driver.add_cookie(cookie_dict)

def scrapeBoard(url, pinCount):

    global driver

    driver.get(url)
    time.sleep(3)

    count = 0
    pinIDs = set() # set to prevent dupes
    height = driver.execute_script("return document.body.scrollHeight")
    scroll_attempt = 0

    # start scrolling!

    while len(pinIDs) < pinCount:

        # Search for all the pin links on the screen
        pins = driver.find_elements(By.CSS_SELECTOR, "a[href^='/pin/']")
        try:
            board_container = driver.find_element(By.CSS_SELECTOR, 'div[data-test-id="board-feed"]')
            pins = board_container.find_elements(By.CSS_SELECTOR, "a[href^='/pin/']")
        except NoSuchElementException:
            pass

        for pin in pins:
            try:
                href = pin.get_attribute('href')
                if href: # only add the id
                    pinIDs.add(href.split('/pin/')[1].strip('/'))
            # this happens when pinterest deletes the pin before we read it, just skip it
            # because we have likely added it already
            except StaleElementReferenceException:
                continue
        # scroll down and wait
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(2)

        new_height = driver.execute_script("return document.body.scrollHeight")
        if height == new_height:
            scroll_attempt+=1
            if scroll_attempt > 3:
                print (f"Done getting boards for {url}")
                break
            time.sleep(1)
        else:
            scroll_attempt = 0       
            height = new_height
    driver.quit()

    print(f"\nTotal unique pins found: {len(pinIDs)}")
    return list(pinIDs)

'''
add the pin to the csv following format:

pin_id, source_url, image_url, image_path, title, description, style, color, coarse_category, fine_tag, coarse_conf, sleeve_label, coverage_label, embedding
'''

def getPin(id):
    url = f'https://www.pinterest.com/pin/{id}/'

    # headers so pinterest doesn't block us
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    response = requests.get(url, headers=headers)

    # Check if the page loaded successfully
    if response.status_code != 200:
        print(f"Failed to load pin {id}. Status code: {response.status_code}")
        return None

    html_content = response.content #Parse the response to get jus tthe HTML content

    soup = BeautifulSoup(html_content, 'html.parser') #Parse the HTML using the html.parser in Beautiful Soup

    # Grab the image
    image_meta = soup.find('meta', property='og:image')
    image_url = image_meta['content'] if image_meta else None

    # Grab the title
    title_meta = soup.find('meta', property='og:title')
    title = title_meta['content'] if title_meta else None

    # Grab the description
    desc_meta = soup.find('meta', property='og:description')
    description = desc_meta['content'] if desc_meta else None

    # Store all and return
    pin = {
        "pin_id": id,
        "source_url": url,
        "color": None,
        "image_url": image_url,
        "title": title,
        "description": description,
    }
    return pin

# stores pin to end of csv
def addToCSV(pin, style, cat, count):

    if cat == None:
        img_path = None
    else:
        img_path = f'{style}/{cat}/{style}_{cat}_{count:03d}'
    
    row_data = [
        pin['pin_id'], pin['source_url'], pin['image_url'], img_path, 
        pin['title'], pin['description'], style, pin['color'],
        None, None, None, None, None, None, 1
    ]

    # convert row into a df and append to the csv file
    df_row = pd.DataFrame([row_data])
    df_row.to_csv('metadata.csv', mode='a', header=False, index=False)


'''
this function runs the entire scraping pipeline
it goes through the boards csv and scrapes each board, then scraping the info inside each pin
'''
def scrapeAll(boards):

    df = pd.read_csv(boards)

    # go through each board/row
    for index, row in df.iterrows():

        board_url = row["board_url"]
        style = row['style']
        category = row['category']
        pinCount = row['pins_count']

        print(f"Scraping board: {board_url}...")

        count = 0
        # get all pins from the board
        pin_ids = scrapeBoard(board_url, pinCount)

        for pin_id in pin_ids:
            count += 1
            pin = getPin(pin_id)
            if pin:
                addToCSV(pin, style, category, count)
            time.sleep(random.uniform(0.5, 2)) # small wait between pins -> and make it random to seem human

# Initializes metadata.csv file to save dataset
def initMetadata():
    cols = ["pin_id", "source_url", "image_url", "image_path", "title", 
            "description", "style", "color", "coarse_category", "fine_tag", 
            "coarse_conf", "sleeve_label", "coverage_label", "embedding", "review"]

    if os.path.exists('metadata.csv'):
        df = pd.read_csv('metadata.csv')
        if 'metadata' not in df.columns:
            insert_at = df.columns.get_loc('review') if 'review' in df.columns else len(df.columns)
            df.insert(insert_at, 'metadata', '')
        df.to_csv('metadata.csv', index=False)
    else:
        df = pd.DataFrame(columns=cols)
        df.to_csv('metadata.csv', index=False)

# Load cookies to log into pinterest
loadCookies()

# TESTING

board_url = "https://www.pinterest.com/imbervintage/y2k-aesthetic/"
pins = scrapeBoard(board_url)

# print(pins)

# print(getPin(920634348802505304))

# scrapeAll("y2k.csv")






