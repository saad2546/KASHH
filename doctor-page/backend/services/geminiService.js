/**
 * Gemini AI Service — Medication Safety Analysis
 *
 * ARCHITECTURE:
 *   Frontend → Backend (anonymize) → Gemini → Backend → Frontend
 *
 * The frontend NEVER calls Gemini directly.
 * This service receives pre-anonymized data from anonymizerService.js.
 *
 * Gemini is ONLY used for:
 *   1. Drug-drug interaction checks
 *   2. Drug-allergy cross-reactivity checks
 *   3. Age/condition-based dose appropriateness
 *   4. Generating structured safety alerts
 *
 * Gemini is NEVER used for:
 *   - Patient identification
 *   - Diagnosis generation
 *   - Any purpose requiring real patient identity
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

let genAI = null;
let model = null;

const initGemini = () => {
  if (!process.env.GEMINI_API_KEY) {
    logger.warn('[GEMINI] API key not set — AI safety checks will return fallback response');
    return;
  }
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.1,     // Near-deterministic for clinical decisions
      topP: 0.95,
      maxOutputTokens: 2048,
    },
  });
  logger.info('[GEMINI] Service initialised');
};

/**
 * Build a structured clinical prompt from anonymized data.
 * Input is ALREADY anonymized — no PII present at this point.
 */
const buildSafetyPrompt = (anonData) => {
  const medLines = anonData.medicines
    .map((m) => `  - ${m.name} ${m.strength} | ${m.frequency} | ${m.duration} | ${m.route}`)
    .join('\n');

  return `You are a clinical pharmacology AI integrated into a hospital prescription system.
Your ONLY purpose is medication safety checking.

=== ANONYMISED PATIENT CONTEXT ===
Patient Reference: ${anonData.patientRef}
Age Range: ${anonData.ageRange}
Gender: ${anonData.gender}
Reported Allergies: ${anonData.allergies.length ? anonData.allergies.join(', ') : 'None reported'}
Known Conditions: ${anonData.conditions.length ? anonData.conditions.join(', ') : 'None'}
Diagnosis: ${anonData.diagnosis || 'Not specified'}
Symptoms: ${anonData.symptoms.length ? anonData.symptoms.join(', ') : 'Not specified'}

=== MEDICINES TO VALIDATE ===
${medLines || '  No medicines provided'}

=== YOUR TASK ===
Perform comprehensive medication safety analysis:
1. Drug-drug interactions (all pairs above + any known current medications)
2. Drug-allergy cross-reactivity (check each medicine against listed allergies)
3. Age-appropriateness (is the dose/medicine safe for the stated age range?)
4. Condition contraindications (any medicines contraindicated for listed conditions?)

=== RESPONSE FORMAT ===
Respond ONLY with a JSON object. No markdown, no explanation outside JSON.

{
  "overallRisk": "low|medium|high|fatal",
  "color": "green|yellow|red",
  "stopAlert": null or "STOP - reason",
  "summary": "2-3 sentence clinical summary",
  "findings": [
    {
      "type": "interaction|allergy|age_factor|contraindication",
      "severity": "low|medium|high|fatal",
      "drugA": "drug name",
      "drugB": "drug or factor",
      "mechanism": "clinical mechanism",
      "description": "explanation",
      "recommendation": "what to do"
    }
  ],
  "alternatives": [
    {
      "insteadOf": "drug",
      "suggest": "safer alternative",
      "reason": "why safer",
      "note": "caveats"
    }
  ],
  "sources": [
    {
      "name": "NLM DailyMed|DrugBank|FDA|WHO",
      "reference": "specific entry",
      "url": "https://..."
    }
  ],
  "clearedMedicines": ["list of medicines with no issues"]
}`;
};

/**
 * Main function: validate prescription safety.
 * @param {Object} anonymizedData - Output of anonymizerService.anonymizeForAI()
 * @returns {Object} Structured safety report
 */
const validatePrescriptionSafety = async (anonymizedData) => {
  if (!model) {
    initGemini();
  }

  if (!model) {
    return fallbackResponse('Gemini API not configured');
  }

  try {
    const prompt = buildSafetyPrompt(anonymizedData);
    logger.info(`[GEMINI] Running safety check for session ${anonymizedData.patientRef}`);

    const result = await model.generateContent(prompt);
    const raw = result.response.text();

    return parseGeminiResponse(raw);
  } catch (error) {
    logger.error(`[GEMINI] API call failed: ${error.message}`);
    return fallbackResponse(error.message);
  }
};

const parseGeminiResponse = (raw) => {
  try {
    // Strip markdown code fences if present
    const cleaned = raw.replace(/```(?:json)?/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON found in response');

    const data = JSON.parse(match[0]);

    // Validate and normalise
    const risk = ['low', 'medium', 'high', 'fatal'].includes(data.overallRisk)
      ? data.overallRisk
      : 'medium';

    return {
      overallRisk:       risk,
      color:             { low: 'green', medium: 'yellow', high: 'red', fatal: 'red' }[risk],
      stopAlert:         data.stopAlert || null,
      summary:           data.summary || 'Safety analysis completed.',
      findings:          Array.isArray(data.findings) ? data.findings : [],
      alternatives:      Array.isArray(data.alternatives) ? data.alternatives : [],
      sources:           Array.isArray(data.sources) ? data.sources : [],
      clearedMedicines:  Array.isArray(data.clearedMedicines) ? data.clearedMedicines : [],
      checkedAt:         new Date().toISOString(),
      aiProvider:        'gemini-1.5-flash',
    };
  } catch (err) {
    logger.error(`[GEMINI] Response parse error: ${err.message}`);
    return fallbackResponse('Failed to parse AI response');
  }
};

const fallbackResponse = (reason) => ({
  overallRisk:      'medium',
  color:            'yellow',
  stopAlert:        null,
  summary:          'Automated safety analysis unavailable. Please perform manual interaction check.',
  findings:         [{
    type:           'system',
    severity:       'medium',
    drugA:          'System',
    drugB:          'AI Check',
    mechanism:      'Service unavailable',
    description:    `AI safety check failed: ${reason}. Perform manual review.`,
    recommendation: 'Consult NLM DailyMed or a clinical pharmacist.',
  }],
  alternatives:     [],
  sources:          [{ name: 'NLM DailyMed', reference: 'Manual lookup', url: 'https://dailymed.nlm.nih.gov' }],
  clearedMedicines: [],
  checkedAt:        new Date().toISOString(),
  aiUnavailable:    true,
});

// Initialise on module load
initGemini();

module.exports = { validatePrescriptionSafety };
