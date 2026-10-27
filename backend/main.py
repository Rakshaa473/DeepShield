
import os
import shutil
import tempfile
from pathlib import Path
from typing import Any

from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware

from model.image_detector import detect_image
from model.ocr_detector import extract_text
from model.metadata_detector import analyze_metadata
from model.score_engine import calculate_score
from model.document_detector import analyze_document
from model.audio_detector import analyze_audio, SUPPORTED_AUDIO_EXTENSIONS
from model.video_detector import analyze_video, SUPPORTED_VIDEO_EXTENSIONS
from model.text_detector import analyze_text


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="DeepShield AI Backend",
    description="AI-powered multimedia authenticity analysis API",
    version="1.1.0",
)


# ============================================================
# CORS
# ============================================================

allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://deepshield-app.vercel.app",
]

frontend_url = os.getenv("FRONTEND_URL", "")

if frontend_url:
    for origin in frontend_url.split(","):
        origin = origin.strip()
        if origin and origin not in allowed_origins:
            allowed_origins.append(origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# UPLOAD STORAGE
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_FOLDER = BASE_DIR / "uploads"
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)


def save_upload(file: UploadFile) -> Path:
    """Save an upload to a uniquely named temporary file."""

    extension = Path(file.filename or "").suffix.lower()

    temporary_file = tempfile.NamedTemporaryFile(
        dir=UPLOAD_FOLDER,
        prefix="deepshield-",
        suffix=extension,
        delete=False,
    )

    filepath = Path(temporary_file.name)

    try:
        with temporary_file:
            shutil.copyfileobj(file.file, temporary_file)
    except Exception:
        filepath.unlink(missing_ok=True)
        raise

    return filepath


def remove_upload(filepath: Path) -> None:
    """Remove a temporary upload."""

    try:
        filepath.unlink(missing_ok=True)
    except OSError as error:
        print(f"Could not remove temporary upload: {error}")


def require_result_dict(result: Any, detector_name: str) -> dict:
    """Reject malformed detector output instead of inventing a result."""

    if not isinstance(result, dict):
        raise HTTPException(
            status_code=500,
            detail=f"{detector_name} returned an invalid result.",
        )

    return result


def valid_probability(value: Any) -> float | None:
    """Accept a probability only if it is a finite number from 0 to 100."""

    if isinstance(value, bool):
        return None

    try:
        number = float(value)
    except (TypeError, ValueError):
        return None

    if not os.path.exists("/dev/null"):
        # No platform-specific operation is needed here.
        pass

    if number != number or number in (float("inf"), float("-inf")):
        return None

    if not 0 <= number <= 100:
        return None

    return number


# ============================================================
# IMAGE LABEL INTERPRETATION
# ============================================================

def interpret_image_prediction(
    predictions: Any,
) -> dict:
    """
    Interpret predictions only when labels clearly indicate
    AI-generated/fake versus real/authentic content.

    Labels from NSFW, object, scene, or general image classifiers
    are not evidence of image authenticity.
    """

    if not isinstance(predictions, list) or not predictions:
        return {
            "usable": False,
            "label": "Inconclusive",
            "ai_probability": None,
            "model_confidence": None,
        }

    top = predictions[0]

    if not isinstance(top, dict):
        return {
            "usable": False,
            "label": "Inconclusive",
            "ai_probability": None,
            "model_confidence": None,
        }

    raw_label = str(top.get("label", "")).strip()
    label = raw_label.lower().replace("_", " ").replace("-", " ")

    try:
        confidence = float(top.get("score"))
    except (TypeError, ValueError):
        confidence = -1

    if not 0 <= confidence <= 1:
        return {
            "usable": False,
            "label": "Inconclusive",
            "ai_probability": None,
            "model_confidence": None,
        }

    confidence_percent = confidence * 100

    # Do not confuse these labels with authenticity predictions.
    unrelated_labels = {
        "nsfw",
        "normal",
        "porn",
        "sexy",
        "hentai",
        "drawing",
        "drawings",
        "neutral",
        "safe",
        "unsafe",
    }

    if label in unrelated_labels:
        return {
            "usable": False,
            "label": "Inconclusive",
            "ai_probability": None,
            "model_confidence": confidence_percent,
        }

    fake_labels = {
        "fake",
        "ai generated",
        "ai-generated",
        "synthetic",
        "generated",
        "artificial",
        "deepfake",
        "manipulated",
    }

    real_labels = {
        "real",
        "real image",
        "authentic",
        "genuine",
        "human",
        "natural",
    }

    if label in fake_labels:
        return {
            "usable": True,
            "label": "AI-Generated / Manipulated",
            "ai_probability": confidence_percent,
            "model_confidence": confidence_percent,
        }

    if label in real_labels:
        return {
            "usable": True,
            "label": "Likely Real",
            "ai_probability": 100 - confidence_percent,
            "model_confidence": confidence_percent,
        }

    return {
        "usable": False,
        "label": "Inconclusive",
        "ai_probability": None,
        "model_confidence": confidence_percent,
    }


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():
    return {
        "message": "DeepShield AI Backend Running",
        "version": "1.1.0",
        "status": "online",
    }


@app.get("/health")
def health():
    return {"status": "ok"}


# ============================================================
# IMAGE DETECTION
# ============================================================

@app.post("/detect-image")
async def detect_image_endpoint(file: UploadFile = File(...)):
    filename = file.filename or "image"
    filepath = save_upload(file)

    try:
        try:
            predictions = detect_image(str(filepath))
        except Exception as error:
            raise HTTPException(
                status_code=500,
                detail=f"Image model failed: {error}",
            ) from error

        interpretation = interpret_image_prediction(predictions)

        # OCR is optional. Failure to run OCR must not be treated
        # as evidence that an image is real or fake.
        extracted_text = ""

        try:
            extracted_text = extract_text(str(filepath)) or ""
        except Exception as error:
            print(f"OCR unavailable: {error}")

        try:
            metadata_result = analyze_metadata(str(filepath))
            if not isinstance(metadata_result, dict):
                metadata_result = {}
        except Exception as error:
            print(f"Metadata analysis unavailable: {error}")
            metadata_result = {}

        metadata = metadata_result.get("metadata", {})
        if not isinstance(metadata, dict):
            metadata = {}

        metadata_probability = valid_probability(
            metadata_result.get("ai_probability")
        )

        if metadata_probability is None:
            metadata_probability = None

        # No validated authenticity prediction means we must not
        # manufacture a fake/real answer from unrelated signals.
        if not interpretation["usable"]:
            return {
                "filename": filename,
                "score": 50,
                "label": "Inconclusive",
                "risk": "Medium",
                "text": extracted_text,
                "metadata": metadata,
                "metadata_ai_probability": metadata_probability,
                "image_model_score": None,
                "image_model_label": (
                    str(predictions[0].get("label", "Unknown"))
                    if isinstance(predictions, list)
                    and predictions
                    and isinstance(predictions[0], dict)
                    else "Unknown"
                ),
                "model_confidence": interpretation["model_confidence"],
                "image_ai_probability": None,
                "ela_score": None,
                "message": (
                    "The current image model does not provide a "
                    "recognized authenticity prediction. Replace it "
                    "with a model trained for AI-generated image detection."
                ),
            }

        image_probability = interpretation["ai_probability"]

        # The score engine is used only when the image model returns
        # an explicitly recognized authenticity label.
        try:
            final_score, final_label, risk = calculate_score(
    image_probability,
    metadata_probability,
    None,
    extracted_text,
)

        except Exception as error:
            raise HTTPException(
                status_code=500,
                detail=f"Score calculation failed: {error}",
            ) from error

        return {
            "filename": filename,
            "score": final_score,
            "label": final_label,
            "risk": risk,
            "text": extracted_text,
            "metadata": metadata,
            "metadata_ai_probability": metadata_probability,
            "image_model_score": image_probability,
            "image_model_label": interpretation["label"],
            "model_confidence": interpretation["model_confidence"],
            "image_ai_probability": image_probability,
            "ela_score": None,
            "message": (
                "Experimental estimate only; results are not proof "
                "of authenticity."
            ),
        }

    finally:
        remove_upload(filepath)
        await file.close()


# ============================================================
# DOCUMENT DETECTION
# ============================================================

@app.post("/detect-document")
async def detect_document_endpoint(file: UploadFile = File(...)):
    filename = file.filename or "document"
    filepath = save_upload(file)

    try:
        try:
            result = analyze_document(str(filepath))
        except Exception as error:
            raise HTTPException(
                status_code=500,
                detail=f"Document analysis failed: {error}",
            ) from error

        result = require_result_dict(result, "Document detector")

        probability = valid_probability(result.get("ai_probability"))

        if probability is None:
            return {
                "filename": filename,
                "label": "Inconclusive",
                "risk": "Unknown",
                "ai_probability": None,
                "word_count": result.get("word_count", 0),
                "character_count": result.get("character_count", 0),
                "suspicious_keywords": result.get("suspicious_keywords", []),
                "text": result.get("text", ""),
                "message": "The document detector did not return a valid probability.",
            }

        if probability >= 70:
            risk = "High"
        elif probability >= 40:
            risk = "Medium"
        else:
            risk = "Low"

        return {
            "filename": filename,
            "label": result.get("label", "Document Analysis"),
            "risk": risk,
            "ai_probability": round(probability, 2),
            "word_count": result.get("word_count", 0),
            "character_count": result.get("character_count", 0),
            "suspicious_keywords": result.get("suspicious_keywords", []),
            "text": result.get("text", ""),
            "message": (
                "This is a heuristic estimate, not proof that a "
                "document is authentic or manipulated."
            ),
        }

    finally:
        remove_upload(filepath)
        await file.close()


# ============================================================
# AUDIO DETECTION
# ============================================================

@app.post("/detect-audio")
async def detect_audio_endpoint(file: UploadFile = File(...)):
    filename = file.filename or "audio"
    extension = Path(filename).suffix.lower()

    if extension not in SUPPORTED_AUDIO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported audio format. Supported formats: "
                + ", ".join(sorted(SUPPORTED_AUDIO_EXTENSIONS))
            ),
        )

    filepath = save_upload(file)

    try:
        try:
            result = analyze_audio(str(filepath))
        except Exception as error:
            raise HTTPException(
                status_code=500,
                detail=f"Audio analysis failed: {error}",
            ) from error

        result = require_result_dict(result, "Audio detector")

        # Preserve the detector's actual output. Do not silently
        # replace a missing label or score with "Real".
        if not result or not any(
            key in result
            for key in (
                "label",
                "prediction",
                "risk",
                "score",
                "ai_probability",
                "fake_probability",
            )
        ):
            result = {
                **result,
                "label": "Inconclusive",
                "risk": "Unknown",
                "message": (
                    "The audio detector did not return an authenticity "
                    "prediction. Check its model and output mapping."
                ),
            }

        return {"filename": filename, **result}

    finally:
        remove_upload(filepath)
        await file.close()


# ============================================================
# VIDEO DETECTION
# ============================================================

@app.post("/detect-video")
async def detect_video_endpoint(file: UploadFile = File(...)):
    filename = file.filename or "video"
    extension = Path(filename).suffix.lower()

    if extension not in SUPPORTED_VIDEO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported video format. Supported formats: "
                + ", ".join(sorted(SUPPORTED_VIDEO_EXTENSIONS))
            ),
        )

    filepath = save_upload(file)

    try:
        try:
            result = analyze_video(str(filepath))
        except Exception as error:
            raise HTTPException(
                status_code=500,
                detail=f"Video analysis failed: {error}",
            ) from error

        result = require_result_dict(result, "Video detector")

        if not result or not any(
            key in result
            for key in (
                "label",
                "prediction",
                "risk",
                "score",
                "ai_probability",
                "fake_probability",
            )
        ):
            result = {
                **result,
                "label": "Inconclusive",
                "risk": "Unknown",
                "message": (
                    "The video detector did not return an authenticity "
                    "prediction. Check its frame analysis and score mapping."
                ),
            }

        return {"filename": filename, **result}

    finally:
        remove_upload(filepath)
        await file.close()


# ============================================================
# TEXT DETECTION
# ============================================================

@app.post("/detect-text")
async def detect_text_endpoint(payload: dict = Body(...)):
    text = payload.get("text")

    if not isinstance(text, str) or not text.strip():
        raise HTTPException(
            status_code=400,
            detail="Text is required for analysis.",
        )

    try:
        result = analyze_text(text)
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Text analysis failed: {error}",
        ) from error

    result = require_result_dict(result, "Text detector")

    # Do not force a missing detector result to "Real".
    if not result or not any(
        key in result
        for key in (
            "label",
            "prediction",
            "risk",
            "score",
            "ai_probability",
            "fake_probability",
        )
    ):
        return {
            **result,
            "label": "Inconclusive",
            "risk": "Unknown",
            "message": (
                "The text detector did not return a prediction. "
                "AI-text detection is probabilistic and cannot prove authorship."
            ),
        }

    return result
