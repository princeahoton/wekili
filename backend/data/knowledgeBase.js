'use strict';

// ═══════════════════════════════════════════════════════════════════
// BASE DE CONNAISSANCES WEKILI — Données vérifiées 2025-2026
// ═══════════════════════════════════════════════════════════════════

const BASE_CONNAISSANCES = {

  // ── Bourses peu connues / cachées ────────────────────────────────
  bourses_cachees: [
    {
      nom: 'Bourses SCAC (Service de Coopération et d\'Action Culturelle)',
      organisme: 'Ambassades de France dans chaque pays',
      description: 'Bourses d\'excellence gérées LOCALEMENT par chaque ambassade française — très peu publicisées sur Internet, pas sur Campus France',
      montant: 'Variable selon ambassade (souvent 800-1200€/mois)',
      eligibilite: 'Profil excellent, motivation claire, contact direct avec l\'attaché culturel',
      conseil: 'Contacter directement le service culturel de l\'ambassade de France dans votre pays avant octobre — ne pas attendre une annonce publique',
      deadline_type: 'Souvent octobre-novembre pour rentrée septembre suivant',
      pays_etude: 'France',
    },
    {
      nom: 'Bourses Initiatives-Jeunes (FIJI)',
      organisme: 'Campus France / Ministère des Affaires Étrangères',
      description: 'Programme sous-médiatisé pour projets de mobilité jeunes francophones — souvent pas en page d\'accueil',
      conseil: 'Chercher dans "Autres bourses" ou "Bourses spécifiques" sur campusfrance.org — pas visible en navigation principale',
      pays_etude: 'France',
    },
    {
      nom: 'Bourses BID (Banque Islamique de Développement)',
      organisme: 'Banque Islamique de Développement (IsDB)',
      description: 'Disponible pour étudiants des pays membres de l\'OCI — très peu connue des étudiants francophones',
      pays_eligibles: ['Bénin', 'Sénégal', 'Mali', 'Burkina Faso', 'Niger', 'Guinée', 'Tchad', 'Cameroun', 'Mauritanie', 'Gabon', 'Côte d\'Ivoire'],
      lien_officiel: 'https://www.isdb.org/scholarship-programs',
      conseil: 'Très compétitif mais moins demandé que les bourses françaises — candidater en priorité si pays éligible',
    },
    {
      nom: 'Bourses AUF (Agence Universitaire de la Francophonie)',
      organisme: 'AUF',
      description: 'Mobilité académique pour étudiants des universités membres de l\'AUF',
      lien_officiel: 'https://www.auf.org/nos-actions/appuis-aux-formations/bourses-de-recherche/',
      conseil: 'Votre université doit être membre AUF — vérifier sur auf.org avant de candidater',
    },
    {
      nom: 'MasterCard Foundation Scholars Program',
      organisme: 'MasterCard Foundation + universités partenaires',
      description: 'Programme pour leaders africains — couvre frais + logement + billet aller-retour + allocation mensuelle',
      universites_partenaires: ['Sciences Po', 'University of Edinburgh', 'McGill University', 'University of Toronto', 'University of California Berkeley'],
      conseil: 'Très sélectif (leadership, impact Afrique) mais couverture TOTALE — candidater dès octobre N-1 pour rentrée N',
    },
    {
      nom: 'Bourses Erasmus+ pour pays partenaires',
      organisme: 'Union Européenne / universités partenaires',
      description: 'Accords Erasmus+ entre universités africaines et européennes — souvent ignorées par les étudiants',
      lien_officiel: 'https://erasmus-plus.ec.europa.eu',
      conseil: 'Contacter le bureau des relations internationales de VOTRE université actuelle — ces bourses sont attribuées via votre université',
    },
    {
      nom: 'Bourse Eiffel Excellence',
      organisme: 'Campus France / Ministère de l\'Europe et des Affaires Étrangères',
      description: 'Bourse très compétitive pour Master et Doctorat — ~1800€/mois couverture totale',
      lien_officiel: 'https://www.campusfrance.org/fr/eiffel',
      eligibilite_minimale: 'Candidature via ÉTABLISSEMENT FRANÇAIS (pas vous directement)',
      conseil: 'C\'est l\'université française qui dépose le dossier, pas l\'étudiant — contacter directement les universités visées pour qu\'elles vous proposent',
      deadline: 'Dossier université : novembre-janvier pour rentrée septembre',
    },
    {
      nom: 'Bourses ARES (Belgique)',
      organisme: 'Académie de Recherche et d\'Enseignement Supérieur de Belgique',
      description: 'Financement total pour Master et formations spécialisées en Belgique',
      lien_officiel: 'https://www.ares-ac.be/fr/cooperation-au-developpement/bourses',
      conseil: 'Deadline stricte — vérifier annuellement sur le site ARES (souvent février)',
    },
  ],

  // ── Pièges courants à éviter ─────────────────────────────────────
  pieges_courants: [
    {
      piege: 'Date limite Campus France trop optimiste',
      realite: 'La plateforme CEF ferme 3-4 semaines AVANT la date officielle à cause de la surcharge serveur — les derniers jours, le site est inaccessible ou très lent',
      conseil: 'Finaliser et soumettre le dossier minimum 3 semaines avant la deadline affichée. NE PAS attendre le dernier moment.',
      impact: 'Critique — dossier non pris en compte',
    },
    {
      piege: 'Délai Uni-Assist sous-estimé (Allemagne)',
      realite: 'L\'évaluation réelle Uni-Assist prend 6-10 semaines, PAS 3-4 semaines comme indiqué officiellement. En période de pointe, jusqu\'à 12 semaines.',
      conseil: 'Soumettre le dossier Uni-Assist minimum 3 mois avant la deadline universitaire. Vérifier aussi si APS Certificate requis (pays spécifiques — voir daad.de)',
      impact: 'Critique — candidature rejetée si évaluation incomplète à la deadline',
    },
    {
      piege: 'Certification linguistique expirée',
      realite: 'IELTS et TOEFL sont valables seulement 2 ans à la date de candidature — refusés automatiquement si expirés',
      conseil: 'Vérifier la date d\'expiration AVANT de postuler. Si expirée ou < 6 mois de validité, repasser l\'examen en priorité.',
      impact: 'Haute — dossier refusé automatiquement',
    },
    {
      piege: 'Légalisation et traduction assermentée sous-estimées',
      realite: 'La légalisation (apostille) + traduction assermentée peut prendre 1-3 MOIS selon les pays et les administrations, pas 1-2 semaines',
      conseil: 'Faire légaliser et traduire tous les documents officiels (diplômes, relevés de notes) minimum 2 mois avant la soumission',
      impact: 'Haute',
    },
    {
      piege: 'Confusion visa court séjour vs long séjour',
      realite: 'Pour des études de plus de 90 jours en France, un visa de LONG SÉJOUR valant titre de séjour (VLS-TS) est OBLIGATOIRE — pas un visa court séjour',
      conseil: 'Toujours demander un VLS-TS étudiant à l\'ambassade. Valider l\'OFII dans les 3 mois après arrivée (200€ à payer en ligne).',
      impact: 'Critique — refus à l\'entrée ou impossibilité de séjour légal',
    },
    {
      piege: 'Garant financier insuffisant',
      realite: 'Certaines ambassades exigent la preuve de ressources pour toute la durée des études — France : ~615€/mois × nombre de mois d\'études',
      conseil: 'Préparer les justificatifs financiers (relevés bancaires sur 3 mois, lettre de garant) bien à l\'avance — contacter l\'ambassade pour les montants exacts',
      impact: 'Haute — refus de visa',
    },
    {
      piege: 'Lettre de motivation générique',
      realite: 'Une lettre de motivation identique envoyée à plusieurs universités est détectée et pénalisée — les commissions vérifient le lien avec l\'université spécifique',
      conseil: 'Personnaliser chaque lettre avec le nom du programme, des professeurs, des laboratoires spécifiques à cette université',
      impact: 'Haute — dossier non retenu même avec un bon profil académique',
    },
  ],

  // ── Coûts réels vérifiés 2025-2026 ──────────────────────────────
  couts_reels: {
    procedures: {
      campus_france_cef: {
        description: 'Frais Campus France (Procédure CEF)',
        montant: '50€',
        payable: 'En ligne sur la plateforme CEF',
        note: 'Requis pour la France dans les pays CEF (majorité des pays d\'Afrique francophone)',
        lien_officiel: 'https://etudiant.campusfrance.org',
      },
      visa_france_vls_ts: {
        description: 'Visa étudiant long séjour France (VLS-TS)',
        montant: '50€',
        payable: 'Visa Application Center ou consulat',
        note: 'À ce montant s\'ajoute 200€ OFII (Office Français de l\'Immigration) à payer après arrivée en France sous 3 mois',
      },
      ofii_france: {
        description: 'Validation du VLS-TS (OFII)',
        montant: '200€',
        lien_officiel: 'https://www.ofii.fr',
        note: 'OBLIGATOIRE dans les 3 mois suivant l\'arrivée — sans ça, le titre de séjour n\'est pas valide',
      },
      uni_assist_allemagne: {
        description: 'Évaluation Uni-Assist (Allemagne)',
        montant_premier_dossier: '75€',
        montant_par_universite_supplementaire: '30€',
        exemple: '5 universités = 75€ + 4×30€ = 195€',
        lien_officiel: 'https://www.uni-assist.de',
        note: 'Certains pays (Cameroun, etc.) nécessitent aussi un APS Certificate — vérifier sur daad.de',
      },
      ucas_royaume_uni: {
        description: 'Frais UCAS (Royaume-Uni)',
        montant: '27.50£',
        inclus: 'Jusqu\'à 5 universités',
        lien_officiel: 'https://www.ucas.com',
      },
      visa_uk_student: {
        description: 'Visa étudiant Royaume-Uni (Student Visa)',
        montant: '490£',
        ihs_healthcare: '776£ par an (Healthcare Surcharge)',
        note: 'Coût total élevé — prévoir aussi l\'IHS',
      },
      permis_etudes_canada: {
        description: 'Permis d\'études Canada',
        montant: 'CAD 150 (environ 105€)',
        lien_officiel: 'https://www.canada.ca/fr/immigration-refugies-citoyennete',
        note: 'Certaines universités canadiennes exigent aussi la LOA (Letter of Acceptance) avant le permis',
      },
      visa_national_allemagne: {
        description: 'Visa national Allemagne (type D étudiant)',
        montant: '75€',
        lien_officiel: 'https://www.auswaertiges-amt.de',
      },
      visa_national_belgique: {
        description: 'Visa national Belgique (type D étudiant)',
        montant: '180€',
        lien_officiel: 'https://dofi.ibz.be',
      },
    },

    frais_vie_mensuels_2026: {
      Paris:       { min: 1200, max: 2000, detail: 'Loyer 600-1100€ (hors CROUS) + 400-600€ vie courante' },
      Lyon:        { min: 900,  max: 1400, detail: 'Loyer 450-800€ + vie courante' },
      Bordeaux:    { min: 850,  max: 1350, detail: 'Ville étudiante dynamique, loyers en hausse' },
      Toulouse:    { min: 850,  max: 1300, detail: 'Forte population étudiante, bonne qualité de vie' },
      Montpellier: { min: 800,  max: 1250 },
      Strasbourg:  { min: 800,  max: 1300, detail: 'Proche Allemagne, option train transfrontalier' },
      Rennes:      { min: 750,  max: 1150, detail: 'Moins cher, très bonne université' },
      Berlin:      { min: 950,  max: 1600, detail: 'Loyer 600-900€ — en forte hausse ces dernières années' },
      Munich:      { min: 1200, max: 2000, detail: 'Très cher — CROUS équivalent (Studentenwerk) très demandé' },
      Londres:     { min: 1800, max: 3000, detail: 'TRÈS élevé — prévoir budget sérieux. Zone 1-2 : 1200-1800£ logement seul' },
      Montreal:    { min: 1000, max: 1600, detail: 'En CAD — environ 700-1100€. Moins cher que Toronto' },
      Toronto:     { min: 1400, max: 2200, detail: 'En CAD — l\'une des villes les plus chères du Canada' },
      Bruxelles:   { min: 1000, max: 1600, detail: 'Loyer 500-900€. Avantage : CPAS étudiant disponible' },
    },
  },

  // ── Délais réels vs officiels ────────────────────────────────────
  delais_reels: {
    visa_france_depuis_afrique: {
      officiel: '15 jours ouvrés',
      reel: '3-8 semaines',
      conseil: 'Déposer le dossier MINIMUM 2 mois avant la date de départ prévue',
    },
    visa_canada_depuis_afrique: {
      officiel: '8 semaines',
      reel: '8-20 semaines (jusqu\'à 5 mois pour certains pays)',
      conseil: 'Déposer 4-5 mois avant la rentrée — certains dossiers africains prennent beaucoup plus longtemps',
    },
    visa_uk_depuis_afrique: {
      officiel: '3 semaines',
      reel: '4-8 semaines',
      conseil: 'Déposer 2 mois avant la date souhaitée',
    },
    visa_allemagne_depuis_afrique: {
      officiel: '4-6 semaines',
      reel: '6-12 semaines',
      conseil: 'Déposer 3 mois avant — certains pays d\'Afrique de l\'Ouest ont des délais très longs',
    },
    legalisation_apostille: {
      officiel: '1-2 semaines',
      reel: '4-8 semaines selon le pays',
      conseil: 'Prévoir 2 mois minimum pour la légalisation et la traduction assermentée',
    },
    uni_assist_evaluation: {
      officiel: '3-4 semaines',
      reel: '6-10 semaines (jusqu\'à 12 en période haute)',
      conseil: 'Soumettre Uni-Assist 3 mois avant la deadline universitaire',
    },
  },

  // ── Instructions de validation anti-hallucination ─────────────
  regles_validation: [
    'JAMAIS inventer une URL — écrire "À vérifier sur le site officiel" si incertain à 100%',
    'JAMAIS affirmer qu\'une bourse est "garantie" ou "certaine" — utiliser des probabilités',
    'JAMAIS inventer un montant précis sans le qualifier de "environ" ou "à vérifier officiellement"',
    'TOUJOURS utiliser les délais RÉELS (plus longs) pas les délais officiels optimistes',
    'TOUJOURS citer les vraies données du profil dans la synthèse (prénom, pays, moyenne, etc.)',
    'Si une info est incertaine : dire "Je recommande de vérifier sur..." plutôt qu\'inventer',
    'Le score global doit être HONNÊTE — ne pas surestimer pour faire plaisir',
    'Les programmes recommandés doivent EXISTER RÉELLEMENT — préférer moins de recommandations mais vraies',
  ],
};

// ═══════════════════════════════════════════════════════════════════
// SPÉCIFICITÉS PAR PAYS — Données terrain pour l'Afrique francophone
// ═══════════════════════════════════════════════════════════════════

const SPECIFICITES_PAR_PAYS = {

  BJ: {
    noms: ['Bénin', 'Benin', 'béninois', 'beninois'],
    systeme_educatif: {
      bac: 'Baccalauréat béninois (Séries C, D, A — système français)',
      superieur: 'Système LMD depuis 2007, accrédité par le CAMES',
      universites_principales: ['Université d\'Abomey-Calavi (UAC, Cotonou)', 'UNSTIM', 'ENEAM'],
      equivalence_principale: '14/20 au Bénin = Mention Bien (bien perçu par les universités françaises)',
    },
    equivalences_diplomes: {
      'Licence (3 ans / 180 crédits ECTS)': 'Équivalent Licence L3 française — bien reconnu',
      'Maîtrise (4 ans)': 'Ancien système — équivalent Master 1 (vérifier via ENIC-NARIC)',
      'Master (5 ans)': 'Équivalent Master 2 français',
      'DEA/DESS': 'Équivalent Master 2 recherche/professionnel',
    },
    campus_france: {
      bureau: 'Campus France Bénin',
      ville: 'Cotonou',
      lien: 'https://benin.campusfrance.org',
      tel: '+229 21 30 06 78',
      note: 'Procédure CEF OBLIGATOIRE pour candidater en France',
    },
    ambassade_france: {
      ville: 'Cotonou',
      adresse: 'Avenue Jean-Paul II, Cotonou',
      lien: 'https://bj.ambafrance.org',
    },
    bourses_nationales: [
      'Bourse gouvernementale béninoise (MESRS)',
      'Bourse BID (Banque Islamique de Développement) — pays membre OCI',
      'Bourses AUF si université membre',
    ],
    aps_uni_assist: {
      requis_uni_assist: true,
      conseil: 'Bénin dans la liste Uni-Assist — soumettre 3 mois avant deadline. Vérifier si APS Certificate requis via anabin.kmk.org ou daad.de',
      delai_reel: '2-3 mois (Uni-Assist)',
    },
    conseil_specifique: 'L\'UAC est bien connue des universités françaises via l\'espace CAMES. Mentionner explicitement l\'accréditation CAMES dans le dossier. Si dans le top 10% de promotion, l\'indiquer — c\'est très valorisé.',
  },

  SN: {
    noms: ['Sénégal', 'Senegal', 'sénégalais', 'senegalais'],
    systeme_educatif: {
      bac: 'Baccalauréat sénégalais (S1 Maths, S2 Sciences, L Lettres, G1/G2 Gestion, T Technique)',
      superieur: 'Système LMD depuis 2012. UCAD et UGB sont les références nationales.',
      universites_principales: ['UCAD (Cheikh Anta Diop, Dakar)', 'UGB (Gaston Berger, Saint-Louis)', 'UAS (Ziguinchor)'],
      equivalence_principale: '14/20 à l\'UCAD = Mention Bien — très bien vu en France',
    },
    equivalences_diplomes: {
      'Licence (L3)': 'Équivalent L3 français — excellente reconnaissance',
      'Master 1': 'Équivalent M1 français',
      'Master 2 / DESS': 'Équivalent M2 français',
    },
    campus_france: {
      bureau: 'Campus France Sénégal',
      ville: 'Dakar',
      lien: 'https://senegal.campusfrance.org',
      tel: '+221 33 889 38 60',
      note: 'L\'un des bureaux Campus France les plus actifs d\'Afrique — accompagnement personnalisé',
    },
    ambassade_france: {
      ville: 'Dakar',
      adresse: '1 Place de l\'Indépendance, Dakar',
      lien: 'https://sn.ambafrance.org',
    },
    bourses_nationales: [
      'Bourse gouvernementale MEFP (Ministère de l\'Enseignement supérieur)',
      'Bourse BID',
      'Bourses Banque Mondiale (programmes spécifiques)',
    ],
    aps_uni_assist: {
      requis_uni_assist: true,
      conseil: 'Sénégal dans liste Uni-Assist — délai réel 2-3 mois. Vérifier APS via anabin',
    },
    conseil_specifique: 'L\'UCAD a une forte réputation en France. Si top 10% de promotion, le mentionner explicitement. Les étudiants sénégalais sont bien accueillis par les universités françaises.',
  },

  CI: {
    noms: ['Côte d\'Ivoire', 'Cote d\'Ivoire', 'ivoirien', 'ivoirienne'],
    systeme_educatif: {
      bac: 'Baccalauréat ivoirien (Séries A, B, C, D, E, G)',
      superieur: 'Système LMD. Universités principales : UFHB, INP-HB (Grandes Écoles), INPHB',
      universites_principales: ['UFHB (Félix Houphouët-Boigny, Abidjan)', 'INP-HB (Yamoussoukro — Grandes Écoles)', 'Université Alassane Ouattara (Bouaké)'],
      equivalence_principale: '14/20 = Mention Bien — bon niveau reconnu',
    },
    campus_france: {
      bureau: 'Campus France Côte d\'Ivoire',
      ville: 'Abidjan',
      lien: 'https://cotedivoire.campusfrance.org',
    },
    bourses_nationales: [
      'Bourse d\'excellence MESRS (Ministère de l\'Enseignement Supérieur)',
      'Bourse BID',
    ],
    aps_uni_assist: {
      requis_uni_assist: true,
      conseil: 'CI dans liste Uni-Assist — délai 3-4 mois. Vérifier APS Certificate via daad.de/anabin',
    },
    conseil_specifique: 'INP-HB est l\'équivalent d\'une Grande École ivoirienne — très reconnu pour les filières ingénieurs en France. Si diplômé INP-HB, le mettre en avant explicitement dans le dossier.',
  },

  CM: {
    noms: ['Cameroun', 'Cameroon', 'camerounais', 'camerounaise'],
    systeme_educatif: {
      bac: 'BILINGUE : Baccalauréat (francophone) OU GCE A-Level (anglophone)',
      superieur: 'Deux systèmes parallèles : LMD francophone + HND/BSc anglophone',
      universites_principales: ['Université de Yaoundé I et II', 'Université de Douala', 'Université de Buea (anglophone)'],
      note_importante: 'Préciser IMPÉRATIVEMENT dans chaque dossier si le diplôme est francophone ou anglophone',
    },
    equivalences_diplomes: {
      'Licence (francophone, 3 ans)': 'Équivalent L3 français',
      'HND (anglophone, 2 ans après A-Level)': 'Équivalent DUT/BTS — souvent en L2 ou L3 en France selon appréciation',
      'Master (francophone)': 'Équivalent M2 français',
      'Maîtrise (ancien régime francophone)': 'Équivalent M1 (vérifier ENIC-NARIC)',
    },
    campus_france: {
      bureau: 'Campus France Cameroun',
      ville: 'Yaoundé',
      lien: 'https://cameroun.campusfrance.org',
    },
    ambassade_france: {
      ville: 'Yaoundé',
      lien: 'https://cm.ambafrance.org',
    },
    bourses_nationales: [
      'Bourse gouvernementale camerounaise (MINESUP)',
    ],
    aps_uni_assist: {
      requis_uni_assist: true,
      aps_certificate_requis: true,
      lien_aps: 'https://aps.daad.de',
      delai_reel: '3-5 mois',
      conseil: 'ATTENTION : Le Cameroun est EXPLICITEMENT listé par DAAD comme pays requérant l\'APS Certificate pour l\'Allemagne. Délai réel 3-5 mois — commencer la demande APS 5 mois avant la deadline. C\'est la première étape pour l\'Allemagne.',
    },
    conseil_specifique: 'Les diplômes anglophones camerounais peuvent créer des confusions en France — faire valider l\'équivalence via ENIC-NARIC (gratuit, en ligne). Pour les universités françaises, la langue d\'enseignement (français/anglais) doit être précisée dans chaque dossier.',
  },

  ML: {
    noms: ['Mali', 'malien', 'malienne'],
    systeme_educatif: {
      bac: 'Baccalauréat malien (Sciences Exactes, Sciences Naturelles, Lettres, Économie)',
      superieur: 'Université des Sciences Sociales et de Gestion de Bamako (USSGB), Université des Sciences, Techniques et Technologies',
    },
    campus_france: {
      bureau: 'Campus France Mali',
      ville: 'Bamako',
      lien: 'https://mali.campusfrance.org',
      note: 'Fonctionnement maintenu — vérifier actualité diplomatique avant rendez-vous',
    },
    ambassade_france: {
      note: 'Relations diplomatiques complexes depuis 2022 — privilégier Campus France Bamako pour les démarches',
    },
    aps_uni_assist: {
      requis_uni_assist: true,
      aps_certificate_requis: false,
      conseil: 'Mali dans liste Uni-Assist standard — vérifier via uni-assist.de. Pas d\'APS Certificate requis a priori.',
    },
    conseil_specifique: 'Vu le contexte géopolitique, certaines procédures administratives peuvent être plus longues. Prévoir des délais supplémentaires et s\'assurer que tous les documents officiels sont légalisés apostille bien avant.',
  },

  BF: {
    noms: ['Burkina Faso', 'burkinabè', 'burkinabe', 'burkinabé'],
    systeme_educatif: {
      bac: 'Baccalauréat burkinabè (A, B, C, D, E)',
      superieur: 'Université Joseph Ki-Zerbo (Ouagadougou), Université Aube Nouvelle, UPB',
    },
    campus_france: {
      bureau: 'Campus France Burkina Faso',
      ville: 'Ouagadougou',
      lien: 'https://burkinafaso.campusfrance.org',
      note: 'Vérifier l\'état de fonctionnement en 2026 en raison du contexte sécuritaire',
    },
    aps_uni_assist: {
      requis_uni_assist: true,
      conseil: 'Burkina Faso dans liste Uni-Assist — vérifier selon université visée',
    },
    conseil_specifique: 'Le contexte sécuritaire peut rallonger les délais administratifs. Commencer toutes les démarches 2-3 mois plus tôt que les délais standard.',
  },

  TG: {
    noms: ['Togo', 'togolais', 'togolaise'],
    systeme_educatif: {
      bac: 'Baccalauréat togolais (A, B, C, D, E, F, G)',
      superieur: 'Université de Lomé (principale), UCAO',
    },
    campus_france: {
      bureau: 'Campus France Togo',
      ville: 'Lomé',
      lien: 'https://togo.campusfrance.org',
    },
    aps_uni_assist: {
      requis_uni_assist: true,
      conseil: 'Togo dans liste Uni-Assist — délai réel 2-3 mois',
    },
  },

  MG: {
    noms: ['Madagascar', 'malgache', 'malagasy'],
    systeme_educatif: {
      bac: 'Baccalauréat malgache',
      superieur: 'Université d\'Antananarivo (principale), système LMD depuis 2007',
      note: 'Langue d\'enseignement : français et malgache selon filière',
    },
    campus_france: {
      bureau: 'Campus France Madagascar',
      ville: 'Antananarivo',
      lien: 'https://madagascar.campusfrance.org',
    },
    conseil_specifique: 'Les équivalences malgaches sont bien reconnues en France grâce aux accords historiques. Préciser que la formation était en français dans chaque dossier.',
  },

  GN: {
    noms: ['Guinée', 'Guinee', 'guinéen', 'guineen', 'Guinea Conakry'],
    systeme_educatif: {
      bac: 'Baccalauréat guinéen',
      superieur: 'Université Gamal Abdel Nasser de Conakry, Université Julius Nyerere de Kankan',
    },
    campus_france: {
      bureau: 'Campus France Guinée',
      ville: 'Conakry',
      lien: 'https://guinee.campusfrance.org',
    },
  },

  NE: {
    noms: ['Niger', 'nigérien', 'nigerien'],
    systeme_educatif: {
      superieur: 'Université Abdou Moumouni de Niamey',
    },
    campus_france: {
      bureau: 'Campus France Niger',
      ville: 'Niamey',
      lien: 'https://niger.campusfrance.org',
      note: 'Vérifier l\'état de fonctionnement en 2026',
    },
  },

  GA: {
    noms: ['Gabon', 'gabonais', 'gabonaise'],
    systeme_educatif: {
      superieur: 'Université Omar Bongo (UOB), USTM (Libreville)',
    },
    campus_france: {
      bureau: 'Campus France Gabon',
      ville: 'Libreville',
      lien: 'https://gabon.campusfrance.org',
    },
    bourses_nationales: [
      'Bourse IPES (Institut Pédagogique de l\'Enseignement Supérieur du Gabon) — accompagnement officiel',
    ],
    conseil_specifique: 'Le Gabon a des accords de coopération solides avec la France. Les boursiers IPES bénéficient d\'un suivi spécifique. Contacter l\'IPES avant toute démarche pour voir si éligible.',
  },

  CG: {
    noms: ['Congo-Brazzaville', 'Congo Brazzaville', 'République du Congo', 'congolais (Brazzaville)'],
    campus_france: {
      bureau: 'Campus France Congo',
      ville: 'Brazzaville',
      lien: 'https://congo.campusfrance.org',
    },
  },

  CD: {
    noms: ['RDC', 'Congo-Kinshasa', 'République démocratique du Congo', 'congolais (Kinshasa)', 'RD Congo'],
    systeme_educatif: {
      bac: 'Diplôme d\'État (équivalent Baccalauréat)',
      superieur: 'Système BELGE (Graduat 3 ans + Licence 2 ans + Doctorat) — DIFFÉRENT du LMD',
      universites_principales: ['Université de Kinshasa (UNIKIN)', 'Université de Lubumbashi (UNILU)', 'Université Catholique de Bukavu (UCB)'],
      note_importante: 'Le "Graduat" (3 ans) ≠ Licence LMD — peut créer des confusions dans les dossiers',
    },
    equivalences_diplomes: {
      'Graduat (3 ans)': 'Équivalent L3 français — FAIRE VALIDER par ENIC-NARIC avant de postuler',
      'Licence (5 ans après Graduat)': 'Équivalent Master 1 ou 2 selon université — vérifier cas par cas',
      'Diplôme d\'Études Approfondies (DEA)': 'Équivalent Master 2 recherche',
    },
    campus_france: {
      bureau: 'Campus France RDC',
      ville: 'Kinshasa',
      lien: 'https://rdc.campusfrance.org',
    },
    conseil_specifique: 'PRIORITÉ : Faire valider l\'équivalence du Graduat ou de la Licence via ENIC-NARIC (gratuit, 2-4 semaines). Cette démarche évite les refus de dossier. Préciser "formation en français, système belge" dans TOUS les dossiers.',
  },

  TD: {
    noms: ['Tchad', 'tchadien', 'tchadienne'],
    campus_france: {
      bureau: 'Campus France Tchad',
      ville: 'N\'Djamena',
      lien: 'https://tchad.campusfrance.org',
    },
  },

  MR: {
    noms: ['Mauritanie', 'mauritanien', 'mauritanienne'],
    systeme_educatif: {
      note: 'Pays arabophone avec enseignement supérieur bilingue arabe/français selon filière',
    },
    campus_france: {
      bureau: 'Campus France Mauritanie',
      ville: 'Nouakchott',
      lien: 'https://mauritanie.campusfrance.org',
    },
  },

  RW: {
    noms: ['Rwanda', 'rwandais', 'rwandaise'],
    systeme_educatif: {
      note: 'Pays trilingue mais enseignement supérieur principalement ANGLOPHONE depuis 2008',
      conseil: 'Pour les universités françaises : préciser le niveau de français et les cours suivis en français',
    },
    campus_france: {
      note: 'Pas de bureau Campus France à Kigali — contacter l\'ambassade de France ou Campus France Paris',
      lien: 'https://www.campusfrance.org',
    },
    conseil_specifique: 'Pour la France et la Belgique francophone : justifier le niveau de français (certification DELF/DALF recommandée). Pour le Royaume-Uni et le Canada anglophone : diplômes rwandais bien reconnus.',
  },
};

// ── Helper : trouver les spécificités d'un pays ──────────────────
function trouverSpecificitesPays(paysInput) {
  if (!paysInput || typeof paysInput !== 'string') return null;
  const norm = paysInput.trim().toLowerCase();
  for (const [code, data] of Object.entries(SPECIFICITES_PAR_PAYS)) {
    if (data.noms && data.noms.some(n => {
      const nl = n.toLowerCase();
      return norm === nl || norm.includes(nl) || nl.includes(norm);
    })) {
      return { code, ...data };
    }
  }
  return null;
}

module.exports = { BASE_CONNAISSANCES, SPECIFICITES_PAR_PAYS, trouverSpecificitesPays };
