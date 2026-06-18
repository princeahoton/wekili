const pool = require('../config/database');

exports.getProfile = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [req.userId]
    );
    if (rows.length === 0) return res.json({ profile: null });
    res.json({ profile: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.saveProfile = async (req, res) => {
  const {
    nationalite, pays_residence, telephone, date_naissance,
    niveau_etudes, domaine, etablissement, moyenne,
    langue_principale, niveau_langue, certification, langue2, niveau_langue2,
    pays_cibles, niveau_vise, domaine_vise, budget
  } = req.body;

  try {
    const existing = await pool.query(
      'SELECT id FROM profiles WHERE user_id = $1',
      [req.userId]
    );

    if (existing.rows.length === 0) {
      await pool.query(
        `INSERT INTO profiles
          (user_id, nationalite, pays_residence, telephone, date_naissance,
           niveau_etudes, domaine, etablissement, moyenne,
           langue_principale, niveau_langue, certification, langue2, niveau_langue2,
           pays_cibles, niveau_vise, domaine_vise, budget, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,NOW())`,
        [req.userId, nationalite, pays_residence, telephone, date_naissance || null,
         niveau_etudes, domaine, etablissement, moyenne || null,
         langue_principale, niveau_langue, certification, langue2, niveau_langue2,
         pays_cibles, niveau_vise, domaine_vise, budget]
      );
    } else {
      await pool.query(
        `UPDATE profiles SET
          nationalite=$2, pays_residence=$3, telephone=$4, date_naissance=$5,
          niveau_etudes=$6, domaine=$7, etablissement=$8, moyenne=$9,
          langue_principale=$10, niveau_langue=$11, certification=$12,
          langue2=$13, niveau_langue2=$14, pays_cibles=$15,
          niveau_vise=$16, domaine_vise=$17, budget=$18, updated_at=NOW()
         WHERE user_id=$1`,
        [req.userId, nationalite, pays_residence, telephone, date_naissance || null,
         niveau_etudes, domaine, etablissement, moyenne || null,
         langue_principale, niveau_langue, certification, langue2, niveau_langue2,
         pays_cibles, niveau_vise, domaine_vise, budget]
      );
    }

    const { rows } = await pool.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [req.userId]
    );
    res.json({ message: 'Profil sauvegardé', profile: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
