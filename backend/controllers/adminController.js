'use strict';
const pool = require('../config/database');

// â”€â”€ Stats globales â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.getStats = async (req, res) => {
  try {
    const [
      usersRes, newUsersRes, newWeekRes, authMethodRes,
      profilesRes, analysesRes, docsRes, docTypesRes,
      candidaturesRes, boursesRes, uniRes, cvRes, lmRes,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query("SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days'"),
      pool.query("SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days'"),
      pool.query('SELECT auth_method, COUNT(*) FROM users GROUP BY auth_method'),
      pool.query('SELECT COUNT(*) FROM profiles'),
      pool.query('SELECT COUNT(*), ROUND(AVG(score_global)) as avg_score FROM analyses'),
      pool.query('SELECT COUNT(*) FROM documents'),
      pool.query("SELECT type, COUNT(*) FROM documents GROUP BY type ORDER BY COUNT(*) DESC LIMIT 8"),
      pool.query('SELECT statut, COUNT(*) FROM candidatures GROUP BY statut'),
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE actif) as actives FROM scholarships'),
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE actif) as actives FROM universities'),
      pool.query('SELECT COUNT(*) FROM cv_versions'),
      pool.query('SELECT COUNT(*) FROM lm_versions'),
    ]);

    res.json({
      users: {
        total:          parseInt(usersRes.rows[0].count),
        new_this_month: parseInt(newUsersRes.rows[0].count),
        new_this_week:  parseInt(newWeekRes.rows[0].count),
        with_profile:   parseInt(profilesRes.rows[0].count),
        by_auth_method: Object.fromEntries(authMethodRes.rows.map(r => [r.auth_method, parseInt(r.count)])),
      },
      analyses: {
        total:     parseInt(analysesRes.rows[0].count),
        avg_score: parseInt(analysesRes.rows[0].avg_score) || 0,
      },
      documents: {
        total:   parseInt(docsRes.rows[0].count),
        by_type: Object.fromEntries(docTypesRes.rows.map(r => [r.type, parseInt(r.count)])),
      },
      candidatures: {
        total:     candidaturesRes.rows.reduce((s, r) => s + parseInt(r.count), 0),
        by_status: Object.fromEntries(candidaturesRes.rows.map(r => [r.statut, parseInt(r.count)])),
      },
      bourses:    { total: parseInt(boursesRes.rows[0].total), actives: parseInt(boursesRes.rows[0].actives) },
      universities: { total: parseInt(uniRes.rows[0].total), actives: parseInt(uniRes.rows[0].actives) },
      cv_versions: parseInt(cvRes.rows[0].count),
      lm_versions: parseInt(lmRes.rows[0].count),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Une erreur est survenue. Réessayez.' });
  }
};

// â”€â”€ Utilisateurs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.getUsers = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const role   = req.query.role || '';

    const conds  = [];
    const params = [];
    let   idx    = 1;

    if (search) {
      conds.push(`(u.email ILIKE $${idx} OR u.prenom ILIKE $${idx} OR u.nom ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (role) {
      conds.push(`u.role = $${idx}`);
      params.push(role);
      idx++;
    }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const [countRes, usersRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM users u ${where}`, params),
      pool.query(`
        SELECT
          u.id, u.email, u.prenom, u.nom, u.pays,
          u.auth_method, u.role, u.email_verified, u.two_fa_enabled, u.created_at,
          (SELECT COUNT(*) FROM documents  WHERE user_id = u.id)::int  AS doc_count,
          (SELECT COUNT(*) FROM analyses   WHERE user_id = u.id)::int  AS analyse_count,
          (SELECT score_global FROM analyses WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) AS last_score,
          (SELECT created_at  FROM login_sessions WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) AS last_login,
          (p.id IS NOT NULL) AS has_profile
        FROM users u
        LEFT JOIN profiles p ON p.user_id = u.id
        ${where}
        ORDER BY u.created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}
      `, [...params, limit, offset]),
    ]);

    res.json({ users: usersRes.rows, total: parseInt(countRes.rows[0].count), page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Une erreur est survenue. Réessayez.' });
  }
};

exports.getUserDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const [userRes, profileRes, docsRes, analysesRes, candidaturesRes] = await Promise.all([
      pool.query(`
        SELECT u.*,
          (SELECT created_at FROM login_sessions WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) AS last_login
        FROM users u WHERE u.id = $1
      `, [id]),
      pool.query('SELECT * FROM profiles WHERE user_id = $1', [id]),
      pool.query('SELECT id, type, nom_fichier, taille, statut, created_at FROM documents WHERE user_id = $1 ORDER BY created_at DESC', [id]),
      pool.query('SELECT id, score_global, synthese, created_at FROM analyses WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5', [id]),
      pool.query(`
        SELECT c.*, uni.nom AS uni_nom, uni.pays AS uni_pays
        FROM candidatures c
        JOIN universities uni ON uni.id = c.university_id
        WHERE c.user_id = $1
        ORDER BY c.created_at DESC
      `, [id]),
    ]);

    if (!userRes.rows.length) return res.status(404).json({ message: 'Utilisateur introuvable' });

    const user = { ...userRes.rows[0] };
    delete user.password;
    delete user.doc_pin_hash;

    res.json({
      user,
      profile:      profileRes.rows[0]  || null,
      documents:    docsRes.rows,
      analyses:     analysesRes.rows,
      candidatures: candidaturesRes.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Une erreur est survenue. Réessayez.' });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['user', 'admin', 'superadmin'].includes(role)) {
      return res.status(400).json({ message: 'RÃ´le invalide' });
    }
    if (id === req.userId) {
      return res.status(400).json({ message: 'Impossible de modifier votre propre rÃ´le' });
    }
    const { rows } = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, prenom, nom, role',
      [role, id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json({ user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Une erreur est survenue. Réessayez.' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.userId) return res.status(400).json({ message: 'Impossible de supprimer votre propre compte' });
    const { rows } = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json({ message: 'Utilisateur supprimÃ©' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Une erreur est survenue. Réessayez.' });
  }
};

// â”€â”€ Bourses â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.getBourses = async (req, res) => {
  try {
    const { search = '', pays = '', actif = '' } = req.query;
    const conds = [], params = [];
    let idx = 1;

    if (search) { conds.push(`(s.nom ILIKE $${idx} OR s.organisme ILIKE $${idx})`); params.push(`%${search}%`); idx++; }
    if (pays)   { conds.push(`s.pays = $${idx}`);  params.push(pays);  idx++; }
    if (actif !== '') { conds.push(`s.actif = $${idx}`); params.push(actif === 'true'); idx++; }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await pool.query(`
      SELECT s.*,
        (SELECT COUNT(*) FROM matches WHERE scholarship_id = s.id)::int AS nb_matches
      FROM scholarships s ${where}
      ORDER BY s.created_at DESC
    `, params);
    res.json({ bourses: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Une erreur est survenue. Réessayez.' });
  }
};

exports.createBourse = async (req, res) => {
  try {
    const {
      nom, organisme, pays, code_pays, niveau, domaine, montant,
      type_financement, description, deadline, date_debut, duree,
      lien, langue_requise, niveau_langue_requis, age_max, nb_places,
      actif = true, avantages, criteres, documents_requis, nationalites_eligibles,
    } = req.body;

    if (!nom?.trim() || !organisme?.trim() || !pays?.trim()) {
      return res.status(400).json({ message: 'nom, organisme et pays sont requis' });
    }

    const { rows } = await pool.query(`
      INSERT INTO scholarships
        (nom, organisme, pays, code_pays, niveau, domaine, montant, type_financement,
         description, deadline, date_debut, duree, lien, langue_requise,
         niveau_langue_requis, age_max, nb_places, actif, avantages, criteres,
         documents_requis, nationalites_eligibles)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
      RETURNING *
    `, [
      nom.trim(), organisme.trim(), pays.trim(), code_pays || null,
      niveau || null, domaine || null, montant || null, type_financement || null,
      description || null, deadline || null, date_debut || null, duree || null,
      lien || null, langue_requise || null, niveau_langue_requis || null,
      age_max || null, nb_places || null, actif,
      avantages  ? (Array.isArray(avantages)  ? JSON.stringify(avantages)  : avantages)  : null,
      criteres   ? (Array.isArray(criteres)   ? JSON.stringify(criteres)   : criteres)   : null,
      documents_requis       ? (Array.isArray(documents_requis)       ? documents_requis       : [documents_requis])       : null,
      nationalites_eligibles ? (Array.isArray(nationalites_eligibles) ? nationalites_eligibles : [nationalites_eligibles]) : null,
    ]);

    res.status(201).json({ bourse: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Une erreur est survenue. Réessayez.' });
  }
};

exports.updateBourse = async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = [
      'nom','organisme','pays','code_pays','niveau','domaine','montant',
      'type_financement','description','deadline','date_debut','duree','lien',
      'langue_requise','niveau_langue_requis','age_max','nb_places','actif',
      'avantages','criteres','documents_requis','nationalites_eligibles',
    ];
    const updates = [], params = [];
    let idx = 1;

    for (const key of allowed) {
      if (key in req.body) {
        updates.push(`${key} = $${idx}`);
        if (['avantages','criteres'].includes(key) && Array.isArray(req.body[key])) {
          params.push(JSON.stringify(req.body[key]));
        } else {
          params.push(req.body[key]);
        }
        idx++;
      }
    }

    if (!updates.length) return res.status(400).json({ message: 'Aucun champ Ã  modifier' });
    params.push(id);

    const { rows } = await pool.query(
      `UPDATE scholarships SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );
    if (!rows.length) return res.status(404).json({ message: 'Bourse introuvable' });
    res.json({ bourse: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Une erreur est survenue. Réessayez.' });
  }
};

exports.deleteBourse = async (req, res) => {
  try {
    const { rows } = await pool.query('DELETE FROM scholarships WHERE id = $1 RETURNING id', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Bourse introuvable' });
    res.json({ message: 'Bourse supprimÃ©e' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Une erreur est survenue. Réessayez.' });
  }
};

// â”€â”€ UniversitÃ©s â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.getUniversities = async (req, res) => {
  try {
    const { search = '', pays = '' } = req.query;
    const conds = [], params = [];
    let idx = 1;

    if (search) { conds.push(`(u.nom ILIKE $${idx} OR u.ville ILIKE $${idx})`); params.push(`%${search}%`); idx++; }
    if (pays)   { conds.push(`u.pays = $${idx}`); params.push(pays); idx++; }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await pool.query(`
      SELECT u.*,
        (SELECT COUNT(*) FROM candidatures WHERE university_id = u.id)::int AS nb_candidatures
      FROM universities u ${where}
      ORDER BY u.created_at DESC
    `, params);
    res.json({ universities: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Une erreur est survenue. Réessayez.' });
  }
};

exports.createUniversity = async (req, res) => {
  try {
    const {
      nom, pays, code_pays, ville, type, domaines, niveaux, langue, niveau_langue,
      classement_mondial, taux_admission, frais_scolarite, frais_inscription,
      moyenne_requise, programme_phare, campus_france_requis, uni_assist_requis,
      points_forts, documents_requis, plateforme, cout_plateforme,
      lien_candidature, lien_officiel, date_ouverture, date_cloture,
      description, actif = true,
    } = req.body;

    if (!nom?.trim() || !pays?.trim() || !ville?.trim()) {
      return res.status(400).json({ message: 'nom, pays et ville sont requis' });
    }

    const { rows } = await pool.query(`
      INSERT INTO universities
        (nom, pays, code_pays, ville, type, domaines, niveaux, langue, niveau_langue,
         classement_mondial, taux_admission, frais_scolarite, frais_inscription,
         moyenne_requise, programme_phare, campus_france_requis, uni_assist_requis,
         points_forts, documents_requis, plateforme, cout_plateforme,
         lien_candidature, lien_officiel, date_ouverture, date_cloture,
         description, actif)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)
      RETURNING *
    `, [
      nom.trim(), pays.trim(), code_pays || null, ville.trim(), type || null,
      domaines     ? (Array.isArray(domaines)     ? domaines     : [domaines])     : null,
      niveaux      ? (Array.isArray(niveaux)      ? niveaux      : [niveaux])      : null,
      langue || null, niveau_langue || null,
      classement_mondial || null, taux_admission || null,
      frais_scolarite || null, frais_inscription || null,
      moyenne_requise || null, programme_phare || null,
      campus_france_requis || false, uni_assist_requis || false,
      points_forts    ? (Array.isArray(points_forts)    ? points_forts    : [points_forts])    : null,
      documents_requis ? (Array.isArray(documents_requis) ? documents_requis : [documents_requis]) : null,
      plateforme || null, cout_plateforme || null,
      lien_candidature || null, lien_officiel || null,
      date_ouverture || null, date_cloture || null,
      description || null, actif,
    ]);

    res.status(201).json({ university: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Une erreur est survenue. Réessayez.' });
  }
};

exports.updateUniversity = async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = [
      'nom','pays','code_pays','ville','type','domaines','niveaux','langue','niveau_langue',
      'classement_mondial','taux_admission','frais_scolarite','frais_inscription',
      'moyenne_requise','programme_phare','campus_france_requis','uni_assist_requis',
      'points_forts','documents_requis','plateforme','cout_plateforme',
      'lien_candidature','lien_officiel','date_ouverture','date_cloture','description','actif',
    ];
    const updates = [], params = [];
    let idx = 1;

    for (const key of allowed) {
      if (key in req.body) {
        updates.push(`${key} = $${idx}`);
        params.push(req.body[key]);
        idx++;
      }
    }

    if (!updates.length) return res.status(400).json({ message: 'Aucun champ Ã  modifier' });
    params.push(id);

    const { rows } = await pool.query(
      `UPDATE universities SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );
    if (!rows.length) return res.status(404).json({ message: 'UniversitÃ© introuvable' });
    res.json({ university: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Une erreur est survenue. Réessayez.' });
  }
};

exports.deleteUniversity = async (req, res) => {
  try {
    const { rows } = await pool.query('DELETE FROM universities WHERE id = $1 RETURNING id', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'UniversitÃ© introuvable' });
    res.json({ message: 'UniversitÃ© supprimÃ©e' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Une erreur est survenue. Réessayez.' });
  }
};
