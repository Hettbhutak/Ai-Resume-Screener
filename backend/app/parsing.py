from pathlib import Path

from docx import Document
from pypdf import PdfReader


def extract_text_from_pdf(path: Path) -> str:
    reader = PdfReader(str(path))
    chunks = []
    for page in reader.pages:
        text = page.extract_text() or ""
        if text:
            chunks.append(text)
    return "\n".join(chunks)


def extract_text_from_docx(path: Path) -> str:
    document = Document(str(path))
    return "\n".join([p.text for p in document.paragraphs if p.text.strip()])


def extract_text(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        return extract_text_from_pdf(path)
    if suffix == ".docx":
        return extract_text_from_docx(path)
    if suffix in {".txt", ".md"}:
        return path.read_text(encoding="utf-8", errors="ignore")

    # Fallback for unsupported extension.
    return path.read_text(encoding="utf-8", errors="ignore")
