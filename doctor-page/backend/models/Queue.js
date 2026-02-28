const mongoose = require('mongoose');

/**
 * Queue Schema — represents the daily patient appointment queue.
 *
 * Design decisions:
 * - queueDate allows multi-day querying without date-based collection sharding.
 * - tokenNumber is the display number shown to patients (e.g., Token 007).
 * - status enum is intentionally simple: only 3 states to keep logic clean.
 *   Extend with "in_progress" when adding real-time consultation tracking.
 * - doctorId links to Firebase UID (not a MongoDB ObjectId) for consistency
 *   with the Firebase-based auth system.
 */
const queueSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
    },
    patientName: {
      type: String,
      required: true,
      trim: true,
    },
    tokenNumber: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['waiting', 'in_progress', 'completed', 'skipped'],
      default: 'waiting',
      index: true,
    },
    appointmentTime: {
      type: String, // "09:30 AM" — stored as string for display flexibility
    },
    queueDate: {
      type: String, // "YYYY-MM-DD" — for daily queue lookup
      required: true,
      index: true,
    },
    doctorId: {
      type: String, // Firebase UID
      required: true,
      index: true,
    },
    completedAt: {
      type: Date,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index for "get today's queue for this doctor"
queueSchema.index({ doctorId: 1, queueDate: 1, tokenNumber: 1 });

const Queue = mongoose.model('Queue', queueSchema);

module.exports = Queue;
