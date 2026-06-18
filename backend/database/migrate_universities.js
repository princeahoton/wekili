const pool = require('../config/database');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS universities (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nom           VARCHAR(200) NOT NULL,
        pays          VARCHAR(100) NOT NULL,
        ville         VARCHAR(100) NOT NULL,
        code_pays     CHAR(2) NOT NULL,
        type          VARCHAR(30) DEFAULT 'publique',
        domaines      TEXT[] DEFAULT '{}',
        niveaux       TEXT[] DEFAULT '{}',
        langue        VARCHAR(30) DEFAULT 'Français',
        niveau_langue VARCHAR(5) DEFAULT 'B2',
        taux_admission INTEGER,
        frais_scolarite VARCHAR(150),
        frais_inscription VARCHAR(100),
        moyenne_requise DECIMAL(4,2),
        classement_mondial INTEGER,
        classement_national INTEGER,
        description   TEXT,
        points_forts  TEXT[] DEFAULT '{}',
        documents_requis TEXT[] DEFAULT '{}',
        plateforme    VARCHAR(100),
        cout_plateforme VARCHAR(100),
        lien_candidature TEXT,
        lien_officiel TEXT,
        date_ouverture DATE,
        date_cloture   DATE,
        created_at    TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS university_matches (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
        university_id   UUID REFERENCES universities(id) ON DELETE CASCADE,
        score_admission INTEGER DEFAULT 0,
        type_candidature VARCHAR(20) DEFAULT 'realiste',
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, university_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS candidatures (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
        university_id   UUID REFERENCES universities(id) ON DELETE CASCADE,
        statut          VARCHAR(30) DEFAULT 'en_preparation',
        voeu_numero     INTEGER,
        notes           TEXT,
        date_soumission DATE,
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, university_id)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_universities_pays ON universities(pays);
      CREATE INDEX IF NOT EXISTS idx_universities_niveau ON universities USING GIN(niveaux);
      CREATE INDEX IF NOT EXISTS idx_university_matches_user ON university_matches(user_id);
      CREATE INDEX IF NOT EXISTS idx_candidatures_user ON candidatures(user_id);
    `);

    await client.query('COMMIT');
    console.log('✅ Tables universities, university_matches, candidatures créées.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur migration universities:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

migrate().then(() => process.exit(0)).catch(() => process.exit(1));
