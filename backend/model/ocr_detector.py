import os

import cv2
import pytesseract

configured_tesseract = os.getenv("TESSERACT_CMD")
if configured_tesseract:
    pytesseract.pytesseract.tesseract_cmd = configured_tesseract

def extract_text(image_path):
    image = cv2.imread(image_path)

    text = pytesseract.image_to_string(image)

    return text.strip()