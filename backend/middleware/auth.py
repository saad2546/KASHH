import os
import json
from functools import wraps
from flask import request, jsonify
from firebase_admin import auth, initialize_app, credentials
import firebase_admin

def initialize_firebase():
    if not firebase_admin._apps:
        service_account_env = os.environ.get('FIREBASE_SERVICE_ACCOUNT')
        if service_account_env:
            try:
                cert_dict = json.loads(service_account_env)
                cred = credentials.Certificate(cert_dict)
                initialize_app(cred)
                print("[AUTH] Firebase initialized from env")
            except Exception as e:
                print(f"[AUTH] Failed to initialize Firebase from env: {e}")
        else:
            try:
                cred = credentials.Certificate("firebase-key.json")
                initialize_app(cred)
                print("[AUTH] Firebase initialized from local key")
            except:
                print("[AUTH] Firebase not configured")

initialize_firebase()

def verify_token(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Unauthorized', 'message': 'No authorization token provided'}), 401
        
        token = auth_header.split('Bearer ')[1]
        
        # Dev bypass (matches Node.js logic)
        if os.environ.get('FLASK_ENV') != 'production' and not os.environ.get('FIREBASE_SERVICE_ACCOUNT'):
            request.doctor = {
                'uid': 'dev-doctor-001',
                'email': 'dev@medirx.local',
                'name': 'Dev Doctor',
                'role': 'doctor'
            }
            return f(*args, **kwargs)
            
        try:
            decoded = auth.verify_id_token(token)
            request.doctor = {
                'uid': decoded.get('uid'),
                'email': decoded.get('email'),
                'name': decoded.get('name', decoded.get('email')),
                'role': decoded.get('role', 'doctor')
            }
            return f(*args, **kwargs)
        except Exception as e:
            print(f"[AUTH] Token verification failed: {e}")
            return jsonify({'error': 'Unauthorized', 'message': 'Session expired or invalid token'}), 401
            
    return decorated_function
