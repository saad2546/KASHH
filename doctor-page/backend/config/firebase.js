const admin = require('firebase-admin');
const logger = require('../utils/logger');

/**
 * Initialize Firebase Admin SDK once (singleton pattern).
 *
 * SECURITY NOTE:
 * - The service account JSON is stored ONLY in server-side environment variables.
 * - Never committed to version control or sent to the frontend.
 * - This gives the backend the ability to verify ID tokens issued to doctors.
 */
let initialized = false;

const initFirebase = () => {
  if (initialized) return admin;

  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');

    if (!serviceAccount.project_id) {
      // Development fallback: load from file if env var not set
      logger.warn('FIREBASE_SERVICE_ACCOUNT env var not set — auth middleware will be bypassed in dev mode');
      initialized = true;
      return admin;
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    initialized = true;
    logger.info(`Firebase Admin initialised for project: ${serviceAccount.project_id}`);
  } catch (error) {
    logger.error(`Firebase Admin init failed: ${error.message}`);
    logger.warn('Auth middleware will run in BYPASS mode — DO NOT use this in production');
    initialized = true;
  }

  return admin;
};

module.exports = { initFirebase, admin };
