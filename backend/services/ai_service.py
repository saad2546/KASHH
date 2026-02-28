import os
import json
import logging
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

# --- Anonymizer Logic ---
def age_to_range(age):
    if not age: return 'unknown'
    try:
        n = int(age)
        lower = (n // 10) * 10
        return f"{lower}-{lower + 10}"
    except ValueError:
        return 'unknown'

def anonymize_for_ai(patient_data, medicines):
    import random
    import string
    
    session_token = "P_" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    
    age_range = age_to_range(patient_data.get('age', patient_data.get('patientAge')))
    
    symptoms = [str(s).strip() for s in patient_data.get('symptoms', []) if s][:20]
    allergies = [str(a).strip() for a in patient_data.get('allergies', []) if a][:20]
    diagnosis = str(patient_data.get('diagnosis', ''))[:500]
    conditions = [str(c).strip() for c in patient_data.get('conditions', []) if c][:10]
    
    clean_medicines = []
    for m in (medicines or []):
        clean_medicines.append({
            'name': str(m.get('name', '')).strip()[:100],
            'strength': str(m.get('strength', m.get('dosage', ''))).strip()[:50],
            'frequency': str(m.get('frequency', '')).strip()[:100],
            'duration': str(m.get('duration', '')).strip()[:50],
            'route': str(m.get('route', 'oral')).strip()[:50]
        })
        
    return {
        'patientRef': session_token,
        'ageRange': age_range,
        'gender': patient_data.get('gender', patient_data.get('patientGender', 'unspecified')),
        'symptoms': symptoms,
        'allergies': allergies,
        'diagnosis': diagnosis,
        'conditions': conditions,
        'medicines': clean_medicines
    }

# --- Gemini API Logic ---
client = None

def init_gemini():
    global client
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        logger.warning('[GEMINI] API key not set')
        return False
    client = genai.Client(api_key=api_key)
    return True

def fallback_response(reason):
    return {
        "overallRisk": "medium",
        "color": "yellow",
        "stopAlert": None,
        "summary": "Automated safety analysis unavailable. Please perform manual interaction check.",
        "findings": [{
            "type": "system",
            "severity": "medium",
            "drugA": "System",
            "drugB": "AI Check",
            "mechanism": "Service unavailable",
            "description": f"AI safety check failed: {reason}. Perform manual review.",
            "recommendation": "Consult NLM DailyMed or a clinical pharmacist."
        }],
        "alternatives": [],
        "sources": [{"name": "NLM DailyMed", "reference": "Manual lookup", "url": "https://dailymed.nlm.nih.gov"}],
        "clearedMedicines": [],
        "checkedAt": "Unavailable",
        "aiUnavailable": True
    }

def validate_prescription_safety(patient_data, medicines, diagnosis):
    global client
    if not client and not init_gemini():
        return fallback_response("Gemini API not configured")
        
    anon_data = anonymize_for_ai(patient_data, medicines)
    anon_data['diagnosis'] = diagnosis

    med_lines = "\n".join([f"  - {m['name']} {m['strength']} | {m['frequency']} | {m['duration']} | {m['route']}" for m in anon_data['medicines']])
    
    prompt = f"""You are a clinical pharmacology AI integrated into a hospital prescription system...
    === ANONYMISED PATIENT CONTEXT ===
    Age Range: {anon_data['ageRange']}
    Gender: {anon_data['gender']}
    Allergies: {', '.join(anon_data['allergies']) if anon_data['allergies'] else 'None reported'}
    Known Conditions: {', '.join(anon_data['conditions']) if anon_data['conditions'] else 'None'}
    Diagnosis: {anon_data['diagnosis']}
    Symptoms: {', '.join(anon_data['symptoms'])}

    === MEDICINES TO VALIDATE ===
    {med_lines}

    === YOUR TASK ===
    Check for: 1. Drug interactions. 2. Drug-allergy reactions. 3. Age safety. 4. Conditions safety.
    RESPOND ONLY WITH JSON matching this exactly:
    {{
      "overallRisk": "low|medium|high|fatal",
      "summary": "2-3 sentences max",
      "findings": [{{ "type": "interaction", "severity": "...", "drugA": "...", "drugB": "...", "mechanism": "...", "description": "...", "recommendation": "..." }}]
    }}
    """
    
    try:
        response = client.models.generate_content(
            model=os.environ.get('GEMINI_MODEL', 'gemini-1.5-flash'),
            contents=prompt,
        )
        
        text = response.text
        import re
        text = re.sub(r'```(?:json)?', '', text).strip()
        
        match = re.search(r'\{[\s\S]*\}', text)
        if not match:
            return fallback_response("No JSON found in response")
            
        data = json.parse(match.group(0))
        return {
            "overallRisk": data.get("overallRisk", "medium"),
            "summary": data.get("summary", "Done."),
            "findings": data.get("findings", []),
            "checkedAt": "Now"
        }
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        return fallback_response(str(e))
