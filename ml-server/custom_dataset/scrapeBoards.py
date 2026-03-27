#use the pinterest API to find boards for different styles for each category
import requests

headers = {
    'Authorization': 'Bearer <access_token>',
    'Content-Type': 'application/json',
    'Accept': 'application/json',
}

response = requests.get('https://api.pinterest.com/v5/boards/{board_id}?board_id={board_id}', headers=headers)

#(tops, bottoms,shoes,outwear,onepiece,accessories)for each category

#1 sporty style 

#2 Academia (needs segmentation script using SAM3 model)

#3 Earthy/Hippie/Boho

#4 Vintage/ Cottage Core

#5 Minimal / clean girl 

#6 coquette