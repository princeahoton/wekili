const pool = require('../config/database');
const claudeService = require('../services/claudeService');
const multer = require('multer');
const { PDFParse } = require('pdf-parse');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Seuls les fichiers PDF sont acceptés'));
  },
});
exports.uploadMiddleware = upload.single('cv');

exports.extractPDF = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier PDF reçu.' });
    const parser = new PDFParse({ data: req.file.buffer });
    const result = await parser.getText();
    await parser.destroy();
    const texte = result.text.replace(/\n{3,}/g, '\n\n').trim();
    if (!texte) return res.status(400).json({ message: 'Impossible d\'extraire le texte de ce PDF.' });
    res.json({ texte, pages: result.total });
  } catch (err) {
    console.error('Erreur extraction PDF:', err.message);
    res.status(500).json({ message: 'Impossible de lire ce fichier PDF. Vérifiez que le fichier n\'est pas corrompu.' });
  }
};

exports.getCVVersions = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, version, contenu, pays_cible, score, points_forts,
              corrections, sections_manquantes, norme_pays, version_corrigee, created_at
       FROM cv_versions WHERE user_id = $1 ORDER BY created_at ASC`,
      [req.userId]
    );
    res.json({ versions: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Impossible de charger vos versions de CV. Réessayez.' });
  }
};

exports.corrigerCV = async (req, res) => {
  try {
    const profileRes = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [req.userId]);
    if (!profileRes.rows.length) return res.status(400).json({ message: 'Complétez votre profil avant la correction.' });
    const profile = profileRes.rows[0];
    const { contenu, pays_cible = 'France' } = req.body;
    if (!contenu?.trim()) return res.status(400).json({ message: 'Le contenu du CV est requis.' });

    const result = await claudeService.corrigerCV(contenu, profile, pays_cible);

    const { rows: cnt } = await pool.query('SELECT COUNT(*) FROM cv_versions WHERE user_id = $1', [req.userId]);
    const version = parseInt(cnt[0].count) + 1;

    const { rows } = await pool.query(
      `INSERT INTO cv_versions
         (user_id, version, contenu, pays_cible, score, points_forts, corrections, sections_manquantes, norme_pays, version_corrigee, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW()) RETURNING *`,
      [
        req.userId, version, contenu, pays_cible,
        result.score_global,
        result.points_forts         || [],
        result.corrections          || [],
        result.sections_manquantes  || [],
        result.norme_pays           || {},
        result.version_corrigee     || '',
      ]
    );

    res.json({ version: rows[0], analyse: result });
  } catch (err) {
    console.error('Erreur correction CV:', err.message);
    res.status(500).json({ message: 'La correction du CV a échoué. Réessayez dans quelques instants.' });
  }
};

exports.sauvegarderCV = async (req, res) => {
  try {
    const { contenu, pays_cible = 'France' } = req.body;
    if (!contenu?.trim()) return res.status(400).json({ message: 'Contenu requis.' });

    const { rows: cnt } = await pool.query('SELECT COUNT(*) FROM cv_versions WHERE user_id = $1', [req.userId]);
    const version = parseInt(cnt[0].count) + 1;

    const { rows } = await pool.query(
      `INSERT INTO cv_versions (user_id, version, contenu, pays_cible, created_at)
       VALUES ($1,$2,$3,$4,NOW()) RETURNING *`,
      [req.userId, version, contenu, pays_cible]
    );

    res.json({ version: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'La sauvegarde du CV a échoué. Réessayez.' });
  }
};
