import requests
import json

url = "http://127.0.0.1:5000/api/queue/add-patient"
payload = {
    "patient_uid": "test123",
    "patient_email": "test@test.com",
    "patient_name": "Test Patient",
    "doctor_id": "1",
    "doctor_name": "Dr. Ayesha Khan",
    "slot": "10:00 AM",
    "complaint": "Headache",
    "appointment_type": "new",
    "urgency_score": 5,
    "is_emergency": False,
    "age": 28,
    "priority_score": 4.5
}
headers = {"Content-Type": "application/json"}

try:
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")
