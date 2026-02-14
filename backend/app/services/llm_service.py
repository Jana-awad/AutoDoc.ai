"""
Generic LLM service: call OpenAI with system + user message, with error handling.
"""
from openai import OpenAI, APIError
from openai.types.chat import ChatCompletion

from app.core.config import settings


# Map your model enum/names to OpenAI model IDs if needed (optional)
def _get_model_id(model: str | None = None) -> str:
    """Resolve model to OpenAI model ID; default from settings."""
    if model:
        return model.strip().lower()
    return (settings.OPENAI_MODEL or "gpt-4o-mini").strip().lower()


def generate_response(
    *,
    system_prompt: str,
    user_message: str,
    model: str | None = None,
) -> ChatCompletion:
    """
    Call OpenAI chat completions with system + user message.

    Args:
        system_prompt: System message content.
        user_message: User message content.
        model: Optional model ID; uses settings.OPENAI_MODEL if omitted.

    Returns:
        OpenAI ChatCompletion response.

    Raises:
        ValueError: If OPENAI_API_KEY is not set.
        HTTPException(429): If rate limited.
        HTTPException(500): If other API/communication error.
    """
    from fastapi import HTTPException

    if not settings.OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY is not set")

    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    model_id = _get_model_id(model)

    try:
        response = client.chat.completions.create(
            model=model_id,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
        )
        return response
    except APIError as e:
        if e.status == 429:
            raise HTTPException(
                status_code=429,
                detail="AI service is temporarily busy. Please try again.",
            ) from e
        raise HTTPException(
            status_code=500,
            detail="Failed to communicate with LLM provider.",
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Failed to communicate with LLM provider.",
        ) from e


def get_response_text(response: ChatCompletion) -> str:
    """Extract assistant text from ChatCompletion (convenience)."""
    content = response.choices[0].message.content
    return content or ""
