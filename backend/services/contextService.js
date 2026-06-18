'use strict';

const pool = require('../config/database');
const { BASE_CONNAISSANCES, trouverSpecificitesPays } = require('../data/knowledgeBase');

// Requête DB silencieuse — retourne [] si table manquante ou erreur
async function safeQuery(sql, params = []) {
  try {
    const { rows } = await pool.query(sql, params);
    return rows;
  } catch {
    return [];
  }
}

// Construit le contexte complet d'un étudiant pour enrichir les prompts Claude
async function construireContexteComplet(userId) {
  const [profilRows, docs, analyses, univMatches, bourseMatches, candidatures] = await Promise.all([
    safeQuery('SELECT * FROM profiles WHERE user_id = $1', [userId]),
    safeQuery('SELECT type, nom_fichier, statut FROM documents WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
    safeQuery(
      'SELECT score_global, synthese, created_at FROM analyses WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
      [userId]
    ),
    safeQuery(
      `SELECT u.nom, u.pays, u.programme_phare, u.classement_monde, u.taux_admission,
              um.score_admission, um.type_candidature
       FROM university_matches um
       JOIN universities u ON u.id = um.university_id
       WHERE um.user_id = $1
       ORDER BY um.score_admission DESC
       LIMIT 8`,
      [userId]
    ),
    safeQuery(
      `SELECT s.nom, s.pays, s.montant, s.type_financement, m.score_eligibilite
       FROM matches m
       JOIN scholarships s ON s.id = m.scholarship_id
       WHERE m.user_id = $1
       ORDER BY m.score_eligibilite DESC
       LIMIT 8`,
      [userId]
    ),
    safeQuery(
      `SELECT u.nom AS universite, c.statut, c.voeu_numero, c.notes
       FROM candidatures c
       JOIN universities u ON u.id = c.university_id
       WHERE c.user_id = $1
       ORDER BY c.voeu_numero ASC`,
      [userId]
    ),
  ]);

  const profil = profilRows[0] || null;
  const paysRef = profil?.nationalite || profil?.pays_residence;
  const specificites_pays = trouverSpecificitesPays(paysRef);

  // Calcul progression sur les analyses
  let progression_score = null;
  if (analyses.length >= 2) {
    const derniere = analyses[0].score_global;
    const premiere = analyses[analyses.length - 1].score_global;
    progression_score = { premiere, derniere, delta: derniere - premiere };
  }

  return {
    profil,
    docs,
    historique_analyses: analyses,
    progression_score,
    top_universites_matchees: univMatches,
    top_bourses_matchees: bourseMatches,
    candidatures_actives: candidatures,
    specificites_pays,
    base_connaissances: BASE_CONNAISSANCES,
  };
}

// Formate le contexte pays pour injection dans un prompt
function formatContextePays(specificites) {
  if (!specificites) return '';
  const s = specificites;
  const lignes = [
    `\n═══════════════════════════════════════`,
    `CONTEXTE PAYS : ${s.noms?.[0] || s.code} (${s.code})`,
    `═══════════════════════════════════════`,
  ];

  if (s.systeme_educatif) {
    if (s.systeme_educatif.bac)          lignes.push(`BAC              : ${s.systeme_educatif.bac}`);
    if (s.systeme_educatif.superieur)    lignes.push(`Supérieur        : ${s.systeme_educatif.superieur}`);
    if (s.systeme_educatif.equivalence_principale) lignes.push(`Note equiv.      : ${s.systeme_educatif.equivalence_principale}`);
    if (s.systeme_educatif.note_importante) lignes.push(`⚠ IMPORTANT      : ${s.systeme_educatif.note_importante}`);
  }

  if (s.equivalences_diplomes) {
    lignes.push('Équivalences     :');
    for (const [diplome, equiv] of Object.entries(s.equivalences_diplomes)) {
      lignes.push(`  • ${diplome} → ${equiv}`);
    }
  }

  if (s.campus_france) {
    const cf = s.campus_france;
    if (cf.bureau) lignes.push(`Campus France    : ${cf.bureau} (${cf.ville || ''})`);
    if (cf.lien)   lignes.push(`  Lien           : ${cf.lien}`);
    if (cf.note)   lignes.push(`  Note           : ${cf.note}`);
  }

  if (s.aps_uni_assist?.conseil) {
    lignes.push(`Allemagne (APS)  : ${s.aps_uni_assist.conseil}`);
  }

  if (s.bourses_nationales?.length > 0) {
    lignes.push(`Bourses nationales: ${s.bourses_nationales.join(' | ')}`);
  }

  if (s.conseil_specifique) {
    lignes.push(`Conseil terrain  : ${s.conseil_specifique}`);
  }

  return lignes.join('\n');
}

module.exports = { construireContexteComplet, formatContextePays };
