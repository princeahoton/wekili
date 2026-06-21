const pool = require('../config/database');

// Endpoint PUBLIC — aucun token requis — utilisé sur la page d'accueil
exports.getBoursesPublic = async (req, res) => {
  try {
    const { pays, niveau, limit = 6 } = req.query;
    let query = 'SELECT id, nom, organisme, pays, code_pays, niveau, domaine, montant, deadline, date_debut, duree, type_financement, description, lien, avantages, documents_requis, nationalites_eligibles, langue_requise, niveau_langue_requis, age_max, nb_places, criteres FROM scholarships';
    const params = [];
    const conditions = [];
    let idx = 1;

    if (pays) {
      conditions.push(`pays = $${idx++}`);
      params.push(pays);
    }
    if (niveau) {
      conditions.push(`niveau ILIKE $${idx++}`);
      params.push(`%${niveau}%`);
    }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ` ORDER BY deadline ASC NULLS LAST LIMIT $${idx}`;
    params.push(parseInt(limit));

    const { rows } = await pool.query(query, params);
    res.json({ bourses: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Impossible de charger les bourses. Réessayez.' });
  }
};

exports.getBourses = async (req, res) => {
  try {
    const { pays, niveau, score_min, search, sort, page = 1, limit = 20 } = req.query;
    const pageNum  = Math.max(1, parseInt(page)  || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset   = (pageNum - 1) * limitNum;

    const filterParams = [req.userId];
    const conditions   = [];
    let idx = 2;

    if (pays) {
      conditions.push(`s.pays = $${idx++}`);
      filterParams.push(pays);
    }
    if (niveau) {
      conditions.push(`s.niveau ILIKE $${idx++}`);
      filterParams.push(`%${niveau}%`);
    }
    if (search) {
      conditions.push(`(s.nom ILIKE $${idx} OR s.organisme ILIKE $${idx})`);
      filterParams.push(`%${search}%`);
      idx++;
    }
    if (score_min) {
      conditions.push(`(m.score_eligibilite >= $${idx++} OR m.score_eligibilite IS NULL)`);
      filterParams.push(parseInt(score_min));
    }

    const joinClause  = `FROM scholarships s LEFT JOIN matches m ON m.scholarship_id = s.id AND m.user_id = $1`;
    const whereClause = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';
    const orderClause = sort === 'deadline'
      ? ' ORDER BY s.deadline ASC NULLS LAST'
      : ' ORDER BY COALESCE(m.score_eligibilite, 0) DESC, s.deadline ASC NULLS LAST';

    const mainQuery = `
      SELECT s.id, s.nom, s.organisme, s.pays, s.code_pays, s.niveau, s.domaine,
             s.montant, s.deadline, s.date_debut, s.duree, s.type_financement,
             s.description, s.lien, s.avantages, s.documents_requis,
             s.nationalites_eligibles, s.langue_requise, s.niveau_langue_requis,
             s.age_max, s.nb_places, s.criteres, m.score_eligibilite
      ${joinClause}${whereClause}${orderClause}
      LIMIT $${idx} OFFSET $${idx + 1}
    `;

    const [{ rows }, countRes, totalRes] = await Promise.all([
      pool.query(mainQuery, [...filterParams, limitNum, offset]),
      pool.query(`SELECT COUNT(*) ${joinClause}${whereClause}`, filterParams),
      pool.query('SELECT COUNT(*) FROM scholarships'),
    ]);

    const filteredTotal = parseInt(countRes.rows[0].count);
    const total         = parseInt(totalRes.rows[0].count);

    res.json({
      bourses: rows,
      total,
      filteredTotal,
      page:  pageNum,
      limit: limitNum,
      pages: Math.ceil(filteredTotal / limitNum),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Impossible de charger les bourses. Réessayez.' });
  }
};

exports.getBourseDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT s.*, m.score_eligibilite, m.statut as match_statut
       FROM scholarships s
       LEFT JOIN matches m ON m.scholarship_id = s.id AND m.user_id = $2
       WHERE s.id = $1`,
      [id, req.userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Bourse non trouvée' });
    res.json({ bourse: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Impossible de charger les bourses. Réessayez.' });
  }
};
