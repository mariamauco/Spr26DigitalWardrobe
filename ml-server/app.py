from flask import Flask, jsonify, request, send_file
from PIL import Image
import io

# background removal function
from remove_bg import remove_bg

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

    #checks if image was sent
    if "image" not in request.files:
        return jsonify(error="No image uploaded"), 400

    image_file = request.files["image"]
    image = Image.open(image_file.stream)

    # Removes background
    result_image = remove_bg(image)

    # Saves the processed image
    output = io.BytesIO()
    result_image.save(output, format="PNG")
    output.seek(0)

    return send_file(output, mimetype="image/png")

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)