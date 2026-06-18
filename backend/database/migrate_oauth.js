'use strict';

const pool = require('../config/database');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Rendre password nullable (pour les comptes OAuth sans mot de passe)
    await client.query(`
      ALTER TABLE users
        ALTER COLUMN password DROP NOT NULL
    `);

    // Ajouter les colonnes OAuth si elles n'existent pas
    await client.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS google_id   VARCHAR(255) UNIQUE,
        ADD COLUMN IF NOT EXISTS facebook_id VARCHAR(255) UNIQUE,
        ADD COLUMN IF NOT EXISTS phone       VARCHAR(30)  UNIQUE,
        ADD COLUMN IF NOT EXISTS avatar_url  TEXT,
        ADD COLUMN IF NOT EXISTS auth_method VARCHAR(20) DEFAULT 'email'
    `);

    await client.query('COMMIT');
    console.log('✓ Migration OAuth appliquée avec succès (users table mise à jour)');
  } catch (err) {
    await client.query('ROLLBACK');
    // Si password était déjà nullable, on ignore l'erreur
    if (err.message.includes('column "password" of relation')) {
      console.log('✓ password déjà nullable — colonnes OAuth ajoutées');
    } else {
      throw err;
    }
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => { console.error('✗ Erreur migration OAuth:', err.message); process.exit(1); });
