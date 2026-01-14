from flask import Flask, jsonify, request
from flask_cors import CORS
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.prophet import predict_patient_flow
from services.scheduling import optimize_schedule

app = Flask(__name__)
CORS(app)  # allow frontend access

@app.route("/")
def health_check():
    return jsonify({"status": "Backend running"})

@app.route("/api/predict-patient-flow", methods=["POST"])
def predict_patient_flow_controller():
    return predict_patient_flow(request)

@app.route("/api/optimize-schedule", methods=["POST"])
def optimize_schedule_controller():
    return optimize_schedule(request)

if __name__ == "__main__":
    app.run(debug=True)
