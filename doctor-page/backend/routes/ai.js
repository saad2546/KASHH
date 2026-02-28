const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/auth');
const { validatePrescription } = require('../controllers/aiController');

/**
 * AI Routes — Gemini Security Proxy
 *
 * SECURITY DESIGN:
 * - These endpoints are the ONLY way the frontend communicates with Gemini.
 * - The Gemini API key is NEVER sent to the frontend.
 * - All patient data is anonymized INSIDE the controller before hitting Gemini.
 *
 * Stricter rate limiting than global: 20 requests per minute per doctor.
 * Gemini API has its own rate limits and each call has a cost.
 */
const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 20,
  keyGenerator: (req) => req.doctor?.uid || req.ip,
  message: { error: 'Too many AI requests. Please wait a moment.' },
});

// POST /api/ai/validate-prescription
router.post(
  '/validate-prescription',
  verifyFirebaseToken,
  aiRateLimit,
  validatePrescription
);

module.exports = router;
