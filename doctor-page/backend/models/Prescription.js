const mongoose = require('mongoose');

const medicineEntrySchema = new mongoose.Schema(
  {
    medicineId:   { type: String },           // Medicine._id (optional ref)
    name:         { type: String, required: true },
    strength:     { type: String },
    dosageForm:   { type: String },
    frequency:    { type: String },           // "Twice daily"
    duration:     { type: String },           // "7 days"
    route:        { type: String, default: 'oral' },
    instructions: { type: String },
    manufacturer: { type: String },
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    // Doctor info (from Firebase token)
    doctorId:       { type: String, required: true, index: true },
    doctorName:     { type: String },
    doctorSpecialization: { type: String },

    // Patient info — stored in full here (internal DB only, never sent to AI)
    patientId:      { type: String, required: true, index: true },
    patientName:    { type: String, required: true },
    patientAge:     { type: Number },
    patientGender:  { type: String, enum: ['male', 'female', 'other', ''] },
    patientPhone:   { type: String },         // Stored encrypted in production

    // Clinical data
    diagnosis:      { type: String, required: true },
    symptoms:       [{ type: String }],
    allergies:      [{ type: String }],
    medicines:      [medicineEntrySchema],
    notes:          { type: String },
    followUpDate:   { type: String },

    // AI Safety Report (de-identified version stored for audit)
    safetyReport: {
      overallRisk:  { type: String },
      summary:      { type: String },
      findings:     [{ type: mongoose.Schema.Types.Mixed }],
      checkedAt:    { type: Date },
    },

    // Metadata
    prescriptionNumber: { type: String, unique: true },
    status: {
      type: String,
      enum: ['draft', 'active', 'expired', 'cancelled'],
      default: 'active',
    },
    queueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Queue' },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Auto-generate prescription number before save
prescriptionSchema.pre('save', function (next) {
  if (!this.prescriptionNumber) {
    const ts = Date.now().toString(36).toUpperCase();
    this.prescriptionNumber = `RX-${ts}`;
  }
  next();
});

const Prescription = mongoose.model('Prescription', prescriptionSchema);

module.exports = Prescription;
