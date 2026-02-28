from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
import re

booking_bp = Blueprint('booking', __name__)

# ─────────────────────────────────────────────
# 🧠 URGENCY CLASSIFICATION (Rule-based GenAI fallback)
# ─────────────────────────────────────────────

# High-urgency keywords scored 8-10
HIGH_URGENCY_KEYWORDS = [
    'chest pain', 'heart attack', 'stroke', 'unconscious', 'seizure',
    'bleeding heavily', 'severe bleeding', 'not breathing', 'choking',
    'anaphylaxis', 'allergic reaction severe', 'severe burn', 'poisoning',
    'overdose', 'collapse', 'fainted', 'paralysis', 'head injury',
    'accident', 'fracture open', 'severe trauma'
]

# Medium-urgency keywords scored 5-7
MEDIUM_URGENCY_KEYWORDS = [
    'high fever', 'fever', 'vomiting', 'diarrhea', 'severe pain',
    'stomach pain', 'abdominal pain', 'migraine', 'difficulty breathing',
    'shortness of breath', 'infection', 'swelling', 'sprain', 'fracture',
    'blood in', 'rash severe', 'dehydration', 'chest discomfort',
    'dizziness', 'fainting', 'numbness', 'weakness sudden'
]

# Low-urgency keywords scored 2-4
LOW_URGENCY_KEYWORDS = [
    'cold', 'cough', 'flu', 'runny nose', 'sore throat', 'headache',
    'back pain', 'joint pain', 'skin rash', 'acne', 'dental',
    'checkup', 'routine', 'follow up', 'vaccination', 'report',
    'prescription refill', 'mild pain', 'itching', 'insomnia',
    'fatigue', 'stress', 'anxiety'
]


def classify_urgency_rule_based(complaint):
    text = complaint.lower().strip()
    for kw in HIGH_URGENCY_KEYWORDS:
        if kw in text:
            return 9
    for kw in MEDIUM_URGENCY_KEYWORDS:
        if kw in text:
            return 6
    for kw in LOW_URGENCY_KEYWORDS:
        if kw in text:
            return 3
    return 5


def try_genai_classification(complaint):
    import os
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        return classify_urgency_rule_based(complaint)
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash')
        prompt = f"""You are a medical triage assistant. Classify the medical urgency from 1 to 10 based on the chief complaint.
1 = routine/non-urgent, 10 = life-threatening emergency.
Respond with ONLY a JSON object: {{"urgency_score": <number>}}

Chief complaint: {complaint}"""
        response = model.generate_content(prompt)
        text = response.text.strip()
        import json
        if '{' in text:
            json_str = text[text.index('{'):text.rindex('}') + 1]
            result = json.loads(json_str)
            score = int(result.get('urgency_score', 5))
            return max(1, min(10, score))
        numbers = re.findall(r'\d+', text)
        if numbers:
            score = int(numbers[0])
            return max(1, min(10, score))
        return classify_urgency_rule_based(complaint)
    except Exception as e:
        print(f"GenAI classification failed: {e}, using rule-based fallback")
        return classify_urgency_rule_based(complaint)


# ─────────────────────────────────────────────
# 📊 PRIORITY CALCULATION
# ─────────────────────────────────────────────

APPOINTMENT_TYPE_SCORES = {
    'new': 5,
    'followup': 3,
    'report': 2
}


def calculate_priority(urgency_score, appointment_type, age):
    type_score = APPOINTMENT_TYPE_SCORES.get(appointment_type, 3)
    age_factor = 10 if (age and (age < 5 or age > 65)) else 0
    priority = (0.6 * urgency_score) + (0.3 * type_score) + (0.1 * age_factor)
    return round(priority, 2)


# ─────────────────────────────────────────────
# 🔬 API — Classify Urgency
# ─────────────────────────────────────────────

@booking_bp.route('/classify-urgency', methods=['POST'])
@jwt_required()
def classify_urgency():
    data = request.get_json()
    complaint = data.get('complaint', '')
    if not complaint.strip():
        return jsonify({'error': 'Chief complaint is required'}), 400
    urgency_score = try_genai_classification(complaint)
    return jsonify({
        'urgency_score': urgency_score,
        'method': 'genai' if __import__('os').getenv('GEMINI_API_KEY') else 'rule_based'
    }), 200


# ─────────────────────────────────────────────
# 📅 API — Book Appointment
# ─────────────────────────────────────────────

@booking_bp.route('/book-appointment', methods=['POST'])
@jwt_required()
def book_appointment():
    data = request.get_json()

    # Identity is now uid string; claims contain email/role
    uid = get_jwt_identity()
    claims = get_jwt()

    required = ['doctor_id', 'doctor_name', 'slot', 'complaint',
                'appointment_type', 'urgency_score']
    for field in required:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400

    priority_score = calculate_priority(
        urgency_score=data['urgency_score'],
        appointment_type=data['appointment_type'],
        age=data.get('age')
    )

    booking_payload = {
        'patient_uid': uid,
        'patient_email': claims.get('email'),
        'patient_name': data.get('patient_name', 'Patient'),
        'doctor_id': data['doctor_id'],
        'doctor_name': data['doctor_name'],
        'slot': data['slot'],
        'complaint': data['complaint'],
        'appointment_type': data['appointment_type'],
        'urgency_score': data['urgency_score'],
        'is_emergency': data.get('is_emergency', False),
        'age': data.get('age'),
        'priority_score': priority_score,
    }

    # Forward to website backend (configurable URL)
    import os
    website_backend_url = os.getenv('WEBSITE_BACKEND_URL', 'http://10.146.128.182:5000')
    forward_url = f'{website_backend_url}/api/queue/add-patient'
    print(f"[FORWARD] Sending booking to: {forward_url}")
    print(f"[FORWARD] Payload: {booking_payload}")

    try:
        import requests
        resp = requests.post(
            forward_url,
            json=booking_payload,
            timeout=10
        )

        print(f"[FORWARD] Response status: {resp.status_code}")
        print(f"[FORWARD] Response body: {resp.text}")

        if resp.status_code in [200, 201]:
            result = resp.json()
            return jsonify({
                'success': True,
                'priority_score': priority_score,
                'token_number': result.get('token_number', 'N/A'),
                'queue_position': result.get('queue_position', 'N/A'),
                'estimated_wait': result.get('estimated_wait', 'N/A'),
                'booking': booking_payload
            }), 201
        else:
            print(f"[FORWARD] FAILED with status {resp.status_code}: {resp.text}")
            return jsonify({
                'success': True,
                'priority_score': priority_score,
                'token_number': 'PENDING',
                'queue_position': 'Sync pending',
                'estimated_wait': 'Calculating...',
                'booking': booking_payload,
                'warning': f'Website backend returned {resp.status_code}: {resp.text}'
            }), 201

    except Exception as e:
        print(f"[FORWARD] EXCEPTION: {type(e).__name__}: {e}")
        return jsonify({
            'success': True,
            'priority_score': priority_score,
            'token_number': 'PENDING',
            'queue_position': 'Sync pending',
            'estimated_wait': 'Calculating...',
            'booking': booking_payload,
            'warning': f'Website backend unreachable: {str(e)}'
        }), 201
