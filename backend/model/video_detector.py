
import os
import tempfile

import cv2
import numpy as np

from model.image_detector import detect_image


SUPPORTED_VIDEO_EXTENSIONS = {
    ".mp4", ".avi", ".mov", ".mkv", ".webm"
}
MAX_SAMPLED_FRAMES = 7


def _sample_indices(frame_count):
    sample_count = min(MAX_SAMPLED_FRAMES, frame_count)

    return sorted(set(
        np.linspace(
            0, frame_count - 1, sample_count, dtype=int
        ).tolist()
    ))


def _frame_ai_probability(predictions):
    """Return a probability only for recognized detector labels."""
    if not predictions or not isinstance(predictions, list):
        return None, "Inconclusive"

    top_prediction = predictions[0]

    label = str(top_prediction.get("label", "Unknown"))
    raw_score = top_prediction.get("score")

    try:
        score = float(raw_score)
    except (TypeError, ValueError):
        return None, label

    if not np.isfinite(score) or not 0 <= score <= 1:
        return None, label

    normalized_label = label.strip().lower()

    if normalized_label in {
        "ai generated", "ai-generated", "fake",
        "synthetic", "generated", "ai"
    }:
        return score * 100, label

    if normalized_label in {
        "real image", "real", "authentic", "human"
    }:
        return (1 - score) * 100, label

    return None, label


def analyze_video(file_path):
    """Analyze sampled video frames with the image detector.

    This is frame-based analysis, not a dedicated video deepfake detector.
    """

    extension = os.path.splitext(file_path)[1].lower()

    if extension not in SUPPORTED_VIDEO_EXTENSIONS:
        raise ValueError(
            f"Unsupported video format: {extension or 'unknown'}"
        )

    if not os.path.isfile(file_path):
        raise FileNotFoundError("The uploaded video was not found.")

    capture = cv2.VideoCapture(file_path)

    if not capture.isOpened():
        raise ValueError("The uploaded video could not be opened.")

    frame_results = []
    frame_count = 0
    fps = 0.0
    duration = 0.0

    try:
        frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = float(capture.get(cv2.CAP_PROP_FPS) or 0)

        if frame_count <= 0:
            raise ValueError(
                "The uploaded video contains no readable frames."
            )

        duration = frame_count / fps if fps > 0 else 0

        with tempfile.TemporaryDirectory(
            prefix="deepshield-video-"
        ) as temp_dir:

            for frame_number in _sample_indices(frame_count):
                capture.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
                success, frame = capture.read()

                if not success:
                    continue

                frame_path = os.path.join(
                    temp_dir, f"frame-{frame_number}.jpg"
                )

                if not cv2.imwrite(frame_path, frame):
                    continue

                predictions = detect_image(frame_path)
                probability, label = _frame_ai_probability(
                    predictions
                )

                frame_results.append({
                    "frame_number": int(frame_number),
                    "timestamp": round(
                        frame_number / fps, 3
                    ) if fps > 0 else 0,
                    "label": label,
                    "ai_probability": (
                        round(probability, 2)
                        if probability is not None
                        else None
                    ),
                })

    finally:
        capture.release()

    if not frame_results:
        raise ValueError(
            "No video frames could be sampled for analysis."
        )

    valid_probabilities = [
        result["ai_probability"]
        for result in frame_results
        if result["ai_probability"] is not None
    ]

    if not valid_probabilities:
        return {
            "label": "Inconclusive",
            "ai_probability": None,
            "risk": "Unknown",
            "message": (
                "Video frames were sampled, but the image detector "
                "did not return recognized predictions."
            ),
            "duration": round(duration, 3),
            "fps": round(fps, 3),
            "frame_count": frame_count,
            "sampled_frames": len(frame_results),
            "frame_results": frame_results,
        }

    ai_probability = round(
        sum(valid_probabilities) / len(valid_probabilities), 2
    )

    # These are prototype thresholds, not validated detection limits.
    if ai_probability >= 70:
        risk = "High"
        label = "Likely AI Generated"
    elif ai_probability >= 55:
        risk = "Medium"
        label = "Inconclusive"
    elif ai_probability <= 30:
        risk = "Low"
        label = "Likely Real"
    else:
        risk = "Medium"
        label = "Inconclusive"

    return {
        "label": label,
        "ai_probability": ai_probability,
        "risk": risk,
        "message": (
            "This result is based on sampled video frames. "
            "It does not verify the video's full authenticity."
        ),
        "duration": round(duration, 3),
        "fps": round(fps, 3),
        "frame_count": frame_count,
        "sampled_frames": len(frame_results),
        "analyzed_frames": len(valid_probabilities),
        "frame_results": frame_results,
    }
