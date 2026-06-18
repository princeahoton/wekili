'use strict';

/**
 * Lance toutes les migrations dans l'ordre au démarrage du serveur.
 * Chaque migration est idempotente (IF NOT EXISTS) — sûr à relancer.
 */

const pool = require('../config/database');

async function runAll() {
  const client = await pool.connect();
  console.log('🔧 Démarrage des migrations...');

  try {
    await client.query('BEGIN');

    // ── TABLE USERS ────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email      VARCHAR(255) UNIQUE,
        password   VARCHAR(255),
        nom        VARCHAR(100),
        prenom     VARCHAR(100),
        pays       VARCHAR(100),
        google_id  VARCHAR(255) UNIQUE,
        facebook_id VARCHAR(255) UNIQUE,
        phone      VARCHAR(30)  UNIQUE,
        avatar_url TEXT,
        auth_method VARCHAR(20) DEFAULT 'email',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── TABLE PROFILES ─────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id               UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        nationalite           VARCHAR(100),
        pays_residence        VARCHAR(100),
        telephone             VARCHAR(30),
        date_naissance        DATE,
        niveau_etudes         VARCHAR(100),
        domaine               VARCHAR(200),
        domaine_etudes        VARCHAR(200),
        etablissement         VARCHAR(200),
        moyenne               DECIMAL(4,2),
        moyenne_generale      DECIMAL(4,2),
        langue_principale     VARCHAR(100),
        niveau_langue         VARCHAR(50),
        certification         VARCHAR(100),
        langue2               VARCHAR(100),
        niveau_langue2        VARCHAR(50),
        pays_cibles           TEXT[],
        niveau_vise           VARCHAR(100),
        domaine_vise          VARCHAR(200),
        budget                INTEGER,
        pays_destination      VARCHAR(100),
        langues               TEXT[],
        experience_pro        TEXT,
        activites_extra       TEXT,
        motivation            TEXT,
        date_arrivee          DATE,
        budget_mensuel        INTEGER,
        created_at            TIMESTAMPTZ DEFAULT NOW(),
        updated_at            TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nationalite VARCHAR(100)`);
    await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telephone VARCHAR(30)`);
    await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_naissance DATE`);
    await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS domaine VARCHAR(200)`);
    await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS etablissement VARCHAR(200)`);
    await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS moyenne DECIMAL(4,2)`);
    await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS langue_principale VARCHAR(100)`);
    await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS niveau_langue VARCHAR(50)`);
    await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS certification VARCHAR(100)`);
    await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS langue2 VARCHAR(100)`);
    await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS niveau_langue2 VARCHAR(50)`);
    await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pays_cibles TEXT[]`);
    await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS niveau_vise VARCHAR(100)`);
    await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS domaine_vise VARCHAR(200)`);
    await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS budget INTEGER`);

    // ── TABLE DOCUMENTS ────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
        type         VARCHAR(100) NOT NULL,
        nom_fichier  VARCHAR(500),
        url          TEXT,
        url_s3       TEXT,
        taille       INTEGER,
        statut       VARCHAR(50) DEFAULT 'en_attente',
        created_at   TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS url_s3 TEXT`);
    await client.query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS taille INTEGER`);

    // ── TABLE ANALYSES ─────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS analyses (
        id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id               UUID REFERENCES users(id) ON DELETE CASCADE,
        score_global          INTEGER,
        synthese              TEXT,
        points_forts          JSONB,
        axes_amelioration     JSONB,
        forces                JSONB,
        faiblesses            JSONB,
        recommandations       JSONB,
        programmes_recommandes JSONB,
        estimation_chances    JSONB,
        raw_response          TEXT,
        created_at            TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`ALTER TABLE analyses ADD COLUMN IF NOT EXISTS forces JSONB`);
    await client.query(`ALTER TABLE analyses ADD COLUMN IF NOT EXISTS faiblesses JSONB`);
    await client.query(`ALTER TABLE analyses ADD COLUMN IF NOT EXISTS recommandations JSONB`);
    await client.query(`ALTER TABLE analyses ADD COLUMN IF NOT EXISTS programmes_recommandes JSONB`);
    await client.query(`ALTER TABLE analyses ADD COLUMN IF NOT EXISTS estimation_chances JSONB`);

    // ── TABLE BOURSES ──────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS scholarships (
        id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nom                     VARCHAR(300) NOT NULL,
        organisme               VARCHAR(200),
        pays                    VARCHAR(100),
        code_pays               VARCHAR(10),
        niveau                  VARCHAR(100),
        domaine                 VARCHAR(200),
        domaines                TEXT[],
        montant                 VARCHAR(200),
        type_financement        VARCHAR(100),
        description             TEXT,
        criteres                TEXT,
        date_limite             DATE,
        deadline                DATE,
        date_debut              DATE,
        duree                   VARCHAR(100),
        lien                    TEXT,
        avantages               TEXT,
        documents_requis        TEXT[],
        nationalites_eligibles  TEXT[],
        langue_requise          VARCHAR(100),
        niveau_langue_requis    VARCHAR(50),
        age_max                 INTEGER,
        nb_places               INTEGER,
        actif                   BOOLEAN DEFAULT true,
        created_at              TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS code_pays VARCHAR(10)`);
    await client.query(`ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS domaine VARCHAR(200)`);
    await client.query(`ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS deadline DATE`);
    await client.query(`ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS date_debut DATE`);
    await client.query(`ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS duree VARCHAR(100)`);
    await client.query(`ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS avantages TEXT`);
    await client.query(`ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS documents_requis TEXT[]`);
    await client.query(`ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS nationalites_eligibles TEXT[]`);
    await client.query(`ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS langue_requise VARCHAR(100)`);
    await client.query(`ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS niveau_langue_requis VARCHAR(50)`);
    await client.query(`ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS age_max INTEGER`);
    await client.query(`ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS nb_places INTEGER`);

    // ── TABLE MATCHES BOURSES ──────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS matches (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
        scholarship_id    UUID REFERENCES scholarships(id) ON DELETE CASCADE,
        score_eligibilite INTEGER,
        raison            TEXT,
        created_at        TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, scholarship_id)
      )
    `);

    // ── TABLE UNIVERSITIES ─────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS universities (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nom               VARCHAR(300) NOT NULL,
        pays              VARCHAR(100),
        ville             VARCHAR(100),
        type              VARCHAR(100),
        classement_monde  INTEGER,
        classement_national INTEGER,
        taux_admission    INTEGER,
        frais_scolarite   VARCHAR(200),
        programme_phare   VARCHAR(200),
        langues_enseignement TEXT[],
        campus_france_requis BOOLEAN DEFAULT false,
        uni_assist_requis BOOLEAN DEFAULT false,
        lien              TEXT,
        description       TEXT,
        actif             BOOLEAN DEFAULT true,
        created_at        TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── TABLE UNIVERSITY MATCHES ───────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS university_matches (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
        university_id       UUID REFERENCES universities(id) ON DELETE CASCADE,
        score_admission     INTEGER,
        type_candidature    VARCHAR(100),
        created_at          TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, university_id)
      )
    `);

    // ── TABLE CANDIDATURES ─────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS candidatures (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
        university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
        statut        VARCHAR(50) DEFAULT 'en_preparation',
        voeu_numero   INTEGER,
        notes         TEXT,
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, university_id)
      )
    `);

    // ── TABLE LOGEMENTS ────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS logements (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id             UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        pays_destination    VARCHAR(100),
        ville_destination   VARCHAR(100),
        type_souhaite       VARCHAR(100),
        budget_mensuel      INTEGER,
        date_arrivee        DATE,
        nb_colocataires     INTEGER DEFAULT 0,
        statut              VARCHAR(50) DEFAULT 'en_recherche'
          CHECK (statut IN ('en_recherche','dossier_soumis','en_attente','visite_planifiee','logement_confirme')),
        type_logement       VARCHAR(100),
        loyer_mensuel       INTEGER,
        adresse             TEXT,
        date_debut_contrat  DATE,
        lien_annonce        TEXT,
        completed_steps     JSONB DEFAULT '[]',
        notes               TEXT,
        created_at          TIMESTAMPTZ DEFAULT NOW(),
        updated_at          TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query('COMMIT');
    console.log('✅ Toutes les tables créées / vérifiées avec succès');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur migration:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { runAll };
