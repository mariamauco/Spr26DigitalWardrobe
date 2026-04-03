# Pinterest Scraping Script version 3!
'''
new strategy: use Selinium to physically open a ewal browser, load the page, and
mimic a human pressing the page down key. the beowser will cause the javascript
trigger it needs for making pinterest think its a human scrolling through a board

to do this: install selenium `pip install selenium`
'''
from selenium import webdriver
from selenium.webdriver.common.by import By
import time

def scrapeBoard(url):

    # Open a browser in the background
    options = webdriver.ChromeOptions()
    driver = webdriver.Chrome(options=options)

    # open the board and let the page load
    driver.get(url)
    time.sleep(3)

    pinIDs = set() # set to prevent dupes
    scroll = driver.execute_script("return document.body.scrollHeight")

    # start scrolling!

    while True:

        # find all the pin links on the screen

        pins = driver.find_elements(By.CSS_SELECTOR, "a[href^='/pin/']")

        for pin in pins:
            href = el.get_attribute('href')
            if href: # only add the id
                pin_ids.add(href.split('/pin/')[1].strip('/'))

        # scroll down and wait
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(3)

        new_height = driver.execute_script("return document.body.scrollHeight")
        if height == new_height:
            print (f"Done getting boards for {url}")
            break
        
        height = new_height
    driver.quit()

    print(f"\nTotal unique pins found: {len(pin_ids)}")
    return list(pin_ids)


board_url = "https://www.pinterest.com/imbervintage/y2k-aesthetic/"
pins = scrapeBoard(board_url)

print(pins)
