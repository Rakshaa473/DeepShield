import os

# Full AI model is enabled by default for local development.
# On Render, we will disable it to stay within the 512 MB RAM limit.
USE_AI_MODEL = os.getenv("DEEPSHIELD_AI_MODEL", "true").lower() == "true"

detector = None


def load_detector():
    """Load the AI model only when it is actually needed."""
    global detector

    if detector is not None:
        return detector

    from transformers import pipeline
    import torch

    DEVICE = 0 if torch.cuda.is_available() else -1

    detector = pipeline(
        "image-classification",
        model="capcheck/ai-image-detection",
        device=DEVICE
    )

    return detector


def detect_image(image_path):
    """
    Detect whether an image is real or AI-generated.

    Local mode:
        Uses the Hugging Face AI detection model.

    Render lightweight mode:
        Returns a preliminary result without loading PyTorch.
    """

    # Lightweight deployment mode
    if not USE_AI_MODEL:
        return [
            {
                "label": "Real Image",
                "score": 0.50
            }
        ]

    # Full AI detection mode
    model = load_detector()
    results = model(image_path)

    converted_results = []

    for result in results:
        label = result["label"]
        score = float(result["score"])

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