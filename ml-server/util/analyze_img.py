from PIL import Image

import matplotlib.pyplot as plt
import numpy as np
import requests
import seaborn as sns
import torch
from transformers import CLIPProcessor, CLIPModel
from util.prompts import FINE_CATEGORY_PROMPTS, STYLE_FINE_CATEGORIES, STYLES

@torch.inference_mode()
def clip_classify(image: Image.Image, label_to_prompt: dict, model: CLIPModel, processor: CLIPProcessor):
    """
    label_to_prompt: dict[label] -> prompt(str)
    Returns: (best_label, confidence, probs_dict)
    """
    labels = list(label_to_prompt.keys())
    prompts = [label_to_prompt[l] for l in labels]
    device = next(model.parameters()).device

    inputs = processor(text=prompts, images=image, return_tensors="pt", padding=True).to(device)
    outputs = model(**inputs)
    probs = outputs.logits_per_image.softmax(dim=1).detach().cpu().numpy()[0]

    best_idx = int(probs.argmax())
    best_label = labels[best_idx]
    conf = float(probs[best_idx])
    probs_dict = {labels[i]: float(probs[i]) for i in range(len(labels))}
    return best_label, conf, probs_dict


@torch.inference_mode()
def clip_classify_fine(image: Image.Image, coarse_key: str, model: CLIPModel, processor: CLIPProcessor):
    """
    Fine prediction restricted to a coarse category.
    Returns: (best_fine_label, confidence, probs_dict)
    """
    label_to_prompt = FINE_CATEGORY_PROMPTS.get(coarse_key, {})
    if not label_to_prompt:
        return None, None, {}

    return clip_classify(image, label_to_prompt, model, processor)

def clip_classify_style(image: Image.Image, fine_tag, model: CLIPModel, processor: CLIPProcessor):
    """
    Returns: (best_style, confidence, probs_dict)
    """
    
    label_to_prompt = {
        style: f"a photo of a {style} {fine_tag}"
        for style in STYLES
    }
    return clip_classify(image, label_to_prompt, model, processor)

def get_img_embedding(model:CLIPModel, processor:CLIPProcessor, img):
    """
    Gets image with background removed
    Returns: python list of embedding
    """

    # 1. Process images (resize, normalize)
    device = next(model.parameters()).device
    inputs = processor(images=img, return_tensors="pt", padding=True).to(device)

    # 2. Pass through the model to get features
    img_features = model.get_image_features(**inputs)

    # 3. L2 Normalize embedding
    img_features = img_features / img_features.norm(p=2, dim=-1, keepdim=True).clamp_min(1e-12)

    embedding = img_features[0].detach().cpu().float().tolist()

    return embedding