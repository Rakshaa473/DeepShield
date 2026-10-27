
from transformers import pipeline
from PIL import Image
import os

MODEL_NAME = "capcheck/ai-human-generated-image-detection"

image_path = input("Enter the full path of an image: ").strip().strip('"')

if not os.path.isfile(image_path):
    print("Error: Image file not found.")
else:
    try:
        image = Image.open(image_path).convert("RGB")

        detector = pipeline(
            "image-classification",
            model=MODEL_NAME
        )

        results = detector(image, top_k=None)

        print("\nModel predictions:")
        for result in results:
            print(
                f"{result['label']}: "
                f"{result['score'] * 100:.2f}%"
            )

    except Exception as error:
        print("Model test failed:", error)
