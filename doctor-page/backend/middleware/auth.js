const { admin } = require('../config/firebase');
const logger = require('../utils/logger');

/**
 * Firebase ID Token Verification Middleware.
 *
 * SECURITY FLOW:
 * 1. Client sends: Authorization: Bearer <firebase_id_token>
 * 2. We extract the token from the header
 * 3. Firebase Admin SDK verifies the token cryptographically
 *    (checks signature, expiry, issuer, audience — all server-side)
 * 4. On success: attach decoded claims to req.doctor
 * 5. On failure: return 401 immediately — no further processing
 *
 * Why Firebase and not our own JWT?
 * - Firebase handles token rotation, revocation, and refresh automatically
 * - No need to store sessions or manage token blacklists
 * - Built-in protection against token replay attacks
 *
 * IMPORTANT: In development with no service account configured,
 * this middleware bypasses verification and attaches a mock doctor.
 * This behaviour is BLOCKED in NODE_ENV=production.
 */
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authorization token provided',
      });
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Development bypass (ONLY when Firebase is not configured)
    if (
      process.env.NODE_ENV !== 'production' &&
      !process.env.FIREBASE_SERVICE_ACCOUNT
    ) {
      logger.warn('[AUTH] DEVELOPMENT BYPASS — Firebase not configured');
      req.doctor = {
        uid: 'dev-doctor-001',
        email: 'dev@medirx.local',
        name: 'Dev Doctor',
        role: 'doctor',
      };
      return next();
    }

    // Production: verify the token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Attach doctor identity to request for downstream use
    req.doctor = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.email,
      role: decodedToken.role || 'doctor', // custom claim for RBAC
    };

    // Audit log: which doctor accessed which endpoint
    logger.info(`[AUTH] Doctor ${req.doctor.email} → ${req.method} ${req.path}`);

    next();
  } catch (error) {
    logger.warn(`[AUTH] Token verification failed: ${error.code} — ${error.message}`);

    // Map Firebase error codes to meaningful responses
    const message =
      error.code === 'auth/id-token-expired'
        ? 'Session expired. Please login again.'
        : error.code === 'auth/argument-error'
        ? 'Invalid token format.'
        : 'Authentication failed.';

    return res.status(401).json({ error: 'Unauthorized', message });
  }
};

/**
 * Optional role guard — use after verifyFirebaseToken.
 * Example: router.get('/admin', verifyFirebaseToken, requireRole('admin'), handler)
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.doctor || !roles.includes(req.doctor.role)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: `This action requires role: ${roles.join(' or ')}`,
    });
  }
  next();
};

module.exports = { verifyFirebaseToken, requireRole };
