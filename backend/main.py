import os
import shutil
import tempfile
from pathlib import Path

from fastapi import BackgroundTasks, Body, FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from model.image_detector import detect_image
from model.ocr_detector import extract_text
from model.metadata_detector import analyze_metadata
from model.score_engine import calculate_score
from model.document_detector import analyze_document
from model.audio_detector import analyze_audio, SUPPORTED_AUDIO_EXTENSIONS
from model.video_detector import analyze_video, SUPPORTED_VIDEO_EXTENSIONS
from model.text_detector import analyze_text


app = FastAPI()


# ============================================================
# CORS - Allow Next.js frontend
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        *[origin.strip() for origin in os.getenv("FRONTEND_URL", "").split(",") if origin.strip()],
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Upload folder
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_FOLDER = BASE_DIR / "uploads"
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)


def save_upload(file: UploadFile):
    """Save an upload under a generated name and return its path."""
    extension = Path(file.filename or "").suffix.lower()
    temporary_file = tempfile.NamedTemporaryFile(
        dir=UPLOAD_FOLDER,
        prefix="deepshield-",
        suffix=extension,
        delete=False,
    )

    try:
        with temporary_file:
            shutil.copyfileobj(file.file, temporary_file)
    except Exception:
        Path(temporary_file.name).unlink(missing_ok=True)
        raise

    return Path(temporary_file.name)


def remove_upload(filepath):
    Path(filepath).unlink(missing_ok=True)


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():
    return {
        "message": "DeepShield AI Backend Running 🚀"
    }


# ============================================================
# IMAGE DETECTION
# ============================================================

@app.post("/detect-image")
async def detect_image_endpoint(file: UploadFile = File(...), background_tasks: BackgroundTasks = None):

    # Save uploaded image
    filename = file.filename or "image"
    filepath = save_upload(file)
    background_tasks.add_task(remove_upload, filepath)

    # --------------------------------------------------------
    # Image AI model
    # --------------------------------------------------------

    predictions = detect_image(str(filepath))

    if not predictions:
        return {
            "filename": filename,
            "label": "Unknown",
            "risk": "Medium",
            "score": 0,
            "text": "",
            "metadata": {},
            "metadata_ai_probability": 0
        }

    top = predictions[0]

    image_score = float(top.get("score", 0)) * 100
    model_label = str(top.get("label", "Unknown"))


    # --------------------------------------------------------
    # Metadata analysis
    # --------------------------------------------------------

    metadata_result = analyze_metadata(str(filepath))

    metadata_score = float(
        metadata_result.get("ai_probability", 0)
    )


    # --------------------------------------------------------
    # OCR
    # --------------------------------------------------------

    extracted_text = extract_text(str(filepath))


    # --------------------------------------------------------
    # ELA
    #
    # If your current project does not have a separate ELA
    # detector, we use 0 as the default.
    # --------------------------------------------------------

    ela_score = 0


    # --------------------------------------------------------
    # Combined scoring
    # --------------------------------------------------------

    final_score, final_label, risk = calculate_score(
        image_score,
        metadata_score,
        ela_score,
        extracted_text
    )


    # --------------------------------------------------------
    # Return result
    # --------------------------------------------------------

    return {
        "filename": filename,
        "score": final_score,
        "label": final_label,
        "risk": risk,
        "text": extracted_text,
        "metadata": metadata_result.get("metadata", {}),
        "metadata_ai_probability": metadata_score,
        "image_model_score": round(image_score, 2),
        "image_model_label": model_label,
        "ela_score": ela_score
    }


# ============================================================
# DOCUMENT DETECTION
# ============================================================

@app.post("/detect-document")
async def detect_document(file: UploadFile = File(...), background_tasks: BackgroundTasks = None):

    # Save uploaded document
    filename = file.filename or "document"
    filepath = save_upload(file)
    background_tasks.add_task(remove_upload, filepath)


    # --------------------------------------------------------
    # Analyze document
    # --------------------------------------------------------

    result = analyze_document(str(filepath))

    ai_probability = result.get(
        "ai_probability",
        0
    )


    # --------------------------------------------------------
    # Determine risk
    # --------------------------------------------------------

    if ai_probability >= 70:
        risk = "High"

    elif ai_probability >= 40:
        risk = "Medium"

    else:
        risk = "Low"


    # --------------------------------------------------------
    # Return result
    # --------------------------------------------------------

    return {
        "filename": filename,
        "label": "Document Analysis",
        "risk": risk,
        "ai_probability": ai_probability,
        "word_count": result.get("word_count", 0),
        "character_count": result.get("character_count", 0),
        "suspicious_keywords": result.get(
            "suspicious_keywords",
            []
        ),
        "text": result.get("text", "")
    }


# ============================================================
# AUDIO DETECTION
# ============================================================

@app.post("/detect-audio")
async def detect_audio_endpoint(file: UploadFile = File(...), background_tasks: BackgroundTasks = None):

    filename = file.filename or "audio"
    extension = os.path.splitext(filename)[1].lower()

    if extension not in SUPPORTED_AUDIO_EXTENSIONS:
        supported_formats = ", ".join(sorted(SUPPORTED_AUDIO_EXTENSIONS))
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio format. Supported formats: {supported_formats}",
        )

    filepath = save_upload(file)
    background_tasks.add_task(remove_upload, filepath)

    try:
        result = analyze_audio(str(filepath))
    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=f"Audio analysis failed: {error}",
        ) from error

    return {
        "filename": filename,
        **result,
    }


# ============================================================
# VIDEO DETECTION
# ============================================================

@app.post("/detect-video")
async def detect_video_endpoint(file: UploadFile = File(...), background_tasks: BackgroundTasks = None):

    filename = file.filename or "video"
    extension = os.path.splitext(filename)[1].lower()

    if extension not in SUPPORTED_VIDEO_EXTENSIONS:
        supported_formats = ", ".join(sorted(SUPPORTED_VIDEO_EXTENSIONS))
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported video format. Supported formats: {supported_formats}",
        )

    filepath = save_upload(file)
    background_tasks.add_task(remove_upload, filepath)

    try:
        result = analyze_video(str(filepath))
    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=f"Video analysis failed: {error}",
        ) from error

    return {
        "filename": filename,
        **result,
    }


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

    return analyze_text(text)


