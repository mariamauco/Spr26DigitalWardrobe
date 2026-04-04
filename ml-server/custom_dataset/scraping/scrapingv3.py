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
import time, os

def scrapeBoard(url):

    # Open a browser in the background
    options = webdriver.ChromeOptions()

    # 1. Define a folder in your current directory to save the session
    profile_path = os.path.join(os.getcwd(), "pinterest_profile")
    options.add_argument(f"user-data-dir={profile_path}")

    driver = webdriver.Chrome(options=options)

    # open the board and let the page load
    driver.get(url)
    time.sleep(3)

    pinIDs = set() # set to prevent dupes
    height = driver.execute_script("return document.body.scrollHeight")
    scroll_attempt = 0

    # start scrolling!

    while True:

        # find all the pin links on the screen

        pins = driver.find_elements(By.CSS_SELECTOR, "a[href^='/pin/']")
        try:
            board_container = driver.find_element(By.CSS_SELECTOR, 'div[data-test-id="board-feed"]')
            pins = board_container.find_elements(By.CSS_SELECTOR, "a[href^='/pin/']")
        except NoSuchElementException:
            return

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
            time.sleep(2)
        else:
            scroll_attempt = 0       
            height = new_height
    driver.quit()

    print(f"\nTotal unique pins found: {len(pinIDs)}")
    return list(pinIDs)

'''
add the pin to the csv following format:

pin_id, source_url, image_url, image_path, style, color, coarse_category, fine_tag, coarse_conf, sleeve_label, coverage_label, embedding
'''
def addToCSV(pin):
    return

board_url = "https://www.pinterest.com/imbervintage/y2k-aesthetic/"
pins = scrapeBoard(board_url)

print(pins)


