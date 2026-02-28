from ortools.sat.python import cp_model
from flask import jsonify

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

    if not surgeries:
        return jsonify({"error": "No surgeries provided"}), 400

    # Validate input schema
    # NOTE: duration_minutes is intentionally excluded — duration is hardcoded
    # to 60 minutes internally. Sending it from the frontend is optional.
    required_fields = [
        "id",
        "patient_name",
        "surgeon",
        "scheduled_start_time",
    ]

    for s in surgeries:
        for field in required_fields:
            if field not in s:
                return jsonify({
                    "error": f"Missing field '{field}' in surgery: {s}"
                }), 400

    model = cp_model.CpModel()

    horizon = OR_END_TIME - OR_START_TIME  # 660 minutes
    intervals_per_room = [[] for _ in range(NUM_OPERATING_ROOMS)]
    intervals_per_surgeon = {}
    output_data = {}

    # -----------------------------
    # CREATE VARIABLES
    # -----------------------------
    for s in surgeries:
        sid = s["id"]
        # Use duration_minutes from payload if provided, otherwise default to 60
        duration = int(s.get("duration_minutes", 60))
        surgeon = s["surgeon"]

        requested_start = time_to_minutes(s["scheduled_start_time"])

        latest_start = horizon - duration
        if latest_start < 0:
            return jsonify({
                "error": f"Surgery {sid} duration exceeds operating window"
            }), 400

        start_v = model.NewIntVar(0, latest_start, f"start_{sid}")
        end_v = model.NewIntVar(duration, horizon, f"end_{sid}")
        room_v = model.NewIntVar(0, NUM_OPERATING_ROOMS - 1, f"room_{sid}")

        output_data[sid] = {
            "start": start_v,
            "room": room_v,
            "requested": requested_start
        }

        if surgeon not in intervals_per_surgeon:
            intervals_per_surgeon[surgeon] = []

        # -----------------------------
        # ROOM ASSIGNMENT (OPTIONAL INTERVALS)
        # -----------------------------
        for r in range(NUM_OPERATING_ROOMS):
            is_in_room = model.NewBoolVar(f"{sid}_in_room_{r}")

            model.Add(room_v == r).OnlyEnforceIf(is_in_room)
            model.Add(room_v != r).OnlyEnforceIf(is_in_room.Not())

            opt_interval = model.NewOptionalIntervalVar(
                start_v,
                duration,
                end_v,
                is_in_room,
                f"interval_{sid}_room_{r}"
            )

            intervals_per_room[r].append(opt_interval)
            intervals_per_surgeon[surgeon].append(opt_interval)

    # -----------------------------
    # CONSTRAINTS
    # -----------------------------
    for r in range(NUM_OPERATING_ROOMS):
        model.AddNoOverlap(intervals_per_room[r])

    for surgeon_intervals in intervals_per_surgeon.values():
        model.AddNoOverlap(surgeon_intervals)

    # -----------------------------
    # OBJECTIVE: Minimize deviation
    # -----------------------------
    deviations = []
    for sid, data in output_data.items():
        diff = model.NewIntVar(0, horizon, f"diff_{sid}")
        model.AddAbsEquality(diff, data["start"] - data["requested"])
        deviations.append(diff)

    model.Minimize(sum(deviations))

    # -----------------------------
    # SOLVE
    # -----------------------------
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 5
    status = solver.Solve(model)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return jsonify({"error": "No feasible schedule found"}), 400

    # -----------------------------
    # OUTPUT
    # -----------------------------
    results = []
    for s in surgeries:
        sid = s["id"]
        results.append({
            "patient": s["patient_name"],
            "surgeon": s["surgeon"],
            "original_start": s["scheduled_start_time"],
            "optimized_start": minutes_to_time(
                solver.Value(output_data[sid]["start"])
            ),
            "room": solver.Value(output_data[sid]["room"]) + 1
        })

    return jsonify({"optimized_schedule": results})