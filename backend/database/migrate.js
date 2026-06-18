const pool = require('../config/database');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // users table already exists with id UUID — skip creation

    await client.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id SERIAL PRIMARY KEY,
        user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        nationalite VARCHAR(100),
        pays_residence VARCHAR(100),
        telephone VARCHAR(50),
        date_naissance DATE,
        niveau_etudes VARCHAR(100),
        domaine VARCHAR(100),
        etablissement VARCHAR(200),
        moyenne DECIMAL(4,2),
        langue_principale VARCHAR(50),
        niveau_langue VARCHAR(20),
        certification VARCHAR(100),
        langue2 VARCHAR(50),
        niveau_langue2 VARCHAR(20),
        pays_cibles TEXT[],
        niveau_vise VARCHAR(100),
        domaine_vise VARCHAR(100),
        budget VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        nom_fichier VARCHAR(255),
        url_s3 VARCHAR(500),
        taille INTEGER,
        statut VARCHAR(50) DEFAULT 'en_attente',
        texte_extrait TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS analyses (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        score_global INTEGER,
        synthese TEXT,
        forces JSONB DEFAULT '[]',
        faiblesses JSONB DEFAULT '[]',
        recommandations JSONB DEFAULT '[]',
        programmes_recommandes JSONB DEFAULT '[]',
        estimation_chances JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS scholarships (
        id SERIAL PRIMARY KEY,
        nom VARCHAR(255) NOT NULL,
        organisme VARCHAR(255),
        pays VARCHAR(100),
        code_pays VARCHAR(10),
        niveau VARCHAR(100),
        domaine VARCHAR(255),
        montant VARCHAR(100),
        deadline DATE,
        description TEXT,
        lien VARCHAR(500),
        criteres JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS matches (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        scholarship_id INTEGER REFERENCES scholarships(id) ON DELETE CASCADE,
        score_eligibilite INTEGER,
        statut VARCHAR(50) DEFAULT 'nouveau',
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, scholarship_id)
      );
    `);

    await client.query('COMMIT');
    console.log('✅ Tables créées avec succès');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur migration :', err.message);
    throw err;
  } finally {
    client.release();
  }
}

migrate().then(() => process.exit(0)).catch(() => process.exit(1));
