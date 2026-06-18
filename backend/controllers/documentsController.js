const pool = require('../config/database');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'eu-west-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.AWS_BUCKET_NAME;

// S3 n'est actif que si les vraies credentials sont présentes (pas les placeholders)
function s3Active() {
  const key = process.env.AWS_ACCESS_KEY_ID || '';
  return BUCKET && key.length > 10 && !key.includes('REMPLACE');
}

exports.getDocuments = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, type, nom_fichier, url_s3, taille, statut, created_at FROM documents WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json({ documents: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier fourni' });

    const { type } = req.body;
    if (!type) return res.status(400).json({ message: 'Type de document requis' });

    const ext = path.extname(req.file.originalname);
    const key = `documents/${req.userId}/${type}_${uuidv4()}${ext}`;

    let url_s3 = null;

    if (s3Active()) {
      const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      });
      await s3.send(command);
      url_s3 = `https://${BUCKET}.s3.${process.env.AWS_REGION || 'eu-west-1'}.amazonaws.com/${key}`;
    }

    // Remove existing doc of same type for this user
    await pool.query(
      'DELETE FROM documents WHERE user_id = $1 AND type = $2',
      [req.userId, type]
    );

    const { rows } = await pool.query(
      `INSERT INTO documents (user_id, type, nom_fichier, url_s3, taille, statut)
       VALUES ($1, $2, $3, $4, $5, 'en_attente') RETURNING *`,
      [req.userId, type, req.file.originalname, url_s3, req.file.size]
    );

    res.json({ message: 'Document uploadé', document: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur upload' });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'SELECT * FROM documents WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Document non trouvé' });

    const doc = rows[0];

    if (doc.url_s3 && s3Active()) {
      const urlParts = doc.url_s3.split('.amazonaws.com/');
      if (urlParts[1]) {
        await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: urlParts[1] }));
      }
    }

    await pool.query('DELETE FROM documents WHERE id = $1', [id]);
    res.json({ message: 'Document supprimé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
