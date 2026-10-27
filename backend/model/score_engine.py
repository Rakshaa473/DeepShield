
def calculate_score(
    image_score,
    metadata_score=None,
    ela_score=None,
    text=""
):
    """
    Combine available forensic signals into an experimental
    AI-likelihood score.

    IMPORTANT:
    This score is not a calibrated probability and cannot
    prove whether an image is real or AI-generated.

    Input scores must represent AI-likelihood on a 0-100 scale.
    Metadata and ELA must be calibrated before being used as
    evidence of AI generation.

    Returns:
        (score, label, risk)
    """

    def valid_score(value):
        if value is None or isinstance(value, bool):
            return None

        try:
            number = float(value)
        except (TypeError, ValueError):
            return None

        if number != number or number in (
            float("inf"),
            float("-inf")
        ):
            return None

        if not 0 <= number <= 100:
            return None

        return number

    image_ai = valid_score(image_score)

    # An invalid or missing primary model score means we cannot
    # responsibly classify the image.
    if image_ai is None:
        return (50.0, "Inconclusive", "Unknown")

    # Do not automatically treat missing metadata/ELA as zero.
    metadata_ai = valid_score(metadata_score)
    ela_ai = valid_score(ela_score)

    # The image model is the only primary authenticity signal.
    # Metadata and ELA are omitted until their scores have been
    # validated and calibrated for this exact task.
    #
    # This prevents unavailable or uncalibrated forensic signals
    # from silently changing the model's prediction.
    ai_score = image_ai

    # Scores from 40-60 are deliberately uncertain.
    if ai_score >= 70:
        label = "AI Generated"
        risk = "High"
        score = ai_score

    elif ai_score >= 60:
        label = "Likely AI Generated"
        risk = "Medium"
        score = ai_score

    elif ai_score <= 30:
        label = "Likely Real Image"
        risk = "Low"
        score = 100 - ai_score

    elif ai_score <= 40:
        label = "Likely Real Image"
        risk = "Medium"
        score = 100 - ai_score

    else:
        label = "Inconclusive"
        risk = "Unknown"
        score = 50.0

    return (
        round(score, 2),
        label,
        risk
    )
