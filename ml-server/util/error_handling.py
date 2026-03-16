#This file will handle all the errors once a user inputs an incorrect image
#If a user uploads an image that has multiple clothing items their image will be sent to this script and they
#will be advise them to upload a new image with a single item
import cv2
import numpy as np
from PIL import Image


def validate_single_clothing_item(image) -> Image.Image:
    #bg_removed: Image.Image = remove_bg(image_path)

    #separate the image obtained into its individual channels(RBA) as a tuple and convert from PIL to a numpy array
    alpha = np.array(image.split()[-1])

    #get a clean binary mask to work with by making every pixel white/foreground & disregard the first return value
    _, binary_mask = cv2.threshold(alpha, 127, 255, cv2.THRESH_BINARY)

    #trace the outline of every white region detected in the binary mask ensuring they are only external contours
    contours, _ = cv2.findContours(
        binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )

    
    significant = []
    
    #calculate the area under the countours by calculating the area of contour and divide by the area of the items pixels
    for c in contours:
        if cv2.contourArea(c) / (binary_mask.shape[0] * binary_mask.shape[1]) >= 0.01:
            significant.append(c)
    

    num_items = len(significant)

    if num_items > 1:
        return (
            False,
            f"Multiple clothing items detected ({num_items} items found). "
            "Please upload an image containing only one item.",
        )

    if num_items == 0:
        return False, "No clothing items detected in the image."

    return True, "Single clothing item detected."