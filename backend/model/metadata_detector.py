from PIL import Image
from PIL.ExifTags import TAGS


def analyze_metadata(image_path):
    try:
        image = Image.open(image_path)

        exif = image._getexif()

        if exif is None:
            return {
                "metadata": "No EXIF metadata found",
                "ai_probability": 80
            }

        metadata = {}

        for tag_id, value in exif.items():
            tag = TAGS.get(tag_id, tag_id)
            metadata[tag] = value

        important = [
            "Make",
            "Model",
            "Software",
            "DateTime",
            "LensModel"
        ]

        found = {}

        for key in important:
            if key in metadata:
                found[key] = metadata[key]

        if len(found) == 0:
            probability = 70
        else:
            probability = 20

        return {
            "metadata": found,
            "ai_probability": probability
        }

    except Exception as e:
        return {
            "metadata": str(e),
            "ai_probability": 50
        }