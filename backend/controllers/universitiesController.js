const pool = require('../config/database');

// GET /api/universities/public — sans auth, pour la page d'accueil
exports.getUniversitiesPublic = async (req, res) => {
  try {
    const { pays, niveau, limit = 6 } = req.query;
    let query = `
      SELECT id, nom, pays, ville, code_pays, type, domaines, niveaux,
             langue, taux_admission, frais_scolarite,
             COALESCE(classement_mondial, classement_monde) AS classement_mondial,
             classement_national, description, points_forts, plateforme,
             cout_plateforme, lien_candidature, lien_officiel, date_cloture
      FROM universities
    `;
    const params = [];
    const conds = [];
    let idx = 1;

    if (pays) { conds.push(`pays = $${idx++}`); params.push(pays); }
    if (niveau) { conds.push(`$${idx++} = ANY(niveaux)`); params.push(niveau); }
    if (conds.length) query += ' WHERE ' + conds.join(' AND ');
    query += ` ORDER BY COALESCE(classement_mondial, classement_monde) ASC NULLS LAST LIMIT $${idx}`;
    params.push(parseInt(limit));

    const { rows } = await pool.query(query, params);
    res.json({ universities: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/universities — avec auth + matches utilisateur
exports.getUniversities = async (req, res) => {
  try {
    const { pays, niveau, search, sort, limit } = req.query;

    let baseQuery = `
      SELECT u.id, u.nom, u.pays, u.ville, u.code_pays, u.type,
             u.domaines, u.niveaux, u.langue, u.niveau_langue,
             u.taux_admission, u.frais_scolarite, u.frais_inscription,
             u.moyenne_requise, COALESCE(u.classement_mondial, u.classement_monde) AS classement_mondial, u.classement_national,
             u.description, u.points_forts, u.documents_requis,
             u.plateforme, u.cout_plateforme,
             u.lien_candidature, u.lien_officiel,
             u.date_ouverture, u.date_cloture,
             um.score_admission, um.type_candidature,
             c.statut as candidature_statut, c.voeu_numero
      FROM universities u
      LEFT JOIN university_matches um ON um.university_id = u.id AND um.user_id = $1
      LEFT JOIN candidatures c ON c.university_id = u.id AND c.user_id = $1
    `;
    const params = [req.userId];
    const conds = [];
    let idx = 2;

    if (pays) { conds.push(`u.pays = $${idx++}`); params.push(pays); }
    if (niveau) { conds.push(`$${idx++} = ANY(u.niveaux)`); params.push(niveau); }
    if (search) {
      conds.push(`(u.nom ILIKE $${idx} OR u.ville ILIKE $${idx} OR u.pays ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }
    if (conds.length) baseQuery += ' WHERE ' + conds.join(' AND ');

    if (sort === 'classement') {
      baseQuery += ' ORDER BY COALESCE(u.classement_mondial, u.classement_monde) ASC NULLS LAST';
    } else if (sort === 'taux') {
      baseQuery += ' ORDER BY u.taux_admission DESC NULLS LAST';
    } else {
      baseQuery += ' ORDER BY COALESCE(um.score_admission, 0) DESC, COALESCE(u.classement_mondial, u.classement_monde) ASC NULLS LAST';
    }

    if (limit) { baseQuery += ` LIMIT $${idx}`; params.push(parseInt(limit)); }

    const { rows } = await pool.query(baseQuery, params);
    const countRes = await pool.query('SELECT COUNT(*) FROM universities');
    res.json({ universities: rows, total: parseInt(countRes.rows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/universities/:id
exports.getUniversityDetail = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.*,
             um.score_admission, um.type_candidature,
             c.statut as candidature_statut, c.voeu_numero, c.notes, c.date_soumission
      FROM universities u
      LEFT JOIN university_matches um ON um.university_id = u.id AND um.user_id = $2
      LEFT JOIN candidatures c ON c.university_id = u.id AND c.user_id = $2
      WHERE u.id = $1
    `, [req.params.id, req.userId]);

    if (!rows.length) return res.status(404).json({ message: 'Université non trouvée' });
    res.json({ university: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/universities/candidatures — toutes les candidatures de l'utilisateur
exports.getCandidatures = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*, u.nom, u.pays, u.ville, u.code_pays, u.plateforme,
             u.lien_candidature, u.date_cloture, u.frais_scolarite,
             um.score_admission, um.type_candidature
      FROM candidatures c
      JOIN universities u ON u.id = c.university_id
      LEFT JOIN university_matches um ON um.university_id = c.university_id AND um.user_id = c.user_id
      WHERE c.user_id = $1
      ORDER BY c.voeu_numero ASC NULLS LAST, c.created_at DESC
    `, [req.userId]);
    res.json({ candidatures: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// POST /api/universities/:id/candidature — ajouter/mettre à jour une candidature
exports.upsertCandidature = async (req, res) => {
  try {
    const { statut = 'en_preparation', voeu_numero, notes, date_soumission } = req.body;
    const STATUTS = ['en_preparation', 'soumise', 'en_attente', 'admis', 'refuse', 'liste_attente'];
    if (!STATUTS.includes(statut)) return res.status(400).json({ message: 'Statut invalide' });

    const { rows } = await pool.query(`
      INSERT INTO candidatures (user_id, university_id, statut, voeu_numero, notes, date_soumission, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (user_id, university_id) DO UPDATE
        SET statut = EXCLUDED.statut,
            voeu_numero = EXCLUDED.voeu_numero,
            notes = EXCLUDED.notes,
            date_soumission = EXCLUDED.date_soumission,
            updated_at = NOW()
      RETURNING *
    `, [req.userId, req.params.id, statut, voeu_numero || null, notes || null, date_soumission || null]);

    res.json({ candidature: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// DELETE /api/universities/:id/candidature
exports.deleteCandidature = async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM candidatures WHERE user_id = $1 AND university_id = $2',
      [req.userId, req.params.id]
    );
    res.json({ message: 'Candidature supprimée' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
