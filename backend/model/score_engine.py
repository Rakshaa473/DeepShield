def calculate_score(image_score, metadata_score, ela_score, text):

    ai = 0
    real = 0

    # AI MODEL
    if image_score >= 80:
        real += 40
    elif image_score >= 60:
        real += 25
        ai += 15
    else:
        ai += 40

    # METADATA
    if metadata_score >= 80:
        ai += 20
    elif metadata_score >= 50:
        ai += 10
    else:
        real += 20

    # ELA
    if ela_score >= 70:
        ai += 25
    elif ela_score >= 40:
        ai += 10
    else:
        real += 25

    # OCR
    if len(text.strip()) > 20:
        real += 15

    # FINAL SCORE
    total = ai + real

    if total == 0:
        total = 1

    ai_percent = round((ai / total) * 100, 2)
    real_percent = round((real / total) * 100, 2)

    if ai_percent > real_percent:
        return ai_percent, "AI Generated", "High"

    return real_percent, "Real Image", "Low"