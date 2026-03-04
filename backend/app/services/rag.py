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
    prompt = f"""You are a friendly MUET Reading coach helping a Malaysian student understand their practice test results.

Here is the student's performance:

{performance_summary}

The following official MUET band descriptors were retrieved as the closest matches using semantic search:

{descriptor_context}

Using ONLY the official MUET band descriptors above as your grounding criteria, write personalised feedback in simple, friendly English — like a teacher talking directly to the student. Use short sentences. Avoid difficult words. Any student, even a Band 2 student, must be able to understand every sentence.

Rules:
- Base the estimated band and all feedback strictly on the MUET descriptors above
- The performance summary contains STRONG, WEAK and HEAVILY SKIPPED labels to guide you — use them to decide what to mention, but NEVER use these words in your response. Instead write naturally e.g. "you struggled with", "you found this challenging", "many questions were left unanswered"
- Only mention STRONG parts in "What You Did Well". Only mention WEAK or HEAVILY SKIPPED parts in "Where to Focus". Never contradict the labels.
- Never mention scores, fractions or percentages — describe performance in plain words only
- If HEAVILY SKIPPED parts exist, mention generally that many questions were skipped and remind the student there is no penalty in MUET so always attempt every question
- Keep the tone encouraging and kind

Format your response EXACTLY with these section headers:

ESTIMATED BAND: [Band 1 / Band 2 / Band 3 / Band 4 / Band 5 / Band 5+]

YOUR BAND RESULT: [2 simple sentences explaining what this band means for a reading student, based on the descriptor. No jargon.]

WHAT YOU DID WELL: [2-3 bullet points starting with •. Only mention parts the student did well in and name the reading skill that shows. If no parts stand out, write one honest encouraging bullet instead. e.g. "• You did well in Part 1 and Part 2 — this shows you are good at finding specific facts and understanding main ideas in short everyday texts."]

WHERE TO FOCUS: [2-3 bullet points starting with •. Mention which parts were most challenging and name the skill each tests. If many questions were skipped, add one bullet about always attempting every question. e.g. "• Parts 6 and 7 were the most challenging — these test your ability to understand a writer's tone, purpose and deeper meaning in complex articles." e.g. "• You skipped many questions — remember there is no penalty for a wrong answer in MUET, so always make a guess rather than leaving a question blank."]

YOUR STUDY PLAN: [3 bullet points starting with •. One tip per weak area from WHERE TO FOCUS. If skipping was a problem, one tip must cover exam technique. Each tip must include a concrete example — a specific website, article type or activity with a short how-to. e.g. "• To improve at Part 5 (how ideas connect): read a short article on BBC Learning English (bbclearningenglish.com), cover the last paragraph and guess what comes next — this trains you to follow the flow of a text." e.g. "• For unanswered questions: practise the elimination method — cross out the option that is clearly wrong, then choose between what remains. An educated guess is always better than no answer." e.g. "• To get better at Parts 6 and 7: read one short opinion piece from The Star or New Straits Times each day and ask yourself — what is the writer trying to say, and are they for or against the topic?"]

YOUR NEXT GOAL: [2 sentences. Describe what the next band level looks like based on the descriptors and give one simple first step to get there.]"""

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

    all_headers = [
        "ESTIMATED BAND",
        "YOUR BAND RESULT",
        "WHAT YOU DID WELL",
        "WHERE TO FOCUS",
        "YOUR STUDY PLAN",
        "YOUR NEXT GOAL",
    ]

    sections = {}
    for i, header in enumerate(all_headers):
        sections[header] = extract_section(raw, header, all_headers[i+1:])

    structured_feedback = {
        "your_band_result":   sections.get("YOUR BAND RESULT", ""),
        "what_you_did_well":  sections.get("WHAT YOU DID WELL", ""),
        "where_to_focus":     sections.get("WHERE TO FOCUS", ""),
        "your_study_plan":    sections.get("YOUR STUDY PLAN", ""),
        "your_next_goal":     sections.get("YOUR NEXT GOAL", ""),
    }

    return {
        "feedback": raw,
        "structured_feedback": structured_feedback,
        "estimated_band": estimated_band,
        "top_descriptor_id": top_matches[0]["id"] if top_matches else None,
    }