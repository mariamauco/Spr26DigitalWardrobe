from PIL import Image

import torch
from transformers import CLIPProcessor, CLIPModel
from util.prompts import FINE_CATEGORY_PROMPTS

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