import pytesseract
from PIL import Image


def extract_text(image_path):
    try:
        image = Image.open(image_path)
        text = pytesseract.image_to_string(image)
        return text.strip()

    except pytesseract.TesseractNotFoundError:
        return ""

    except Exception:
        return ""