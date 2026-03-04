from app.config import supabase, LLM_MODEL, GEMINI_API_KEY
from app.services.embedding import embed_text
from app.services.knn import knn_search
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

_llm = None

def get_llm():
    global _llm
    if _llm is None:
        _llm = ChatGoogleGenerativeAI(
            model=LLM_MODEL,
            google_api_key=GEMINI_API_KEY,
            temperature=0.7,
        )
    return _llm


def load_descriptors(component: str) -> list[dict]:
    result = (
        supabase.table("muet_descriptors")
        .select("id, band_level, descriptor_text, embedding_vector")
        .eq("component", component)
        .execute()
    )
    descriptors = []
    for row in result.data:
        vec = row["embedding_vector"]
        if isinstance(vec, str):
            vec = [float(x) for x in vec.strip("[]").split(",")]
        descriptors.append({
            "id": row["id"],
            "band_level": row["band_level"],
            "descriptor_text": row["descriptor_text"],
            "embedding_vector": vec,
        })
    return descriptors


def parse_response_content(content) -> str:
    if isinstance(content, str):
        return content
    elif isinstance(content, list):
        item = content[0]
        if isinstance(item, dict):
            return item.get("text", str(item))
        else:
            return getattr(item, "text", str(item))
    else:
        return str(content)


def rag_generate_feedback(component: str, performance_summary: str, k: int = 3) -> dict:
    """
    Full RAG pipeline:
    1. Embed student performance summary text
    2. KNN finds top-k closest MUET band descriptors
    3. Augment prompt with retrieved descriptors
    4. LLM generates structured feedback with band estimate
    """
    # Step 1 — Embed
    query_vector = embed_text(performance_summary)

    # Step 2 — Retrieval (KNN search)
    descriptors = load_descriptors(component)
    top_matches = knn_search(query_vector, descriptors, k=k)

    # Step 3 — Augment
    descriptor_context = "\n\n".join([
        f"[{m['band_level']}] (similarity: {m['similarity']:.3f})\n{m['descriptor_text']}"
        for m in top_matches
    ])

    # Step 4 — Generate with structured output
    prompt = f"""You are an official MUET (Malaysian University English Test) examiner and coach.

A student has completed a MUET {component.capitalize()} practice test. Here is their performance summary:

{performance_summary}

The following official MUET band descriptors were retrieved as the closest matches using semantic search:

{descriptor_context}

Using ONLY the official MUET band descriptors above as your grounding criteria, generate structured feedback in simple, clear English that a Malaysian student can easily understand.

Format your response EXACTLY as shown below with these exact section headers:

ESTIMATED BAND: [Band 1 / Band 2 / Band 3 / Band 4 / Band 5 / Band 5+]

WHAT THIS BAND MEANS: [In 2 simple sentences, explain what the official MUET descriptor says this band level means in plain English. Quote the descriptor language directly.]

STRENGTHS: [2-3 bullet points starting with • about what the student did well based on their correct answers and which parts they performed better in]

WEAKNESSES: [2-3 bullet points starting with • about specific parts where the student struggled, with numbers e.g. Part 2: 0/6, and what skill that part tests]

WHY THIS BAND: [2-3 simple sentences explaining exactly why this band was chosen based on the student's score pattern and how it matches the descriptor. Use simple English, no jargon.]

HOW TO IMPROVE: [3 bullet points starting with • with concrete, specific and actionable study tips directly related to the student's weak areas and the MUET criteria]

NEXT TARGET: [2 sentences about what the next band level requires and one specific thing the student should focus on to get there]"""

    response = get_llm().invoke([HumanMessage(content=prompt)])
    raw = parse_response_content(response.content).strip()

    # Parse estimated band
    estimated_band = "Band 3"  # fallback
    if "ESTIMATED BAND:" in raw:
        band_line = raw.split("ESTIMATED BAND:")[1].split("\n")[0].strip()
        for band in ["Band 5+", "Band 5", "Band 4", "Band 3", "Band 2", "Band 1"]:
            if band in band_line:
                estimated_band = band
                break

    # Parse each section
    def extract_section(text, header, next_headers):
        if header + ":" not in text:
            return ""
        after = text.split(header + ":")[1]
        for nh in next_headers:
            if nh + ":" in after:
                after = after.split(nh + ":")[0]
        return after.strip()

    all_headers = ["ESTIMATED BAND", "WHAT THIS BAND MEANS", "STRENGTHS",
                   "WEAKNESSES", "WHY THIS BAND", "HOW TO IMPROVE", "NEXT TARGET"]

    sections = {}
    for i, header in enumerate(all_headers):
        next_h = all_headers[i+1:]
        sections[header] = extract_section(raw, header, next_h)

    # Build structured feedback object
    structured_feedback = {
        "what_this_band_means": sections.get("WHAT THIS BAND MEANS", ""),
        "strengths": sections.get("STRENGTHS", ""),
        "weaknesses": sections.get("WEAKNESSES", ""),
        "why_this_band": sections.get("WHY THIS BAND", ""),
        "how_to_improve": sections.get("HOW TO IMPROVE", ""),
        "next_target": sections.get("NEXT TARGET", ""),
    }

    # Also keep full raw text as fallback
    feedback_text = raw

    return {
        "feedback": feedback_text,
        "structured_feedback": structured_feedback,
        "estimated_band": estimated_band,
        "top_descriptor_id": top_matches[0]["id"] if top_matches else None,
    }