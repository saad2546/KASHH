const Prescription = require('../models/Prescription');
const logger = require('../utils/logger');

/**
 * POST /api/prescriptions
 * Create a new prescription for the current patient.
 */
const createPrescription = async (req, res, next) => {
  try {
    const doctorId = req.doctor.uid;
    const data = req.body;

    if (!data.patientId || !data.diagnosis || !data.medicines?.length) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'patientId, diagnosis, and at least one medicine are required',
      });
    }

    const prescription = new Prescription({
      doctorId,
      doctorName: req.doctor.name,
      doctorSpecialization: data.doctorSpecialization,
      patientId: data.patientId,
      patientName: data.patientName,
      patientAge: data.patientAge,
      patientGender: data.patientGender,
      patientPhone: data.patientPhone,
      diagnosis: data.diagnosis,
      symptoms: data.symptoms || [],
      allergies: data.allergies || [],
      medicines: data.medicines,
      notes: data.notes || '',
      followUpDate: data.followUpDate,
      safetyReport: data.safetyReport,
      queueId: data.queueId,
    });

    await prescription.save();
    logger.info(`[PRESCRIPTION] Created ${prescription.prescriptionNumber} by doctor ${doctorId}`);

    return res.status(201).json({ prescription });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/prescriptions
 * List prescriptions for the authenticated doctor.
 */
const listPrescriptions = async (req, res, next) => {
  try {
    const doctorId = req.doctor.uid;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

    const total = await Prescription.countDocuments({ doctorId });
    const prescriptions = await Prescription.find({ doctorId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-__v')
      .lean();

    return res.json({ prescriptions, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/prescriptions/:id
 */
const getPrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findOne({
      _id: req.params.id,
      doctorId: req.doctor.uid,
    }).lean();

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }
    return res.json(prescription);
  } catch (error) {
    next(error);
  }
};

module.exports = { createPrescription, listPrescriptions, getPrescription };
