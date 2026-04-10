'''
Script used to clean the dataset
'''

import time, os, json, random, re
import pandas as pd

df = pd.read_csv('metadata.csv')

onlyID = df["pin_id"].astype(str).str.fullmatch(r"\d+") | df["pin_id"].isna()
onlyID = df[onlyID]

onlyID.to_csv(path_or_buf='metadata.csv')

print(onlyID)