const Anthropic = require('@anthropic-ai/sdk');
const { construireContexteComplet, formatContextePays } = require('./contextService');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ═══════════════════════════════════════════════════════════════════
// PROMPTS
// ═══════════════════════════════════════════════════════════════════

// ── MODULE 1 — Analyse de dossier (enrichie avec contexte pays + historique) ──
const promptAnalyseDossier = (profil, docs, contexte = {}) => {
  const docList = docs.map(d => `- ${d.type}: ${d.nom_fichier || ''}${d.statut ? ` (${d.statut})` : ''}`).join('\n') || 'Aucun document uploadé';

  const {
    specificites_pays,
    historique_analyses = [],
    top_bourses_matchees = [],
    top_universites_matchees = [],
    candidatures_actives = [],
    progression_score,
    base_connaissances,
  } = contexte;

  const paysBlock = formatContextePays(specificites_pays);

  const historiqueBlock = historique_analyses.length > 0 ? `
═══════════════════════════════════════
HISTORIQUE DES ANALYSES PRÉCÉDENTES
═══════════════════════════════════════
${historique_analyses.map((a, i) => `  Analyse ${i + 1} (${new Date(a.created_at).toLocaleDateString('fr-FR')}) : ${a.score_global}/100`).join('\n')}
${progression_score ? `Progression : ${progression_score.premiere} → ${progression_score.derniere} (${progression_score.delta >= 0 ? '+' : ''}${progression_score.delta} pts)` : ''}` : '';

  const matchesBlock = (top_bourses_matchees.length > 0 || top_universites_matchees.length > 0) ? `
═══════════════════════════════════════
MATCHES EN BASE DE DONNÉES WEKILI
═══════════════════════════════════════
${top_bourses_matchees.length > 0 ? `Top bourses matchées      : ${top_bourses_matchees.slice(0, 4).map(b => `${b.nom} (${b.score_eligibilite}%)`).join(' | ')}` : ''}
${top_universites_matchees.length > 0 ? `Top universités matchées  : ${top_universites_matchees.slice(0, 4).map(u => `${u.nom} ${u.pays} (${u.score_admission}%)`).join(' | ')}` : ''}
${candidatures_actives.length > 0 ? `Candidatures en cours      : ${candidatures_actives.map(c => `${c.universite} (vœu ${c.voeu_numero} — ${c.statut})`).join(', ')}` : ''}` : '';

  const couts = base_connaissances?.couts_reels?.procedures || {};
  const coutsCampusFrance = couts.campus_france_cef?.montant || '50€';
  const coutsVisaFR = couts.visa_france_vls_ts?.montant || '50€';

  const boursesCache = (base_connaissances?.bourses_cachees || []).slice(0, 3)
    .map(b => `  • ${b.nom} : ${b.conseil}`).join('\n');

  const pieges = (base_connaissances?.pieges_courants || []).slice(0, 3)
    .map(p => `  ⚠ ${p.piege} : ${p.conseil}`).join('\n');

  return `Tu es Wekili, un expert senior en admissions universitaires internationales avec 10 ans
d'expérience dans l'accompagnement des étudiants africains francophones. Tu connais parfaitement :
• Les équivalences des diplômes africains dans chaque pays (CAMES, systèmes nationaux)
• Les pièges réels des procédures (Campus France, Uni-Assist, APS, visa)
• Les bourses cachées peu connues (SCAC, BID, AUF, Erasmus+)
• Les délais réels versus les délais officiels optimistes

═══════════════════════════════════════
PROFIL DE L'ÉTUDIANT
═══════════════════════════════════════
Prénom           : ${profil.prenom || 'Non précisé'}
Nationalité      : ${profil.nationalite || 'Non précisé'}
Pays de résidence: ${profil.pays_residence || 'Non précisé'}
Niveau actuel    : ${profil.niveau_etudes || 'Non précisé'}
Établissement    : ${profil.etablissement || 'Non précisé'}
Domaine d'études : ${profil.domaine || 'Non précisé'}
Spécialisation   : ${profil.specialisation || 'Non précisé'}
Moyenne générale : ${profil.moyenne || 'Non précisé'}/20
Langue principale: ${profil.langue_principale || 'Non précisé'} — niveau ${profil.niveau_langue || 'Non précisé'}
Certification    : ${profil.certification || 'Aucune'}
Pays cibles      : ${(profil.pays_cibles || []).join(', ') || 'Non précisé'}
Niveau visé      : ${profil.niveau_vise || 'Non précisé'}
Objectif bourse  : ${profil.objectif_bourse || 'Non précisé'}

═══════════════════════════════════════
DOCUMENTS UPLOADÉS (${docs.length})
═══════════════════════════════════════
${docList}
${paysBlock}
${historiqueBlock}
${matchesBlock}

═══════════════════════════════════════
COÛTS RÉELS VÉRIFIÉS 2025-2026
═══════════════════════════════════════
• Campus France (CEF)      : ${coutsCampusFrance}
• Visa France (VLS-TS)     : ${coutsVisaFR} + 200€ OFII après arrivée
• Uni-Assist (Allemagne)   : 75€ 1er dossier + 30€/université supplémentaire
• UCAS (Royaume-Uni)       : 27.50£ pour 5 universités
• Visa UK                  : 490£ + healthcare surcharge
• Permis études Canada     : CAD 150 (≈105€)

═══════════════════════════════════════
BOURSES PEU CONNUES À MENTIONNER
═══════════════════════════════════════
${boursesCache || '  (Non disponibles)'}

═══════════════════════════════════════
PIÈGES COURANTS À SIGNALER
═══════════════════════════════════════
${pieges || '  (Non disponibles)'}

═══════════════════════════════════════
RÈGLES ABSOLUES — NE PAS ENFREINDRE
═══════════════════════════════════════
1. JAMAIS inventer une URL — écrire "À vérifier sur le site officiel" si incertain
2. JAMAIS affirmer qu'une bourse est "garantie" — utiliser des probabilités honnêtes
3. TOUJOURS citer les vraies données du profil dans la synthèse (prénom, pays, moyenne, etc.)
4. TOUJOURS utiliser les délais réels (plus longs), pas les délais officiels optimistes
5. Les montants de bourses doivent être qualifiés de "environ" ou "à vérifier officiellement"
6. Le score_global doit être HONNÊTE — ne pas surestimer pour faire plaisir
7. Préférer MOINS de recommandations VRAIES que PLUS d'inventées

Réponds UNIQUEMENT en JSON valide (sans markdown, sans texte autour) :

{
  "score_global": <entier 0-100 — honnête et justifié>,
  "synthese": "<2-3 phrases concrètes citant les vraies données : prénom, nationalité, moyenne, domaine, pays visés>",
  "forces": [
    {"titre": "<force concrète>", "description": "<explication avec les données réelles du profil>"}
  ],
  "faiblesses": [
    {"titre": "<faiblesse concrète>", "description": "<explication concrète et actionnable>", "priorite": "haute|moyenne|basse"}
  ],
  "recommandations": [
    {"action": "<action concrète, actionnable avec délai>", "impact": "<impact chiffré si possible>", "priorite": "haute|moyenne|basse"}
  ],
  "programmes_recommandes": [
    {"nom": "<nom EXACT de la bourse — doit exister réellement>", "pays": "<pays>", "organisme": "<organisme>", "lien": "<URL officielle ou 'À vérifier sur le site officiel'>"}
  ],
  "estimation_chances": {
    "France": <0-100>,
    "Canada": <0-100>,
    "Belgique": <0-100>,
    "Allemagne": <0-100>,
    "Royaume-Uni": <0-100>
  }
}`;
};

// ── MODULE 2 — Recommandations universités ───────────────────────────
const promptUniversites = (profil, analyse) => `
Tu es un expert en admissions universitaires internationales.
Tu connais toutes les universités mondiales, leurs vrais critères d'admission et procédures.

PROFIL ÉTUDIANT :
- Domaine           : ${profil.domaine}
- Spécialisation    : ${profil.specialisation || 'Non précisé'}
- Niveau visé       : ${profil.niveau_vise}
- Moyenne           : ${profil.moyenne}/20
- Langues           : ${profil.langue_principale} niveau ${profil.niveau_langue}
- Pays cibles       : ${(profil.pays_cibles || []).join(', ')}
- Score Wekili      : ${analyse.score_global}/100

RÈGLES :
- Donne UNIQUEMENT de vraies universités qui existent
- Donne les VRAIS liens de candidature
- Donne les VRAIS frais 2025-2026
- Stratégie : 2 ambitieuses + 3 réalistes + 2 sûres par pays

Réponds UNIQUEMENT en JSON valide :
{
  "strategie_globale": "<conseil stratégique personnalisé>",
  "recommandations_par_pays": {
    "France": {
      "procedure": "Campus France",
      "cout_procedure": "50€",
      "lien_procedure": "https://etudiant.campusfrance.org",
      "nb_voeux_max": 7,
      "deadline_procedure": "2026-01-15",
      "universites": [
        {
          "rang": 1,
          "type": "realiste",
          "nom": "<nom exact>",
          "programme": "<programme exact>",
          "lien_officiel": "<URL réelle>",
          "lien_candidature": "<URL réelle>",
          "ville": "<ville>",
          "frais_scolarite": "<montant réel>",
          "chances_admission": <0-100>,
          "selectivite": "Modérée|Élevée|Très élevée|Faible",
          "classement_mondial": <nombre ou null>,
          "langue_cours": "Français|Anglais|Bilingue",
          "duree": "2 ans|3 ans",
          "points_forts": ["<point 1>", "<point 2>", "<point 3>"],
          "documents_requis": ["<doc 1>", "<doc 2>"],
          "deadline": "AAAA-MM-JJ",
          "frais_vie_mensuel": "<fourchette>"
        }
      ]
    }
  },
  "resume_couts_procedures": [
    {"pays": "<pays>", "plateforme": "<plateforme>", "cout": "<montant>", "visa": "<montant>", "total": "<montant>"}
  ],
  "conseil_strategique": "<conseil concret avec ordre de priorité>"
}`;

// ── MODULE 3 — Matching bourses ──────────────────────────────────────
const promptBourses = (profil, analyse) => `
Tu es un expert en bourses d'études internationales pour étudiants africains.

PROFIL :
- Nationalité       : ${profil.nationalite}
- Pays résidence    : ${profil.pays_residence}
- Niveau visé       : ${profil.niveau_vise}
- Domaine           : ${profil.domaine}
- Moyenne           : ${profil.moyenne}/20
- Pays cibles       : ${(profil.pays_cibles || []).join(', ')}
- Langues           : ${profil.langue_principale} niveau ${profil.niveau_langue}
- Score dossier     : ${analyse.score_global}/100

Donne UNIQUEMENT des bourses qui existent réellement avec leurs vrais liens.

Réponds en JSON :
{
  "total_bourses_trouvees": <nombre>,
  "bourses_tres_eligibles": [
    {
      "nom": "<nom exact>",
      "organisme": "<organisme>",
      "pays_etude": "<pays>",
      "montant": "<montant réel>",
      "type_financement": "total|partiel",
      "eligibilite_estimee": <0-100>,
      "deadline": "AAAA-MM-JJ",
      "lien_officiel": "<URL réelle>",
      "documents_requis": ["<doc>"],
      "pourquoi_eligible": "<explication personnalisée>"
    }
  ],
  "bourses_eligibles": [...],
  "bourses_a_travailler": [
    {
      "nom": "<nom>",
      "eligibilite_estimee": <0-100>,
      "bloquant": "<ce qui manque>",
      "conseil": "<comment y remédier>"
    }
  ],
  "plan_candidatures": [
    {"ordre": 1, "bourse": "<nom>", "deadline": "AAAA-MM-JJ", "action_immediate": "<action>"}
  ]
}`;

// ── MODULE 4 — Guide Campus France ──────────────────────────────────
const promptCampusFrance = (profil, universites_choisies) => `
Tu es un expert de la procédure Campus France.

PROFIL :
- Pays de résidence  : ${profil.pays_residence}
- Niveau visé        : ${profil.niveau_vise}
- Domaine            : ${profil.domaine}
- Universités visées : ${universites_choisies.join(', ')}

Génère un guide COMPLET et PERSONNALISÉ de la procédure Campus France 2025-2026.

Réponds en JSON :
{
  "presentation": "<description Campus France>",
  "cout_total": {
    "frais_dossier_cef": "50€",
    "visa_etudiant": "50€",
    "total": "100€",
    "moyen_paiement": "<info paiement>"
  },
  "plateforme": {
    "nom": "Espace CEF",
    "lien": "https://pastel.diplomatie.gouv.fr/etudesenfrance"
  },
  "calendrier_2026": {
    "ouverture_plateforme": "<date>",
    "deadline_dossier": "<date>",
    "entretiens": "<période>",
    "resultats": "<période>",
    "rentree": "Septembre 2026"
  },
  "etapes_detaillees": [
    {
      "numero": 1,
      "titre": "<titre étape>",
      "detail": "<description>",
      "duree_estimee": "<durée>",
      "documents_necessaires": ["<doc>"],
      "conseil": "<conseil pratique>",
      "deadline": "<deadline>"
    }
  ],
  "erreurs_a_eviter": ["<erreur 1>"],
  "ressources_utiles": [{"nom": "<nom>", "lien": "<URL>"}]
}`;

// ── MODULE 4 — Guide visa étudiant ──────────────────────────────────
const promptVisa = (pays_destination, profil) => `
Tu es un expert en visas étudiants internationaux.

PROFIL :
- Pays résidence   : ${profil.pays_residence}
- Pays destination : ${pays_destination}
- Niveau visé      : ${profil.niveau_vise}

Guide visa complet et à jour pour ${pays_destination}.

Réponds en JSON :
{
  "type_visa": "<type exact>",
  "cout": "<montant réel>",
  "lieu_demande": "<lieu>",
  "lien_officiel": "<URL>",
  "documents_requis": ["<doc>"],
  "etapes": [{"numero": 1, "titre": "<titre>", "detail": "<detail>"}],
  "delai_traitement": "<délai>",
  "duree_validite": "<durée>",
  "erreurs_a_eviter": ["<erreur>"],
  "apres_arrivee": ["<démarche à faire à l'arrivée>"]
}`;

// ── MODULE 4 — Guide Uni-Assist (Allemagne) ──────────────────────────
const promptUniAssist = (profil) => `
Tu es un expert des candidatures universitaires en Allemagne.

PROFIL :
- Domaine  : ${profil.domaine}
- Niveau   : ${profil.niveau_vise}
- Moyenne  : ${profil.moyenne}/20
- Langues  : ${profil.langue_principale} niveau ${profil.niveau_langue}

Guide Uni-Assist 2025-2026 avec les vraies informations.

Réponds en JSON :
{
  "presentation": "<description Uni-Assist>",
  "lien_officiel": "https://www.uni-assist.de",
  "couts": {
    "premier_dossier": "75€",
    "dossier_supplementaire": "30€",
    "exemple": "5 universités = 75 + (4×30) = 195€"
  },
  "document_aps": {
    "description": "<qu'est-ce que l'APS Certificate>",
    "obligatoire_pour": ["Cameroun", "Bénin", "Togo", "Côte d'Ivoire"],
    "cout": "<coût>",
    "lien": "<URL>"
  },
  "etapes": [{"numero": 1, "titre": "<titre>", "detail": "<detail>"}],
  "universites_sans_uni_assist": ["<université>"],
  "documents_requis": ["<doc>"],
  "deadlines_2026": {"semestre_hiver": "<date>", "semestre_ete": "<date>"}
}`;

// ── MODULE 4 — Guide UCAS (Royaume-Uni) ─────────────────────────────
const promptUCAS = (profil) => `
Tu es un expert des candidatures universitaires au Royaume-Uni via UCAS.

PROFIL :
- Domaine         : ${profil.domaine}
- Niveau          : ${profil.niveau_vise}
- Niveau anglais  : ${profil.niveau_langue}

Guide UCAS complet.

Réponds en JSON :
{
  "presentation": "<description UCAS>",
  "lien_officiel": "https://www.ucas.com",
  "couts": {
    "frais_ucas": "27.50£",
    "inclus": "5 universités maximum",
    "visa_etudiant": "490£",
    "total_estime": "520£+"
  },
  "nb_voeux": 5,
  "personal_statement": {
    "description": "<qu'est-ce que le PS>",
    "longueur": "4000 caractères maximum",
    "conseils": ["<conseil 1>"]
  },
  "exigences_anglais": {
    "minimum": "IELTS 6.5 ou TOEFL 90",
    "recommande": "IELTS 7.0+"
  },
  "etapes": [{"numero": 1, "titre": "<titre>", "detail": "<detail>"}],
  "deadlines_2026": {"deadline_principale": "<date>", "deadline_art": "<date>"}
}`;

// ── MODULE 5 — Correction lettre de motivation ───────────────────────
const promptCorrectionLM = (lm_texte, profil, universite_cible) => `
Tu es un expert en rédaction de lettres de motivation pour les admissions
universitaires internationales, spécialisé dans l'accompagnement des
étudiants africains.

CONTEXTE :
- Étudiant      : ${profil.prenom || 'l\'étudiant'}, ${profil.nationalite || profil.pays_residence}
- Niveau visé   : ${profil.niveau_vise} en ${profil.domaine}
- Université    : ${universite_cible}
- Moyenne       : ${profil.moyenne}/20

LETTRE À ANALYSER :
═══════════════════════════════
${lm_texte}
═══════════════════════════════

Analyse et corrige cette lettre. Réponds en JSON :
{
  "score_global": <0-100>,
  "evaluation_par_critere": {
    "accroche":              {"score": <0-100>, "commentaire": "<>", "exemple_amelioration": "<>"},
    "presentation_parcours": {"score": <0-100>, "commentaire": "<>"},
    "motivation_specifique": {"score": <0-100>, "commentaire": "<>", "conseil": "<>"},
    "projet_professionnel":  {"score": <0-100>, "commentaire": "<>"},
    "qualite_redaction":     {"score": <0-100>, "commentaire": "<>"},
    "longueur_format":       {"score": <0-100>, "commentaire": "<>"}
  },
  "points_forts": ["<point fort>"],
  "points_a_ameliorer": [
    {
      "probleme": "<problème>",
      "extrait_original": "<citation>",
      "suggestion": "<suggestion>",
      "exemple": "<exemple concret>"
    }
  ],
  "structure_recommandee": ["§1 <description>", "§2 <description>"],
  "version_corrigee_complete": "<lettre entière corrigée>",
  "conseil_final": "<conseil en 1-2 phrases>"
}`;

// ── MODULE 5 — Correction CV ─────────────────────────────────────────
const promptCorrectionCV = (cv_texte, profil, pays_cible) => `
Tu es un expert en rédaction de CV pour les candidatures universitaires
internationales selon les standards de ${pays_cible}.

CONTEXTE :
- Candidat      : ${profil.prenom || 'le candidat'}, ${profil.nationalite || profil.pays_residence}
- Niveau visé   : ${profil.niveau_vise} en ${profil.domaine}
- Pays cible    : ${pays_cible}

CV À ANALYSER :
═══════════════════
${cv_texte}
═══════════════════

Réponds en JSON :
{
  "score_global": <0-100>,
  "format_adapte_pays": <true|false>,
  "norme_pays": {
    "photo": "<recommandée/non recommandée/obligatoire>",
    "longueur": "<norme>",
    "age_etat_civil": "<inclure ou non>",
    "langue": "<langue du CV>"
  },
  "corrections": [
    {"section": "<section>", "probleme": "<problème>", "suggestion": "<suggestion>"}
  ],
  "sections_manquantes": ["<section manquante>"],
  "points_forts": ["<point fort>"],
  "version_corrigee": "<CV complet corrigé>",
  "conseil_final": "<conseil>"
}`;

// ── MODULE 5 — Simulation entretien Campus France ────────────────────
const promptEntretienCampusFrance = (profil, universites_choisies) => `
Tu es un agent Campus France simulant un entretien avec un étudiant.

PROFIL :
- Pays résidence : ${profil.pays_residence}
- Niveau visé    : ${profil.niveau_vise} en ${profil.domaine}
- Universités    : ${universites_choisies.join(', ')}
- Moyenne        : ${profil.moyenne}/20

Génère 15 questions typiques avec les meilleures réponses conseillées.

Réponds en JSON :
{
  "introduction": "<présentation de l'entretien>",
  "duree_moyenne": "20-30 minutes",
  "questions": [
    {
      "numero": 1,
      "categorie": "Parcours académique|Projet d'études|Financement|Vie en France|Questions pièges",
      "question": "<question exacte>",
      "pourquoi_posee": "<raison>",
      "reponse_conseillee": "<réponse modèle>",
      "erreurs_a_eviter": ["<erreur>"],
      "conseil": "<conseil pratique>"
    }
  ],
  "conseils_generaux": ["<conseil>"],
  "documents_a_apporter": ["<document>"]
}`;

// ── MODULE 5 — Génération projet d'études ────────────────────────────
const promptProjetEtudes = (profil, universite_cible, programme) => `
Tu es un expert en rédaction de projets d'études pour les candidatures
universitaires internationales.

CONTEXTE :
- Étudiant         : ${profil.prenom || 'l\'étudiant'}, ${profil.nationalite || profil.pays_residence}
- Parcours         : ${profil.niveau_etudes} en ${profil.domaine}, moyenne ${profil.moyenne}/20
- Programme visé   : ${programme}
- Université cible : ${universite_cible}
- Projet pro       : ${profil.projet_professionnel || 'Non précisé'}

Génère un projet d'études professionnel et convaincant.

Réponds en JSON :
{
  "structure": ["<§1 description>", "<§2 description>"],
  "longueur_recommandee": "500-800 mots",
  "points_cles": ["<point clé à inclure>"],
  "projet_complet": "<texte complet du projet d'études>",
  "conseil": "<conseil de personnalisation>"
}`;

// ── MODULE 6 — Logement ──────────────────────────────────────────────
const promptLogement = (profil, ville, budget_mensuel) => `
Tu es un expert en logement étudiant international.

PROFIL :
- Pays d'origine   : ${profil.pays_residence}
- Ville cible      : ${ville}
- Budget logement  : ${budget_mensuel}€/mois
- Date d'arrivée   : ${profil.date_arrivee || 'Septembre 2026'}

Recommandations concrètes et actualisées pour ${ville}.

Réponds en JSON :
{
  "analyse_budget": {
    "budget": "${budget_mensuel}€",
    "evaluation": "Confortable|Adapté|Insuffisant",
    "conseil": "<conseil budget>"
  },
  "options": [
    {
      "type": "Résidence CROUS|Colocation|Studio|Résidence privée",
      "cout_mensuel": "<fourchette>",
      "avantages": ["<avantage>"],
      "inconvenients": ["<inconvénient>"],
      "comment_postuler": "<démarche>",
      "lien_officiel": "<URL>",
      "timing": "<quand commencer les démarches>"
    }
  ],
  "aides_financieres": {
    "CAF": {
      "description": "<description>",
      "montant_estime": "<montant>",
      "lien": "https://www.caf.fr"
    }
  },
  "quartiers_recommandes": [{"nom": "<quartier>", "description": "<pourquoi>", "prix_moyen": "<€/mois>"}],
  "checklist_logement": ["<étape>"],
  "plateformes_recherche": [{"nom": "<nom>", "lien": "<URL>", "conseil": "<conseil>"}]
}`;

// ── MODULE 7 — Rappel personnalisé ───────────────────────────────────
const promptRappel = (etudiant, type_rappel, contexte) => `
Tu es le conseiller Wekili envoyant un rappel à un étudiant.

CONTEXTE :
- Étudiant        : ${etudiant.prenom}
- Type de rappel  : ${type_rappel}
- Deadline        : ${contexte.deadline}
- Jours restants  : ${contexte.jours_restants}
- Action requise  : ${contexte.action_requise}

Génère des messages personnalisés et motivants.

Réponds en JSON :
{
  "email": {
    "sujet": "<sujet court avec emoji et délai>",
    "corps": "<email complet 200-300 mots, bienveillant et actionnable>"
  },
  "sms": "<SMS max 160 caractères avec lien>",
  "whatsapp": "<message WhatsApp max 300 caractères avec emojis et mise en forme>"
}`;

// ── MODULE 8 — Guide arrivée ─────────────────────────────────────────
const promptGuideArrivee = (profil, pays_destination, ville) => `
Tu es un expert en intégration des étudiants africains à l'étranger.

PROFIL :
- Pays d'origine   : ${profil.pays_residence}
- Destination      : ${ville}, ${pays_destination}
- Première fois à l'étranger : oui

Guide pratique complet pour les 30 premiers jours à ${ville}.

Réponds en JSON :
{
  "checklist_avant_depart": [
    {"item": "<item>", "detail": "<detail>", "urgence": "critique|important|utile"}
  ],
  "jour_j": {
    "aeroport": "<info aéroport>",
    "transport_ville": "<options transport>",
    "premier_logement": "<conseil hébergement premier soir>"
  },
  "semaine_1": ["<démarche prioritaire>"],
  "mois_1": ["<démarche du mois>"],
  "contacts_utiles": {
    "urgences": "15 (SAMU) / 17 (Police) / 18 (Pompiers) / 112",
    "ambassade": "<info ambassade pays d'origine>",
    "asso_etudiants_africains": "<info>"
  },
  "banques_recommandees": [
    {"nom": "<banque>", "avantage": "<sans justificatif domicile si possible>", "lien": "<URL>"}
  ],
  "assurance_maladie": {"description": "<>", "comment_sinscrire": "<>", "cout": "<>"},
  "transport_etudiant": {"carte": "<nom carte>", "reduction": "<% réduction>", "lien": "<URL>"}
}`;

// ═══════════════════════════════════════════════════════════════════
// SERVICE CLAUDE
// ═══════════════════════════════════════════════════════════════════

class ClaudeService {

  async appeler(prompt, max_tokens = 4000, model = 'claude-sonnet-4-6') {
    const message = await client.messages.create({
      model,
      max_tokens,
      messages: [{ role: 'user', content: prompt }],
    });

    const texte = message.content[0].text.trim();

    // Essai direct
    try { return JSON.parse(texte); } catch { /* */ }

    // Extraction du premier bloc JSON
    const jsonMatch = texte.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try { return JSON.parse(jsonMatch[0]); } catch { /* */ }
    }

    throw new Error('Réponse Claude non parseable en JSON');
  }

  // ── Module 1 ──────────────────────────────────────────────────────
  async analyserDossier(profil, docs, userId = null) {
    let contexte = {};
    if (userId) {
      try {
        contexte = await construireContexteComplet(userId);
      } catch (err) {
        console.warn('⚠ Contexte enrichi indisponible:', err.message);
      }
    }
    return this.appeler(promptAnalyseDossier(profil, docs, contexte), 4000);
  }

  // ── Module 2 ──────────────────────────────────────────────────────
  async recommanderUniversites(profil, analyse) {
    return this.appeler(promptUniversites(profil, analyse), 4000);
  }

  // ── Module 3 ──────────────────────────────────────────────────────
  async matcherBourses(profil, analyse) {
    return this.appeler(promptBourses(profil, analyse), 3000);
  }

  // ── Module 4 ──────────────────────────────────────────────────────
  async guiderCampusFrance(profil, universites) {
    return this.appeler(promptCampusFrance(profil, universites), 4000);
  }

  async guiderVisa(pays_destination, profil) {
    return this.appeler(promptVisa(pays_destination, profil), 2000);
  }

  async guiderUniAssist(profil) {
    return this.appeler(promptUniAssist(profil), 3000);
  }

  async guiderUCAS(profil) {
    return this.appeler(promptUCAS(profil), 3000);
  }

  // ── Module 5 ──────────────────────────────────────────────────────
  async corrigerLM(lm_texte, profil, universite_cible) {
    return this.appeler(promptCorrectionLM(lm_texte, profil, universite_cible), 4000);
  }

  async corrigerCV(cv_texte, profil, pays_cible) {
    return this.appeler(promptCorrectionCV(cv_texte, profil, pays_cible), 3000);
  }

  async simulerEntretien(profil, universites_choisies) {
    return this.appeler(promptEntretienCampusFrance(profil, universites_choisies), 4000);
  }

  async genererProjetEtudes(profil, universite_cible, programme) {
    return this.appeler(promptProjetEtudes(profil, universite_cible, programme), 3000);
  }

  // ── Module 6 ──────────────────────────────────────────────────────
  async recommanderLogement(profil, ville, budget_mensuel) {
    return this.appeler(promptLogement(profil, ville, budget_mensuel), 2000);
  }

  // ── Module 7 ──────────────────────────────────────────────────────
  async genererRappel(etudiant, type_rappel, contexte) {
    return this.appeler(promptRappel(etudiant, type_rappel, contexte), 1000);
  }

  // ── Module 8 ──────────────────────────────────────────────────────
  async guiderArrivee(profil, pays_destination, ville) {
    return this.appeler(promptGuideArrivee(profil, pays_destination, ville), 3000);
  }
}

module.exports = new ClaudeService();
