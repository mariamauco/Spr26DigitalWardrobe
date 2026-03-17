import base64
import io

from flask import Flask, jsonify, request
from PIL import Image, UnidentifiedImageError

import torch
from transformers import CLIPProcessor, CLIPModel

# util functions
from util.error_handling import validate_single_clothing_item
from util.prompts import COARSE_PROMPTS
from util.analyze_img import clip_classify, clip_classify_fine, get_img_embedding

# background removal function
from util.remove_bg import remove_bg

# model
MODEL_NAME = "patrickjohncyh/fashion-clip"
FINE_MODE = "pred_coarse"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
model = CLIPModel.from_pretrained(MODEL_NAME).to(DEVICE)
processor = CLIPProcessor.from_pretrained(MODEL_NAME)
model.eval()

# Flask cors: flask extension that enables cros origin resource sharing (useful for development)
from flask_cors import CORS

# creating an instance of flask
app = Flask(__name__)
CORS(app)  # enables CORS for development


@app.get("/")
def home():
    return "Hello from Flask 👋"

@app.get("/health")
def health():
    return jsonify(status="ok")

@app.post("/process-image")
def process_image():
    # checks if an image file field was sent
    if "image" not in request.files:
        return jsonify(error="Missing form-data file field 'image'"), 400

    image_file = request.files["image"]
    if not image_file or not image_file.filename:
        return jsonify(error="No file selected for 'image'"), 400

    # Read bytes first so we can validate empty uploads and decode failures.
    raw_bytes = image_file.read()
    if not raw_bytes:
        return jsonify(error="Uploaded file is empty"), 400

    try:
        image = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    except UnidentifiedImageError:
        return jsonify(error="Uploaded file is not a valid image"), 400

    # Removes background
    result_image = remove_bg(image)

    # check num of objects on the image
    single, message = validate_single_clothing_item(result_image)
    # if single is set to false, there is no image or more than one image, return the error
    if not single:
        return jsonify(error=message), 400

    # use the background-removed image for both clip stages
    clip_image = result_image.convert("RGB")
    image_embedding = get_img_embedding(model, processor, clip_image)

    pred_coarse, coarse_conf, coarse_probs = clip_classify(
        clip_image, COARSE_PROMPTS, model, processor
    )

    fine_coarse_key = pred_coarse
    pred_fine, fine_conf, fine_probs = clip_classify_fine(
        clip_image, fine_coarse_key, model, processor
    )

    output = io.BytesIO()
    result_image.save(output, format="PNG")

    # change this to return a image url or the path after storing
    bg_removed_base64 = base64.b64encode(output.getvalue()).decode("utf-8")

    data = jsonify({
        "embedding_dim": len(image_embedding),
        "image_embedding": image_embedding,
        "pred_coarse": pred_coarse,
        "coarse_conf": coarse_conf,
        "coarse_probs": coarse_probs,
        "pred_fine": pred_fine,
        "fine_conf": fine_conf,
        "fine_probs": fine_probs,
        "fine_pool_coarse": fine_coarse_key,
        "validation_message": message,
        "bg_removed_image": { # change this to return a image url or the path after storing
            "format": "png",
            "mime_type": "image/png",
            "base64": bg_removed_base64,
        },
    })
    
    return data

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)