from PIL import Image, ImageChops, ImageEnhance
import os
import tempfile

def perform_ela(image_path):

    temp_file = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
    temp_path = temp_file.name
    temp_file.close()

    image = Image.open(image_path).convert("RGB")

    image.save(temp_path, "JPEG", quality=90)

    compressed = Image.open(temp_path)

    diff = ImageChops.difference(image, compressed)

    extrema = diff.getextrema()

    max_diff = max([e[1] for e in extrema])

    if max_diff == 0:
        max_diff = 1

    scale = 255.0 / max_diff

    diff = ImageEnhance.Brightness(diff).enhance(scale)

    ela_file = tempfile.NamedTemporaryFile(suffix="-ela.jpg", delete=False)
    ela_path = ela_file.name
    ela_file.close()

    diff.save(ela_path)

    os.remove(temp_path)

    return ela_path, max_diff