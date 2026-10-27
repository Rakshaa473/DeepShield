
import os
import librosa


SUPPORTED_AUDIO_EXTENSIONS = {".wav", ".mp3", ".m4a", ".ogg", ".flac"}


def _mean(values):
    return round(float(values.mean()), 6)


def analyze_audio(file_path):
    """
    Extract audio signal features for DeepShield.

    IMPORTANT:
    This is feature analysis, NOT a trained AI-generated-audio detector.
    Signal features alone cannot reliably determine audio authenticity.
    """

    extension = os.path.splitext(file_path)[1].lower()

    if extension not in SUPPORTED_AUDIO_EXTENSIONS:
        raise ValueError(
            f"Unsupported audio format: {extension or 'unknown'}"
        )

    if not os.path.isfile(file_path):
        raise FileNotFoundError("The uploaded audio file was not found.")

    audio, sample_rate = librosa.load(
        file_path,
        sr=None,
        mono=True
    )

    if audio.size == 0:
        raise ValueError("The uploaded audio file is empty.")

    if sample_rate <= 0:
        raise ValueError("Invalid audio sample rate.")

    rms = librosa.feature.rms(y=audio)[0]
    zero_crossing_rate = librosa.feature.zero_crossing_rate(audio)[0]
    spectral_centroid = librosa.feature.spectral_centroid(
        y=audio, sr=sample_rate
    )[0]
    spectral_bandwidth = librosa.feature.spectral_bandwidth(
        y=audio, sr=sample_rate
    )[0]
    spectral_rolloff = librosa.feature.spectral_rolloff(
        y=audio, sr=sample_rate
    )[0]
    spectral_flatness = librosa.feature.spectral_flatness(y=audio)[0]

    features = {
        "rms_energy": _mean(rms),
        "zero_crossing_rate": _mean(zero_crossing_rate),
        "spectral_centroid_hz": _mean(spectral_centroid),
        "spectral_bandwidth_hz": _mean(spectral_bandwidth),
        "spectral_rolloff_hz": _mean(spectral_rolloff),
        "spectral_flatness": _mean(spectral_flatness),
    }

    duration = float(librosa.get_duration(
        y=audio,
        sr=sample_rate
    ))

    # Do not invent an AI probability from unvalidated thresholds.
    return {
        "label": "Inconclusive",
        "ai_probability": None,
        "risk": "Unknown",
        "message": (
            "Audio features were extracted successfully, but a trained "
            "and validated AI-audio detection model is required to "
            "estimate whether this audio is AI-generated."
        ),
        "duration": round(duration, 3),
        "sample_rate": int(sample_rate),
        "features": features,
    }
