"""
RAG EVALUATION - COMPLETE FIXED VERSION
Uses actual question text from database for speaking
"""

import sys
import os
import csv
import time
import glob
import json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import supabase
from app.services.rag import rag_generate_feedback
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from app.config import GEMINI_API_KEY, LLM_MODEL

# Import PART_SKILLS from component files
from app.api.endpoints.reading import PART_SKILLS as READING_SKILLS
from app.api.endpoints.listening import PART_SKILLS as LISTENING_SKILLS

llm = ChatGoogleGenerativeAI(model=LLM_MODEL, google_api_key=GEMINI_API_KEY, temperature=0.7)

# ============================================================
# MUET KEYWORDS for hallucination detection
# ============================================================

MUET_KEYWORDS = {
    "reading": ["part", "score", "correct", "skipped", "strong", "weak", "passage", "multiple choice", "simple", "factual information",],
    "listening": ["part", "dialogue", "monologue", "score", "correct", "skipped", "strong", "weak", "speaker"],
    "writing": ["task", "word count", "minimum 100 words", "notes", "grammar", "vocabulary", "tone", "suggested answer"],
    "speaking": ["fluency", "filler", "uh", "um", "presentation", "hesitation", "pronunciation", "transcript"]
}

def check_muet_keywords(text, component):
    if not text:
        return 0, []
    text_lower = text.lower()
    keywords = MUET_KEYWORDS.get(component, [])
    found = [kw for kw in keywords if kw in text_lower]
    return len(found), found

# ============================================================
# TEST CASES
# ============================================================

TEST_CASES = [
    # READING
    (1, "5bce6d26-b59c-40c5-b20b-ac041603cfe0", "reading", "Band 1"),
    (2, "2b5efb8c-c1d8-464a-ad3c-2d1a433b0743", "reading", "Band 2"),
    (3, "08852237-1980-4455-9d2d-71e887223bb4", "reading", "Band 3"),
    (4, "17bc7829-d5d1-446c-8d8c-ea105d897554", "reading", "Band 4"),
    (5, "55b0b754-b016-4994-a472-8bc7cbd23f4b", "reading", "Band 5"),
    (6, "fe2a8b16-ccf4-4ee4-824d-822d014e76e0", "reading", "Band 5+"),
    
    # LISTENING
    (7, "129dda84-e5d1-40bd-b89b-e0a339d8dbf6", "listening", "Band 1"),
    (8, "aeca4d33-2681-4ef5-a5d0-1bcf146d7eb5", "listening", "Band 2"),
    (9, "0b87957e-f8aa-4315-80de-ba2718f02169", "listening", "Band 3"),
    (10, "02017282-9cf4-49a1-8fbc-a51182bdc183", "listening", "Band 4"),
    (11, "a4f7d38d-8ae4-4a6e-b25b-df54851f2ec2", "listening", "Band 5"),
    (12, "77eead30-d9d6-46fc-8a63-013e0e53a7ff", "listening", "Band 5+"),
    
    # WRITING
    (13, "36376c8a-ab54-46c6-8a8d-2066c8239309", "writing", "Band 1"),
    (14, "8f1d6d81-7bae-496c-89b8-4f4bc77f6e64", "writing", "Band 2"),
    (15, "fbb21441-4173-404e-907d-aeb71d7ec50c", "writing", "Band 3"),
    (16, "45b8781a-eda2-46f7-90c2-f51315815ed6", "writing", "Band 4"),
    (17, "56c39503-702b-49d5-8f44-4f35961d354d", "writing", "Band 5"),
    (18, "a29aa0ea-0ffc-4c3d-a278-18fb1bbe4e87", "writing", "Band 5+"),
    
    # SPEAKING
    (19, "23aee447-379f-4f81-99f7-bd9bf3cf1e30", "speaking", "Band 1"),
    (20, "4312d051-bf8d-4ec9-954a-53a746ba001c", "speaking", "Band 2"),
    (21, "798fbce8-500d-4662-8aa6-bde3d4ee6d4f", "speaking", "Band 3"),
    (22, "6ef47279-984e-41ce-b808-18c29e4dbbba", "speaking", "Band 4"),
    (23, "df875b17-1061-4bf5-ada2-a121d17f7fb1", "speaking", "Band 5"),
    (24, "6bbdea17-f810-4d60-bb0f-7241ed2dd53d", "speaking", "Band 5+"),
]

def get_session_raw_data(session_id, component):
    answers_res = supabase.table("student_answers")\
        .select("question_id, student_answer, is_correct")\
        .eq("session_id", session_id)\
        .execute()
    
    answers = {a["question_id"]: a for a in answers_res.data}
    
    q_ids = list(answers.keys())
    if not q_ids:
        return None, 0, 0, 0
    
    questions_res = supabase.table("questions")\
        .select("id, question_text, correct_answer, part_number, passage, options, set_number, year")\
        .in_("id", q_ids)\
        .execute()
    
    raw_data = []
    skipped = 0
    for q in questions_res.data:
        ans = answers.get(q["id"], {})
        student_ans = ans.get("student_answer") or "(no answer)"
        is_correct = ans.get("is_correct", False)
        if student_ans == "(no answer)":
            skipped += 1
        raw_data.append({
            "question_text": q.get("question_text", ""),
            "student_answer": student_ans,
            "correct_answer": q.get("correct_answer", ""),
            "is_correct": is_correct,
            "part_number": q.get("part_number", 1),
            "passage": q.get("passage", ""),
            "set_number": q.get("set_number", 1),
            "year": q.get("year", 2024)
        })
    
    total = len(raw_data)
    correct = sum(1 for r in raw_data if r["is_correct"])
    
    return raw_data, total, correct, skipped

def estimate_band_from_performance(correct_count, total_questions):
    if total_questions == 0:
        return "Band 1"
    percentage = correct_count / total_questions * 100
    if percentage >= 90:
        return "Band 5+"
    elif percentage >= 75:
        return "Band 5"
    elif percentage >= 55:
        return "Band 4"
    elif percentage >= 35:
        return "Band 3"
    elif percentage >= 15:
        return "Band 2"
    else:
        return "Band 1"

def no_rag_predict(raw_data, component):
    qa_text = []
    for i, r in enumerate(raw_data[:10]):
        qa_text.append(f"Q{i+1}: {r['question_text'][:200]}")
        qa_text.append(f"Student: {r['student_answer']}")
        qa_text.append("")
    
    prompt = f"""Estimate MUET {component} band for this student.

{chr(10).join(qa_text)}

Format: ESTIMATED BAND: [Band X]"""
    
    start = time.time()
    response = llm.invoke([HumanMessage(content=prompt)])
    elapsed = time.time() - start
    text = response.content if isinstance(response.content, str) else str(response.content)
    
    band = "Unknown"
    if "ESTIMATED BAND:" in text:
        line = text.split("ESTIMATED BAND:")[1].split("\n")[0].strip()
        for b in ["Band 5+", "Band 5", "Band 4", "Band 3", "Band 2", "Band 1"]:
            if b in line:
                band = b
                break
    
    if band == "Unknown":
        for b in ["Band 5+", "Band 5", "Band 4", "Band 3", "Band 2", "Band 1"]:
            if b in text:
                band = b
                break
    
    if band == "Unknown":
        correct_count = sum(1 for r in raw_data[:10] if r.get("is_correct", False))
        total = len(raw_data[:10])
        band = estimate_band_from_performance(correct_count, total)
    
    return band, elapsed, text

def build_performance_summary(raw_data, component, total_q, correct, skipped):
    if component == "reading":
        part_scores = {}
        for r in raw_data:
            p = r.get("part_number", 1)
            if p not in part_scores:
                part_scores[p] = {"correct": 0, "total": 0, "skipped": 0}
            part_scores[p]["total"] += 1
            if r["is_correct"]:
                part_scores[p]["correct"] += 1
            if r["student_answer"] == "(no answer)":
                part_scores[p]["skipped"] += 1
        
        strong_parts = []
        weak_parts = []
        skipped_parts = []
        part_lines = []
        
        for p in sorted(part_scores.keys()):
            s = part_scores[p]
            pct = s["correct"] / s["total"] if s["total"] > 0 else 0
            if s["skipped"] >= s["total"] // 2:
                skipped_parts.append(p)
            elif pct >= 0.6:
                strong_parts.append(p)
            else:
                weak_parts.append(p)
            
            skill = READING_SKILLS.get(p, "Reading comprehension")
            part_lines.append(f"  Part {p} ({skill}): {s['correct']}/{s['total']} correct, {s['skipped']} skipped")
        
        return f"""Student completed MUET Reading practice test.
Overall score: {correct}/{total_q} correct. Total skipped: {skipped}/{total_q}.

Per-part breakdown:
{chr(10).join(part_lines)}

STRONG parts: {", ".join(f"Part {p}" for p in strong_parts) if strong_parts else "None"}
WEAK parts: {", ".join(f"Part {p}" for p in weak_parts) if weak_parts else "None"}
HEAVILY SKIPPED parts: {", ".join(f"Part {p}" for p in skipped_parts) if skipped_parts else "None"}"""
    
    elif component == "listening":
        part_scores = {}
        for r in raw_data:
            p = r.get("part_number", 1)
            if p not in part_scores:
                part_scores[p] = {"correct": 0, "total": 0, "skipped": 0}
            part_scores[p]["total"] += 1
            if r["is_correct"]:
                part_scores[p]["correct"] += 1
            if r["student_answer"] == "(no answer)":
                part_scores[p]["skipped"] += 1
        
        strong_parts = []
        weak_parts = []
        skipped_parts = []
        part_lines = []
        
        for p in sorted(part_scores.keys()):
            s = part_scores[p]
            pct = s["correct"] / s["total"] if s["total"] > 0 else 0
            if s["skipped"] >= s["total"] // 2:
                skipped_parts.append(p)
            elif pct >= 0.6:
                strong_parts.append(p)
            else:
                weak_parts.append(p)
            
            skill = LISTENING_SKILLS.get(p, "Listening comprehension")
            part_lines.append(f"  Part {p} ({skill}): {s['correct']}/{s['total']} correct, {s['skipped']} skipped")
        
        return f"""Student completed MUET Listening practice test.
Overall score: {correct}/{total_q} correct. Total skipped: {skipped}/{total_q}.

Per-part breakdown:
{chr(10).join(part_lines)}

STRONG parts: {", ".join(f"Part {p}" for p in strong_parts) if strong_parts else "None"}
WEAK parts: {", ".join(f"Part {p}" for p in weak_parts) if weak_parts else "None"}
HEAVILY SKIPPED parts: {", ".join(f"Part {p}" for p in skipped_parts) if skipped_parts else "None"}"""
    
    elif component == "writing":
        student_answer = raw_data[0]["student_answer"] if raw_data else ""
        word_count = len(student_answer.split())
        passage = raw_data[0].get("passage", "") if raw_data else ""
        
        return f"""Student completed MUET Writing Task 1.
Student name: Lithia

{passage}

Task: Write a reply of at least 100 words using all 4 notes given.
Word count: {word_count} words (minimum required: 100 words).

Student's response:
{student_answer}"""
    
    elif component == "speaking":
        transcript = raw_data[0]["student_answer"] if raw_data else ""
        word_count = len(transcript.split())
        
        # Get the actual question from the database
        question_text = raw_data[0].get("question_text", "") if raw_data else ""
        
        # Count filler words
        filler_words = ["uh", "um", "uhm", "umm", "erm", "err"]
        filler_breakdown = {}
        total_fillers = 0
        transcript_lower = transcript.lower()
        
        for filler in filler_words:
            count = transcript_lower.count(filler)
            if count > 0:
                filler_breakdown[filler] = count
                total_fillers += count
        
        # Build filler summary
        if total_fillers > 0:
            breakdown_parts = []
            for filler, count in filler_breakdown.items():
                breakdown_parts.append(f'"{filler}" (×{count})')
            filler_summary = f"\nFiller words detected in transcript: {', '.join(breakdown_parts)}. Total filler word count: {total_fillers}."
        else:
            filler_summary = "\nFiller words detected: None."
        
        set_number = raw_data[0].get("set_number", 1) if raw_data else 1
        booklet_number = raw_data[0].get("part_number", 1) if raw_data else 1
        
        return f"""Student completed MUET Speaking Part 1 Individual Presentation (Set {set_number}, Booklet {booklet_number}, Candidate 1).

Topic situation: Technology helps us in many ways. What are some of these ways?
Student's specific prompt: {question_text}

Transcript of student's spoken response (transcribed via speech-to-text):
{transcript}

Word count: {word_count} words (expected: approximately 200-250 words for a 2-minute presentation).{filler_summary}"""
    
    return ""

def full_rag_predict(raw_data, component, total_q, correct, skipped):
    performance_summary = build_performance_summary(raw_data, component, total_q, correct, skipped)
    start = time.time()
    result = rag_generate_feedback(component=component, performance_summary=performance_summary, k=3)
    elapsed = time.time() - start
    return result["estimated_band"], elapsed, result.get("feedback", "")

def run_evaluation():
    print("=" * 80)
    print("RAG EVALUATION - COMPLETE FIXED VERSION")
    print("=" * 80)
    
    results = []
    no_rag_correct = 0
    full_rag_correct = 0
    no_rag_times = []
    full_rag_times = []
    no_rag_hallucinations = 0
    full_rag_hallucinations = 0
    
    for sample_id, session_id, component, expected in TEST_CASES:
        print(f"\n--- [{sample_id}] {component.upper()} - Expected: {expected} ---")
        
        raw_data, total_q, correct, skipped = get_session_raw_data(session_id, component)
        if not raw_data:
            print(f"  SKIPPED: No data")
            continue
        
        print(f"  Questions: {total_q}, Correct: {correct}, Skipped: {skipped}")
        
        # No RAG
        nr_band, nr_time, nr_feedback = no_rag_predict(raw_data, component)
        nr_correct = (nr_band == expected)
        nr_muet_count, _ = check_muet_keywords(nr_feedback, component)
        
        # Full RAG
        fr_band, fr_time, fr_feedback = full_rag_predict(raw_data, component, total_q, correct, skipped)
        fr_correct = (fr_band == expected)
        fr_muet_count, _ = check_muet_keywords(fr_feedback, component)
        
        if nr_correct:
            no_rag_correct += 1
        if fr_correct:
            full_rag_correct += 1
        no_rag_times.append(nr_time)
        full_rag_times.append(fr_time)
        
        # Hallucination detection for all components including Speaking
        # A feedback is hallucinated if it contains fewer than 2 MUET related words
        if nr_muet_count < 2:
            no_rag_hallucinations += 1
        if fr_muet_count < 2:
            full_rag_hallucinations += 1
        
        print(f"  No RAG:   {nr_band} {'✓' if nr_correct else '✗'} ({nr_time:.1f}s) - MUET keywords: {nr_muet_count}")
        print(f"  Full RAG: {fr_band} {'✓' if fr_correct else '✗'} ({fr_time:.1f}s) - MUET keywords: {fr_muet_count}")
        
        results.append({
            "sample_id": sample_id,
            "component": component,
            "expected": expected,
            "no_rag_band": nr_band,
            "no_rag_correct": nr_correct,
            "full_rag_band": fr_band,
            "full_rag_correct": fr_correct,
            "no_rag_time": round(nr_time, 1),
            "full_rag_time": round(fr_time, 1),
            "no_rag_muet": nr_muet_count,
            "full_rag_muet": fr_muet_count
        })
    
    total = len(results)
    no_rag_acc = no_rag_correct / total * 100
    full_rag_acc = full_rag_correct / total * 100
    no_rag_avg_time = sum(no_rag_times) / len(no_rag_times) if no_rag_times else 0
    full_rag_avg_time = sum(full_rag_times) / len(full_rag_times) if full_rag_times else 0
    no_rag_hall_rate = no_rag_hallucinations / total * 100
    full_rag_hall_rate = full_rag_hallucinations / total * 100
    
    print("\n" + "=" * 100)
    print("RESULTS SUMMARY TABLE")
    print("=" * 100)
    print(f"\n{'ID':<4} {'Component':<12} {'Expected':<10} {'No RAG':<10} {'Full RAG':<10} {'NR✓':<5} {'FR✓'}")
    print("-" * 65)
    for r in results:
        nr_corr = "✓" if r['no_rag_correct'] else "✗"
        fr_corr = "✓" if r['full_rag_correct'] else "✗"
        print(f"{r['sample_id']:<4} {r['component']:<12} {r['expected']:<10} {r['no_rag_band']:<10} {r['full_rag_band']:<10} {nr_corr:<5} {fr_corr}")
    
    print("\n" + "=" * 90)
    print(" " * 35 + "METRICS SUMMARY")
    print("=" * 90)
    print(f"{'Metric':<22} {'No RAG':<28} {'Full RAG':<28} {'Difference':<15}")
    print("-" * 90)
    print(f"{'Band Accuracy':<22} "
          f"{f'{no_rag_acc:.1f}% ({no_rag_correct}/{total})':<28} "
          f"{f'{full_rag_acc:.1f}% ({full_rag_correct}/{total})':<28} "
          f"{f'+{full_rag_acc - no_rag_acc:.1f}%':<15}")
    
    print(f"{'Hallucination Rate':<22} "
          f"{f'{no_rag_hall_rate:.1f}% ({no_rag_hallucinations}/{total})':<28} "
          f"{f'{full_rag_hall_rate:.1f}% ({full_rag_hallucinations}/{total})':<28} "
          f"{f'-{no_rag_hall_rate - full_rag_hall_rate:.1f}%':<15}")
    
    print(f"{'Response Time':<22} "
          f"{f'{no_rag_avg_time:.1f}s':<28} "
          f"{f'{full_rag_avg_time:.1f}s':<28} "
          f"{f'+{full_rag_avg_time - no_rag_avg_time:.1f}s':<15}")
    
    print("=" * 90)
    
    # Save to CSV
    existing = glob.glob(os.path.join(os.path.dirname(__file__), "rag_eval_results_*.csv"))
    next_num = len(existing) + 1
    csv_path = os.path.join(os.path.dirname(__file__), f"rag_eval_results_{next_num}.csv")
    with open(csv_path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["sample_id", "component", "expected", "no_rag_band", "no_rag_correct", "full_rag_band", "full_rag_correct", "no_rag_time", "full_rag_time", "no_rag_muet", "full_rag_muet"])
        for r in results:
            writer.writerow([r["sample_id"], r["component"], r["expected"], r["no_rag_band"], r["no_rag_correct"], r["full_rag_band"], r["full_rag_correct"], r["no_rag_time"], r["full_rag_time"], r["no_rag_muet"], r["full_rag_muet"]])
    
    print(f"\nResults saved to: {csv_path}")
    print("=" * 80)

if __name__ == "__main__":
    run_evaluation()