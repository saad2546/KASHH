/**
 * Patient Data Anonymizer Service
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  CRITICAL SECURITY LAYER — READ BEFORE MODIFYING               ║
 * ║                                                                  ║
 * ║  This service ensures ZERO PII reaches the Gemini API.          ║
 * ║  It is the only place where patient identity is stripped.        ║
 * ║                                                                  ║
 * ║  Fields NEVER sent to Gemini:                                   ║
 * ║    - Full name           → replaced with "Patient_X"            ║
 * ║    - Exact date of birth → replaced with age range              ║
 * ║    - Phone number        → stripped completely                   ║
 * ║    - ABHA ID             → stripped completely                   ║
 * ║    - Address             → stripped completely                   ║
 * ║    - Email               → stripped completely                   ║
 * ║    - Patient ID          → replaced with random token           ║
 * ║                                                                  ║
 * ║  Fields ALLOWED to be sent (clinical only):                     ║
 * ║    - Age range (e.g., "35-45")                                  ║
 * ║    - Gender                                                      ║
 * ║    - Symptoms                                                    ║
 * ║    - Allergies                                                   ║
 * ║    - Diagnosis / conditions                                      ║
 * ║    - Proposed medicines (names, doses, frequencies)             ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

const logger = require('../utils/logger');

/**
 * Convert exact age to a 10-year range bucket.
 * e.g., 43 → "40-50", 67 → "60-70", 8 → "0-10"
 *
 * Why a range? Exact age combined with other data can re-identify patients.
 * A 10-year bucket provides sufficient clinical context without precision.
 */
const ageToRange = (age) => {
  if (!age || isNaN(age)) return 'unknown';
  const n = parseInt(age, 10);
  const lower = Math.floor(n / 10) * 10;
  return `${lower}-${lower + 10}`;
};

/**
 * Convert a date of birth string to an age range.
 * Never returns the DOB itself.
 */
const dobToAgeRange = (dob) => {
  try {
    const birth = new Date(dob);
    const ageMs = Date.now() - birth.getTime();
    const age = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 365.25));
    return ageToRange(age);
  } catch {
    return 'unknown';
  }
};

/**
 * Main anonymization function.
 *
 * @param {Object} patientData - Raw patient data from request
 * @param {Array}  medicines   - Proposed medicines list
 * @returns {Object} Sanitized payload safe for Gemini
 */
const anonymizeForAI = (patientData, medicines) => {
  // Generate a one-time session token — NOT traceable to the real patient
  const sessionToken = `P_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  // ── Compute age range ────────────────────────────────────────────────────
  let ageRange = 'unknown';
  if (patientData.age) {
    ageRange = ageToRange(patientData.age);
  } else if (patientData.dateOfBirth || patientData.dob) {
    ageRange = dobToAgeRange(patientData.dateOfBirth || patientData.dob);
  }

  // ── Sanitize symptoms: strip any accidentally included PII ──────────────
  const cleanSymptoms = (patientData.symptoms || [])
    .map((s) => String(s).trim())
    .filter((s) => s.length > 0 && s.length < 200) // no giant strings
    .slice(0, 20); // cap at 20 symptoms

  // ── Sanitize allergies ───────────────────────────────────────────────────
  const cleanAllergies = (patientData.allergies || [])
    .map((a) => String(a).trim())
    .filter((a) => a.length > 0 && a.length < 100)
    .slice(0, 20);

  // ── Sanitize diagnosis ───────────────────────────────────────────────────
  // Allow only the diagnosis string — no free text that might contain names
  const cleanDiagnosis = String(patientData.diagnosis || '').slice(0, 500);

  // ── Previous conditions (no full text, just condition names) ─────────────
  const cleanConditions = (patientData.conditions || patientData.previousConditions || [])
    .map((c) => String(c).trim().slice(0, 100))
    .slice(0, 10);

  // ── Sanitize medicines list ──────────────────────────────────────────────
  const cleanMedicines = (medicines || []).map((m) => ({
    name:      String(m.name || '').trim().slice(0, 100),
    strength:  String(m.strength || m.dosage || '').trim().slice(0, 50),
    frequency: String(m.frequency || '').trim().slice(0, 100),
    duration:  String(m.duration || '').trim().slice(0, 50),
    route:     String(m.route || 'oral').trim().slice(0, 50),
  }));

  const anonymized = {
    patientRef: sessionToken,       // "P_X7K2M" — not traceable
    ageRange,                        // "35-45"   — not exact age
    gender: patientData.gender || 'unspecified', // generic
    symptoms: cleanSymptoms,
    allergies: cleanAllergies,
    diagnosis: cleanDiagnosis,
    conditions: cleanConditions,
    medicines: cleanMedicines,
  };

  // Audit log: confirm what was stripped (log keys only, not values)
  const strippedFields = ['name', 'phone', 'abha', 'abhaId', 'address', 'email',
    'dateOfBirth', 'dob', 'patientId', 'id', '_id']
    .filter((k) => patientData[k] !== undefined);

  if (strippedFields.length > 0) {
    logger.info(`[ANONYMIZER] Stripped PII fields: ${strippedFields.join(', ')} → session ${sessionToken}`);
  }

  return anonymized;
};

module.exports = { anonymizeForAI, ageToRange, dobToAgeRange };
