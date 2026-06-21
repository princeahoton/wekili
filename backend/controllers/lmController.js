const pool = require('../config/database');
const claudeService = require('../services/claudeService');

exports.getLMVersions = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, version, contenu, universite, score, points_forts,
              points_ameliorer, evaluation, version_corrigee, created_at
       FROM lm_versions WHERE user_id = $1 ORDER BY created_at ASC`,
      [req.userId]
    );
    res.json({ versions: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Impossible de charger vos lettres de motivation. Réessayez.' });
  }
};

exports.genererLM = async (req, res) => {
  try {
    const profileRes = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [req.userId]);
    if (!profileRes.rows.length) return res.status(400).json({ message: 'Complétez votre profil avant de générer une LM.' });
    const profile = profileRes.rows[0];
    const { universite = '' } = req.body;

    const result = await claudeService.genererLM(profile, universite);

    const { rows: cnt } = await pool.query('SELECT COUNT(*) FROM lm_versions WHERE user_id = $1', [req.userId]);
    const version = parseInt(cnt[0].count) + 1;

    const { rows } = await pool.query(
      `INSERT INTO lm_versions (user_id, version, contenu, universite, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [req.userId, version, result.lettre_complete, universite]
    );

    res.json({ version: rows[0], lettre: result.lettre_complete, structure: result.structure, conseil: result.conseil });
  } catch (err) {
    console.error('Erreur génération LM:', err.message);
    res.status(500).json({ message: 'La génération de la lettre de motivation a échoué. Réessayez dans quelques instants.' });
  }
};

exports.corrigerLM = async (req, res) => {
  try {
    const profileRes = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [req.userId]);
    if (!profileRes.rows.length) return res.status(400).json({ message: 'Complétez votre profil avant la correction.' });
    const profile = profileRes.rows[0];
    const { contenu, universite = '' } = req.body;
    if (!contenu?.trim()) return res.status(400).json({ message: 'Le contenu de la lettre est requis.' });

    const result = await claudeService.corrigerLM(contenu, profile, universite);

    const { rows: cnt } = await pool.query('SELECT COUNT(*) FROM lm_versions WHERE user_id = $1', [req.userId]);
    const version = parseInt(cnt[0].count) + 1;

    const { rows } = await pool.query(
      `INSERT INTO lm_versions
         (user_id, version, contenu, universite, score, points_forts, points_ameliorer, evaluation, version_corrigee, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW()) RETURNING *`,
      [
        req.userId, version, contenu, universite,
        result.score_global,
        result.points_forts           || [],
        result.points_a_ameliorer     || [],
        result.evaluation_par_critere || {},
        result.version_corrigee_complete || '',
      ]
    );

    res.json({ version: rows[0], analyse: result });
  } catch (err) {
    console.error('Erreur correction LM:', err.message);
    res.status(500).json({ message: 'La correction de la lettre de motivation a échoué. Réessayez dans quelques instants.' });
  }
};

exports.sauvegarderLM = async (req, res) => {
  try {
    const { contenu, universite = '' } = req.body;
    if (!contenu?.trim()) return res.status(400).json({ message: 'Contenu requis.' });

    const { rows: cnt } = await pool.query('SELECT COUNT(*) FROM lm_versions WHERE user_id = $1', [req.userId]);
    const version = parseInt(cnt[0].count) + 1;

    const { rows } = await pool.query(
      `INSERT INTO lm_versions (user_id, version, contenu, universite, created_at)
       VALUES ($1,$2,$3,$4,NOW()) RETURNING *`,
      [req.userId, version, contenu, universite]
    );

    res.json({ version: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'La sauvegarde de la lettre a échoué. Réessayez.' });
  }
};
