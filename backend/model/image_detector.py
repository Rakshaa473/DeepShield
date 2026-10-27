
import os
from pathlib import Path

# ============================================================
# DEEPSHIELD IMAGE AUTHENTICITY DETECTOR
# ============================================================

MODEL_NAME = "capcheck/ai-human-generated-image-detection"

USE_AI_MODEL = (
    os.getenv("DEEPSHIELD_AI_MODEL", "true").strip().lower()
    in {"true", "1", "yes"}
)

# Lazy-loaded model cache
detector = None


# ============================================================
# LOAD MODEL
# ============================================================

def load_detector():
    """Load the model once and reuse it for later requests."""

    global detector

    if detector is not None:
        return detector

    if not USE_AI_MODEL:
        raise RuntimeError(
            "Image detection model is disabled. "
            "Set DEEPSHIELD_AI_MODEL=true to enable it."
        )

    try:
        import torch
        from transformers import pipeline

        device = 0 if torch.cuda.is_available() else -1

        print(f"DeepShield: Loading model {MODEL_NAME}")
        print(f"DeepShield: Torch version: {torch.__version__}")
        print(f"DeepShield: CUDA available: {torch.cuda.is_available()}")

        loaded_model = pipeline(
            task="image-classification",
            model=MODEL_NAME,
            device=device,
        )

        print(
            "DeepShield: Model labels:",
            loaded_model.model.config.id2label,
        )

        detector = loaded_model
        print("DeepShield: Image model loaded successfully.")

        return detector

    except Exception as error:
        print(f"DeepShield: Model loading failed: {error}")
        raise RuntimeError(
            f"Could not load image authenticity model: {error}"
        ) from error


# ============================================================
# LABEL NORMALIZATION
# ============================================================

def normalize_label(raw_label):
    """
    Normalize only labels with a recognizable meaning.

    Unknown labels are preserved instead of being guessed.
    """

    label = str(raw_label or "").strip().lower()
    label = label.replace("_", " ").replace("-", " ")
    label = " ".join(label.split())

    ai_labels = {
        "ai",
        "ai generated",
        "ai generated image",
        "ai generated images",
        "generated",
        "synthetic",
        "synthetic image",
        "artificial",
        "fake",
        "fake image",
        "deepfake",
        "manipulated",
    }

    real_labels = {
        "real",
        "real image",
        "real photograph",
        "real photo",
        "human",
        "human generated",
        "human created",
        "human made",
        "authentic",
        "genuine",
        "natural image",
        "natural photograph",
    }

    if label in ai_labels:
        return "AI Generated"

    if label in real_labels:
        return "Real Image"

    # Preserve unsupported labels. The API should treat them
    # as inconclusive rather than forcing a classification.
    return str(raw_label or "Unknown")


# ============================================================
# IMAGE DETECTION
# ============================================================

def detect_image(image_path):
    """
    Classify an image using the configured model.

    Returns a list of:
        {
            "label": model label,
            "score": confidence from 0.0 to 1.0
        }

    Model confidence is not a calibrated probability of
    authenticity and does not prove that an image is real or fake.
    """

    filepath = Path(image_path)

    if not filepath.is_file():
        raise FileNotFoundError(
            f"Image file does not exist: {filepath}"
        )

    if not USE_AI_MODEL:
        raise RuntimeError(
            "DEEPSHIELD_AI_MODEL is disabled. "
            "No image authenticity prediction was made."
        )

    # Validate that the upload is a readable image.
    try:
        from PIL import Image

        with Image.open(filepath) as image:
            image.verify()

    except Exception as error:
        raise ValueError(
            f"Uploaded file is not a valid readable image: {error}"
        ) from error

    model = load_detector()

    try:
        # Load and run inference on the image.
        results = model(
            str(filepath),
            top_k=None,
        )

    except Exception as error:
        print(f"DeepShield: Image inference failed: {error}")
        raise RuntimeError(
            f"Image model inference failed: {error}"
        ) from error

    if not isinstance(results, list) or not results:
        raise RuntimeError(
            "The image model returned no predictions."
        )

    converted_results = []

    for result in results:
        if not isinstance(result, dict):
            continue

        raw_label = str(result.get("label", "Unknown"))

        try:
            confidence = float(result.get("score"))
        except (TypeError, ValueError):
            continue

        if (
            not 0.0 <= confidence <= 1.0
            or confidence != confidence
        ):
            continue

        converted_results.append({
            "label": normalize_label(raw_label),
            "raw_label": raw_label,
            "score": confidence,
        })

    if not converted_results:
        raise RuntimeError(
            "The image model returned no valid label/score pairs."
        )

    converted_results.sort(
        key=lambda item: item["score"],
        reverse=True,
    )

    print("DeepShield: Image predictions:", converted_results)

    return converted_results
