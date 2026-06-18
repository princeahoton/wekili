/**
 * Ajouter une bourse manuellement dans la base de données.
 * Utilisation : node database/add_bourse.js
 *
 * Modifie le tableau `nouvelles` ci-dessous, puis relance le script.
 * Les doublons (même nom + même pays) sont ignorés.
 */

const pool = require('../config/database');
require('dotenv').config();

// ──────────────────────────────────────────────────────────────────────
// AJOUTE TES NOUVELLES BOURSES ICI
// ──────────────────────────────────────────────────────────────────────
const nouvelles = [

  // Exemple — supprime ou modifie cet exemple avant de lancer
  {
    nom: 'Bourse Exemple — À remplacer',
    organisme: 'Organisme officiel',
    pays: 'France',
    code_pays: 'fr',           // code ISO 2 lettres (fr, ca, de, gb, be, us...)
    niveau: 'Master',          // Licence / Master / Doctorat / Master et Doctorat
    domaine: 'Tous domaines',
    montant: '1 000 €/mois',
    deadline: '2027-03-31',    // AAAA-MM-JJ
    date_debut: '2026-12-01',
    duree: '1 à 2 ans',
    type_financement: 'Complète',  // Complète / Partielle / Voyage / Frais de scolarité
    description: 'Description complète de la bourse...',
    lien: 'https://www.site-officiel.com/candidater',  // Lien DIRECT page candidature
    avantages: ['Allocation mensuelle', 'Billet d\'avion', 'Assurance maladie'],
    documents_requis: ['CV', 'Lettre de motivation', 'Relevés de notes', 'Passeport'],
    nationalites_eligibles: ['Afrique subsaharienne'],
    langue_requise: 'Français',
    niveau_langue_requis: 'B2',    // A1 A2 B1 B2 C1 C2
    age_max: 35,                   // null si pas de limite
    nb_places: 50,                 // null si non précisé
    criteres: [
      { titre: 'Critère 1', desc: 'Description du critère...' },
      { titre: 'Critère 2', desc: 'Description du critère...' },
    ],
  },

];
// ──────────────────────────────────────────────────────────────────────

async function ajouterBourses() {
  let ajoutees = 0;
  let ignorees = 0;

  for (const b of nouvelles) {
    try {
      // Vérifie doublon
      const { rows } = await pool.query(
        'SELECT id FROM scholarships WHERE nom = $1 AND pays = $2',
        [b.nom, b.pays]
      );
      if (rows.length > 0) {
        console.log(`⏭  Ignorée (déjà présente) : ${b.nom}`);
        ignorees++;
        continue;
      }

      await pool.query(
        `INSERT INTO scholarships
          (nom, organisme, pays, code_pays, niveau, domaine, montant, deadline,
           date_debut, duree, type_financement, description, lien,
           avantages, documents_requis, nationalites_eligibles,
           langue_requise, niveau_langue_requis, age_max, nb_places, criteres)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
        [
          b.nom, b.organisme, b.pays, b.code_pays, b.niveau, b.domaine,
          b.montant, b.deadline, b.date_debut, b.duree, b.type_financement,
          b.description, b.lien,
          b.avantages, b.documents_requis, b.nationalites_eligibles,
          b.langue_requise, b.niveau_langue_requis, b.age_max, b.nb_places,
          JSON.stringify(b.criteres),
        ]
      );
      console.log(`✅ Ajoutée : ${b.nom}`);
      ajoutees++;
    } catch (err) {
      console.error(`❌ Erreur pour "${b.nom}" :`, err.message);
    }
  }

  console.log(`\nRésultat : ${ajoutees} ajoutée(s), ${ignorees} ignorée(s)`);
  await pool.end();
}

ajouterBourses();
