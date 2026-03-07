import httpx
from app.config import GROQ_API_KEY, STT_MODEL

GROQ_STT_URL = "https://api.groq.com/openai/v1/audio/transcriptions"

FILLER_WORDS = [
    "uh", "um", "uhm", "umm", "erm", "err",
    "like", "you know", "basically", "literally",
    "actually", "right", "okay", "so", "well",
]

async def transcribe_audio(audio_bytes: bytes, filename: str = "speech.webm") -> str:
    """Transcribe audio bytes using Groq Whisper and return transcript text."""
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            GROQ_STT_URL,
            headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
            files={"file": (filename, audio_bytes, "audio/webm")},
            data={
                "model": STT_MODEL,
                "language": "en",
                "response_format": "text",
            },
        )
        response.raise_for_status()
        return response.text.strip()


def detect_filler_words(transcript: str) -> dict:
    """Count filler words in transcript and return detailed breakdown."""
    words = transcript.lower().split()
    counts = {}

    # Single word fillers
    single_fillers = [f for f in FILLER_WORDS if " " not in f]
    for word in words:
        clean = word.strip(".,!?;:'\"")
        if clean in single_fillers:
            counts[clean] = counts.get(clean, 0) + 1

    # Multi-word fillers
    text_lower = transcript.lower()
    multi_fillers = [f for f in FILLER_WORDS if " " in f]
    for phrase in multi_fillers:
        count = text_lower.count(phrase)
        if count > 0:
            counts[phrase] = count

    total = sum(counts.values())
    return {
        "total": total,
        "breakdown": counts,
        "has_fillers": total > 0,
    }