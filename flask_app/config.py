import os
from datetime import timedelta
from dotenv import load_dotenv
load_dotenv()

class Config:
    JWT_SECRET_KEY   = os.getenv('JWT_SECRET_KEY', 'hospital-queue-super-secret-key-2026!')
    MONGO_URI        = os.getenv('MONGO_URI', 'mongodb://localhost:27017/hospital_queue')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
