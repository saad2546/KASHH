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
            'id': data.get('id'), # Use existing Firestore ID if provided
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

        # FIRESTORE PERSISTENCE (for mobile/backend-only bookings)
        hospital_id = data.get('hospital_id')
        if hospital_id and not patient_entry.get('id'):
            try:
                from middleware.auth import initialize_firebase
                initialize_firebase()
                from firebase_admin import firestore
                db_fs = firestore.client()
                doc_ref = db_fs.collection("hospitals").document(hospital_id).collection("surgery_requests").document()
                patient_entry['id'] = doc_ref.id
                doc_ref.set({
                    'patient_name': patient_entry['patient_name'],
                    'surgeon': patient_entry['doctor_name'],
                    'chief_complaint': patient_entry['complaint'],
                    'appointment_type': patient_entry['appointment_type'],
                    'urgency_score': patient_entry['urgency_score'],
                    'priority_score': patient_entry['priority_score'],
                    'is_emergency': patient_entry['is_emergency'],
                    'age': patient_entry['age'],
                    'status': 'scheduled', # Bypass 'pending' approval flow
                    'scheduled_start_time': '09:00',
                    'scheduled_date': datetime.utcnow().strftime('%Y-%m-%d'),
                    'createdAt': firestore.SERVER_TIMESTAMP
                })
                print(f"[QUEUE] Persisted mobile booking to Firestore: {patient_entry['id']}")
            except Exception as fe:
                print(f"[QUEUE] Firestore persistence failed: {fe}")

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

        from socket_ext import socketio
        
        queue_data = doctor_queues[doctor_id]
        
        # Broadcast to anyone listening for this doctor's queue (e.g., DoctorDashboard)
        socketio.emit('queue_updated', {
            'doctor_id': doctor_id, 
            'doctor_name': data.get('doctor_name', ''),
            'queue': queue_data
        })
        # Broadcast to all clients (e.g., Patient displays)
        socketio.emit('all_queues_updated', {'timestamp': datetime.utcnow().isoformat()})

        # TRIGGER AUTO-OPTIMIZATION
        if hospital_id:
            try:
                from services.scheduling import run_optimization
                from middleware.auth import initialize_firebase
                initialize_firebase()
                from firebase_admin import firestore
                db_fs = firestore.client()
                
                # Fetch all scheduled surgeries for today to re-optimize
                today_str = datetime.utcnow().strftime('%Y-%m-%d')
                surgeries_ref = db_fs.collection("hospitals").document(hospital_id).collection("surgery_requests")
                docs = surgeries_ref.where("scheduled_date", "==", today_str).where("status", "==", "scheduled").stream()
                
                surgeries_to_optimize = []
                for doc in docs:
                    d = doc.to_dict()
                    surgeries_to_optimize.append({
                        "id": doc.id,
                        "patient_name": d.get("patient_name") or d.get("patient") or "Unknown",
                        "surgeon": d.get("surgeon") or "Unknown",
                        "scheduled_start_time": d.get("scheduled_start_time") or "09:00",
                        "duration_minutes": d.get("duration_minutes") or 60
                    })
                
                if surgeries_to_optimize:
                    print(f"[QUEUE] Triggering auto-optimization for {len(surgeries_to_optimize)} surgeries")
                    run_optimization(surgeries_to_optimize, hospital_id)
            except Exception as oe:
                print(f"[QUEUE] Auto-optimization trigger failed: {oe}")

        return jsonify({
            'token_number': token_number,
            'queue_position': queue_position,
            'estimated_wait': estimated_wait,
            'id': patient_entry.get('id')
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
