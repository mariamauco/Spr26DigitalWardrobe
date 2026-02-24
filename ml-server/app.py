from flask import Flask, jsonify
from rembg import remove 

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

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)