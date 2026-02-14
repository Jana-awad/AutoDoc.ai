"""
Text cleanup for OCR output.
Normalizes whitespace, line breaks, and removes non-printable characters
so the text is ready for LLM extraction.
"""
import re
import unicodedata


def _normalize_whitespace(text: str) -> str:
    """
    Replace multiple consecutive spaces/tabs with a single space.
    This fixes issues like "Date:    |Date" -> "Date: |Date"

    Args:
        text: Raw text string

    Returns:
        Text with normalized whitespace
    """
    text = re.sub(r" +", " ", text)
    text = re.sub(r"\t+", " ", text)
    return text


def _normalize_line_breaks(text: str) -> str:
    """
    Normalize different line break formats to consistent \\n.
    Handles Windows (\\r\\n), Mac (\\r), and Unix (\\n) formats.

    Args:
        text: Text with mixed line breaks

    Returns:
        Text with consistent \\n line breaks
    """
    text = text.replace("\r\n", "\n")
    text = text.replace("\r", "\n")
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text


def _remove_non_printable(text: str) -> str:
    """
    Remove non-printable characters that might confuse the LLM.
    Keeps normal text, spaces, newlines, and common punctuation.

    Args:
        text: Text that might contain non-printable characters

    Returns:
        Text with non-printable characters removed
    """
    cleaned = []
    for char in text:
        if char.isprintable() or char in ["\n", "\t"]:
            cleaned.append(char)
        elif unicodedata.category(char)[0] == "C":
            cleaned.append(" ")
        else:
            cleaned.append(char)
    return "".join(cleaned)


def _fix_common_ocr_errors(text: str) -> str:
    """
    Fix common OCR mistakes (e.g. missing or wrong characters).
    - "DUE: ue Date" -> "DUE: Due Date" (missing D)
    - "DATE: |Date" -> "DATE: Date" (pipe misread)
    """
    # Restore missing "D" in "Due Date" when after "DUE:"
    text = re.sub(r"DUE:\s*ue\s+Date", "DUE: Due Date", text, flags=re.IGNORECASE)
    # Remove pipe before "Date" in "DATE: |Date"
    text = re.sub(r"DATE:\s*\|Date", "DATE: Date", text, flags=re.IGNORECASE)
    return text


def _fix_common_phrases(text: str) -> str:
    """
    Fix common multi-word OCR phrase errors (not just single words).
    These are lightweight, rule-based corrections to improve readability.
    """
    fixes = [
        (r"(?i)invoice\s+no\.?\s*[:\-]?\s*", "Invoice Number: "),
        (r"(?i)inv\.?\s*no\.?\s*[:\-]?\s*", "Invoice Number: "),
        (r"(?i)account\s+no\.?\s*[:\-]?\s*", "Account Number: "),
        (r"(?i)bill\s+to\s*[:\-]?\s*", "Bill To: "),
        (r"(?i)ship\s+to\s*[:\-]?\s*", "Ship To: "),
        (r"(?i)due\s+date\s*[:\-]?\s*", "Due Date: "),
        (r"(?i)invoice\s+date\s*[:\-]?\s*", "Invoice Date: "),
        (r"(?i)statement\s+period\s*[:\-]?\s*", "Statement Period: "),
        (r"(?i)total\s+amount\s*[:\-]?\s*", "Total Amount: "),
        (r"(?i)sub\s*total\s*[:\-]?\s*", "Subtotal: "),
    ]
    for pattern, repl in fixes:
        text = re.sub(pattern, repl, text)
    return text


def _strip_whitespace(text: str) -> str:
    """
    Remove leading and trailing whitespace from each line,
    and from the entire text.

    Args:
        text: Text with potential leading/trailing whitespace

    Returns:
        Text with whitespace trimmed
    """
    lines = text.split("\n")
    cleaned_lines = [line.strip() for line in lines]
    text = "\n".join(cleaned_lines)
    return text.strip()


def clean_ocr_text(raw_text: str) -> str:
    """
    Main function to clean OCR-extracted text.
    Applies all cleanup steps in order:
    1. Normalize line breaks
    2. Normalize whitespace
    3. Remove non-printable characters
    4. Fix common OCR errors (e.g. "ue Date" -> "Due Date")
    5. Strip whitespace

    This is the function to call from the extraction pipeline.

    Args:
        raw_text: Raw text extracted from OCR (from get_text_from_pdf)

    Returns:
        Cleaned text ready for LLM processing
    """
    if not raw_text:
        return ""

    text = _normalize_line_breaks(raw_text)
    text = _normalize_whitespace(text)
    text = _remove_non_printable(text)
    text = _fix_common_ocr_errors(text)
    text = _fix_common_phrases(text)
    text = _strip_whitespace(text)

    return text
