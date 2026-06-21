'use strict';

const pool = require('../config/database');
const claudeService = require('../services/claudeService');

exports.getLogement = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM logements WHERE user_id = $1',
      [req.userId]
    );
    res.json({ logement: rows[0] || null });
  } catch (err) {
    console.error('Erreur getLogement:', err.message);
    res.status(500).json({ message: 'Impossible de charger vos informations de logement. Réessayez.' });
  }
};

exports.upsertLogement = async (req, res) => {
  const {
    pays_destination, ville_destination, type_souhaite, budget_mensuel,
    date_arrivee, nb_colocataires, statut, type_logement, loyer_mensuel,
    adresse, date_debut_contrat, lien_annonce, completed_steps, notes,
  } = req.body;

  const statutsValides = ['en_recherche', 'dossier_soumis', 'en_attente', 'visite_planifiee', 'logement_confirme'];
  if (statut && !statutsValides.includes(statut)) {
    return res.status(400).json({ message: 'Statut invalide' });
  }

  try {
    const { rows } = await pool.query(`
      INSERT INTO logements (
        user_id, pays_destination, ville_destination, type_souhaite, budget_mensuel,
        date_arrivee, nb_colocataires, statut, type_logement, loyer_mensuel,
        adresse, date_debut_contrat, lien_annonce, completed_steps, notes, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        pays_destination    = COALESCE(EXCLUDED.pays_destination,    logements.pays_destination),
        ville_destination   = COALESCE(EXCLUDED.ville_destination,   logements.ville_destination),
        type_souhaite       = COALESCE(EXCLUDED.type_souhaite,       logements.type_souhaite),
        budget_mensuel      = COALESCE(EXCLUDED.budget_mensuel,      logements.budget_mensuel),
        date_arrivee        = COALESCE(EXCLUDED.date_arrivee,        logements.date_arrivee),
        nb_colocataires     = COALESCE(EXCLUDED.nb_colocataires,     logements.nb_colocataires),
        statut              = COALESCE(EXCLUDED.statut,              logements.statut),
        type_logement       = COALESCE(EXCLUDED.type_logement,       logements.type_logement),
        loyer_mensuel       = COALESCE(EXCLUDED.loyer_mensuel,       logements.loyer_mensuel),
        adresse             = COALESCE(EXCLUDED.adresse,             logements.adresse),
        date_debut_contrat  = COALESCE(EXCLUDED.date_debut_contrat,  logements.date_debut_contrat),
        lien_annonce        = COALESCE(EXCLUDED.lien_annonce,        logements.lien_annonce),
        completed_steps     = COALESCE(EXCLUDED.completed_steps,     logements.completed_steps),
        notes               = COALESCE(EXCLUDED.notes,               logements.notes),
        updated_at          = NOW()
      RETURNING *
    `, [
      req.userId, pays_destination, ville_destination, type_souhaite, budget_mensuel,
      date_arrivee, nb_colocataires, statut, type_logement, loyer_mensuel,
      adresse, date_debut_contrat, lien_annonce,
      completed_steps ? JSON.stringify(completed_steps) : null,
      notes,
    ]);
    res.json({ logement: rows[0] });
  } catch (err) {
    console.error('Erreur upsertLogement:', err.message);
    res.status(500).json({ message: 'La sauvegarde des informations de logement a échoué. Réessayez.' });
  }
};

exports.getGuideIA = async (req, res) => {
  try {
    const [{ rows: logRows }, { rows: profRows }] = await Promise.all([
      pool.query('SELECT * FROM logements WHERE user_id = $1', [req.userId]),
      pool.query('SELECT * FROM profiles WHERE user_id = $1', [req.userId]),
    ]);

    const logement = logRows[0];
    const profil = profRows[0] || {};

    if (!logement?.ville_destination) {
      return res.status(400).json({ message: 'Veuillez d\'abord renseigner votre ville de destination dans la section Logement.' });
    }

    const guide = await claudeService.recommanderLogement(
      profil,
      logement.ville_destination,
      logement.budget_mensuel || 700
    );

    res.json({ guide });
  } catch (err) {
    const isApiErr = err?.status === 400 || err?.status === 429;
    console.error('Erreur guide IA logement:', err.message);
    if (isApiErr) {
      return res.status(503).json({ message: 'Service IA temporairement indisponible. Réessayez dans quelques instants.' });
    }
    res.status(500).json({ message: 'Erreur lors de la génération du guide', detail: err.message });
  }
};
