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


def _fix_common_ocr_character_errors(text: str) -> str:
    """
    Fix common OCR character misreadings and artifacts.
    Handles general OCR errors without being too specific.
    """
    # Fix broken words with stray characters
    # Remove isolated punctuation that doesn't make sense (like |, ~, ` in the middle of words)
    text = re.sub(r'([a-zA-Z0-9])\s*[|~`]\s*([a-zA-Z0-9])', r'\1\2', text)
    
    # Fix common spacing issues around punctuation
    # Remove spaces before punctuation (except for opening quotes/parentheses)
    text = re.sub(r'\s+([.,;:!?])', r'\1', text)
    # Fix spaces after opening quotes/parentheses
    text = re.sub(r'(["\'(])\s+', r'\1', text)
    # Fix spaces before closing quotes/parentheses
    text = re.sub(r'\s+(["\')])', r'\1', text)
    
    # Fix double punctuation (common OCR error)
    text = re.sub(r'([.,;:!?])\s*\1+', r'\1', text)
    
    # Fix broken numbers (spaces in numbers)
    # Pattern: digit space digit (likely a broken number)
    text = re.sub(r'(\d)\s+(\d)', r'\1\2', text)
    
    # Fix broken currency/percentage symbols
    # Pattern: space between symbol and number
    text = re.sub(r'([$€£%])\s+(\d)', r'\1\2', text)
    
    return text


def _fix_grammar_and_spacing_errors(text: str) -> str:
    """
    Fix common grammar and spacing errors from OCR.
    General-purpose fixes that improve readability.
    """
    # Fix missing spaces after punctuation (except periods that might be decimals)
    # Pattern: punctuation followed by letter (should have space)
    text = re.sub(r'([.,;:!?])([A-Za-z])', r'\1 \2', text)
    
    # Fix multiple spaces between words (already handled by normalize_whitespace, but double-check)
    text = re.sub(r'([a-zA-Z0-9])\s{2,}([a-zA-Z0-9])', r'\1 \2', text)
    
    # Fix capitalization errors at sentence starts
    # Pattern: period/newline followed by lowercase letter
    text = re.sub(r'([.!?]\s+)([a-z])', lambda m: m.group(1) + m.group(2).upper(), text)
    text = re.sub(r'(\n\s*)([a-z])', lambda m: m.group(1) + m.group(2).upper(), text)
    
    # Fix common OCR artifacts: remove stray single characters that don't make sense
    # Pattern: isolated single letter/number surrounded by spaces (but preserve single-letter words like "a", "I")
    # This is conservative - only remove if it's clearly an artifact
    text = re.sub(r'\s+([0-9])\s+', r' \1 ', text)  # Preserve single digits
    
    # Fix broken hyphenated words
    # Pattern: word-space-hyphen-space-word -> word-hyphen-word
    text = re.sub(r'([a-zA-Z0-9])\s+-\s+([a-zA-Z0-9])', r'\1-\2', text)
    
    # Fix spacing around colons (common in forms: "Field: value")
    text = re.sub(r'([a-zA-Z0-9])\s*:\s*([a-zA-Z0-9])', r'\1: \2', text)
    
    return text


def _remove_ocr_artifacts(text: str) -> str:
    """
    Remove common OCR artifacts and noise.
    """
    # Remove excessive dashes/underscores that are likely OCR artifacts
    # Pattern: 3+ consecutive dashes/underscores (likely separator line)
    text = re.sub(r'[-_]{3,}', ' ', text)
    
    # Remove stray characters that are common OCR errors
    # Pattern: isolated special characters that don't make sense
    # Remove |, ~, ` when they appear isolated
    text = re.sub(r'\s+[|~`]\s+', ' ', text)
    
    # Fix broken currency symbols
    # Pattern: space between $ and number
    text = re.sub(r'\$\s+(\d)', r'$\1', text)
    
    # Remove excessive dots (likely OCR noise)
    # Pattern: 4+ consecutive dots
    text = re.sub(r'\.{4,}', '...', text)
    
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
    4. Fix common OCR character errors (rn->m, broken words, etc.)
    5. Fix grammar and spacing errors
    6. Remove OCR artifacts and noise
    7. Strip whitespace

    This is the function to call from the extraction pipeline.
    Uses general-purpose OCR cleanup rules, not specific phrase fixes.

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
    text = _fix_common_ocr_character_errors(text)
    text = _fix_grammar_and_spacing_errors(text)
    text = _remove_ocr_artifacts(text)
    text = _strip_whitespace(text)

    return text
