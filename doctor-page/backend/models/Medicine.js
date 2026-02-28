const mongoose = require('mongoose');

/**
 * Medicine Schema — imported from Kaggle CSV dataset (50,000 records).
 *
 * INDEXING STRATEGY:
 * - Compound text index with weights for relevance scoring.
 *   Name gets highest weight (doctors search by name most often).
 * - Regular index on category for filter queries.
 * - No unnecessary indexes to keep write performance high.
 */
const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      index: true,
    },
    dosageForm: {
      type: String,
      trim: true,
    },
    strength: {
      type: String,
      trim: true,
    },
    manufacturer: {
      type: String,
      trim: true,
    },
    indication: {
      type: String,
      trim: true,
    },
    classification: {
      type: String,
      enum: ['Prescription', 'Over-the-Counter', 'OTC', ''],
      trim: true,
      index: true,
    },
  },
  {
    timestamps: false, // Save space — medicines don't need created/updated
    versionKey: false,
  }
);

/**
 * COMPOUND TEXT INDEX with field weights.
 * Higher weight = more relevance in $text search scoring.
 *
 * Example: searching "paracetamol" will prioritise name matches (weight 10)
 * over indication matches (weight 2).
 */
medicineSchema.index(
  {
    name:           'text',
    category:       'text',
    indication:     'text',
    classification: 'text',
  },
  {
    weights: {
      name:           10, // Primary search field
      category:        5, // "antibiotic", "antiviral", etc.
      indication:      3, // "fever", "infection", etc.
      classification:  1, // "Prescription" / "OTC"
    },
    name: 'medicine_text_idx',
    background: true,
  }
);

// Regular index for autocomplete on name prefix (regex queries)
medicineSchema.index({ name: 1 });

const Medicine = mongoose.model('Medicine', medicineSchema);

module.exports = Medicine;
