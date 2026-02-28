# 🏥 Hospital Queue — Smart Appointment System

A full-stack mobile + web system for hospital queue management with AI-powered priority scheduling. Patients book appointments through a mobile app, their urgency is classified using GenAI, and they're dynamically inserted into a priority-based queue visible on the web dashboard.

---

## 📱 Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────────┐
│   Mobile App    │────▶│  Flask Backend   │────▶│  Website Backend     │
│  (React Native) │     │  (Auth + Booking)│     │  (Queue Management)  │
│   Expo Go       │     │  Port 5000       │     │  Port 5000           │
└─────────────────┘     └──────────────────┘     └──────────────────────┘
        │                       │                          │
    Firebase Auth        Firebase Admin SDK          WebSocket / REST
    (Client SDK)         JWT Authentication          Queue Display
```

---

## 📂 Project Structure

```
MobileApp/
├── PatientApp/                  # React Native (Expo) Mobile App
│   ├── App.js                   # Entry point
│   ├── package.json
│   └── src/
│       ├── navigation/
│       │   └── AppNavigator.js  # Tab + Stack navigation
│       ├── screens/
│       │   ├── LoginScreen.js
│       │   ├── RegisterScreen.js
│       │   ├── DoctorListScreen.js
│       │   ├── PatientIntakeScreen.js    # Smart booking intake
│       │   ├── SlotSelectionScreen.js
│       │   ├── BookingConfirmationScreen.js
│       │   ├── VisitStatusScreen.js
│       │   ├── ProfileScreen.js
│       │   ├── EditProfileScreen.js
│       │   ├── NotificationPrefsScreen.js
│       │   ├── PrivacySecurityScreen.js
│       │   ├── AccountSettingsScreen.js
│       │   ├── PrescriptionListScreen.js
│       │   └── PrescriptionDetailScreen.js
│       └── utils/
│           ├── firebaseConfig.js
│           └── api.js            # Auth request helper with JWT refresh
│
└── flask_app/                   # Flask Backend Server
    ├── app.py                   # App factory + JWT error handlers
    ├── config.py                # JWT + MongoDB config
    ├── requirements.txt
    ├── serviceAccountKey.json   # Firebase Admin credentials (gitignored)
    ├── routes/
    │   ├── auth.py              # Firebase token verify + web login/register
    │   └── booking.py           # Urgency classification + booking + forwarding
    └── middleware/
        └── auth_middleware.py
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **Python** 3.10+
- **Expo Go** app on your phone
- **MongoDB** (local or Atlas)
- **Firebase** project with Email/Password auth enabled

### 1. Mobile App Setup

```bash
cd PatientApp
npm install
npx expo start -c
```

Scan the QR code with Expo Go on your phone.

### 2. Flask Backend Setup

```bash
cd flask_app
python -m venv venv

# Windows
.\venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
python app.py
```

Server runs on `http://0.0.0.0:5000`

### 3. Environment Variables (Optional)

Create a `.env` file in `flask_app/`:

```env
JWT_SECRET_KEY=your-secret-key-here
MONGO_URI=mongodb://localhost:27017/hospital_queue
GEMINI_API_KEY=your-gemini-api-key    # Optional: enables AI urgency classification
WEBSITE_BACKEND_URL=http://<web-server-ip>:5000
```

---

## ✨ Features

### Mobile App (Patient)
| Feature | Description |
|---|---|
| 🔐 Authentication | Firebase Email/Password with Flask JWT exchange |
| 👤 Profile Management | Edit name, phone, age via Firestore |
| 🔔 Notification Preferences | Toggle notifications (stored in AsyncStorage) |
| 🔒 Privacy & Security | Change password with re-authentication |
| ⚙️ Account Settings | Clear cache, delete account |
| 🩺 Doctor Search | Browse and search doctors by name/specialty |
| 📋 Smart Intake | Collect chief complaint, appointment type, emergency toggle |
| 🧠 AI Urgency Score | GenAI classifies urgency 1-10 from complaint text |
| 📊 Priority Calculation | Weighted formula: urgency + type + age factor |
| 🎫 Queue Booking | POST to website backend, receive token + queue position |

### Flask Backend (API)
| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/verify-token` | POST | Verify Firebase token → Flask JWT |
| `/api/auth/web/register` | POST | Doctor/Admin registration |
| `/api/auth/web/login` | POST | Doctor/Admin login |
| `/api/auth/me` | GET | Get current user profile |
| `/api/booking/classify-urgency` | POST | AI urgency classification (1-10) |
| `/api/booking/book-appointment` | POST | Calculate priority, forward to website queue |

---

## 🧮 Priority Formula

```
Priority = (0.6 × Urgency) + (0.3 × Type Score) + (0.1 × Age Factor)
```

| Component | Values |
|---|---|
| **Urgency** | 1-10 from GenAI / rule-based classification |
| **Type Score** | New Consultation = 5, Follow-up = 3, Report Review = 2 |
| **Age Factor** | 10 if age < 5 or > 65, else 0 |
| **Emergency** | Forces urgency to 10 |

---

## 🔧 Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native, Expo SDK 54, Firebase JS SDK (compat) |
| Navigation | React Navigation (Stack + Tabs) |
| Backend | Flask, Flask-JWT-Extended, Flask-Bcrypt |
| Auth | Firebase Authentication + Firebase Admin SDK |
| Database | Firestore (user profiles), MongoDB (web users) |
| AI | Google Gemini API (with rule-based fallback) |
| Icons | Lucide React Native |
| Storage | AsyncStorage (local prefs + JWT) |

---

## 📡 Network Configuration

Both machines (mobile backend + website backend) must be on the same Wi-Fi network. Update these IPs based on your setup:

| Config | File | Variable |
|---|---|---|
| Mobile → Flask | `src/utils/api.js` | `FLASK_URL` |
| Flask → Website | `routes/booking.py` | `WEBSITE_BACKEND_URL` |

Find your IP: `ipconfig` (Windows) or `ifconfig` (macOS/Linux)

---

## 📄 License

This project is for educational purposes.
