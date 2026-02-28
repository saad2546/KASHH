import os
import json
import re
import time
from flask import jsonify

from google import genai
from google.genai import types
from google.api_core import exceptions


# ─────────────────────────────────────
# APPOINTMENT TYPE BASE SCORES
# ─────────────────────────────────────
TYPE_SCORES = {
    "new": 5,
    "follow-up": 3,
    "report": 2,
}

# ─────────────────────────────────────
# KEYWORD FALLBACK (when Gemini is unavailable)
# ─────────────────────────────────────
URGENT_KEYWORDS = [
    "chest pain", "breathing", "unconscious", "seizure", "heart attack",
    "stroke", "bleeding", "fracture", "accident", "severe", "stabbing",
    "choking", "collapse", "faint", "burn", "poison", "overdose",
]

MODERATE_KEYWORDS = [
    "fever", "vomiting", "diarrhea", "headache", "swelling", "infection",
    "rash", "cough", "pain", "nausea", "dizziness", "weakness",
]


def _fallback_urgency(complaint: str) -> int:
    """Keyword-based urgency when GenAI is unavailable."""
    text = complaint.lower()
    for kw in URGENT_KEYWORDS:
        if kw in text:
            return 8
    for kw in MODERATE_KEYWORDS:
        if kw in text:
            return 5
    return 3


def _age_factor(age: int) -> int:
    """Returns +1 for vulnerable age groups, 0 otherwise."""
    if age < 5 or age >= 65:
        return 1
    return 0


def _compute_score(urgency: int, type_score: int, age_f: int) -> float:
    """Priority = 0.6×urgency + 0.3×type + 0.1×age_factor"""
    return round(0.6 * urgency + 0.3 * type_score + 0.1 * age_f, 2)


def _parse_urgency_from_text(text: str) -> int:
    """Extract urgency_score integer from Gemini response text."""
    # Try JSON parse first
    try:
        data = json.loads(text)
        return max(1, min(10, int(data.get("urgency_score", 5))))
    except (json.JSONDecodeError, ValueError):
        pass

    # Try to find JSON block in text
    json_match = re.search(r'\{[^}]*"urgency_score"\s*:\s*(\d+)[^}]*\}', text)
    if json_match:
        return max(1, min(10, int(json_match.group(1))))

    # Try to find bare number
    num_match = re.search(r'\b(\d{1,2})\b', text)
    if num_match:
        val = int(num_match.group(1))
        if 1 <= val <= 10:
            return val

    return 5  # safe default


# ─────────────────────────────────────
# MAIN ENDPOINT HANDLER
# ─────────────────────────────────────
def calculate_priority(request):
    """
    POST /api/calculate-priority

    Body:
    {
      "chief_complaint": "Severe stomach pain since morning",
      "appointment_type": "new",    // "new" | "follow-up" | "report"
      "age": 72,
      "is_emergency": false
    }

    Returns:
    {
      "priority_score": 7.2,
      "urgency_score": 8,
      "appointment_type_score": 5,
      "age_factor": 1,
      "is_emergency": false
    }
    """
    data = request.get_json(silent=True) or {}

    chief_complaint = str(data.get("chief_complaint", "")).strip()
    appointment_type = str(data.get("appointment_type", "new")).strip().lower()
    age = int(data.get("age", 30))
    is_emergency = bool(data.get("is_emergency", False))

    if not chief_complaint:
        return jsonify({"error": "chief_complaint is required"}), 400

    # ── Emergency override ──
    if is_emergency:
        type_score = TYPE_SCORES.get(appointment_type, 5)
        age_f = _age_factor(age)
        return jsonify({
            "priority_score": 9.0,
            "urgency_score": 10,
            "appointment_type_score": type_score,
            "age_factor": age_f,
            "is_emergency": True,
        }), 200

    # ── Compute sub-scores ──
    type_score = TYPE_SCORES.get(appointment_type, 5)
    age_f = _age_factor(age)

    # ── GenAI urgency classification ──
    api_key = os.getenv("GEMINI_API_KEY")
    urgency = None

    if api_key:
        try:
            client = genai.Client(api_key=api_key)

            prompt = (
                "You are a medical triage assistant. "
                "Classify the medical urgency of the following chief complaint on a scale of 1 to 10, "
                "where 1 is not urgent at all and 10 is life-threatening emergency.\n\n"
                f"Chief complaint: \"{chief_complaint}\"\n\n"
                "Return ONLY a JSON object with a single key \"urgency_score\" and an integer value. "
                "Example: {\"urgency_score\": 7}\n"
                "Do not include any other text."
            )

            max_retries = 2
            for attempt in range(max_retries):
                try:
                    response = client.models.generate_content(
                        model="gemini-2.0-flash",
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            temperature=0.1,
                            max_output_tokens=50,
                        ),
                    )
                    response_text = (response.text or "").strip()
                    urgency = _parse_urgency_from_text(response_text)
                    break

                except Exception as e:
                    is_rate_limit = (
                        isinstance(e, exceptions.ResourceExhausted)
                        or "RESOURCE_EXHAUSTED" in str(e)
                        or "429" in str(e)
                    )
                    if is_rate_limit:
                        break  # fall through to fallback
                    if attempt < max_retries - 1:
                        time.sleep(1)
                        continue

        except Exception:
            pass  # fall through to fallback

    # ── Fallback if GenAI failed ──
    if urgency is None:
        urgency = _fallback_urgency(chief_complaint)

    score = _compute_score(urgency, type_score, age_f)

    return jsonify({
        "priority_score": score,
        "urgency_score": urgency,
        "appointment_type_score": type_score,
        "age_factor": age_f,
        "is_emergency": False,
    }), 200
