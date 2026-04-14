# Pinterest Scraping Script!!!
'''
requests is a python module for HTTP requests

bs4/BeautifulSoup is a python module for parsing HTML through parse trees

current issue with script: pinterest uses infinite scrolling, the server only sends the first 15 pins
and the rest are loaded via javascript only when the user scrolls down
to get all the pins, we must mimuc the background requests the browser makes, or use a tool that
opens a browser and scrolls
'''
import requests
from bs4 import BeautifulSoup

# Choose the board URL. You can loop through your boards with the following example:
'''
https://www.pinterest.com/<Camilla'sUserName>/BoardName<x>

If you rename the board names in that format: BoardName<x> then you can loop through whatever x is

ALTERNATIVELY you can build a list/set of BoardNames and loop through the list this way

https://www.pinterest.com/<Camilla'sUserName>/BoardNames[i]

'''
url = 'https://www.pinterest.com/hellofloressofia/makeup'

response = requests.get(url) #Get the response from the HTTP request

html_content = response.content #Parse the response to get jus tthe HTML content

soup = BeautifulSoup(html_content, 'html.parser') #Parse the HTML using the html.parser in Beautiful Soup

pin_list = soup.find_all('img') 

image_count = 1

for pin in pin_list:
    print('==='*50)

    caption = pin.get('alt')
    print(caption)

    if caption:
        image = pin.get('src')
        print(image)

        download_image = requests.get(image)
        image_filename = f"image{image_count}.jpg"

        with open(image_filename, "wb") as f:
            f.write(download_image.content)
        
        image_count += 1