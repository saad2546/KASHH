const { anonymizeForAI } = require('../services/anonymizerService');
const { validatePrescriptionSafety } = require('../services/geminiService');
const logger = require('../utils/logger');

/**
 * POST /api/ai/validate-prescription
 *
 * SECURITY ARCHITECTURE:
 *   Frontend → THIS ENDPOINT → Anonymizer → Gemini → Response
 *
 * This endpoint is the SINGLE point of contact between the prescription
 * system and the Gemini AI. It:
 *
 *   1. Receives raw patient + medicine data from the frontend
 *   2. Passes it through the anonymizer (strips ALL PII)
 *   3. Sends ONLY anonymized data to Gemini
 *   4. Returns Gemini's safety analysis to the frontend
 *
 * What the frontend sends:      What Gemini sees:
 * ─────────────────────────     ──────────────────
 * patientName: "Rahul Sharma"   patientRef: "P_X7K2"
 * dob: "1985-03-12"             ageRange: "35-45"
 * phone: "9876543210"           [STRIPPED]
 * symptoms: ["fever"]           symptoms: ["fever"]
 * medicines: [...]              medicines: [...]
 *
 * RATE LIMITING: 20 requests/min per doctor (configured in app.js)
 */
const validatePrescription = async (req, res, next) => {
  try {
    const { patient, medicines, diagnosis } = req.body;

    // ── Input validation ───────────────────────────────────────────────────
    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'medicines array is required and must not be empty',
      });
    }

    if (medicines.length > 20) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Maximum 20 medicines per check',
      });
    }

    // ── Step 1: Anonymize — strip ALL PII before it reaches any AI ────────
    const patientData = {
      ...(patient || {}),
      diagnosis: diagnosis || patient?.diagnosis || '',
    };

    const anonymized = anonymizeForAI(patientData, medicines);

    logger.info(
      `[AI] Doctor ${req.doctor.uid} requesting safety check — ` +
      `session ${anonymized.patientRef}, ${medicines.length} medicines`
    );

    // ── Step 2: Send ONLY anonymized data to Gemini ───────────────────────
    const safetyReport = await validatePrescriptionSafety(anonymized);

    // ── Step 3: Return safety report (no PII in response) ─────────────────
    logger.info(
      `[AI] Safety check complete — session ${anonymized.patientRef}, ` +
      `risk: ${safetyReport.overallRisk}`
    );

    return res.json({
      safetyReport,
      sessionRef: anonymized.patientRef, // Audit reference (no patient identity)
    });

  } catch (error) {
    next(error);
  }
};

module.exports = { validatePrescription };
