# 🏥 MediRx — MERN Stack Digital Prescription System

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                      │
│  Login → Doctor Dashboard → Patient Queue → Prescription Form        │
│  Firebase SDK (auth only) ──► sends ID Token in every API request   │
└───────────────────────────┬──────────────────────────────────────────┘
                            │  HTTPS  +  Authorization: Bearer <token>
┌───────────────────────────▼──────────────────────────────────────────┐
│                    BACKEND (Node.js + Express)                        │
│                                                                       │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────────┐ │
│  │  Firebase Admin  │  │  Medicine Search  │  │  Patient Queue     │ │
│  │  Token Verifier  │  │  (MongoDB Atlas)  │  │  (Mock → Real)     │ │
│  └─────────────────┘  └──────────────────┘  └────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │           GEMINI SECURITY PROXY (Critical Layer)                │ │
│  │  Input Sanitizer → Data Anonymizer → Gemini API → Response      │ │
│  │  ❌ Never exposes: Name, Phone, ABHA, Address, exact DOB        │ │
│  │  ✅ Only sends: Age range, Gender, Symptoms, Anonymised data    │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└───────────────────────────┬──────────────────────────────────────────┘
                            │
              ┌─────────────▼──────────────┐
              │         MongoDB Atlas       │
              │   medicines (50k, indexed)  │
              │   prescriptions             │
              │   queue (mock)              │
              └────────────────────────────┘
```

---

## 🔐 Security Flow

### Firebase Authentication
1. Doctor visits `/login` → enters email/password
2. Firebase SDK authenticates → returns **ID Token** (JWT, 1hr TTL)
3. React stores token in memory (NOT localStorage) via `AuthContext`
4. Every API call includes `Authorization: Bearer <id_token>`
5. Express middleware calls `firebaseAdmin.auth().verifyIdToken()` on **every protected route**
6. Verified `uid` is attached to `req.doctor` — used for audit logging
7. `onAuthStateChanged` handles token refresh transparently

### Gemini Data Protection
```
Patient Record (raw)     →    Anonymizer Service    →    Gemini Payload
─────────────────────         ──────────────────         ───────────────
name: "Rahul Sharma"     →    patient_id: "P_X"     →    patient: "P_X"
dob: "1985-03-12"        →    age_range: "35-45"    →    age_range: "35-45"
phone: "9876543210"      →    [STRIPPED]            →    [not sent]
abha: "12-3456-7890"     →    [STRIPPED]            →    [not sent]
address: "Mumbai, MH"    →    [STRIPPED]            →    [not sent]
symptoms: "fever, cough" →    symptoms: same        →    symptoms: "fever, cough"
allergies: ["penicillin"]→    allergies: same       →    allergies: ["penicillin"]
```

---

## 💊 Medicine Search Optimization

- **50,000 records** imported into MongoDB with compound text index on:
  `Name (weight:10)`, `Category (weight:5)`, `Indication (weight:3)`, `Classification (weight:1)`
- Atlas **$text search** with score-based ranking
- **Regex fallback** for prefix matching when text score is low
- Results capped at **15** with projection (no unnecessary fields)
- Frontend **debounces** at 300ms to avoid hammering API
- In-memory **LRU cache** (TTL 10min) for repeated searches

---

## 🔄 Queue Logic

```
Doctor Login
    │
    ▼
GET /api/queue/today  ──► Returns all today's patients
    │
    ▼
GET /api/queue/next   ──► Returns next "waiting" patient (lowest token)
    │
    ▼
Display patient info on dashboard
    │
    ▼
Doctor prescribes → POST /api/queue/complete/:id
    │
    ▼
Auto-fetch next patient (polling every 30s OR websocket in future)
```

Mock data generates 10 patients per day with realistic names/tokens. Replace `mockQueueData()` in `services/queueService.js` with real DB calls when integrating main project.

---

## 📁 Folder Structure

```
mern-prescription/
├── backend/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── firebase.js        # Firebase Admin init
│   ├── controllers/
│   │   ├── medicineController.js
│   │   ├── queueController.js
│   │   ├── aiController.js
│   │   └── prescriptionController.js
│   ├── middleware/
│   │   ├── auth.js            # Firebase token verification
│   │   └── errorHandler.js    # Global error handler
│   ├── models/
│   │   ├── Medicine.js
│   │   ├── Queue.js
│   │   └── Prescription.js
│   ├── routes/
│   │   ├── medicines.js
│   │   ├── queue.js
│   │   ├── ai.js
│   │   └── prescriptions.js
│   ├── scripts/
│   │   ├── medicine_dataset.csv
│   │   └── importMedicines.js  # Run once: node scripts/importMedicines.js
│   ├── services/
│   │   ├── geminiService.js    # Gemini API calls
│   │   ├── anonymizerService.js # CRITICAL: strips PII
│   │   └── queueService.js    # Mock queue logic
│   ├── utils/
│   │   ├── logger.js
│   │   └── searchCache.js     # In-memory LRU cache
│   ├── app.js
│   ├── server.js
│   └── .env.example
│
└── frontend/
    └── src/
        ├── components/
        │   ├── MedicineSearch/
        │   │   ├── MedicineSearchDropdown.jsx
        │   │   └── MedicineOption.jsx
        │   ├── Queue/
        │   │   ├── PatientQueue.jsx
        │   │   └── CurrentPatientCard.jsx
        │   ├── Prescription/
        │   │   ├── PrescriptionForm.jsx
        │   │   ├── MedicineRow.jsx
        │   │   └── AISafetyPanel.jsx
        │   ├── Auth/
        │   │   └── ProtectedRoute.jsx
        │   └── common/
        │       ├── Navbar.jsx
        │       ├── Spinner.jsx
        │       └── Badge.jsx
        ├── pages/
        │   ├── Login.jsx
        │   ├── Dashboard.jsx
        │   └── NewPrescription.jsx
        ├── services/
        │   ├── api.js         # Axios instance with auth interceptor
        │   ├── medicineService.js
        │   ├── queueService.js
        │   └── prescriptionService.js
        ├── context/
        │   └── AuthContext.jsx
        ├── hooks/
        │   ├── useDebounce.js
        │   └── useQueue.js
        ├── firebase.js
        └── App.jsx
```

---

## 🚀 Setup Instructions

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in MongoDB URI, Firebase service account, Gemini key

# Import 50k medicines (run once)
node scripts/importMedicines.js

# Start
npm run dev
```

### 2. Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
# Fill in Firebase config, backend URL

npm run dev
```

### 3. Firebase Setup
1. Create Firebase project
2. Enable Email/Password auth
3. Download service account JSON → paste into `FIREBASE_SERVICE_ACCOUNT` env var
4. Add your domain to authorized domains
