const Medicine = require('../models/Medicine');
const searchCache = require('../utils/searchCache');
const logger = require('../utils/logger');

/**
 * GET /api/medicines?search=parac&limit=15&category=Antibiotic
 *
 * SEARCH STRATEGY (in order of preference):
 * 1. Check in-memory LRU cache first (TTL: 10min)
 * 2. MongoDB $text search with score-based sorting (uses compound text index)
 * 3. If text search returns < 3 results: fallback to regex prefix match on name
 *
 * This hybrid approach gives:
 * - Fast exact/near-exact matches via text index
 * - Good prefix matching (e.g., "para" → "Paracetamol") via regex fallback
 * - Near-zero latency for repeated searches via cache
 */
const searchMedicines = async (req, res, next) => {
  try {
    const query = (req.query.search || '').trim();
    const limit = Math.min(parseInt(req.query.limit, 10) || 15, 25); // max 25
    const category = req.query.category || '';

    if (!query || query.length < 2) {
      return res.json({ medicines: [], total: 0, cached: false });
    }

    // Build cache key (includes filters)
    const cacheKey = `${query}|${category}|${limit}`;

    // ── Cache hit ──────────────────────────────────────────────────────────
    const cached = searchCache.get(cacheKey);
    if (cached) {
      logger.debug(`[MEDICINE] Cache hit: "${query}"`);
      return res.json({ medicines: cached, total: cached.length, cached: true });
    }

    // ── MongoDB text search ────────────────────────────────────────────────
    const filter = {
      $text: { $search: query, $caseSensitive: false },
      ...(category ? { category } : {}),
    };

    const projection = {
      score: { $meta: 'textScore' },
      name: 1, category: 1, dosageForm: 1,
      strength: 1, manufacturer: 1, indication: 1, classification: 1,
    };

    let medicines = await Medicine.find(filter, projection)
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .lean();

    // ── Regex fallback for prefix matching ────────────────────────────────
    if (medicines.length < 3) {
      logger.debug(`[MEDICINE] Text search weak (${medicines.length} results) — trying regex for "${query}"`);
      const regexFilter = {
        name: { $regex: `^${escapeRegex(query)}`, $options: 'i' },
        ...(category ? { category } : {}),
      };
      const regexResults = await Medicine.find(regexFilter, {
        name: 1, category: 1, dosageForm: 1,
        strength: 1, manufacturer: 1, indication: 1, classification: 1,
      })
        .limit(limit)
        .lean();

      // Merge and deduplicate by _id
      const seen = new Set(medicines.map((m) => m._id.toString()));
      regexResults.forEach((m) => {
        if (!seen.has(m._id.toString())) medicines.push(m);
      });
      medicines = medicines.slice(0, limit);
    }

    // ── Cache and return ───────────────────────────────────────────────────
    searchCache.set(cacheKey, medicines);
    logger.debug(`[MEDICINE] Search "${query}" → ${medicines.length} results`);

    return res.json({ medicines, total: medicines.length, cached: false });

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/medicines/:id
 * Fetch single medicine by MongoDB ID (for prescription autofill)
 */
const getMedicineById = async (req, res, next) => {
  try {
    const medicine = await Medicine.findById(req.params.id).lean();
    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }
    return res.json(medicine);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/medicines/categories
 * List all unique categories (for filter dropdowns)
 */
const getCategories = async (req, res, next) => {
  try {
    const categories = await Medicine.distinct('category');
    return res.json(categories.sort());
  } catch (error) {
    next(error);
  }
};

/** Escape special regex characters in user input */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { searchMedicines, getMedicineById, getCategories };
