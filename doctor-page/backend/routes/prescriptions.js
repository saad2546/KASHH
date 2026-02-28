const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/auth');
const { createPrescription, listPrescriptions, getPrescription } = require('../controllers/prescriptionController');

router.use(verifyFirebaseToken); // All prescription routes require auth

router.post('/',      createPrescription);
router.get('/',       listPrescriptions);
router.get('/:id',    getPrescription);

module.exports = router;
