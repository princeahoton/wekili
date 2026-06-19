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
