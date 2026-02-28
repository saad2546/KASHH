from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.prophet import predict_patient_flow
from services.scheduling import optimize_schedule
from services.inventory import generate_inventory_insights
from services.priority import calculate_priority
from services.queue import add_patient_to_queue, get_queue, get_all_queues

load_dotenv()

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:5173",  # For local development
            "https://hellfire-pulseops.vercel.app"  # Your actual Vercel URL
        ]
    }
})

@app.route("/")
def health_check():
    return jsonify({"status": "Backend running"})

@app.route("/api/predict-patient-flow", methods=["POST"])
def predict_patient_flow_controller():
    return predict_patient_flow(request)

@app.route("/api/optimize-schedule", methods=["POST"])
def optimize_schedule_controller():
    return optimize_schedule(request)

@app.route("/api/inventory-insights", methods=["POST"])
def inventory_insights_controller():
    return generate_inventory_insights(request)

@app.route("/api/calculate-priority", methods=["POST"])
def calculate_priority_controller():
    return calculate_priority(request)

@app.route("/api/queue/add-patient", methods=["POST"])
def add_patient_to_queue_controller():
    return add_patient_to_queue(request)

@app.route("/api/queue/get-queue/<doctor_id>", methods=["GET"])
def get_queue_controller(doctor_id):
    return get_queue(doctor_id)

@app.route("/api/queue/get-all-queues", methods=["GET"])
def get_all_queues_controller():
    return get_all_queues()

if __name__ == "__main__":
    app.run(debug=True)
