from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from flask_bcrypt import Bcrypt
from firebase_admin import auth as firebase_auth
from pymongo import MongoClient
from datetime import datetime
import os
import json

auth_bp = Blueprint('auth', __name__)
bcrypt  = Bcrypt()
client  = MongoClient(os.getenv('MONGO_URI', 'mongodb://localhost:27017/hospital_queue'))
db      = client['hospital_queue']


# ─────────────────────────────────────────────
# 📱 MOBILE — Verify Firebase Token
# ─────────────────────────────────────────────

@auth_bp.route('/verify-token', methods=['POST'])
def verify_firebase_token():
    """
    Receives Firebase ID Token from mobile.
    Verifies it using Firebase Admin SDK.
    Returns a Flask JWT.
    """
    import time

    data     = request.get_json()
    id_token = data.get('token')

    if not id_token:
        return jsonify({'error': 'No token provided'}), 400

    # Retry up to 3 times to handle clock skew between phone and server
    last_error = None
    for attempt in range(3):
        try:
            decoded = firebase_auth.verify_id_token(id_token, check_revoked=False)
            uid     = decoded['uid']
            email   = decoded.get('email')
            print(f"[OK] Token verified on attempt {attempt + 1}: uid={uid}")

            access_token = create_access_token(
                identity=uid,
                additional_claims={
                    'email': email,
                    'role': 'patient'
                }
            )

            return jsonify({
                'access_token': access_token,
                'role':         'patient',
                'uid':          uid
            }), 200

        except Exception as e:
            last_error = e
            error_msg = str(e)
            if 'Token used too early' in error_msg or 'too early' in error_msg.lower():
                print(f"[RETRY] Clock skew detected, attempt {attempt + 1}/3, waiting 2s...")
                time.sleep(2)
                continue
            else:
                print(f"[FAIL] Token verification error: {type(e).__name__}: {e}")
                return jsonify({'error': f'Token verification failed: {error_msg}'}), 401

    # All retries exhausted
    print(f"[FAIL] All retries exhausted: {last_error}")
    return jsonify({'error': f'Token verification failed after retries: {str(last_error)}'}), 401


# ─────────────────────────────────────────────
# 🖥️ WEB — Doctor / Admin Register
# ─────────────────────────────────────────────

@auth_bp.route('/web/register', methods=['POST'])
def web_register():
    data = request.get_json()
    required = ['full_name', 'email', 'password', 'role', 'department']

    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    if data['role'] not in ['doctor', 'admin']:
        return jsonify({'error': 'Invalid role. Must be doctor or admin'}), 400

    if db.users.find_one({'email': data['email']}):
        return jsonify({'error': 'Email already registered'}), 409

    hashed_pw = bcrypt.generate_password_hash(data['password']).decode('utf-8')

    user = {
        'full_name':  data['full_name'],
        'email':      data['email'],
        'password':   hashed_pw,
        'role':       data['role'],
        'department': data['department'],
        'created_at': datetime.utcnow()
    }
    db.users.insert_one(user)

    return jsonify({'message': f'{data["role"].capitalize()} registered successfully'}), 201


# ─────────────────────────────────────────────
# 🖥️ WEB — Doctor / Admin Login
# ─────────────────────────────────────────────

@auth_bp.route('/web/login', methods=['POST'])
def web_login():
    data = request.get_json()

    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password required'}), 400

    user = db.users.find_one({'email': data['email']})

    if not user:
        return jsonify({'error': 'No account found with this email'}), 404

    if not bcrypt.check_password_hash(user['password'], data['password']):
        return jsonify({'error': 'Incorrect password'}), 401

    access_token = create_access_token(identity={
        'user_id':    str(user['_id']),
        'email':      user['email'],
        'role':       user['role'],
        'department': user.get('department', '')
    })

    return jsonify({
        'access_token': access_token,
        'role':         user['role'],
        'full_name':    user['full_name']
    }), 200


# ─────────────────────────────────────────────
# 🔍 GET — Current User Profile
# ─────────────────────────────────────────────

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    identity = get_jwt_identity()
    return jsonify({'user': identity}), 200
