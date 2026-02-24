from rembg import remove
from PIL import Image
import requests
from transformers import CLIPProcessor, CLIPModel


# Fine category examples (expand later)

COARSE_PROMPTS = {
    "top": ["a photo of a top"],
    "bottom": ["a photo of a bottom"],
    "shoe": ["a photo of a shoe"],
    "accessory": ["a photo of an accessory"],
}
FINE_CATEGORY_PROMPTS = {
    "top": [
        "a photo of a t-shirt",
        "a photo of a blouse",
        "a photo of a button-down shirt",
        "a photo of a sweater",
        "a photo of a hoodie",
        "a photo of a jacket",
        "a photo of a coat",
    ],
    "bottom": [
        "a photo of jeans",
        "a photo of trousers",
        "a photo of leggings",
        "a photo of shorts",
        "a photo of a skirt",
    ],
    "shoe": [
        "a photo of sneakers",
        "a photo of boots",
        "a photo of loafers",
        "a photo of heels",
        "a photo of sandals",
    ],
    "accessory": [
        "a photo of a handbag",
        "a photo of a backpack",
        "a photo of a belt",
        "a photo of a hat",
        "a photo of jewelry",
        "a photo of sunglasses",
    ],
}

# Style prompts (multi-label)
STYLE_PROMPTS = [
    "a piece of clothing in neutral style",
    "a piece of clothing in y2k style",
    "a piece of clothing in academia style",
    "a piece of clothing in formal style",
    "a piece of clothing in streetwear style",
    "a piece of clothing in vintage style",
    "a piece of clothing in sporty style",
    "a piece of clothing in minimal style"
    #TODO: expand with more styles
    #TODO: add seasonalities
]


with open('test_images/inputshirt1.jpg', 'rb') as i:
    with open('test_images/outputshirt1.jpg', 'wb') as o:
        input = i.read()
        output = remove(input)
        o.write(output)

model = CLIPModel.from_pretrained("patrickjohncyh/fashion-clip")
processor = CLIPProcessor.from_pretrained("patrickjohncyh/fashion-clip")

image = Image.open('test_images/outputshirt1.jpg').convert("RGB")

labels = []
all_prompts = []

for category, prompt_list in COARSE_PROMPTS.items():
    for p in prompt_list:
        labels.append(category)
        all_prompts.append(p)

inputs = processor(text=all_prompts, images=image, return_tensors="pt", padding=True)

outputs = model(**inputs)
logits_per_image = outputs.logits_per_image
probs = logits_per_image.softmax(dim=1)

probs = probs.detach().numpy()[0]

best_idx = probs.argmax()
best_category = labels[best_idx]
confidence = float(probs[best_idx])

print("Predicted coarse category:", best_category)
print("Confidence:", confidence)
