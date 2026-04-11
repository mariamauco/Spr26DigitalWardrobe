import os
import base64
from pathlib import Path
import cv2
from dotenv import load_dotenv
from inference_sdk import InferenceHTTPClient

load_dotenv()

# 1. Initialize the client
CLIENT = InferenceHTTPClient(
    api_url="http://localhost:9001",
    api_key=os.environ["ROBOFLOW_API_KEY"]
)

# 2. Define the folder mapping
FOLDER_MAP = {
    "short sleeves tops": "Tops/short_sleeves",
    "long sleeves tops": "Tops/long_sleeves",
    "no sleeves tops": "Tops/no_sleeves",
    "pants": "Bottoms/pants",
    "skirt": "Bottoms/skirt",
    "shorts": "Bottoms/shorts",
    "shoes": "Shoes"
}

def process_and_save_outfit(image_path, output_root="/media/maria/ubuntu storage/Fashion_Dataset"):
    # Read the image using OpenCV
    img = cv2.imread(image_path)
    
    # Shrink the image to max 800px wide/high to save GPU VRAM
    height, width = img.shape[:2]
    max_dim = 800
    if max(height, width) > max_dim:
        scale = max_dim / max(height, width)
        img = cv2.resize(img, (int(width * scale), int(height * scale)))

    # Convert the resized image to base64
    _, buffer = cv2.imencode('.jpg', img)
    image_b64 = base64.b64encode(buffer).decode("utf-8")

    # Run the workflow
    result = CLIENT.run_workflow(
        workspace_name="sofias-workspace-9bta6",
        workflow_id="fashion-outfit-segmentation-pipeline-1775500241496",
        images={"image": image_b64}
    )[0]

    crops = result.get("crops", [])
    labels = result.get("crop_labels", [])

    for crop_data, label in zip(crops, labels):
        # Get the destination folder
        subfolder = FOLDER_MAP.get(label)
        if not subfolder:
            continue
            
        dest_dir = os.path.join(output_root, subfolder)
        os.makedirs(dest_dir, exist_ok=True)
        
        # Save the crop
        filename = f"{os.path.basename(image_path).split('.')[0]}_{label}.jpg"
        save_path = os.path.join(dest_dir, filename)
        
        # The crop is returned as a numpy array
        cv2.imwrite(save_path, crop_data)
        print(f"Saved {label} to {save_path}")

# Example usage
process_and_save_outfit(str(Path(__file__).parent / "coquette_outfit.jpg"))
