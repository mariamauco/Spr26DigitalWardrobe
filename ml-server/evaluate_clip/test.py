from rembg import remove
from PIL import Image
import requests
from transformers import CLIPProcessor, CLIPModel
import numpy as np



# Fine category examples (expand later)

COARSE_PROMPTS = {
    "top": "a photo of an upper body base garment such as a t-shirt, shirt, blouse, sweater, or tank top",
    "bottom": "a photo of a lower body garment such as pants, jeans, trousers, shorts, or a skirt",
    "one_piece": "a photo of a full body one-piece garment such as a dress, jumpsuit, romper, or overalls",
    "outerwear": "a photo of an outerwear garment such as a coat, jacket, blazer, cardigan, or vest",
    "shoe": "a photo of footwear such as sneakers, boots, sandals, or heels",
    "accessory": "a photo of a wearable fashion accessory such as a bag, hat, scarf, belt, or jewelry",
}


FINE_CATEGORY_PROMPTS = {
    "top": [
        "a photo of a t-shirt",
        "a photo of a long sleeve shirt",
        "a photo of a shirt",
        "a photo of a blouse",
        "a photo of a tank top",
        "a photo of a sweater",
        "a photo of a hoodie",
    ],

    "bottom": [
        "a photo of jeans",
        "a photo of pants",
        "a photo of trousers",
        "a photo of leggings",
        "a photo of sweatpants",
        "a photo of shorts",
        "a photo of a skirt",
    ],

    "one_piece": [
        "a photo of a dress",
        "a photo of a jumpsuit",
        "a photo of a romper",
        "a photo of overalls",
        "a photo of a bodysuit",
    ],

    "outerwear": [
        "a photo of a jacket",
        "a photo of a coat",
        "a photo of a blazer",
        "a photo of a cardigan worn as outerwear",
        "a photo of a vest",
        "a photo of a trench coat",
    ],

    "shoe": [
        "a photo of sneakers",
        "a photo of boots",
        "a photo of loafers",
        "a photo of flats",
        "a photo of heels",
        "a photo of sandals",
    ],

    "accessory": [
        "a photo of a handbag",
        "a photo of a tote bag",
        "a photo of a backpack",
        "a photo of a belt",
        "a photo of a hat",
        "a photo of a scarf",
        "a photo of jewelry",
        "a photo of sunglasses",
    ],
}

# Style prompts (multi-label)
STYLE_PROMPTS = {
    "neutral": "a photo of neutral colored clothing with beige, white, black, or soft tones",
    "y2k": "a photo of y2k fashion clothing inspired by early 2000s trends with bold colors or fitted silhouettes",
    "academia": "a photo of academia style clothing with blazers, sweaters, pleated skirts, or structured layering",
    "formal": "a photo of formal tailored clothing such as suits, blazers, or elegant structured garments",
    "streetwear": "a photo of streetwear fashion with oversized silhouettes, graphic prints, or urban influence",
    "vintage": "a photo of vintage inspired clothing with retro cuts, classic fabrics, or old-fashioned patterns",
    "sporty": "a photo of sporty athletic clothing such as activewear, performance fabrics, or fitted training apparel",
    "minimalist": "a photo of minimalist clothing with clean silhouettes, solid colors, and simple design"
}

#TODO: expand with more styles
#TODO: add seasonalities and other attributes


with open('inputskirt1.png', 'rb') as i:
    with open('outputskirt1.png', 'wb') as o:
        input = i.read()
        output = remove(input)
        o.write(output)

model = CLIPModel.from_pretrained("patrickjohncyh/fashion-clip")
processor = CLIPProcessor.from_pretrained("patrickjohncyh/fashion-clip")

image = Image.open('outputskirt1.png').convert("RGB")

labels = []
all_prompts = []

for category, prompt in COARSE_PROMPTS.items():
    labels.append(category)
    all_prompts.append(prompt)

inputs = processor(text=all_prompts, images=image, return_tensors="pt", padding=True)

outputs = model(**inputs)
logits_per_image = outputs.logits_per_image
probs = logits_per_image.softmax(dim=1)

probs = probs.detach().numpy()[0]

best_idx = probs.argmax()
best_category = labels[best_idx]
confidence = float(probs[best_idx])

#obtain the feautre vector from the image to return to the backend
#resizing, normalization, and tensor conversion
image_inputs = processor(images=image, return_tensors="pt")
image_features = model.get_image_features(**image_inputs)
image_features = image_features.detach().numpy().flatten()
image_features = image_features / np.linalg.norm(image_features)
feature_vector = image_features.tolist()


print(feature_vector)
print("Predicted coarse category:", best_category)
print("Confidence:", confidence)