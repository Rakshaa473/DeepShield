from PIL import Image
from PIL.ExifTags import TAGS


def analyze_metadata(image_path):
    """
    Analyze image metadata as supporting forensic evidence.

    IMPORTANT:
    Missing EXIF metadata does NOT mean an image is AI-generated.
    Metadata is only one weak signal among several.
    """

    try:
        image = Image.open(image_path)

        exif = image.getexif()

        if not exif:
            return {
                "metadata": "No EXIF metadata found",
                "ai_probability": 50,
                "metadata_signal": "neutral",
            }

        metadata = {}

        for tag_id, value in exif.items():

            tag = TAGS.get(
                tag_id,
                tag_id
            )

            # Avoid extremely large/unserializable metadata values
            if isinstance(value, bytes):
                try:
                    value = value.decode(
                        "utf-8",
                        errors="ignore"
                    )
                except Exception:
                    value = str(value)

            metadata[str(tag)] = value


        # ----------------------------------------------------
        # Relevant metadata fields
        # ----------------------------------------------------

        camera_fields = [
            "Make",
            "Model",
            "LensModel",
            "DateTime",
            "DateTimeOriginal",
            "DateTimeDigitized",
            "FNumber",
            "ExposureTime",
            "ISOSpeedRatings",
            "FocalLength",
        ]

        software_fields = [
            "Software",
            "ProcessingSoftware",
        ]


        camera_metadata = {}

        for key in camera_fields:

            if key in metadata:

                camera_metadata[key] = metadata[key]


        software_metadata = {}

        for key in software_fields:

            if key in metadata:

                software_metadata[key] = metadata[key]


        # ----------------------------------------------------
        # Determine metadata signal
        # ----------------------------------------------------

        # Camera information is mild evidence of a camera
        # workflow, but NOT proof that the image is real.

        if camera_metadata:

            ai_probability = 40
            signal = "camera_metadata_present"

        elif software_metadata:

            # Editing software metadata can indicate that an
            # image passed through an editor, but does not prove
            # AI generation.
            ai_probability = 55
            signal = "software_metadata_present"

        else:

            # EXIF exists but contains no useful fields.
            ai_probability = 50
            signal = "neutral"


        return {
            "metadata": {
                "camera": camera_metadata,
                "software": software_metadata,
            },
            "ai_probability": ai_probability,
            "metadata_signal": signal,
        }


    except Exception as error:

        return {
            "metadata": f"Metadata analysis error: {error}",
            "ai_probability": 50,
            "metadata_signal": "unknown",
        }