from flask import Blueprint, request, jsonify
from datetime import datetime

# In-memory queue storage (replace with database if you have one)
doctor_queues = {}   # { doctor_id: [ {patient_data}, ... ] }
token_counter = {}   # { doctor_id: int }

def add_patient_to_queue(request_obj):
    try:
        data = request_obj.get_json()

        if not data:
            return jsonify({'error': 'No JSON data received'}), 400

        # Use .get() with defaults for robustness
        doctor_id = str(data.get('doctor_id', ''))

        if not doctor_id:
            return jsonify({'error': 'doctor_id is required'}), 400

        # Initialize queue for this doctor if needed
        if doctor_id not in doctor_queues:
            doctor_queues[doctor_id] = []
            token_counter[doctor_id] = 0

        # Generate token number
        token_counter[doctor_id] += 1
        token_number = f"T-{token_counter[doctor_id]:03d}"

        # Build patient entry
        patient_entry = {
            'token_number': token_number,
            'patient_uid': data.get('patient_uid', ''),
            'patient_name': data.get('patient_name', 'Patient'),
            'patient_email': data.get('patient_email', ''),
            'doctor_id': doctor_id,
            'doctor_name': data.get('doctor_name', ''),
            'slot': data.get('slot', ''),
            'complaint': data.get('complaint', ''),
            'appointment_type': data.get('appointment_type', 'new'),
            'urgency_score': data.get('urgency_score', 5),
            'is_emergency': data.get('is_emergency', False),
            'age': data.get('age'),
            'priority_score': float(data.get('priority_score', 0)),
            'status': 'waiting',
            'created_at': datetime.utcnow().isoformat(),
        }

        # Insert and sort by priority_score DESCENDING
        doctor_queues[doctor_id].append(patient_entry)
        doctor_queues[doctor_id].sort(
            key=lambda x: x.get('priority_score', 0), reverse=True
        )

        # Find this patient's position
        queue_position = next(
            i + 1 for i, p in enumerate(doctor_queues[doctor_id])
            if p['token_number'] == token_number
        )

        # Estimate wait time (~7 mins per patient ahead)
        estimated_wait = f"~{queue_position * 7} mins"

        return jsonify({
            'token_number': token_number,
            'queue_position': queue_position,
            'estimated_wait': estimated_wait,
        }), 201

    except Exception as e:
        # Log the error and return it as JSON instead of crashing with HTML 500
        print(f"[ERROR] add-patient failed: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Server error: {str(e)}'}), 500

def get_queue(doctor_id):
    """Returns all patients in a doctor's queue, sorted by priority."""
    queue = doctor_queues.get(doctor_id, [])
    return jsonify({
        'doctor_id': doctor_id,
        'queue': queue,
        'total_patients': len(queue)
    }), 200

def get_all_queues():
    """Returns all queues for all doctors."""
    all_queues = []
    for doctor_id, patients in doctor_queues.items():
        for p in patients:
            all_queues.append(p)
    all_queues.sort(key=lambda x: x.get('priority_score', 0), reverse=True)
    return jsonify({
        'queue': all_queues,
        'total_patients': len(all_queues)
    }), 200

def get_doctor_queue(request_obj):
    """Old endpoint, kept for compatibility if needed"""
    doctor_id = request_obj.args.get('doctor_id')
    if not doctor_id:
        return jsonify({'error': 'Missing doctor_id'}), 400
    
    queue = doctor_queues.get(doctor_id, [])
    return jsonify({'queue': queue}), 200
