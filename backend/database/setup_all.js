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
    // Migration : budget doit stocker une chaîne (ex. "Moins de 5 000 €/an"), pas un entier
    await client.query(`ALTER TABLE profiles ALTER COLUMN budget TYPE TEXT USING NULL`);
    await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE`);
    await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS doc_pin_hash VARCHAR(255)`);

    // ── TABLE DOCUMENT_LOGS ────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS document_logs (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        document_id   UUID,
        document_name VARCHAR(500),
        action        VARCHAR(50) NOT NULL,
        created_at    TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_doc_logs_user ON document_logs(user_id, created_at DESC)`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS two_fa_enabled   BOOLEAN DEFAULT FALSE`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified  BOOLEAN DEFAULT FALSE`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role             VARCHAR(20) DEFAULT 'user'`);
    // Les comptes créés avant la vérification email sont considérés vérifiés
    await client.query(`UPDATE users SET email_verified = true WHERE email_verified = false AND created_at < NOW() - INTERVAL '1 hour'`);

    // ── TABLE LOGIN_SESSIONS ───────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS login_sessions (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        ip          TEXT,
        user_agent  TEXT,
        device_hash TEXT,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_login_sessions_user ON login_sessions(user_id, created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_login_sessions_device ON login_sessions(user_id, device_hash, created_at DESC)`);

    // ── TABLE REFRESH_TOKENS ───────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash  VARCHAR(64) NOT NULL,
        device_hash VARCHAR(24),
        expires_at  TIMESTAMPTZ NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        revoked_at  TIMESTAMPTZ,
        CONSTRAINT uq_refresh_token_hash UNIQUE (token_hash)
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id, created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash)`);

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

    // ── COLONNES MANQUANTES universities ──────────────────────────────
    await client.query(`ALTER TABLE universities ADD COLUMN IF NOT EXISTS code_pays VARCHAR(10)`);
    await client.query(`ALTER TABLE universities ADD COLUMN IF NOT EXISTS domaines TEXT[]`);
    await client.query(`ALTER TABLE universities ADD COLUMN IF NOT EXISTS niveaux TEXT[]`);
    await client.query(`ALTER TABLE universities ADD COLUMN IF NOT EXISTS langue VARCHAR(100)`);
    await client.query(`ALTER TABLE universities ADD COLUMN IF NOT EXISTS niveau_langue VARCHAR(50)`);
    await client.query(`ALTER TABLE universities ADD COLUMN IF NOT EXISTS frais_inscription VARCHAR(200)`);
    await client.query(`ALTER TABLE universities ADD COLUMN IF NOT EXISTS moyenne_requise DECIMAL(4,2)`);
    await client.query(`ALTER TABLE universities ADD COLUMN IF NOT EXISTS classement_mondial INTEGER`);
    await client.query(`ALTER TABLE universities ADD COLUMN IF NOT EXISTS points_forts TEXT[]`);
    await client.query(`ALTER TABLE universities ADD COLUMN IF NOT EXISTS documents_requis TEXT[]`);
    await client.query(`ALTER TABLE universities ADD COLUMN IF NOT EXISTS plateforme VARCHAR(200)`);
    await client.query(`ALTER TABLE universities ADD COLUMN IF NOT EXISTS cout_plateforme VARCHAR(200)`);
    await client.query(`ALTER TABLE universities ADD COLUMN IF NOT EXISTS lien_candidature TEXT`);
    await client.query(`ALTER TABLE universities ADD COLUMN IF NOT EXISTS lien_officiel TEXT`);
    await client.query(`ALTER TABLE universities ADD COLUMN IF NOT EXISTS date_ouverture DATE`);
    await client.query(`ALTER TABLE universities ADD COLUMN IF NOT EXISTS date_cloture DATE`);

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
    await client.query(`ALTER TABLE candidatures ADD COLUMN IF NOT EXISTS date_soumission DATE`);

    // ── SEED UNIVERSITIES ──────────────────────────────────────────────
    const { rows: uniCount } = await client.query('SELECT COUNT(*) FROM universities');
    if (parseInt(uniCount[0].count) === 0) {
      await client.query(`
        INSERT INTO universities
          (nom, pays, ville, code_pays, type, domaines, niveaux, langue, niveau_langue,
           taux_admission, frais_scolarite, frais_inscription, moyenne_requise,
           classement_mondial, classement_national, description, points_forts,
           documents_requis, plateforme, cout_plateforme,
           lien_candidature, lien_officiel, date_ouverture, date_cloture)
        VALUES
          -- FRANCE
          ('Université Paris-Saclay', 'France', 'Gif-sur-Yvette', 'fr', 'Université publique',
           ARRAY['Sciences','Ingénierie','Médecine','Droit','Économie'], ARRAY['Master','Doctorat'],
           'Français', 'B2', 20, '243 € / an', '92 €', 14.0,
           13, 1,
           'Université de recherche de rang mondial, regroupant 15 établissements dont l''ENS Paris-Saclay et CentraleSupélec.',
           ARRAY['Recherche de pointe','Écosystème innovation','Nombreuses bourses','Campus moderne'],
           ARRAY['Diplôme de Licence ou équivalent','Relevés de notes officiels','Lettre de motivation','CV','Certificat de langue DELF B2 minimum','Lettre de recommandation'],
           'Campus France', 'Gratuit', 'https://www.universite-paris-saclay.fr/admission', 'https://www.universite-paris-saclay.fr', '2026-01-15', '2026-04-30'),

          ('Sorbonne Université', 'France', 'Paris', 'fr', 'Université publique',
           ARRAY['Lettres','Sciences','Médecine','Droit','Langues'], ARRAY['Licence','Master','Doctorat'],
           'Français', 'B2', 25, '243 € / an', '92 €', 13.0,
           83, 2,
           'L''une des plus anciennes et prestigieuses universités au monde, fondée en 1257, au cœur de Paris.',
           ARRAY['Patrimoine historique','Bibliothèques d''exception','Réseau alumni mondial','Campus central Paris'],
           ARRAY['Relevés de notes','Lettre de motivation','CV','Certificat DELF/DALF B2','Lettre de recommandation'],
           'Campus France', 'Gratuit', 'https://www.sorbonne-universite.fr/admission', 'https://www.sorbonne-universite.fr', '2026-01-15', '2026-04-30'),

          ('Sciences Po Paris', 'France', 'Paris', 'fr', 'Grande école',
           ARRAY['Sciences politiques','Relations internationales','Droit','Économie','Journalisme'], ARRAY['Master','Doctorat'],
           'Français / Anglais', 'B2', 10, '14 000 € / an (modulable)', '200 €', 14.5,
           244, 1,
           'École de référence mondiale en sciences sociales et politiques. Forte présence internationale et aide financière modulable selon revenus.',
           ARRAY['Réseau politique mondial','Modulation des frais selon revenus','Campus international','Nombreuses spécialisations'],
           ARRAY['Diplôme Bac+3','Relevés de notes','Lettre de motivation','CV','Certificat de langue B2','2 lettres de recommandation','Projet professionnel'],
           'Sciences Po Admissions', 'Gratuit', 'https://www.sciencespo.fr/admissions', 'https://www.sciencespo.fr', '2025-11-01', '2026-02-28'),

          ('Université de Montpellier', 'France', 'Montpellier', 'fr', 'Université publique',
           ARRAY['Médecine','Droit','Sciences','Économie','Pharmacie'], ARRAY['Licence','Master','Doctorat'],
           'Français', 'B2', 40, '243 € / an', '92 €', 12.0,
           601, 8,
           'L''une des plus anciennes universités du monde (1220), réputée pour ses filières médicales et juridiques. Ville ensoleillée à 1h de la mer.',
           ARRAY['Coût de vie abordable','Ville étudiante','Filières médicales réputées','Bonne intégration internationale'],
           ARRAY['Diplôme de Licence','Relevés de notes','Lettre de motivation','Certificat DELF B2'],
           'Campus France', 'Gratuit', 'https://www.umontpellier.fr/admission', 'https://www.umontpellier.fr', '2026-01-15', '2026-05-31'),

          ('Université de Lyon (Lyon 1)', 'France', 'Lyon', 'fr', 'Université publique',
           ARRAY['Sciences','Médecine','Pharmacie','Odontologie','Ingénierie'], ARRAY['Licence','Master','Doctorat'],
           'Français', 'B1', 45, '243 € / an', '92 €', 12.0,
           551, 6,
           'Grande université scientifique et médicale, au cœur de Lyon, 2e ville économique de France.',
           ARRAY['Forte recherche scientifique','Bonne intégration','Coût de vie modéré','Vie culturelle riche'],
           ARRAY['Diplôme de Licence','Relevés de notes','Lettre de motivation','Certificat DELF B1'],
           'Campus France', 'Gratuit', 'https://www.univ-lyon1.fr/admission', 'https://www.univ-lyon1.fr', '2026-01-15', '2026-05-31'),

          -- CANADA
          ('Université de Montréal', 'Canada', 'Montréal', 'ca', 'Université publique',
           ARRAY['Médecine','Droit','Sciences','Informatique','Éducation','Gestion'], ARRAY['Licence','Master','Doctorat'],
           'Français', 'B2', 55, '8 000 CAD / an', '115 CAD', 13.0,
           111, 2,
           'Plus grande université francophone d''Amérique du Nord hors France. Excellente réputation en recherche et forte communauté africaine.',
           ARRAY['Francophone','Forte communauté africaine','Bourse Vanier disponible','Ville cosmopolite','Coût de vie raisonnable'],
           ARRAY['Diplôme de Licence (Bac+3 minimum)','Relevés de notes officiels traduits','Lettre de motivation','CV','2 lettres de recommandation','Test de langue (DELF B2 ou TCF)'],
           'Admission Université de Montréal', 'Gratuit', 'https://admission.umontreal.ca', 'https://www.umontreal.ca', '2025-11-01', '2026-02-01'),

          ('Université Laval', 'Canada', 'Québec', 'ca', 'Université publique',
           ARRAY['Agriculture','Architecture','Droit','Sciences','Médecine','Musique'], ARRAY['Licence','Master','Doctorat'],
           'Français', 'B2', 60, '7 500 CAD / an', '115 CAD', 12.5,
           401, 5,
           'Plus ancienne université francophone d''Amérique (1663). Campus accueillant avec fort soutien à l''intégration internationale.',
           ARRAY['Campus complet en français','Fort soutien à l''intégration','Environnement sécurisé','Bonne aide financière'],
           ARRAY['Diplôme de Licence','Relevés de notes','Lettre de motivation','CV','Lettre de recommandation','TCF ou DELF B2'],
           'Admission Laval', 'Gratuit', 'https://www.ulaval.ca/admission', 'https://www.ulaval.ca', '2025-11-01', '2026-03-01'),

          ('UQAM — Université du Québec à Montréal', 'Canada', 'Montréal', 'ca', 'Université publique',
           ARRAY['Arts','Communication','Sciences sociales','Informatique','Éducation'], ARRAY['Licence','Master','Doctorat'],
           'Français', 'B1', 70, '6 500 CAD / an', '115 CAD', 11.0,
           801, 10,
           'Université urbaine accessible et diversifiée, au cœur de Montréal. Idéale pour les arts, sciences sociales et communication.',
           ARRAY['Frais abordables','Centre-ville Montréal','Bonne diversité','Accès stage en entreprise'],
           ARRAY['Diplôme de Licence','Relevés de notes','Lettre de motivation','TCF ou DELF B1'],
           'Admission UQAM', 'Gratuit', 'https://admission.uqam.ca', 'https://www.uqam.ca', '2025-11-01', '2026-03-15'),

          -- BELGIQUE
          ('Université catholique de Louvain (UCLouvain)', 'Belgique', 'Louvain-la-Neuve', 'be', 'Université privée',
           ARRAY['Droit','Médecine','Sciences','Ingénierie','Gestion','Théologie'], ARRAY['Licence','Master','Doctorat'],
           'Français', 'B2', 35, '835 € / an', '50 €', 13.0,
           201, 2,
           'Grande université catholique francophone avec campus pensé entièrement pour les étudiants. Forte recherche et réseau international.',
           ARRAY['Campus ville universitaire intégral','Bonne intégration Afrique francophone','Bourse WBI accessible','Recherche de qualité'],
           ARRAY['Diplôme de Licence ou Bac+3','Relevés de notes','Lettre de motivation','CV','Certificat DELF B2','Lettre de recommandation'],
           'Admission UCLouvain', 'Gratuit', 'https://uclouvain.be/fr/etudier/inscriptions.html', 'https://uclouvain.be', '2026-02-01', '2026-05-31'),

          ('Université Libre de Bruxelles (ULB)', 'Belgique', 'Bruxelles', 'be', 'Université publique',
           ARRAY['Droit','Médecine','Sciences','Philosophie','Ingénierie','Psychologie'], ARRAY['Licence','Master','Doctorat'],
           'Français', 'B2', 40, '835 € / an', '50 €', 13.0,
           201, 1,
           'Université laïque au cœur de Bruxelles, capitale de l''Europe. Forte tradition académique et communauté internationale dynamique.',
           ARRAY['Bruxelles capitale européenne','Réseau alumni européen','Laïque et progressiste','Nombreux étudiants africains'],
           ARRAY['Diplôme de Licence','Relevés de notes','Lettre de motivation','Certificat DELF B2'],
           'Admission ULB', 'Gratuit', 'https://www.ulb.be/fr/admission', 'https://www.ulb.be', '2026-02-01', '2026-06-30'),

          -- ALLEMAGNE
          ('Université Ludwig-Maximilians de Munich (LMU)', 'Allemagne', 'Munich', 'de', 'Université publique',
           ARRAY['Médecine','Droit','Sciences','Lettres','Économie','Philosophie'], ARRAY['Master','Doctorat'],
           'Allemand / Anglais', 'B2', 15, 'Gratuit (+ 143 € / semestre)', '0 €', 14.5,
           32, 1,
           'L''une des meilleures universités d''Allemagne et d''Europe. Nombreux programmes en anglais au niveau Master et Doctorat.',
           ARRAY['Frais de scolarité nuls','Bourse DAAD disponible','Top classement mondial','Ville culturelle et sécurisée'],
           ARRAY['Diplôme de Licence','Relevés de notes','Lettre de motivation','Certificat de langue B2','Lettre de recommandation','Projet de recherche (Doctorat)'],
           'uni-assist', '75 €', 'https://www.lmu.de/en/study/admission.html', 'https://www.lmu.de', '2025-12-01', '2026-04-30'),

          ('Université Technique de Berlin (TU Berlin)', 'Allemagne', 'Berlin', 'de', 'Université technique',
           ARRAY['Ingénierie','Informatique','Sciences','Architecture','Économie'], ARRAY['Master','Doctorat'],
           'Allemand / Anglais', 'B1', 25, 'Gratuit (+ 143 € / semestre)', '0 €', 14.0,
           154, 3,
           'Grande école d''ingénieurs berlinoise avec de nombreux programmes en anglais. Idéale pour les profils scientifiques et techniques.',
           ARRAY['Nombreux masters en anglais','Berlin ville dynamique','Bourse DAAD disponible','Forte insertion industrielle'],
           ARRAY['Diplôme Bac+3 scientifique','Relevés de notes','Lettre de motivation','Certificat anglais B2 ou allemand B1','CV'],
           'uni-assist', '75 €', 'https://www.tu.berlin/en/studying/applying-and-enrolling', 'https://www.tu.berlin', '2025-12-01', '2026-04-30'),

          -- ROYAUME-UNI
          ('University of Edinburgh', 'Royaume-Uni', 'Édimbourg', 'gb', 'Université publique',
           ARRAY['Médecine','Droit','Sciences','Lettres','Informatique','Ingénierie'], ARRAY['Master','Doctorat'],
           'Anglais', 'C1', 12, '22 000 £ / an', '0 £', 15.0,
           22, 4,
           'Université de classe mondiale fondée en 1583, membre du groupe Russell Group. Forte culture de recherche et vie étudiante riche.',
           ARRAY['Top classement mondial','Bourse Chevening accessible','Ville historique sécurisée','Fort réseau alumni'],
           ARRAY['Diplôme de Licence (2:1 minimum)','Relevés de notes en anglais','Lettre de motivation','CV','2 lettres de recommandation','Certificat IELTS 6.5 minimum'],
           'UCAS', 'Gratuit', 'https://www.ed.ac.uk/studying/postgraduate/applying', 'https://www.ed.ac.uk', '2025-09-01', '2026-01-31'),

          ('King''s College London', 'Royaume-Uni', 'Londres', 'gb', 'Université publique',
           ARRAY['Médecine','Droit','Sciences sociales','Humanités','Ingénierie','Psychiatrie'], ARRAY['Master','Doctorat'],
           'Anglais', 'C1', 18, '24 000 £ / an', '0 £', 15.0,
           40, 5,
           'Université fondée en 1829 au cœur de Londres, membre du Russell Group. Parmi les meilleures au monde en médecine et droit.',
           ARRAY['Cœur de Londres','Top médecine et droit','Bourse Chevening disponible','Réseau professionnel exceptionnel'],
           ARRAY['Diplôme de Licence (2:1 minimum)','Relevés de notes','Lettre de motivation','CV','2 lettres de recommandation','IELTS 6.5'],
           'Admission KCL', 'Gratuit', 'https://www.kcl.ac.uk/study/postgraduate/applying', 'https://www.kcl.ac.uk', '2025-09-01', '2026-01-31')
      `);
      console.log('🌱 Universités seedées (15 universités)');
    }

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

    // ── SEED BOURSES (si table vide) ──────────────────────────────────
    const { rows: countRows } = await client.query('SELECT COUNT(*) FROM scholarships');
    if (parseInt(countRows[0].count) === 0) {
      await client.query(`
        INSERT INTO scholarships (nom, organisme, pays, code_pays, niveau, domaine, montant, description, lien, deadline, langue_requise, niveau_langue_requis, type_financement)
        VALUES
          ('Bourse Eiffel Excellence', 'Campus France', 'France', 'fr', 'Master', 'Tous domaines', 'jusqu''à 1 181 €/mois',
           'La bourse Eiffel est attribuée par le ministère de l''Europe et des Affaires étrangères aux meilleurs étudiants étrangers souhaitant poursuivre des études en France.',
           'https://www.campusfrance.org/fr/bourse-eiffel', '2027-01-09', 'Français', 'B2', 'Bourse complète'),

          ('Bourse Eiffel Doctorat', 'Campus France', 'France', 'fr', 'Doctorat', 'Tous domaines', 'jusqu''à 1 400 €/mois',
           'Volet doctoral de la bourse Eiffel pour soutenir les meilleurs doctorants étrangers dans des établissements d''enseignement supérieur français.',
           'https://www.campusfrance.org/fr/bourse-eiffel', '2027-01-09', 'Français', 'B2', 'Bourse complète'),

          ('Bourse du Gouvernement Français', 'Institut Français', 'France', 'fr', 'Licence, Master', 'Tous domaines', 'jusqu''à 700 €/mois',
           'Bourses octroyées par l''Institut Français aux étudiants étrangers souhaitant effectuer une mobilité en France.',
           'https://www.institutfrancais.com', '2026-03-31', 'Français', 'B1', 'Bourse partielle'),

          ('DAAD — Bourse d''excellence', 'DAAD', 'Allemagne', 'de', 'Master, Doctorat', 'Tous domaines', 'jusqu''à 934 €/mois',
           'Le DAAD finance chaque année des milliers d''étudiants et chercheurs étrangers pour des séjours d''études et de recherche en Allemagne.',
           'https://www.daad.de', '2026-10-15', 'Allemand ou Anglais', 'B2', 'Bourse complète'),

          ('Bourse WBI', 'Wallonie-Bruxelles International', 'Belgique', 'be', 'Master', 'Tous domaines', 'jusqu''à 1 500 €/mois',
           'WBI accorde des bourses aux ressortissants de pays en développement désireux d''effectuer un séjour d''études ou de recherche en Fédération Wallonie-Bruxelles.',
           'https://www.wbi.be', '2026-02-01', 'Français', 'B2', 'Bourse complète'),

          ('Bourse Vanier Canada', 'Gouvernement du Canada', 'Canada', 'ca', 'Doctorat', 'Tous domaines', '50 000 $/an',
           'Le Programme de bourses d''études supérieures du Canada Vanier vise à attirer et à retenir dans les universités canadiennes des étudiants au doctorat de grande qualité.',
           'https://vanier.gc.ca', '2026-11-05', 'Français ou Anglais', 'B2', 'Bourse complète'),

          ('Bourse CRFRS Canada', 'Gouvernement du Canada', 'Canada', 'ca', 'Master', 'Sciences, Ingénierie', '17 500 $/an',
           'Programme de bourses pour étudiants étrangers souhaitant poursuivre un Master dans une université canadienne.',
           'https://www.canada.ca/fr/secretariat-conseil-tresor.html', '2026-12-01', 'Français ou Anglais', 'B2', 'Bourse partielle'),

          ('Bourse Chevening', 'FCDO', 'Royaume-Uni', 'gb', 'Master', 'Tous domaines', 'Couverture totale',
           'Les bourses Chevening sont attribuées par le gouvernement britannique aux futurs leaders mondiaux pour étudier au Royaume-Uni.',
           'https://www.chevening.org', '2026-11-04', 'Anglais', 'C1', 'Bourse complète'),

          ('Commonwealth Scholarship', 'Commonwealth Scholarship Commission', 'Royaume-Uni', 'gb', 'Master, Doctorat', 'Tous domaines', 'Couverture totale',
           'Les bourses Commonwealth permettent à des citoyens des pays membres du Commonwealth d''étudier au Royaume-Uni.',
           'https://cscuk.fcdo.gov.uk', '2026-10-15', 'Anglais', 'B2', 'Bourse complète')
      `);
      console.log('🌱 Données initiales bourses insérées (8 bourses)');
    }

    // ── COMPLETER LES DETAILS DES BOURSES (toujours) ──────────────────
    const detailsBourses = [
      {
        nom: 'Bourse Eiffel Excellence',
        duree: '12 à 36 mois', date_debut: '2026-09-01', age_max: 30, nb_places: 70,
        avantages: JSON.stringify(['Allocation mensuelle 1 181 €', 'Billet aller-retour', 'Couverture sociale', 'Aide au logement']),
        nationalites_eligibles: ['Bénin','Burkina Faso','Cameroun',"Côte d'Ivoire",'Sénégal','Togo','Mali','Niger','Guinée','Congo'],
        documents_requis: ['CV en français','Diplôme de Licence ou Master','Relevés de notes (3 ans)','Lettre de motivation','2 lettres de recommandation','Certificat de langue DELF/DALF B2 min.'],
        criteres: JSON.stringify([{titre:'Excellence académique',desc:'Mention Bien ou Très Bien exigée pour les 3 dernières années.'},{titre:'Projet professionnel',desc:"Projet clair en lien avec les besoins du pays d'origine."},{titre:'Leadership',desc:'Potentiel de leadership et engagement associatif valorisé.'}]),
      },
      {
        nom: 'Bourse Eiffel Doctorat',
        duree: '24 à 36 mois', date_debut: '2026-09-01', age_max: 35, nb_places: 30,
        avantages: JSON.stringify(['Allocation mensuelle 1 400 €', 'Billet aller-retour', 'Couverture sociale', 'Accès laboratoires de recherche']),
        nationalites_eligibles: ['Bénin','Burkina Faso','Cameroun',"Côte d'Ivoire",'Sénégal','Togo','Mali','Niger','Guinée','Congo'],
        documents_requis: ['CV détaillé','Master avec mention','Relevés de notes','Projet de recherche','2 lettres de recommandation de chercheurs','Certificat DELF B2'],
        criteres: JSON.stringify([{titre:'Projet de recherche',desc:'Projet structuré avec problématique, méthodologie et apport scientifique.'},{titre:'Encadrement',desc:"Accord préalable d'un directeur de thèse en France."}]),
      },
      {
        nom: 'Bourse du Gouvernement Français',
        duree: '12 à 24 mois', date_debut: '2026-09-01', age_max: 35, nb_places: 200,
        avantages: JSON.stringify(["Allocation mensuelle 700 €", "Exonération des frais d'inscription", 'Assurance maladie', 'Accès aux services Campus France']),
        nationalites_eligibles: ['Bénin','Burkina Faso','Cameroun',"Côte d'Ivoire",'Sénégal','Togo','Mali','Niger','Guinée','Gabon'],
        documents_requis: ['CV','Diplôme de Licence','Relevés de notes','Lettre de motivation','1 lettre de recommandation','Certificat de langue B1'],
        criteres: JSON.stringify([{titre:'Niveau académique',desc:'Bonne mention exigée. Priorité aux filières scientifiques et technologiques.'},{titre:'Projet de retour',desc:"Engagement à rentrer dans le pays d'origine après les études."}]),
      },
      {
        nom: "DAAD — Bourse d'excellence",
        duree: '12 à 36 mois', date_debut: '2026-10-01', age_max: 32, nb_places: 500,
        avantages: JSON.stringify(["Allocation mensuelle 934 €","Billet aller-retour","Assurance maladie","Cours d'allemand gratuits","Aide au logement"]),
        nationalites_eligibles: ['Tous pays en développement','Afrique subsaharienne prioritaire'],
        documents_requis: ['CV en anglais ou allemand','Diplôme de Licence ou Master','Relevés de notes','Lettre de motivation','2 lettres de recommandation','Certificat de langue (anglais B2 ou allemand B1)'],
        criteres: JSON.stringify([{titre:'Excellence académique',desc:'Moyenne supérieure à 14/20 ou équivalent.'},{titre:'Langue',desc:"Maîtrise de l'anglais (B2) ou de l'allemand (B1) exigée."},{titre:'Projet professionnel',desc:"Lien clair entre la formation et le développement du pays d'origine."}]),
      },
      {
        nom: 'Bourse WBI',
        duree: '12 mois renouvelable', date_debut: '2026-09-01', age_max: 35, nb_places: 120,
        avantages: JSON.stringify(["Allocation mensuelle 1 500 €","Couverture sociale belge","Exonération des frais d'inscription","Logement en résidence universitaire (selon disponibilité)"]),
        nationalites_eligibles: ['Bénin','Burkina Faso','Cameroun',"Côte d'Ivoire",'Congo','Gabon','Guinée','Mali','Niger','Sénégal','Togo'],
        documents_requis: ['CV','Diplôme de Licence (min. Bac+3)','Relevés de notes','Lettre de motivation','2 lettres de recommandation','Certificat de langue française B2'],
        criteres: JSON.stringify([{titre:'Dossier académique',desc:'Excellents résultats académiques exigés (mention Bien minimum).'},{titre:'Projet de retour',desc:"Engagement formel à retourner dans le pays d'origine."}]),
      },
      {
        nom: 'Bourse Vanier Canada',
        duree: '3 ans', date_debut: '2026-09-01', age_max: null, nb_places: 166,
        avantages: JSON.stringify(['50 000 CAD/an pendant 3 ans','Accès aux réseaux de recherche canadiens','Mentorat académique','Opportunités de stage de recherche']),
        nationalites_eligibles: ['Tous pays','Ouvert aux candidats internationaux'],
        documents_requis: ['CV académique complet','Transcripts officiels','Proposition de recherche détaillée','3 lettres de recommandation de professeurs','Preuve de maîtrise linguistique (anglais ou français)'],
        criteres: JSON.stringify([{titre:'Leadership',desc:'Démonstration de leadership académique et communautaire exceptionnel.'},{titre:'Recherche',desc:'Excellence en recherche avec publications ou présentations.'},{titre:'Académique',desc:'Moyenne cumulative très élevée (A ou équivalent).'}]),
      },
      {
        nom: 'Bourse CRFRS Canada',
        duree: '12 mois', date_debut: '2026-09-01', age_max: 40, nb_places: 100,
        avantages: JSON.stringify(['17 500 CAD/an','Couverture assurance santé','Accès aux infrastructures universitaires']),
        nationalites_eligibles: ['Tous pays en développement','Priorité Afrique francophone'],
        documents_requis: ['CV','Transcripts officiels','Lettre de motivation','2 lettres de recommandation','Preuve de niveau anglais ou français B2'],
        criteres: JSON.stringify([{titre:'Domaine',desc:'Priorité aux sciences, ingénierie, technologies et mathématiques (STEM).'},{titre:'Projet',desc:"Projet d'études en lien avec les défis de développement du pays d'origine."}]),
      },
      {
        nom: 'Bourse Chevening',
        duree: '12 mois', date_debut: '2026-09-01', age_max: null, nb_places: 1500,
        avantages: JSON.stringify(['Frais de scolarité complets','Allocation mensuelle de subsistance','Billet aller-retour','Visa étudiant UK','Frais de thèse couverts']),
        nationalites_eligibles: ['Bénin','Burkina Faso','Cameroun',"Côte d'Ivoire",'Ghana','Kenya','Nigeria','Sénégal','Togo','Rwanda','Ouganda'],
        documents_requis: ['CV en anglais','Diplôme de Licence (2:1 minimum)',"2 ans d'expérience professionnelle",'3 essais Chevening','2 références professionnelles','Certificat IELTS 6.5 minimum'],
        criteres: JSON.stringify([{titre:'Leadership',desc:"Potentiel avéré de leadership et d'influence dans votre domaine."},{titre:'Réseau',desc:'Capacité à créer et développer des réseaux professionnels.'},{titre:'Retour pays',desc:'Engagement à retourner dans votre pays après la bourse.'}]),
      },
      {
        nom: 'Commonwealth Scholarship',
        duree: '12 à 48 mois', date_debut: '2026-09-01', age_max: 40, nb_places: 800,
        avantages: JSON.stringify(["Frais de scolarité complets","Allocation mensuelle","Billet aller-retour","Allocation d'arrivée","Couverture médicale"]),
        nationalites_eligibles: ['Tous pays membres du Commonwealth','Afrique subsaharienne prioritaire'],
        documents_requis: ['CV','Diplôme de Licence 2:1 minimum','Transcripts officiels','Proposition de recherche (Doctorat)','2 lettres de recommandation','Certificat IELTS 6.0'],
        criteres: JSON.stringify([{titre:'Développement',desc:'Lien démontré entre le projet et le développement du Commonwealth.'},{titre:'Académique',desc:'Excellence académique et potentiel de recherche.'},{titre:'Impact',desc:'Potentiel d\'impact positif dans votre pays après retour.'}]),
      },
    ];

    for (const b of detailsBourses) {
      await client.query(`
        UPDATE scholarships SET
          duree = $2, date_debut = $3, age_max = $4, nb_places = $5,
          avantages = $6, nationalites_eligibles = $7, documents_requis = $8, criteres = $9
        WHERE nom = $1
      `, [b.nom, b.duree, b.date_debut, b.age_max, b.nb_places,
          b.avantages, b.nationalites_eligibles, b.documents_requis, b.criteres]);
    }
    console.log('✅ Détails des bourses mis à jour');

    // ── TABLE LM_VERSIONS ──────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS lm_versions (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
        version          INTEGER NOT NULL DEFAULT 1,
        contenu          TEXT NOT NULL,
        universite       VARCHAR(300),
        score            INTEGER,
        points_forts     JSONB,
        points_ameliorer JSONB,
        evaluation       JSONB,
        version_corrigee TEXT,
        created_at       TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── TABLE CV_VERSIONS ───────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS cv_versions (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
        version             INTEGER NOT NULL DEFAULT 1,
        contenu             TEXT NOT NULL,
        pays_cible          VARCHAR(100),
        score               INTEGER,
        points_forts        JSONB,
        corrections         JSONB,
        sections_manquantes JSONB,
        norme_pays          JSONB,
        version_corrigee    TEXT,
        created_at          TIMESTAMPTZ DEFAULT NOW()
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
