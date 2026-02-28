from flask import jsonify
from firebase_admin import firestore
import firebase_admin

try:
    from ortools.sat.python import cp_model
    ORTOOLS_AVAILABLE = True
except ImportError:
    ORTOOLS_AVAILABLE = False

# -----------------------------
# CONFIGURATION
# -----------------------------
OR_START_TIME = 9 * 60      # 09:00 in minutes (540)
OR_END_TIME = 20 * 60       # 20:00 in minutes (1200)
NUM_OPERATING_ROOMS = 4

# -----------------------------
# TIME HELPERS
# -----------------------------
def time_to_minutes(time_str: str) -> int:
    hour, minute = map(int, time_str.split(":"))
    return (hour * 60 + minute) - OR_START_TIME


def minutes_to_time(minutes: int) -> str:
    total_minutes = minutes + OR_START_TIME
    hour = total_minutes // 60
    minute = total_minutes % 60
    return f"{hour:02d}:{minute:02d}"

# -----------------------------
# MAIN OPTIMIZER
# -----------------------------
def optimize_schedule(request):
    data = request.get_json(silent=True) or {}
    surgeries = data.get("surgeries", [])
    hospital_id = data.get("hospital_id")
    
    results, error = run_optimization(surgeries, hospital_id)
    if error:
        return jsonify({"error": error}), 400
        
    return jsonify({"optimized_schedule": results})

def run_optimization(surgeries, hospital_id):
    if not surgeries:
        return [], "No surgeries provided"

    # Validate input schema
    required_fields = ["id", "patient_name", "surgeon", "scheduled_start_time"]
    for s in surgeries:
        for field in required_fields:
            if field not in s:
                return [], f"Missing field '{field}' in surgery"

    results = []
    if not ORTOOLS_AVAILABLE:
        # Fallback to returning the original schedule
        for s in surgeries:
            results.append({
                "id": s["id"],
                "patient": s["patient_name"],
                "surgeon": s["surgeon"],
                "original_start": s["scheduled_start_time"],
                "optimized_start": s["scheduled_start_time"],
                "room": 1
            })
    else:
        model = cp_model.CpModel()
        horizon = OR_END_TIME - OR_START_TIME 
        intervals_per_room = [[] for _ in range(NUM_OPERATING_ROOMS)]
        intervals_per_surgeon = {}
        output_data = {}

        for s in surgeries:
            sid = s["id"]
            duration = int(s.get("duration_minutes", 60))
            surgeon = s["surgeon"]
            requested_start = time_to_minutes(s["scheduled_start_time"])
            latest_start = horizon - duration
            
            if latest_start < 0: continue

            start_v = model.NewIntVar(0, latest_start, f"start_{sid}")
            end_v = model.NewIntVar(duration, horizon, f"end_{sid}")
            room_v = model.NewIntVar(0, NUM_OPERATING_ROOMS - 1, f"room_{sid}")

            output_data[sid] = {"start": start_v, "room": room_v, "requested": requested_start}

            if surgeon not in intervals_per_surgeon:
                intervals_per_surgeon[surgeon] = []

            for r in range(NUM_OPERATING_ROOMS):
                is_in_room = model.NewBoolVar(f"{sid}_in_room_{r}")
                model.Add(room_v == r).OnlyEnforceIf(is_in_room)
                model.Add(room_v != r).OnlyEnforceIf(is_in_room.Not())

                opt_interval = model.NewOptionalIntervalVar(start_v, duration, end_v, is_in_room, f"interval_{sid}_room_{r}")
                intervals_per_room[r].append(opt_interval)
                intervals_per_surgeon[surgeon].append(opt_interval)

        for r in range(NUM_OPERATING_ROOMS):
            model.AddNoOverlap(intervals_per_room[r])
        for surgeon_intervals in intervals_per_surgeon.values():
            model.AddNoOverlap(surgeon_intervals)

        deviations = []
        for sid, d_info in output_data.items():
            diff = model.NewIntVar(0, horizon, f"diff_{sid}")
            model.AddAbsEquality(diff, d_info["start"] - d_info["requested"])
            deviations.append(diff)
        model.Minimize(sum(deviations))

        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = 5
        status = solver.Solve(model)

        if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            for s in surgeries:
                sid = s["id"]
                if sid in output_data:
                    results.append({
                        "id": sid,
                        "patient": s["patient_name"],
                        "surgeon": s["surgeon"],
                        "original_start": s["scheduled_start_time"],
                        "optimized_start": minutes_to_time(solver.Value(output_data[sid]["start"])),
                        "room": solver.Value(output_data[sid]["room"]) + 1
                    })
        else:
            # Fallback if solver fails
            for s in surgeries:
                results.append({
                    "id": s["id"],
                    "patient": s["patient_name"],
                    "surgeon": s["surgeon"],
                    "original_start": s["scheduled_start_time"],
                    "optimized_start": s["scheduled_start_time"],
                    "room": 1
                })

    # PERSIST TO FIRESTORE
    if hospital_id and results:
        try:
            from middleware.auth import initialize_firebase
            initialize_firebase()
            db_fs = firestore.client()
            batch = db_fs.batch()
            for r in results:
                doc_ref = db_fs.collection("hospitals").document(hospital_id).collection("surgery_requests").document(r["id"])
                batch.update(doc_ref, {
                    "scheduled_start_time": r["optimized_start"],
                    "room_number": r["room"],
                    "status": "scheduled" # Change from pending to scheduled
                })
            batch.commit()
            print(f"[OPTIMIZER] Successfully persisted {len(results)} items to Firestore")
        except Exception as e:
            print(f"[OPTIMIZER] Firestore persistence failed: {e}")

    # TRIGGER SOCKET BROADCAST
    try:
        from socket_ext import socketio
        from datetime import datetime
        socketio.emit('all_queues_updated', {'timestamp': datetime.utcnow().isoformat()})
        # If possible, emit specifically for surgeons involved
        surgeons = set([r["surgeon"] for r in results])
        for s_name in surgeons:
            socketio.emit('queue_updated', {'doctor_name': s_name})
    except Exception as e:
        print(f"[OPTIMIZER] Socket broadcast failed: {e}")

    return results, None