from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

def patient_required(fn):
    """Protect routes that only patients can access."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        identity = get_jwt_identity()
        if identity.get('role') != 'patient':
            return jsonify({'error': 'Patient access only'}), 403
        return fn(*args, **kwargs)
    return wrapper

def doctor_required(fn):
    """Protect routes that only doctors can access."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        identity = get_jwt_identity()
        if identity.get('role') != 'doctor':
            return jsonify({'error': 'Doctor access only'}), 403
        return fn(*args, **kwargs)
    return wrapper

def admin_required(fn):
    """Protect routes that only admins can access."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        identity = get_jwt_identity()
        if identity.get('role') != 'admin':
            return jsonify({'error': 'Admin access only'}), 403
        return fn(*args, **kwargs)
    return wrapper
