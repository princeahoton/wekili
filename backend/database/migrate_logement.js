'use strict';

const pool = require('../config/database');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS logements (
        id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        -- Destination
        pays_destination    TEXT,
        ville_destination   TEXT,

        -- Recherche
        type_souhaite       TEXT DEFAULT 'colocation',
        budget_mensuel      NUMERIC(10,2),
        date_arrivee        DATE,
        nb_colocataires     INT DEFAULT 1,

        -- Statut de recherche
        statut              TEXT DEFAULT 'en_recherche'
                            CHECK (statut IN (
                              'en_recherche',
                              'dossier_soumis',
                              'en_attente',
                              'visite_planifiee',
                              'logement_confirme'
                            )),

        -- Logement trouvé (rempli après confirmation)
        type_logement       TEXT,
        loyer_mensuel       NUMERIC(10,2),
        adresse             TEXT,
        date_debut_contrat  DATE,
        lien_annonce        TEXT,

        -- Checklist (tableau d'IDs cochés par l'étudiant)
        completed_steps     JSONB DEFAULT '[]',

        notes               TEXT,

        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW(),

        UNIQUE(user_id)
      )
    `);

    await client.query('COMMIT');
    console.log('✓ Table logements créée avec succès');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erreur migration logements:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().then(() => process.exit(0));
