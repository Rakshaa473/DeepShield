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


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="DeepShield AI Backend",
    description="AI-powered multimedia authenticity and deepfake detection API",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================
#
# Allows:
# - Local Next.js development
# - Production Vercel frontend
# - Optional FRONTEND_URL environment variable
#
# ============================================================

allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://deepshield-app.vercel.app",
]

# Optional additional frontend URLs from Render environment variable
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
# UPLOAD FOLDER
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

UPLOAD_FOLDER = BASE_DIR / "uploads"

UPLOAD_FOLDER.mkdir(
    parents=True,
    exist_ok=True,
)


# ============================================================
# FILE HELPERS
# ============================================================

def save_upload(file: UploadFile):
    """
    Save an uploaded file using a generated temporary filename.
    Returns the Path of the saved file.
    """

    extension = Path(
        file.filename or ""
    ).suffix.lower()

    temporary_file = tempfile.NamedTemporaryFile(
        dir=UPLOAD_FOLDER,
        prefix="deepshield-",
        suffix=extension,
        delete=False,
    )

    try:

        with temporary_file:
            shutil.copyfileobj(
                file.file,
                temporary_file,
            )

    except Exception:

        Path(
            temporary_file.name
        ).unlink(
            missing_ok=True
        )

        raise

    return Path(
        temporary_file.name
    )


def remove_upload(filepath):
    """
    Delete uploaded file after processing.
    """

    try:

        Path(filepath).unlink(
            missing_ok=True
        )

    except Exception:

        pass


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
async def detect_image_endpoint(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
):

    # --------------------------------------------------------
    # Save uploaded image
    # --------------------------------------------------------

    filename = file.filename or "image"

    filepath = save_upload(file)

    if background_tasks:
        background_tasks.add_task(
            remove_upload,
            filepath,
        )


    # --------------------------------------------------------
    # IMAGE AI MODEL
    # --------------------------------------------------------

    try:

        predictions = detect_image(
            str(filepath)
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Image detection failed: {error}",
        ) from error


    # --------------------------------------------------------
    # Handle empty prediction
    # --------------------------------------------------------

    if not predictions:

        return {
            "filename": filename,
            "label": "Unknown",
            "risk": "Medium",
            "score": 0,
            "text": "",
            "metadata": {},
            "metadata_ai_probability": 0,
            "image_model_score": 0,
            "image_model_label": "Unknown",
            "ela_score": 0,
        }


    # --------------------------------------------------------
    # Top AI model prediction
    # --------------------------------------------------------

    top = predictions[0]

    image_score = float(
        top.get(
            "score",
            0,
        )
    ) * 100

    model_label = str(
        top.get(
            "label",
            "Unknown",
        )
    )


    # --------------------------------------------------------
    # METADATA ANALYSIS
    # --------------------------------------------------------

    try:

        metadata_result = analyze_metadata(
            str(filepath)
        )

    except Exception:

        metadata_result = {
            "metadata": {},
            "ai_probability": 0,
        }


    metadata_score = float(
        metadata_result.get(
            "ai_probability",
            0,
        )
    )


    # --------------------------------------------------------
    # OCR
    # --------------------------------------------------------
    #
    # IMPORTANT:
    # Render does not have the Tesseract executable installed.
    # Therefore OCR must not be allowed to crash the complete
    # image detection request.
    #
    # If Tesseract is unavailable, we simply continue with
    # extracted_text = "".
    #
    # --------------------------------------------------------

    extracted_text = ""

    try:

        extracted_text = extract_text(
            str(filepath)
        )

        if extracted_text is None:
            extracted_text = ""

    except Exception:

        extracted_text = ""


    # --------------------------------------------------------
    # ELA
    # --------------------------------------------------------
    #
    # Current project uses 0 as the default ELA score.
    #
    # --------------------------------------------------------

    ela_score = 0


    # --------------------------------------------------------
    # COMBINED SCORING
    # --------------------------------------------------------

    try:

        final_score, final_label, risk = calculate_score(
            image_score,
            metadata_score,
            ela_score,
            extracted_text,
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Score calculation failed: {error}",
        ) from error


    # --------------------------------------------------------
    # RETURN RESULT
    # --------------------------------------------------------

    return {
        "filename": filename,

        "score": final_score,

        "label": final_label,

        "risk": risk,

        "text": extracted_text,

        "metadata": metadata_result.get(
            "metadata",
            {},
        ),

        "metadata_ai_probability": metadata_score,

        "image_model_score": round(
            image_score,
            2,
        ),

        "image_model_label": model_label,

        "ela_score": ela_score,
    }


# ============================================================
# DOCUMENT DETECTION
# ============================================================

@app.post("/detect-document")
async def detect_document(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
):

    # --------------------------------------------------------
    # Save document
    # --------------------------------------------------------

    filename = file.filename or "document"

    filepath = save_upload(file)

    if background_tasks:
        background_tasks.add_task(
            remove_upload,
            filepath,
        )


    # --------------------------------------------------------
    # Analyze document
    # --------------------------------------------------------

    try:

        result = analyze_document(
            str(filepath)
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Document analysis failed: {error}",
        ) from error


    # --------------------------------------------------------
    # AI probability
    # --------------------------------------------------------

    ai_probability = result.get(
        "ai_probability",
        0,
    )


    # --------------------------------------------------------
    # Risk
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

        "word_count": result.get(
            "word_count",
            0,
        ),

        "character_count": result.get(
            "character_count",
            0,
        ),

        "suspicious_keywords": result.get(
            "suspicious_keywords",
            [],
        ),

        "text": result.get(
            "text",
            "",
        ),
    }


# ============================================================
# AUDIO DETECTION
# ============================================================

@app.post("/detect-audio")
async def detect_audio_endpoint(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
):

    filename = file.filename or "audio"

    extension = os.path.splitext(
        filename
    )[1].lower()


    # --------------------------------------------------------
    # Check format
    # --------------------------------------------------------

    if extension not in SUPPORTED_AUDIO_EXTENSIONS:

        supported_formats = ", ".join(
            sorted(
                SUPPORTED_AUDIO_EXTENSIONS
            )
        )

        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported audio format. "
                f"Supported formats: {supported_formats}"
            ),
        )


    # --------------------------------------------------------
    # Save audio
    # --------------------------------------------------------

    filepath = save_upload(file)

    if background_tasks:
        background_tasks.add_task(
            remove_upload,
            filepath,
        )


    # --------------------------------------------------------
    # Analyze audio
    # --------------------------------------------------------

    try:

        result = analyze_audio(
            str(filepath)
        )

    except Exception as error:

        raise HTTPException(
            status_code=400,
            detail=f"Audio analysis failed: {error}",
        ) from error


    # --------------------------------------------------------
    # Return result
    # --------------------------------------------------------

    return {
        "filename": filename,
        **result,
    }


# ============================================================
# VIDEO DETECTION
# ============================================================

@app.post("/detect-video")
async def detect_video_endpoint(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
):

    filename = file.filename or "video"

    extension = os.path.splitext(
        filename
    )[1].lower()


    # --------------------------------------------------------
    # Check format
    # --------------------------------------------------------

    if extension not in SUPPORTED_VIDEO_EXTENSIONS:

        supported_formats = ", ".join(
            sorted(
                SUPPORTED_VIDEO_EXTENSIONS
            )
        )

        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported video format. "
                f"Supported formats: {supported_formats}"
            ),
        )


    # --------------------------------------------------------
    # Save video
    # --------------------------------------------------------

    filepath = save_upload(file)

    if background_tasks:
        background_tasks.add_task(
            remove_upload,
            filepath,
        )


    # --------------------------------------------------------
    # Analyze video
    # --------------------------------------------------------

    try:

        result = analyze_video(
            str(filepath)
        )

    except Exception as error:

        raise HTTPException(
            status_code=400,
            detail=f"Video analysis failed: {error}",
        ) from error


    # --------------------------------------------------------
    # Return result
    # --------------------------------------------------------

    return {
        "filename": filename,
        **result,
    }


# ============================================================
# TEXT DETECTION
# ============================================================

@app.post("/detect-text")
async def detect_text_endpoint(
    payload: dict = Body(...),
):

    # --------------------------------------------------------
    # Get text
    # --------------------------------------------------------

    text = payload.get(
        "text"
    )


    # --------------------------------------------------------
    # Validate
    # --------------------------------------------------------

    if not isinstance(
        text,
        str,
    ) or not text.strip():

        raise HTTPException(
            status_code=400,
            detail="Text is required for analysis.",
        )


    # --------------------------------------------------------
    # Analyze
    # --------------------------------------------------------

    try:

        return analyze_text(
            text
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Text analysis failed: {error}",
        ) from error