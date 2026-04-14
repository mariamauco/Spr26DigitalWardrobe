'''
Script used to clean the dataset and download

For all images:
- download the image into the image_path.
- coarse,fine,color,sleeve,coverage = null 
    - use clip, if >70, change it to that.
- if all %s >70 -> set review to 0
- if all <70 --> delete image and continue

- if some <70 -> review

- add style specific: title/ description words that best match
'''

import time, os, json, random, re
import pandas as pd

df = pd.read_csv('metadata.csv')

onlyID = df["pin_id"].astype(str).str.fullmatch(r"\d+") | df["pin_id"].isna()
onlyID = df[onlyID]

onlyID.to_csv(path_or_buf='metadata.csv')

print(onlyID)
