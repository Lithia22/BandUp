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


# Component-specific resource guidance
COMPONENT_RESOURCES = {
    "reading": (
        "Suggest resources like BBC Learning English (bbclearningenglish.com), "
        "The Star, or New Straits Times. Tips should involve active reading: summarising, predicting, identifying opinions."
    ),
    "listening": (
        "Suggest resources like BBC Learning English 6 Minute English "
        "(bbclearningenglish.com/english/features/6-minute-english) or TED-Ed on YouTube. "
        "Tips should involve active listening: summarising, predicting, identifying the speaker's main idea."
    ),
    "writing": (
        "Suggest resources like BBC Learning English (bbclearningenglish.com), "
        "British Council LearnEnglish (learnenglish.britishcouncil.org), or sample MUET writing responses. "
        "Tips should involve active writing practice: writing email replies, checking grammar, "
        "expanding ideas with reasons and examples, or reading model answers to understand good structure and register."
    ),
}


def rag_generate_feedback(component: str, performance_summary: str, k: int = 3, skipped_note: str = "") -> dict:
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

    # Step 4 — Generate
    component_label = component.capitalize()
    resource_guidance = COMPONENT_RESOURCES.get(component, COMPONENT_RESOURCES["reading"])

    if component == "writing":
        prompt = f"""You are a friendly MUET Writing coach giving personalised feedback to a Malaysian student.

Student performance:
{performance_summary}

Official MUET band descriptors (use ONLY these to estimate the band):
{descriptor_context}

Rules:
- Write in simple, friendly English — like a teacher talking directly to the student. Do NOT use any markdown formatting — no asterisks, no bold, no italics, no symbols
- Base the estimated band strictly on the MUET descriptors above
- Evaluate based on these 4 criteria from MUET Writing descriptors and test specifications:
  1. Task Fulfillment — did the student address all notes? Did they use appropriate language functions?
  2. Language Accuracy — grammar, vocabulary, sentence structure
  3. Organisation & Coherence — are ideas logically ordered and well-connected?
  4. Style & Register — is the tone appropriate for the reader-writer relationship?
- Never mention scores, fractions or percentages
- If word count is below 100, always mention this in WHERE TO FOCUS
- Keep the tone encouraging and kind
- For SUGGESTED ANSWER: rewrite the student's response at Band 5 level — keep their exact same ideas, notes and structure but improve the grammar, vocabulary, sentence variety and style. Do NOT invent new ideas. Keep it as a natural email reply. Do not add any explanation or commentary — just the improved email text only.

Format EXACTLY:

ESTIMATED BAND: [Band 1 / Band 2 / Band 3 / Band 4 / Band 5 / Band 5+]

YOUR BAND RESULT:
[2 simple sentences on what this band means for a Writing student based on the descriptor]

WHAT YOU DID WELL:
[One • bullet per criteria the student handled well — name the criteria and explain briefly what they did well]
[One final short encouraging bullet]

WHERE TO FOCUS:
[One • bullet per criteria that needs improvement — name the criteria and explain specifically what was weak]
[If word count below 100, add one bullet about meeting the minimum word count]
[One final short sentence on what to prioritise]

YOUR STUDY PLAN:
[One • bullet per weak criteria identified in WHERE TO FOCUS]
[Each tip: [Criteria name] — [specific activity] using [specific resource]]
[{resource_guidance}]

YOUR NEXT GOAL:
[2 sentences on what the next band looks like based on the descriptors and one simple first step]

SUGGESTED ANSWER:
[Rewrite the student's response at Band 5 level — same ideas, improved language. Natural email format only, no commentary.]"""

    else:
        prompt = f"""You are a friendly MUET {component_label} coach giving personalised feedback to a Malaysian student.

Student performance:
{performance_summary}

Official MUET band descriptors (use ONLY these to estimate the band):
{descriptor_context}

Rules:
- Write in simple, friendly English — like a teacher talking directly to the student. Do NOT use any markdown formatting — no asterisks, no bold, no italics, no symbols
- Never use the words STRONG, WEAK or HEAVILY SKIPPED — write naturally instead
- Never mention scores, fractions or percentages
- Only mention STRONG parts in WHAT YOU DID WELL
- Only mention WEAK or HEAVILY SKIPPED parts in WHERE TO FOCUS
- Always include the part number and its skill + text type in every bullet about a specific part
- WHERE TO FOCUS: explain WHY each part is challenging — no study tips here
- If two parts test the same text type, combine into one bullet
- WHAT YOU DID WELL: if no parts stand out, write one honest encouraging bullet about their effort — do NOT mention whether they completed the test or how many questions they answered

Format EXACTLY:

ESTIMATED BAND: [Band 1 / Band 2 / Band 3 / Band 4 / Band 5 / Band 5+]

YOUR BAND RESULT:
[2 simple sentences on what this band means for a {component_label} student based on the descriptor]

WHAT YOU DID WELL:
[One • bullet per STRONG part: Part [n] — [skill + text type] — [what doing well shows]]
[One final short encouraging bullet]

WHERE TO FOCUS:
[One • bullet per WEAK part: Part [n] — [skill + text type] — [why this is challenging]]
[One final short sentence on what to prioritise]

YOUR STUDY PLAN:
[One • bullet per weak area — cover ALL of them]
{skipped_note}
[If skipping was an issue, add this bullet: • Exam technique — use the elimination method: rule out the clearly wrong option first, then choose between what remains]
[Each tip: Part [n] — [skill] — [specific activity] using [specific resource]]
[{resource_guidance}]

YOUR NEXT GOAL:
[2 sentences on what the next band looks like and one simple first step]"""

    response = get_llm().invoke([HumanMessage(content=prompt)])
    raw = parse_response_content(response.content).strip()

    # Parse estimated band
    estimated_band = "Band 3"
    if "ESTIMATED BAND:" in raw:
        band_line = raw.split("ESTIMATED BAND:")[1].split("\n")[0].strip()
        for band in ["Band 5+", "Band 5", "Band 4", "Band 3", "Band 2", "Band 1"]:
            if band in band_line:
                estimated_band = band
                break

    # Parse sections
    def extract_section(text, header, next_headers):
        if header + ":" not in text:
            return ""
        after = text.split(header + ":")[1]
        for nh in next_headers:
            if nh + ":" in after:
                after = after.split(nh + ":")[0]
        return after.strip()

    all_headers = (
        [
            "ESTIMATED BAND",
            "YOUR BAND RESULT",
            "WHAT YOU DID WELL",
            "WHERE TO FOCUS",
            "YOUR STUDY PLAN",
            "YOUR NEXT GOAL",
            "SUGGESTED ANSWER",
        ]
        if component == "writing"
        else [
            "ESTIMATED BAND",
            "YOUR BAND RESULT",
            "WHAT YOU DID WELL",
            "WHERE TO FOCUS",
            "YOUR STUDY PLAN",
            "YOUR NEXT GOAL",
        ]
    )

    sections = {}
    for i, header in enumerate(all_headers):
        sections[header] = extract_section(raw, header, all_headers[i+1:])

    structured_feedback = {
        "your_band_result":  sections.get("YOUR BAND RESULT", ""),
        "what_you_did_well": sections.get("WHAT YOU DID WELL", ""),
        "where_to_focus":    sections.get("WHERE TO FOCUS", ""),
        "your_study_plan":   sections.get("YOUR STUDY PLAN", ""),
        "your_next_goal":    sections.get("YOUR NEXT GOAL", ""),
    }

    if component == "writing":
        structured_feedback["suggested_answer"] = sections.get("SUGGESTED ANSWER", "")

    return {
        "feedback": raw,
        "structured_feedback": structured_feedback,
        "estimated_band": estimated_band,
        "top_descriptor_id": top_matches[0]["id"] if top_matches else None,
    }