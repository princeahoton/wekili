const pool = require('../config/database');

async function migrateV2() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Nouvelles colonnes pour la table scholarships
    const alterations = [
      `ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS date_debut DATE`,
      `ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS duree VARCHAR(100)`,
      `ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS type_financement VARCHAR(100)`,
      `ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS avantages TEXT[] DEFAULT '{}'`,
      `ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS documents_requis TEXT[] DEFAULT '{}'`,
      `ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS nationalites_eligibles TEXT[] DEFAULT '{}'`,
      `ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS langue_requise VARCHAR(50)`,
      `ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS niveau_langue_requis VARCHAR(20)`,
      `ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS age_max INTEGER`,
      `ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS nb_places INTEGER`,
    ];

    for (const sql of alterations) {
      await client.query(sql);
    }

    await client.query('COMMIT');
    console.log('✅ Migration v2 — nouvelles colonnes scholarships ajoutées');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur migration v2 :', err.message);
    throw err;
  } finally {
    client.release();
  }
}

migrateV2().then(() => process.exit(0)).catch(() => process.exit(1));
