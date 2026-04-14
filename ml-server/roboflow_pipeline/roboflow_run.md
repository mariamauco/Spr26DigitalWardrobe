# Roboflow Pipeline — Run Instructions

## Requirements
- A machine with a **GPU**
- Docker installed and running
- Python environment with dependencies installed:
  ```bash
  pip install inference inference-sdk opencv-python
  ```

## Setup

### 1. Start the local inference server (GPU)
```bash
inference server start --device gpu
```
This starts the Roboflow inference server at `http://localhost:9001`. Must be running before executing the script.

> Note: The CPU image does not support SAM3. A GPU is required.

### 2. Add your API key
In `roboflow.py`, replace the `api_key` value with your Roboflow API key:
```python
CLIENT = InferenceHTTPClient(
    api_url="http://localhost:9001",
    api_key="YOUR_ROBOFLOW_API_KEY"
)
```

## Running the script

Place outfit images in the `roboflow_pipeline/` folder, then update the filename at the bottom of `roboflow.py`:
```python
process_and_save_outfit(str(Path(__file__).parent / "your_image.jpg"))
```

Then run:
```bash
python roboflow.py
```

## Output
Cropped clothing items are saved to `Fashion_Dataset/` organized by category:
```
Fashion_Dataset/
  Tops/
    short_sleeves/
    long_sleeves/
    no_sleeves/
  Bottoms/
    pants/
    skirt/
    shorts/
  Shoes/
```

## Workflow
The script sends each image to the Roboflow workflow `fashion-outfit-segmentation-pipeline` which uses **SAM3** to segment individual clothing items from outfit photos. Each detected item is cropped and saved to its corresponding category folder.