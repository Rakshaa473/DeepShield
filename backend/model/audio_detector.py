import os

import librosa


SUPPORTED_AUDIO_EXTENSIONS = {".wav", ".mp3", ".m4a", ".ogg", ".flac"}


def _mean(values):
    return round(float(values.mean()), 6)


def analyze_audio(file_path):
    """Extract audio features and calculate a lightweight prototype score."""
    extension = os.path.splitext(file_path)[1].lower()

    if extension not in SUPPORTED_AUDIO_EXTENSIONS:
        raise ValueError(f"Unsupported audio format: {extension or 'unknown'}")

    audio, sample_rate = librosa.load(file_path, sr=None, mono=True)

    if audio.size == 0:
        raise ValueError("The uploaded audio file is empty.")

    rms = librosa.feature.rms(y=audio)[0]
    zero_crossing_rate = librosa.feature.zero_crossing_rate(audio)[0]
    spectral_centroid = librosa.feature.spectral_centroid(y=audio, sr=sample_rate)[0]
    spectral_bandwidth = librosa.feature.spectral_bandwidth(y=audio, sr=sample_rate)[0]
    spectral_rolloff = librosa.feature.spectral_rolloff(y=audio, sr=sample_rate)[0]
    spectral_flatness = librosa.feature.spectral_flatness(y=audio)[0]

    features = {
        "rms_energy": _mean(rms),
        "zero_crossing_rate": _mean(zero_crossing_rate),
        "spectral_centroid_hz": _mean(spectral_centroid),
        "spectral_bandwidth_hz": _mean(spectral_bandwidth),
        "spectral_rolloff_hz": _mean(spectral_rolloff),
        "spectral_flatness": _mean(spectral_flatness),
    }

    # This is an intentionally simple signal-based prototype, not a trained detector.
    ai_probability = 10
    if features["spectral_flatness"] > 0.08:
        ai_probability += 15
    if features["zero_crossing_rate"] > 0.15:
        ai_probability += 10
    if features["spectral_centroid_hz"] > 3500:
        ai_probability += 10

    ai_probability = min(ai_probability, 45)

    if ai_probability >= 35:
        risk = "Medium"
    else:
        risk = "Low"

    return {
        "label": "Prototype Audio Analysis",
        "ai_probability": ai_probability,
        "risk": risk,
        "duration": round(float(librosa.get_duration(y=audio, sr=sample_rate)), 3),
        "sample_rate": int(sample_rate),
        "features": features,
    }