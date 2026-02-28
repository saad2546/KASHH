from flask import Blueprint, request, jsonify
import re
import datetime
from bson import ObjectId
from db import medicines, prescriptions, queue as queue_db
from middleware.auth import verify_token
from services.ai_service import validate_prescription_safety

medirx_bp = Blueprint('medirx', __name__)

def serialize_doc(doc):
    if not doc: return doc
    if '_id' in doc and not isinstance(doc['_id'], str): doc['_id'] = str(doc['_id'])
    if 'createdAt' in doc and hasattr(doc['createdAt'], 'isoformat'): doc['createdAt'] = doc['createdAt'].isoformat()
    if 'updatedAt' in doc and hasattr(doc['updatedAt'], 'isoformat'): doc['updatedAt'] = doc['updatedAt'].isoformat()
    return doc

# --- AI ROUTES ---
@medirx_bp.route("/ai/analyze-symptoms", methods=["POST"])
@verify_token
def analyze_symptoms():
    data = request.json
    patient_data = data.get('patientData', {})
    meds = data.get('medicines', [])
    diagnosis = data.get('diagnosis', '')
    
    report = validate_prescription_safety(patient_data, meds, diagnosis)
    return jsonify({"safetyReport": report})

# --- MEDICINE ROUTES ---
@medirx_bp.route("/medicines", methods=["GET"])
@verify_token
def search_medicines():
    query = request.args.get('search', '').strip()
    limit = min(int(request.args.get('limit', 15)), 25)
    category = request.args.get('category', '')
    
    if len(query) < 2:
        return jsonify({"medicines": [], "total": 0, "cached": False})
        
    try:
        results = []
        for m in medicines:
            if query.lower() in m.get('name', '').lower() or query.lower() in m.get('category', '').lower() or query.lower() in m.get('indication', '').lower():
                if category and m.get('category', '').lower() != category.lower():
                    continue
                results.append(m)
                if len(results) >= limit:
                    break
            
        return jsonify({"medicines": [serialize_doc(dict(m)) for m in results], "total": len(results), "cached": False})
    except Exception as e:
        return jsonify({"medicines": [], "total": 0, "error": str(e)})

# --- PRESCRIPTION ROUTES ---
@medirx_bp.route("/prescriptions", methods=["POST"])
@verify_token
def create_prescription():
    data = request.json
    doctor_uid = request.doctor['uid']
    
    if not data.get('patientId') or not data.get('diagnosis') or not data.get('medicines'):
        return jsonify({"error": "Validation Error", "message": "Missing required fields"}), 400
        
    ts = str(int(datetime.datetime.now().timestamp() * 1000))[-6:]
    prescription_num = f"RX-{ts}"
    
    doc = {
        "doctorId": doctor_uid,
        "doctorName": request.doctor.get('name'),
        "doctorSpecialization": data.get('doctorSpecialization', ''),
        "patientId": data.get('patientId'),
        "patientName": data.get('patientName'),
        "patientAge": data.get('patientAge'),
        "patientGender": data.get('patientGender'),
        "patientPhone": data.get('patientPhone'),
        "diagnosis": data.get('diagnosis'),
        "symptoms": data.get('symptoms', []),
        "allergies": data.get('allergies', []),
        "medicines": data.get('medicines', []),
        "notes": data.get('notes', ''),
        "followUpDate": data.get('followUpDate'),
        "safetyReport": data.get('safetyReport'),
        "queueId": data.get('queueId'),
        "prescriptionNumber": prescription_num,
        "status": "active",
        "createdAt": datetime.datetime.utcnow(),
        "updatedAt": datetime.datetime.utcnow()
    }
    
    try:
        import uuid
        doc['_id'] = str(uuid.uuid4())
        
        # Save to in-memory list
        prescriptions.append(doc)
        
        return jsonify({"prescription": serialize_doc(dict(doc))}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@medirx_bp.route("/prescriptions", methods=["GET"])
@verify_token
def list_prescriptions():
    doctor_uid = request.doctor['uid']
    try:
        results = [p for p in prescriptions if p.get("doctorId") == doctor_uid]
        # Sort by createdAt descending
        results.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
        results = results[:50]
        
        return jsonify({
            "prescriptions": [serialize_doc(dict(p)) for p in results],
            "total": len(results),
            "page": 1,
            "pages": 1
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- QUEUE ROUTES (from doctor-page mock) ---
@medirx_bp.route("/queue/today", methods=["GET"])
@verify_token
def get_today_queue():
    doctor_uid = request.doctor['uid']
    doctor_name = request.args.get('name')
    from services.queue import doctor_queues
    
    # Get patients by UID
    patients_by_uid = doctor_queues.get(doctor_uid, [])
    
    # Get patients by Name if provided (Admin might use name as doctor_id)
    patients_by_name = []
    if doctor_name:
        patients_by_name = doctor_queues.get(doctor_name, [])
        
    # Merge and deduplicate by token_number or id
    all_patients_dict = {p.get('token_number') or p.get('id'): p for p in (patients_by_uid + patients_by_name)}
    all_patients = sorted(all_patients_dict.values(), key=lambda x: x.get('priority_score', 0), reverse=True)
    
    stats = {
        "total": len(all_patients),
        "waiting": len([p for p in all_patients if p.get('status') in ['waiting', 'scheduled', 'pending']]),
        "completed": len([p for p in all_patients if p.get('status') == 'completed'])
    }
    
    return jsonify({
        "queue": all_patients,
        "stats": stats
    })

@medirx_bp.route("/queue/complete/<id>", methods=["POST"])
@verify_token
def complete_queue_item(id):
    try:
        doctor_uid = request.doctor['uid']
        from services.queue import doctor_queues
        from socket_ext import socketio
        from datetime import datetime
        
        queue_data = doctor_queues.get(doctor_uid, [])
        found = False
        
        # We need to find the patient by token_number or string id since they don't have MongoDB ObjectIds
        for p in queue_data:
            if str(p.get('token_number')) == str(id) or str(p.get('id', '')) == str(id):
                p['status'] = 'completed'
                p['completedAt'] = datetime.utcnow().isoformat()
                found = True
                break
                
        if not found:
            return jsonify({"error": "Queue item not found"}), 404
            
        # Prepare response
        waiting_patients = [p for p in queue_data if p.get('status') == 'waiting']
        next_patient = waiting_patients[0] if waiting_patients else None
        
        stats = {
            "total": len(queue_data),
            "waiting": len(waiting_patients),
            "completed": len([p for p in queue_data if p.get('status') == 'completed'])
        }
        
        # Broadcast updated queue
        socketio.emit('queue_updated', {'doctor_id': doctor_uid, 'queue': queue_data, 'stats': stats})
        socketio.emit('all_queues_updated', {'timestamp': datetime.utcnow().isoformat()})
        
        return jsonify({
            "message": "Successfully marked as completed",
            "next": next_patient,
            "stats": stats
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
