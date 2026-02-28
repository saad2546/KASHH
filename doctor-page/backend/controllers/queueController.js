const queueService = require('../services/queueService');
const logger = require('../utils/logger');

/**
 * GET /api/queue/today
 * Returns all patients in today's queue for the authenticated doctor.
 */
const getTodayQueue = async (req, res, next) => {
  try {
    const doctorId = req.doctor.uid;
    const queue = await queueService.getTodayQueue(doctorId);
    const stats = await queueService.getQueueStats(doctorId);

    logger.info(`[QUEUE] Doctor ${doctorId} fetched today's queue: ${queue.length} patients`);

    return res.json({ queue, stats, date: new Date().toISOString().split('T')[0] });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/queue/next
 * Returns the next waiting patient (lowest token number).
 * Called automatically after a consultation is completed.
 */
const getNextPatient = async (req, res, next) => {
  try {
    const doctorId = req.doctor.uid;
    const next = await queueService.getNextPatient(doctorId);

    if (!next) {
      return res.json({ patient: null, message: 'No more patients waiting today' });
    }

    logger.info(`[QUEUE] Next patient for doctor ${doctorId}: Token ${next.tokenNumber} — ${next.patientName}`);
    return res.json({ patient: next });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/queue/complete/:id
 * Mark patient consultation as complete.
 * Returns the next waiting patient automatically.
 */
const completePatient = async (req, res, next) => {
  try {
    const doctorId = req.doctor.uid;
    const { id } = req.params;

    const { completed, next } = await queueService.completePatient(doctorId, id);

    logger.info(`[QUEUE] Doctor ${doctorId} completed: Token ${completed.tokenNumber} — ${completed.patientName}`);

    return res.json({
      message: `Consultation completed for ${completed.patientName}`,
      completed,
      next: next || null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTodayQueue, getNextPatient, completePatient };
