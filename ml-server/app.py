import base64
import io
import os

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

# the dir in backend where photos are stored
UPLOADS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "backend", "uploads")
)

def _read_upload_from_shared_dir(image_path: str):
    # Accept either /uploads/<file> or just <file>, then read from shared uploads dir.
    filename = os.path.basename(str(image_path or "").strip())
    if not filename:
        raise FileNotFoundError("Invalid imagePath")

    full_path = os.path.join(UPLOADS_DIR, filename)
    if not os.path.isfile(full_path):
        raise FileNotFoundError("Image file not found in shared uploads directory")

    with open(full_path, "rb") as f:
        return f.read(), filename


@app.get("/")
def home():
    return "Hello from Flask 👋"

@app.get("/health")
def health():
    return jsonify(status="ok")

@app.post("/process-image")
def process_image():

    print("--- Request Received ---")

    raw_bytes = b""

    image_path=''
    # for postman testing: accept multipart upload if present.
    if "image" in request.files:
        image_file = request.files["image"]
        if not image_file or not image_file.filename:
            return jsonify(error="No file selected for 'image'"), 400
        raw_bytes = image_file.read()
    else:
        payload = request.get_json(silent=True) or {}
        image_path = payload.get("imagePath") or payload.get("image_path")
        if not image_path:
            return jsonify(error="Missing imagePath in JSON body"), 400
        try:
            raw_bytes, _ = _read_upload_from_shared_dir(image_path)
        except FileNotFoundError as e:
            return jsonify(error=str(e)), 400
        except OSError:
            return jsonify(error="Could not read image from shared uploads directory"), 400

    # Read bytes first so we can validate empty uploads and decode failures.
    if not raw_bytes:
        return jsonify(error="Uploaded file is empty"), 400

    try:
        image = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    except UnidentifiedImageError:
        return jsonify(error="Uploaded file is not a valid image"), 400

    # Removes background
    result_image = remove_bg(image)
    print("Background removed...")

    # check num of objects on the image
    single, message = validate_single_clothing_item(result_image)
    # if single is set to false, there is no image or more than one image, return the error
    if not single:
        return jsonify(error=message), 400

    # use the background-removed image for both clip stages
    clip_image = result_image.convert("RGB")
    if torch.is_tensor(image_embedding):
        image_embedding = image_embedding.detach().cpu().tolist()

    pred_coarse, coarse_conf, coarse_probs = clip_classify(
        clip_image, COARSE_PROMPTS, model, processor
    )
    print("Coarse classification done...")

    fine_coarse_key = pred_coarse
    pred_fine, fine_conf, fine_probs = clip_classify_fine(
        clip_image, fine_coarse_key, model, processor
    )

    # Save result_image to backend/uploads with the same filename
    # output = io.BytesIO()
    # result_image.save(output, format="PNG")
    
    # Keep the same base filename but always save as PNG.
    if "image" in request.files:
        source_filename = request.files["image"].filename
    else:
        source_filename = os.path.basename(str(image_path or "").strip())

    source_basename = os.path.basename(str(source_filename or "").strip())
    base_name, _ = os.path.splitext(source_basename)
    saved_filename = f"{base_name}.png" if base_name else "upload.png"

    saved_filepath = os.path.join(UPLOADS_DIR, saved_filename)
    result_image.save(saved_filepath, format="PNG")
    print("Saved result image...")

    data = jsonify({
        "embedding_dim": len(image_embedding),
        "imageEmbedding": image_embedding,
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
            "url": f"https://digitalwardrobe.xyz/uploads/{saved_filename}"
        },
    })
    print("Sending response back...")
    return data

if __name__ == "__main__":
    # 0.0.0.0 to allow external requests (Postman/Frontend)
    app.run(host="0.0.0.0", port=5000, debug=True)