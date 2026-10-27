
import os

from pypdf import PdfReader
from docx import Document


SUPPORTED_DOCUMENT_EXTENSIONS = {".pdf", ".docx", ".txt"}


def extract_document_text(file_path):
    """Extract text from PDF, DOCX, or TXT files."""

    if not os.path.isfile(file_path):
        raise FileNotFoundError("The uploaded document was not found.")

    extension = os.path.splitext(file_path)[1].lower()

    if extension not in SUPPORTED_DOCUMENT_EXTENSIONS:
        raise ValueError(
            f"Unsupported document format: {extension or 'unknown'}"
        )

    try:
        if extension == ".pdf":
            reader = PdfReader(file_path)
            pages = []

            for page in reader.pages:
                page_text = page.extract_text()

                if page_text:
                    pages.append(page_text)

            return "\n".join(pages).strip()

        elif extension == ".docx":
            document = Document(file_path)
            paragraphs = [
                paragraph.text
                for paragraph in document.paragraphs
                if paragraph.text.strip()
            ]

            return "\n".join(paragraphs).strip()

        elif extension == ".txt":
            with open(
                file_path,
                "r",
                encoding="utf-8-sig",
                errors="replace"
            ) as file:
                return file.read().strip()

    except Exception as error:
        raise ValueError(
            f"Document extraction failed: {error}"
        ) from error


def analyze_document(file_path):
    """Extract document text and report analysis limitations."""

    text = extract_document_text(file_path)

    if not text:
        raise ValueError(
            "No readable text was found in the document. "
            "Scanned PDFs may require OCR."
        )

    words = text.split()

    return {
        "label": "Document Text Extracted",
        "text": text,
        "word_count": len(words),
        "character_count": len(text),
        "ai_probability": None,
        "risk": "Unknown",
        "suspicious_keywords": [],
        "message": (
            "Document text was extracted successfully. "
            "Text extraction alone cannot determine whether "
            "a document was written by AI."
        ),
    }
