const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/auth');
const { searchMedicines, getMedicineById, getCategories } = require('../controllers/medicineController');

/**
 * Medicine Search Routes
 *
 * All routes require Firebase auth to prevent public access to the medicine DB.
 * Search is a read-only operation — no rate limiting beyond the global one.
 */

// GET /api/medicines?search=parac&limit=15&category=Antibiotic
router.get('/', verifyFirebaseToken, searchMedicines);

// GET /api/medicines/categories — list all categories for filter UI
router.get('/categories', verifyFirebaseToken, getCategories);

// GET /api/medicines/:id — single medicine (for autofill)
router.get('/:id', verifyFirebaseToken, getMedicineById);

module.exports = router;
