import os

# Full AI model is enabled by default for local development.
# On Render, keep this as "false" until we confirm the model
# can run within the available memory.
USE_AI_MODEL = os.getenv("DEEPSHIELD_AI_MODEL", "true").lower() == "true"

detector = None


def load_detector():
    """Load the AI image detection model only when needed."""
    global detector

    if detector is not None:
        return detector

    print("DeepShield: Loading AI image detection model...")

    from transformers import pipeline
    import torch

    device = 0 if torch.cuda.is_available() else -1

    print(f"DeepShield: Torch version = {torch.__version__}")
    print(f"DeepShield: CUDA available = {torch.cuda.is_available()}")
    print(f"DeepShield: Using device = {device}")
    print("DeepShield: Loading capcheck/ai-image-detection...")

    detector = pipeline(
        "image-classification",
        model="capcheck/ai-image-detection",
        device=device
    )

    print("DeepShield: AI image detection model loaded successfully.")

    return detector


def detect_image(image_path):
    """
    Detect whether an image is real or AI-generated.

    Local/full mode:
        Uses the Hugging Face AI detection model.

    Lightweight deployment mode:
        Does not load PyTorch/model and returns a neutral
        preliminary result.
    """

    # ---------------------------------------------------------
    # LIGHTWEIGHT DEPLOYMENT MODE
    # ---------------------------------------------------------
    if not USE_AI_MODEL:
        print(
            "DeepShield: DEEPSHIELD_AI_MODEL=false - "
            "using lightweight image detection mode."
        )

        return [
            {
                "label": "Unknown",
                "score": 0.50
            }
        ]

    # ---------------------------------------------------------
    # FULL AI MODEL MODE
    # ---------------------------------------------------------
    try:
        model = load_detector()

        print(f"DeepShield: Analyzing image: {image_path}")

        results = model(image_path)

        converted_results = []

        for result in results:
            label = str(result.get("label", "Unknown"))
            score = float(result.get("score", 0))

            label_lower = label.lower()

            # Normalize model labels
            if (
                "ai" in label_lower
                or "fake" in label_lower
                or "generated" in label_lower
                or "synthetic" in label_lower
            ):
                final_label = "AI Generated"

            elif (
                "real" in label_lower
                or "authentic" in label_lower
                or "human" in label_lower
            ):
                final_label = "Real Image"

            else:
                final_label = label

            converted_results.append(
                {
                    "label": final_label,
                    "score": score
                }
            )

        print(f"DeepShield: Model results = {converted_results}")

        return converted_results

    except Exception as error:
        print(f"DeepShield: Image model error = {error}")

        # Do not crash the entire API if the model fails.
        return [
            {
                "label": "Unknown",
                "score": 0.50
            }
        ]