const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/auth');
const { getTodayQueue, getNextPatient, completePatient } = require('../controllers/queueController');

/**
 * Patient Queue Routes
 *
 * All endpoints are OPEN in terms of queue logic —
 * no hardcoded assumptions about how patients are added.
 * This makes it trivial to swap mock data for real integration later.
 *
 * Firebase auth still required to identify WHICH doctor's queue to show.
 */

// GET /api/queue/today — full day's patient list
router.get('/today', verifyFirebaseToken, getTodayQueue);

// GET /api/queue/next — next waiting patient
router.get('/next', verifyFirebaseToken, getNextPatient);

// POST /api/queue/complete/:id — mark consultation done, get next patient
router.post('/complete/:id', verifyFirebaseToken, completePatient);

module.exports = router;
