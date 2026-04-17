#import needed libraries
import numpy as np
import matplotlib.pyplot as plt
import cv2, csv, os
import pandas as pd

#METADATA_CSV = "/home/maria/Projects/WEECSSpr26/Spr26DigitalWardrobe/ml-server/custom_dataset/scraping/metadata_labeled.csv"
METADATA_CSV = "scraping/metadata_labeled.csv"

IMAGES_ROOT  = "/media/maria/ubuntu storage/dataset"

CSV_COLUMNS = [
    "row_id","pin_id","source_url","image_url","image_path","title","description","style","color","coarse_category","fine_tag","coarse_conf","fine_conf","sleeve_label","sleeve_conf","coverage_label","coverage_conf","color_conf","embedding","metadata","review","style_keywords","status"
]

# read df and add duplicate rows to list
def find_dupes(df):
    # group by pin_ids
    grouped = df.groupby('pin_id')
    only_dupes = grouped.filter(lambda x: len(x) > 1)
    sorted_dupes = only_dupes.sort_values('pin_id')
    return sorted_dupes

def process_dupes(df):
    cur = 0
    num_dupes = 0
    delete_ids = []

    df = df.sort_values('pin_id')

    # keep cur at 0 bc len of df decreases
    while cur < len(df):
        row = df.iloc[cur] # store cur row
        dupes = df[df['pin_id'] == row['pin_id']].copy() # group rows with the same id
        num_dupes = len(dupes) # number of duplicate pins with that id
        
        first = 0 # current winner

        while num_dupes > 1:
            # compare winner with next dupe
            output_dupe(dupes.iloc[first], dupes.iloc[first + 1])
            choice = input('Which one to keep?')

            # if they did not make a valid choice
            if choice not in {"1", "2"}:
                print("Incorrect input, try again")
                continue
 
            to_del = first

            if int(choice) == 1:
                to_del = first + 1 # delete the second instead

            # add row id to delete list
            delete_ids.append(int(dupes.iloc[to_del]["row_id"]))

            # drop row from dupes and df
            to_del_idx = dupes.index[to_del]
            dupes = dupes.drop(index=to_del_idx)
            df = df.drop(index=to_del_idx)

            num_dupes -= 1
        
        # once done deleting dupes, remove the only pin left
        if len(dupes) == 1:
            keep_idx = dupes.index[0]
            df = df.drop(index=keep_idx)

    return delete_ids

def output_dupe(row1, row2):
    img1_path = os.path.join(IMAGES_ROOT, row1["image_path"])
    img2_path = os.path.join(IMAGES_ROOT, row2["image_path"])

    img1 = cv2.imread(img1_path)
    img2 = cv2.imread(img2_path)

    if img1 is None:
        print(f"Could not load: {img1_path}")
        return
    if img2 is None:
        print(f"Could not load: {img2_path}")
        return

    img1_rgb = cv2.cvtColor(img1, cv2.COLOR_BGR2RGB)
    img2_rgb = cv2.cvtColor(img2, cv2.COLOR_BGR2RGB)

    fig, axes = plt.subplots(1, 2, figsize=(14, 6))

    axes[0].imshow(img1_rgb)
    axes[0].axis("off")
    axes[1].imshow(img2_rgb)
    axes[1].axis("off")

    info1 = f"Status: {row1['status']}\nPin: {row1['pin_id']}\nStyle: {row1['style']}\nColor: {row1['color']}"
    info2 = f"Status: {row2['status']}\nPin: {row2['pin_id']}\nStyle: {row2['style']}\nColor: {row2['color']}"

    fig.subplots_adjust(bottom=0.25)
    fig.text(0.25, 0.05, info1, ha="center", va="bottom", fontsize=9)
    fig.text(0.75, 0.05, info2, ha="center", va="bottom", fontsize=9)

    display(fig)
    plt.close(fig)

def save_output(df, delete_ids):
    # use delete to remove duplicates from df
    delete_set = set(map(int, delete_ids))
    df = df[~df["row_id"].astype(int).isin(delete_set)].copy()

    df.to_csv("metadata_no_dupes.csv")

def duplicate_pipeline(df):

    # variables
    dupe_count = 0 # count of duplicate pins
    dupes = [] # list of duplicates
     # list of pins to be deleted

    # find the duplicate pins
    dupes = find_dupes(df)

    # process_dupes
    delete_ids = process_dupes(dupes)

    # save output
    save_output(df,delete_ids)

# open and prep file
df = pd.read_csv(METADATA_CSV)
duplicate_pipeline(df)

