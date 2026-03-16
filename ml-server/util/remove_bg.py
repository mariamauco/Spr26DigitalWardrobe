from rembg import remove
from PIL import Image

# Takes an input image (file path or a PIL Image object), removes the background, 
# and optionally saves the result to a specified output path
def remove_bg(input_image_path, output_image_path = None):
    if isinstance(input_image_path, str):
        input_image = Image.open(input_image_path)
    elif isinstance(input_image_path, Image.Image):
        input_image = input_image_path
    else:
        raise ValueError("Input must be a file path or a PIL Image object.")
    result_image = remove(input_image)

    # if file path is provided, save the result image
    if output_image_path:
        result_image.save(output_image_path)

    return result_image