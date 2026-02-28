/**
 * Medicine CSV Import Script
 * Run once: node scripts/importMedicines.js
 *
 * Imports 50,000 medicine records from the Kaggle CSV into MongoDB.
 * Uses bulk write operations for performance (handles 50k records in ~30s).
 * Safe to re-run — checks for existing data before importing.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const mongoose = require('mongoose');
const Medicine = require('../models/Medicine');

const CSV_PATH = path.join(__dirname, 'medicine_dataset.csv');
const BATCH_SIZE = 500; // Insert in batches for memory efficiency

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medirx', {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 10000,
  });
  console.log('✅ MongoDB connected');
};

const importMedicines = async () => {
  await connectDB();

  // Check if already imported
  const existing = await Medicine.countDocuments();
  if (existing > 1000) {
    console.log(`⚠️  ${existing.toLocaleString()} medicines already in DB.`);
    console.log('   Add --force flag to re-import: node scripts/importMedicines.js --force');
    if (!process.argv.includes('--force')) {
      await mongoose.disconnect();
      return;
    }
    console.log('🗑️  --force flag detected. Clearing existing medicines...');
    await Medicine.deleteMany({});
  }

  console.log(`📂 Reading CSV: ${CSV_PATH}`);
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ CSV file not found: ${CSV_PATH}`);
    process.exit(1);
  }

  const records = [];
  let total = 0;
  let imported = 0;
  let errors = 0;

  return new Promise((resolve, reject) => {
    const parser = fs
      .createReadStream(CSV_PATH)
      .pipe(parse({ columns: true, skip_empty_lines: true, trim: true }));

    parser.on('data', (row) => {
      total++;
      const name = row['Name'] || row['name'] || '';
      if (!name.trim()) { errors++; return; }

      records.push({
        name:           name.trim(),
        category:       (row['Category'] || row['category'] || '').trim(),
        dosageForm:     (row['Dosage Form'] || row['dosage_form'] || '').trim(),
        strength:       (row['Strength'] || row['strength'] || '').trim(),
        manufacturer:   (row['Manufacturer'] || row['manufacturer'] || '').trim(),
        indication:     (row['Indication'] || row['indication'] || '').trim(),
        classification: (row['Classification'] || row['classification'] || '').trim(),
      });
    });

    parser.on('end', async () => {
      console.log(`📊 Parsed ${total.toLocaleString()} rows (${errors} skipped)`);
      console.log(`⚡ Inserting in batches of ${BATCH_SIZE}...`);

      try {
        for (let i = 0; i < records.length; i += BATCH_SIZE) {
          const batch = records.slice(i, i + BATCH_SIZE);
          await Medicine.insertMany(batch, { ordered: false });
          imported += batch.length;
          const pct = Math.round((imported / records.length) * 100);
          process.stdout.write(`\r   Progress: ${imported.toLocaleString()} / ${records.length.toLocaleString()} (${pct}%)`);
        }

        console.log('\n');

        // Ensure text indexes are built
        console.log('🔍 Building text indexes...');
        await Medicine.ensureIndexes();

        const finalCount = await Medicine.countDocuments();
        console.log(`\n✅ Import complete!`);
        console.log(`   Total in DB: ${finalCount.toLocaleString()} medicines`);
        console.log(`   Text index: medicine_text_idx (Name×10, Category×5, Indication×3, Classification×1)`);
      } catch (err) {
        console.error(`\n❌ Import error: ${err.message}`);
        reject(err);
      } finally {
        await mongoose.disconnect();
        resolve();
      }
    });

    parser.on('error', reject);
  });
};

importMedicines().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
