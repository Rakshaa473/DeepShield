from transformers import pipeline
import torch


# Load the AI image detector once when the backend starts
DEVICE = 0 if torch.cuda.is_available() else -1

detector = pipeline(
    "image-classification",
    model="capcheck/ai-image-detection",
    device=DEVICE
)


def detect_image(image_path):
    """
    Detect whether an image is real or AI-generated.

    Returns:
        [
            {
                "label": "AI Generated" or "Real Image",
                "score": probability
            }
        ]
    """

    results = detector(image_path)

    converted_results = []

    for result in results:
        label = result["label"]
        score = float(result["score"])

        # Normalize model labels
        label_lower = label.lower()

        if "ai" in label_lower or "fake" in label_lower:
            final_label = "AI Generated"
        elif "real" in label_lower or "authentic" in label_lower:
            final_label = "Real Image"
        else:
            final_label = label

        converted_results.append({
            "label": final_label,
            "score": score
        })

    return converted_results