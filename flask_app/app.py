from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials
from config import Config
import os
import json

jwt    = JWTManager()
bcrypt = Bcrypt()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    jwt.init_app(app)
    bcrypt.init_app(app)
    CORS(app)

    # JWT error handlers — print debug info and return proper JSON
    @jwt.invalid_token_loader
    def invalid_token_callback(error_string):
        print(f"[JWT ERROR] invalid_token: {error_string}")
        return jsonify({'error': f'Invalid token: {error_string}'}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error_string):
        print(f"[JWT ERROR] unauthorized: {error_string}")
        return jsonify({'error': f'Missing token: {error_string}'}), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        print(f"[JWT ERROR] expired_token")
        return jsonify({'error': 'Token has expired'}), 401

    # Initialize Firebase Admin SDK if key exists
    if os.path.exists('serviceAccountKey.json'):
        cred = credentials.Certificate('serviceAccountKey.json')
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
    else:
        print("WARNING: serviceAccountKey.json not found! Firebase Admin SDK is NOT initialized.")

    # Register route blueprints
    from routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    from routes.booking import booking_bp
    app.register_blueprint(booking_bp, url_prefix='/api/booking')

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
