/**
 * Queue Service — Mock Mode
 *
 * Currently uses in-memory mock data.
 * To integrate with main project: replace the mock functions below
 * with real MongoDB Queue model calls. The controller interface is
 * intentionally identical — no other files need to change.
 *
 * INTEGRATION GUIDE:
 * 1. Replace mockQueueStore with Queue.find()/Queue.findOne()
 * 2. Replace in-memory updates with Queue.findByIdAndUpdate()
 * 3. Keep the same return shape: { id, patientName, tokenNumber, ... }
 */

const Queue = require('../models/Queue');
const logger = require('../utils/logger');

// ── MOCK DATA STORE ──────────────────────────────────────────────────────────
// Simulates a database. In production, remove this and use MongoDB.

const PATIENT_NAMES = [
  'Priya Sharma', 'Arjun Patel', 'Sunita Devi', 'Ravi Kumar',
  'Fatima Shaikh', 'Suresh Reddy', 'Anjali Singh', 'Mohammed Iqbal',
  'Kavitha Nair', 'Deepak Verma',
];

const APPOINTMENT_TIMES = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM',
  '11:30 AM', '12:00 PM', '02:00 PM', '02:30 PM', '03:00 PM',
];

// In-memory store keyed by "doctorId_date"
const mockStore = {};

const getTodayStr = () => new Date().toISOString().split('T')[0];

/**
 * Generate a fresh mock queue for a doctor (if not already created today).
 */
const ensureMockQueue = (doctorId) => {
  const key = `${doctorId}_${getTodayStr()}`;
  if (mockStore[key]) return mockStore[key];

  const queue = PATIENT_NAMES.map((name, idx) => ({
    id:              `mock_${doctorId}_${idx + 1}`,
    patientId:       `PAT_${(1000 + idx).toString()}`,
    patientName:     name,
    tokenNumber:     idx + 1,
    status:          'waiting',
    appointmentTime: APPOINTMENT_TIMES[idx] || '03:30 PM',
    queueDate:       getTodayStr(),
    doctorId,
    completedAt:     null,
    notes:           '',
  }));

  mockStore[key] = queue;
  logger.info(`[QUEUE] Generated mock queue for doctor ${doctorId}: ${queue.length} patients`);
  return queue;
};

// ── SERVICE FUNCTIONS ────────────────────────────────────────────────────────

/**
 * Get all patients in today's queue for a doctor.
 * Returns sorted by token number.
 */
const getTodayQueue = async (doctorId) => {
  // MOCK: replace below with → Queue.find({ doctorId, queueDate: getTodayStr() }).sort('tokenNumber')
  const queue = ensureMockQueue(doctorId);
  return [...queue].sort((a, b) => a.tokenNumber - b.tokenNumber);
};

/**
 * Get the next waiting patient (lowest token number).
 */
const getNextPatient = async (doctorId) => {
  // MOCK: replace below with →
  // Queue.findOne({ doctorId, queueDate: getTodayStr(), status: 'waiting' }).sort('tokenNumber')
  const queue = ensureMockQueue(doctorId);
  const next = queue
    .filter((p) => p.status === 'waiting')
    .sort((a, b) => a.tokenNumber - b.tokenNumber)[0];
  return next || null;
};

/**
 * Mark a patient as completed and return the next waiting patient.
 */
const completePatient = async (doctorId, patientQueueId) => {
  // MOCK: replace below with →
  // await Queue.findByIdAndUpdate(patientQueueId, { status: 'completed', completedAt: new Date() })
  const queue = ensureMockQueue(doctorId);
  const patient = queue.find((p) => p.id === patientQueueId);
  if (!patient) {
    const err = new Error(`Queue entry ${patientQueueId} not found`);
    err.statusCode = 404;
    throw err;
  }
  patient.status = 'completed';
  patient.completedAt = new Date().toISOString();

  // Return the updated patient + next in queue
  const next = queue
    .filter((p) => p.status === 'waiting')
    .sort((a, b) => a.tokenNumber - b.tokenNumber)[0];

  return { completed: patient, next: next || null };
};

/**
 * Get queue statistics for the dashboard.
 */
const getQueueStats = async (doctorId) => {
  const queue = ensureMockQueue(doctorId);
  return {
    total:     queue.length,
    waiting:   queue.filter((p) => p.status === 'waiting').length,
    completed: queue.filter((p) => p.status === 'completed').length,
  };
};

module.exports = { getTodayQueue, getNextPatient, completePatient, getQueueStats };
