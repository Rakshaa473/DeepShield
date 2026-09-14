import os
import tempfile

import cv2
import numpy as np

from model.image_detector import detect_image


SUPPORTED_VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm"}
MAX_SAMPLED_FRAMES = 7


def _sample_indices(frame_count):
    sample_count = min(MAX_SAMPLED_FRAMES, frame_count)
    return sorted(set(np.linspace(0, frame_count - 1, sample_count, dtype=int).tolist()))


def _frame_ai_probability(predictions):
    if not predictions:
        return 0.0, "Unknown"

    top_prediction = predictions[0]
    label = str(top_prediction.get("label", "Unknown"))
    score = max(0.0, min(float(top_prediction.get("score", 0)), 1.0))
    label_lower = label.lower()

    if "ai" in label_lower or "fake" in label_lower or "generated" in label_lower:
        return score * 100, label

    return (1 - score) * 100, label


def analyze_video(file_path):
    """Sample video frames and run the existing image detector on each sample."""
    extension = os.path.splitext(file_path)[1].lower()

    if extension not in SUPPORTED_VIDEO_EXTENSIONS:
        raise ValueError(f"Unsupported video format: {extension or 'unknown'}")

    capture = cv2.VideoCapture(file_path)
    if not capture.isOpened():
        raise ValueError("The uploaded video could not be opened.")

    try:
        frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = float(capture.get(cv2.CAP_PROP_FPS) or 0)

        if frame_count <= 0:
            raise ValueError("The uploaded video contains no readable frames.")

        duration = frame_count / fps if fps > 0 else 0
        frame_results = []

        with tempfile.TemporaryDirectory(prefix="deepshield-video-") as temp_dir:
            for frame_number in _sample_indices(frame_count):
                capture.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
                success, frame = capture.read()

                if not success:
                    continue

                frame_path = os.path.join(temp_dir, f"frame-{frame_number}.jpg")
                if not cv2.imwrite(frame_path, frame):
                    continue

                predictions = detect_image(frame_path)
                ai_probability, label = _frame_ai_probability(predictions)
                frame_results.append({
                    "frame_number": frame_number,
                    "timestamp": round(frame_number / fps, 3) if fps > 0 else 0,
                    "label": label,
                    "ai_probability": round(ai_probability, 2),
                })
    finally:
        capture.release()

    if not frame_results:
        raise ValueError("No video frames could be sampled for analysis.")

    ai_probability = round(
        sum(result["ai_probability"] for result in frame_results) / len(frame_results),
        2,
    )

    if ai_probability >= 70:
        risk = "High"
    elif ai_probability >= 40:
        risk = "Medium"
    else:
        risk = "Low"

    return {
        "label": "Video Analysis",
        "ai_probability": ai_probability,
        "risk": risk,
        "duration": round(duration, 3),
        "fps": round(fps, 3),
        "frame_count": frame_count,
        "sampled_frames": len(frame_results),
        "frame_results": frame_results,
    }