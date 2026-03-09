import httpx
from app.config import GROQ_API_KEY, STT_MODEL

GROQ_STT_URL = "https://api.groq.com/openai/v1/audio/transcriptions"

FILLER_WORDS = [
    "uh", "um", "uhm", "umm", "erm", "err",
    "you know",
]


def get_mime_type(filename: str) -> str:
    filename_lower = filename.lower()
    if filename_lower.endswith(".mp4") or filename_lower.endswith(".m4a"):
        return "audio/mp4"
    elif filename_lower.endswith(".ogg"):
        return "audio/ogg"
    elif filename_lower.endswith(".wav"):
        return "audio/wav"
    elif filename_lower.endswith(".mp3"):
        return "audio/mpeg"
    else:
        return "audio/webm"


async def transcribe_audio(audio_bytes: bytes, filename: str = "speech.wav") -> str:
    mime_type = get_mime_type(filename)

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            GROQ_STT_URL,
            headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
            files={"file": (filename, audio_bytes, mime_type)},
            data={
                "model": STT_MODEL,
                "language": "en",
                "response_format": "verbose_json",
                "prompt": "Transcribe exactly as spoken, including all filler words like uh, um, uhm, you know.",
            },
        )
        response.raise_for_status()
        data = response.json()
        segments = data.get("segments", [])
        if segments:
            return " ".join(seg["text"].strip() for seg in segments)
        return data.get("text", "").strip()


def detect_filler_words(transcript: str) -> dict:
    words = transcript.lower().split()
    counts = {}

    single_fillers = [f for f in FILLER_WORDS if " " not in f]
    for word in words:
        clean = word.strip(".,!?;:'\"")
        if clean in single_fillers:
            counts[clean] = counts.get(clean, 0) + 1

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