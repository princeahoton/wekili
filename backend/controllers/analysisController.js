const pool = require('../config/database');
const claudeService = require('../services/claudeService');

// ── Analyse locale (fallback si l'API Claude est indisponible) ──────
function analyseLocale(profile, docs) {
  const moy = parseFloat(profile.moyenne) || 0;
  const niveauxLangue = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const userLvl = niveauxLangue.indexOf(profile.niveau_langue) + 1;
  const nbDocs = docs.length;

  let score = 25;
  const niveauxMap = { 'Licence': 1, 'Master': 2, 'Doctorat': 3 };
  const niv = niveauxMap[profile.niveau_etudes] || 1;
  score += niv >= 2 ? 20 : niv >= 1 ? 15 : 10;
  score += profile.domaine ? 15 : 8;
  if (moy >= 16) score += 20;
  else if (moy >= 14) score += 16;
  else if (moy >= 12) score += 12;
  else if (moy >= 10) score += 6;
  if (userLvl >= 4) score += 15;
  else if (userLvl >= 3) score += 10;
  else if (userLvl >= 1) score += 5;
  score = Math.min(100, Math.round(score));

  const forces = [];
  if (moy >= 14) forces.push({ titre: 'Excellente moyenne académique', description: `Votre moyenne de ${moy}/20 est un atout majeur pour les dossiers de bourse.` });
  if (userLvl >= 4) forces.push({ titre: 'Bon niveau de langue', description: `Votre niveau ${profile.niveau_langue} en ${profile.langue_principale} vous ouvre l'accès à de nombreux programmes.` });
  if (profile.certification) forces.push({ titre: 'Certification linguistique', description: `La certification ${profile.certification} renforce significativement votre dossier.` });
  if (nbDocs >= 4) forces.push({ titre: 'Dossier bien constitué', description: `${nbDocs} documents uploadés — votre dossier est presque complet.` });
  if (profile.niveau_etudes === 'Master' || profile.niveau_etudes === 'Doctorat') forces.push({ titre: 'Niveau d\'études avancé', description: 'Votre niveau ouvre l\'accès aux bourses d\'excellence les plus compétitives.' });
  if (forces.length === 0) forces.push({ titre: 'Profil en cours de constitution', description: 'Complétez votre profil pour mettre en valeur vos atouts.' });

  const faiblesses = [];
  if (moy < 12 && moy > 0) faiblesses.push({ titre: 'Moyenne à améliorer', description: 'Une moyenne inférieure à 12/20 peut limiter l\'accès aux bourses d\'excellence.', priorite: 'haute' });
  if (userLvl < 3) faiblesses.push({ titre: 'Niveau de langue insuffisant', description: 'La plupart des bourses exigent au minimum un niveau B1-B2.', priorite: 'haute' });
  if (!profile.certification) faiblesses.push({ titre: 'Pas de certification linguistique', description: 'Un DELF, DALF, IELTS ou TOEFL renforce considérablement votre dossier.', priorite: 'moyenne' });
  if (nbDocs < 4) faiblesses.push({ titre: 'Dossier incomplet', description: `Seulement ${nbDocs}/6 documents uploadés.`, priorite: 'haute' });

  const recommandations = [];
  if (nbDocs < 6) recommandations.push({ action: 'Compléter votre dossier de documents', impact: `Passer de ${nbDocs}/6 à 6/6 documents augmente le score de 10-15 points.`, priorite: 'haute' });
  if (!profile.certification) recommandations.push({ action: `Passer une certification en ${profile.langue_principale || 'français'} (DELF/DALF ou IELTS)`, impact: 'Exigée par la majorité des programmes d\'excellence.', priorite: 'haute' });
  if (userLvl < 4) recommandations.push({ action: 'Améliorer votre niveau de langue', impact: 'Atteindre B2 ou C1 augmente considérablement vos chances.', priorite: 'moyenne' });
  recommandations.push({ action: 'Rédiger une lettre de motivation percutante', impact: 'Peut faire la différence entre deux candidats à profils similaires.', priorite: 'moyenne' });
  recommandations.push({ action: 'Obtenir des lettres de recommandation', impact: 'Requises par 80% des bourses d\'excellence.', priorite: 'basse' });

  const programmes = [];
  const pays = profile.pays_cibles || [];
  if (pays.includes('France') || pays.length === 0) {
    programmes.push({ nom: 'Bourse Eiffel Excellence', pays: 'France', organisme: 'Campus France', lien: 'https://www.campusfrance.org/fr/eiffel' });
    programmes.push({ nom: 'Bourse du Gouvernement Français', pays: 'France', organisme: 'Institut Français', lien: 'https://www.campusfrance.org/fr' });
  }
  if (pays.includes('Canada')) programmes.push({ nom: 'Bourse Vanier Canada', pays: 'Canada', organisme: 'Gouvernement du Canada', lien: 'https://vanier.gc.ca' });
  if (pays.includes('Belgique')) programmes.push({ nom: 'Bourses ARES', pays: 'Belgique', organisme: 'ARES', lien: 'https://www.ares-ac.be/fr/cooperation-au-developpement/bourses' });
  if (pays.includes('Allemagne')) programmes.push({ nom: 'Bourse DAAD', pays: 'Allemagne', organisme: 'DAAD', lien: 'https://www.daad.de/en' });
  if (pays.includes('Royaume-Uni')) programmes.push({ nom: 'Bourse Chevening', pays: 'Royaume-Uni', organisme: 'FCDO', lien: 'https://www.chevening.org' });

  const baseChance = Math.min(score + 5, 95);
  const estimation_chances = {
    France: profile.langue_principale === 'Français' ? Math.min(baseChance + 10, 95) : baseChance,
    Canada: pays.includes('Canada') ? baseChance : Math.max(baseChance - 10, 5),
    Belgique: profile.langue_principale === 'Français' ? Math.min(baseChance + 5, 90) : Math.max(baseChance - 5, 5),
    Allemagne: pays.includes('Allemagne') ? Math.max(baseChance - 15, 5) : Math.max(baseChance - 20, 5),
    'Royaume-Uni': pays.includes('Royaume-Uni') ? Math.max(baseChance - 10, 5) : Math.max(baseChance - 20, 5),
  };

  const synthese = `${profile.prenom || 'L\'étudiant'} présente un profil ${score >= 70 ? 'solide' : score >= 50 ? 'prometteur' : 'en développement'} avec un score de ${score}/100. ${
    moy >= 14 ? `La moyenne de ${moy}/20 est un atout majeur.` : `La moyenne de ${moy > 0 ? moy + '/20' : 'non renseignée'} devra être mise en valeur.`
  } ${nbDocs >= 4 ? 'Le dossier documentaire est bien avancé.' : `Il manque ${6 - nbDocs} document(s) pour compléter le dossier.`}`;

  return { score_global: score, synthese, forces, faiblesses, recommandations, programmes_recommandes: programmes, estimation_chances };
}

// ── Calcul score bourse ─────────────────────────────────────────────
function computeScoreBourse(profile, scholarship) {
  let score = 25;
  const niveauxMap = { 'Licence': 1, 'Master': 2, 'Doctorat': 3 };
  const userNiv = niveauxMap[profile.niveau_etudes] || 1;
  const reqNiv  = niveauxMap[scholarship.niveau]    || 1;
  if (userNiv >= reqNiv) score += 20;
  else if (userNiv >= reqNiv - 0.5) score += 10;

  if (profile.domaine && scholarship.domaine) {
    const d = scholarship.domaine.toLowerCase();
    if (d.includes('tout') || d.includes(profile.domaine.toLowerCase()) || profile.domaine.toLowerCase().includes(d)) score += 20;
    else score += 5;
  } else { score += 10; }

  const moy = parseFloat(profile.moyenne) || 0;
  if (moy >= 16) score += 20; else if (moy >= 14) score += 16; else if (moy >= 12) score += 12; else if (moy >= 10) score += 6;

  const niveauxLangue = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const userLvl = niveauxLangue.indexOf(profile.niveau_langue) + 1;
  if (userLvl >= 4) score += 15; else if (userLvl >= 3) score += 10; else if (userLvl >= 1) score += 5;

  return Math.min(100, Math.round(score));
}

// ── Calcul score université ─────────────────────────────────────────
function computeScoreUniversite(profile, university) {
  let score = 20;
  const moy = parseFloat(profile.moyenne) || 0;
  const reqMoy = parseFloat(university.moyenne_requise) || 12;
  if (moy >= reqMoy + 2) score += 25;
  else if (moy >= reqMoy) score += 20;
  else if (moy >= reqMoy - 1) score += 10;
  else score += 2;

  const niveauxLangue = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const userLvl = niveauxLangue.indexOf(profile.niveau_langue) + 1;
  const reqLvl  = niveauxLangue.indexOf(university.niveau_langue) + 1;
  if (userLvl >= reqLvl + 1) score += 20;
  else if (userLvl >= reqLvl) score += 15;
  else if (userLvl >= reqLvl - 1) score += 8;
  else score += 0;

  const userPays = (profile.pays_cibles || []).map(p => p.toLowerCase());
  if (userPays.includes(university.pays.toLowerCase())) score += 20;

  const uNiveaux = Array.isArray(university.niveaux) ? university.niveaux : [];
  if (uNiveaux.some(n => n.toLowerCase().includes((profile.niveau_vise || '').toLowerCase()))) score += 15;

  // Bonus affinité domaine
  const uDomaines = Array.isArray(university.domaines) ? university.domaines : [];
  if (uDomaines.some(d => d.toLowerCase().includes((profile.domaine || '').toLowerCase()))) score += 10;

  return Math.min(100, Math.round(score));
}

// ── Mise à jour des matches bourses ─────────────────────────────────
async function updateMatchesBourses(userId, profile) {
  try {
    const { rows: scholarships } = await pool.query('SELECT * FROM scholarships');
    for (const s of scholarships) {
      const score = computeScoreBourse(profile, s);
      await pool.query(
        `INSERT INTO matches (user_id, scholarship_id, score_eligibilite, statut)
         VALUES ($1, $2, $3, 'nouveau')
         ON CONFLICT (user_id, scholarship_id)
         DO UPDATE SET score_eligibilite = EXCLUDED.score_eligibilite`,
        [userId, s.id, score]
      );
    }
  } catch (err) {
    console.error('Erreur calcul matches bourses:', err.message);
  }
}

// ── Mise à jour des matches universités ─────────────────────────────
async function updateMatchesUniversites(userId, profile) {
  try {
    const { rows: universities } = await pool.query('SELECT * FROM universities');
    for (const u of universities) {
      const score = computeScoreUniversite(profile, u);
      const type = score >= 75 ? 'realiste'
        : score >= 85 ? 'ambitieuse'
        : 'sure';
      await pool.query(
        `INSERT INTO university_matches (user_id, university_id, score_admission, type_candidature)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, university_id)
         DO UPDATE SET score_admission = EXCLUDED.score_admission, type_candidature = EXCLUDED.type_candidature`,
        [userId, u.id, score, type]
      );
    }
  } catch (err) {
    // La table peut ne pas exister si setup:universities n'a pas été lancé
    if (!err.message.includes('does not exist')) {
      console.error('Erreur calcul matches universités:', err.message);
    }
  }
}

// ── Controller principal ─────────────────────────────────────────────
exports.launchAnalysis = async (req, res) => {
  try {
    const profileRes = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [req.userId]);
    if (profileRes.rows.length === 0) {
      return res.status(400).json({ message: 'Veuillez compléter votre profil avant de lancer l\'analyse' });
    }
    const profile = profileRes.rows[0];
    const docsRes = await pool.query('SELECT type, nom_fichier, statut FROM documents WHERE user_id = $1', [req.userId]);
    const docs = docsRes.rows;

    let analysisData;
    let source = 'ia';

    try {
      analysisData = await claudeService.analyserDossier(profile, docs, req.userId);
    } catch (apiErr) {
      const isCreditsError = apiErr?.status === 400 || apiErr?.status === 401 || apiErr?.status === 429;
      const isNetworkError = apiErr?.code === 'ECONNREFUSED' || apiErr?.code === 'ENOTFOUND';
      const isAuthError = apiErr?.message?.includes('authentication') || apiErr?.message?.includes('apiKey') || apiErr?.message?.includes('authToken');
      if (isCreditsError || isNetworkError || isAuthError) {
        console.warn('⚠️  API Claude indisponible — utilisation de l\'analyse locale');
        analysisData = analyseLocale(profile, docs);
        source = 'local';
      } else {
        throw apiErr;
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO analyses (user_id, score_global, synthese, forces, faiblesses, recommandations, programmes_recommandes, estimation_chances)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        req.userId,
        analysisData.score_global,
        analysisData.synthese,
        JSON.stringify(analysisData.forces || []),
        JSON.stringify(analysisData.faiblesses || []),
        JSON.stringify(analysisData.recommandations || []),
        JSON.stringify(analysisData.programmes_recommandes || []),
        JSON.stringify(analysisData.estimation_chances || {}),
      ]
    );

    // Calcul des matches en parallèle (non bloquant)
    Promise.all([
      updateMatchesBourses(req.userId, profile),
      updateMatchesUniversites(req.userId, profile),
    ]).catch(err => console.error('Erreur matches:', err.message));

    res.json({ message: 'Analyse terminée', source, analyse: rows[0] });
  } catch (err) {
    console.error('Erreur analyse:', err.message);
    res.status(500).json({ message: 'Erreur lors de l\'analyse', detail: err.message });
  }
};

exports.getLatestAnalysis = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM analyses WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [req.userId]
    );
    if (rows.length === 0) return res.json({ analyse: null });
    res.json({ analyse: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.getAllAnalyses = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, score_global, created_at FROM analyses WHERE user_id = $1 ORDER BY created_at ASC',
      [req.userId]
    );
    res.json({ analyses: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
