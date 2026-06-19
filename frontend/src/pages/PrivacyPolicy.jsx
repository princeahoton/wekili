import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const SECTIONS = [
  {
    titre: '1. Qui sommes-nous ?',
    contenu: [
      'Wekili est une plateforme d\'aide à la recherche de bourses internationales pour les étudiants africains francophones.',
      'Responsable du traitement : Wekili — contact@wekili.africa',
      'Site web : wekili.vercel.app',
    ],
  },
  {
    titre: '2. Données collectées',
    contenu: [
      'Lors de votre inscription : prénom, nom, adresse email, pays d\'origine, mot de passe (chiffré).',
      'Dans votre profil : nationalité, pays de résidence, numéro de téléphone, date de naissance, niveau d\'études, établissement, moyenne, langues, certifications, pays cibles, niveau visé, budget.',
      'Documents uploadés : CV, relevés de notes, diplômes, certificats de langue, lettres de motivation, lettres de recommandation.',
      'Données de connexion : adresse IP, type de navigateur (pour la sécurité, détection de nouvelles connexions), historique des 10 dernières sessions.',
    ],
  },
  {
    titre: '3. Finalités du traitement',
    contenu: [
      'Fournir le service d\'analyse IA de votre dossier et de recommandation de bourses.',
      'Sécuriser votre compte (authentification JWT, vérification OTP, 2FA optionnel).',
      'Vous informer des nouvelles connexions depuis un appareil non reconnu.',
      'Améliorer le service et assurer son bon fonctionnement.',
    ],
  },
  {
    titre: '4. Base légale',
    contenu: [
      'Exécution du contrat : le traitement est nécessaire pour vous fournir le service auquel vous avez souscrit.',
      'Consentement : pour l\'envoi d\'emails de notification et d\'alerte de sécurité.',
      'Intérêt légitime : pour la sécurité du service et la prévention des fraudes.',
    ],
  },
  {
    titre: '5. Sécurité des données',
    contenu: [
      'Mots de passe : hachés avec bcrypt (facteur 12) — jamais stockés en clair.',
      'Documents : stockés de manière chiffrée sur Amazon S3 avec accès restreint.',
      'Authentification : tokens JWT à durée limitée (24h). Code OTP requis pour accéder à l\'espace Documents.',
      'Authentification à deux facteurs (2FA) disponible et recommandée dans les Paramètres.',
      'Détection des nouvelles connexions : alerte par email si connexion depuis un nouvel appareil.',
      'Accès HTTPS uniquement — les communications sont chiffrées en transit.',
    ],
  },
  {
    titre: '6. Conservation des données',
    contenu: [
      'Vos données sont conservées le temps de votre utilisation du service.',
      'Vous pouvez supprimer votre compte à tout moment depuis la page Paramètres → Compte. Cette suppression est définitive et irréversible.',
      'Les logs de sécurité (sessions) sont conservés 30 jours puis supprimés automatiquement.',
    ],
  },
  {
    titre: '7. Partage des données',
    contenu: [
      'Wekili ne vend pas et ne loue pas vos données personnelles.',
      'Vos données peuvent être traitées par les sous-traitants suivants, dans le cadre strict du service :',
      '• Anthropic (analyse IA des documents) — politique : anthropic.com/privacy',
      '• Amazon Web Services / S3 (stockage des documents) — politique : aws.amazon.com/privacy',
      '• Resend (envoi des emails) — politique : resend.com/privacy',
      '• Twilio (envoi des SMS OTP) — politique : twilio.com/legal/privacy',
    ],
  },
  {
    titre: '8. Vos droits (RGPD)',
    contenu: [
      'Vous disposez des droits suivants sur vos données personnelles :',
      '• Droit d\'accès : obtenir une copie de vos données.',
      '• Droit de rectification : corriger vos données dans votre profil.',
      '• Droit à l\'effacement : supprimer votre compte (Paramètres → Compte → Supprimer mon compte).',
      '• Droit à la portabilité : obtenir vos données dans un format structuré.',
      '• Droit d\'opposition : s\'opposer à certains traitements.',
      'Pour exercer ces droits : contact@wekili.africa',
    ],
  },
  {
    titre: '9. Cookies',
    contenu: [
      'Wekili n\'utilise pas de cookies de suivi ou publicitaires.',
      'Le stockage de votre session utilise localStorage ou sessionStorage (selon l\'option "Se souvenir de moi") — ce stockage est local à votre navigateur.',
    ],
  },
  {
    titre: '10. Modifications',
    contenu: [
      'Cette politique peut être mise à jour. En cas de changement significatif, vous serez informé par email.',
      'Date de dernière mise à jour : juin 2026.',
    ],
  },
  {
    titre: '11. Contact',
    contenu: [
      'Pour toute question relative à cette politique ou à vos données personnelles :',
      'Email : contact@wekili.africa',
    ],
  },
];

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-32 pb-20">

        <div className="mb-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1a3a6b] transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour
          </button>

          <span className="inline-block bg-blue-50 text-[#1a3a6b] text-xs font-semibold px-3 py-1 rounded-full mb-4">
            Mise à jour : juin 2026
          </span>
          <h1 className="text-3xl font-bold text-[#1a3a6b] mb-3">Politique de confidentialité</h1>
          <p className="text-gray-500 text-base leading-relaxed">
            La protection de vos données personnelles est une priorité pour Wekili. Cette politique explique quelles données nous collectons, comment nous les utilisons et comment vous pouvez exercer vos droits.
          </p>
        </div>

        <div className="space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.titre} className="border-b border-gray-100 pb-8 last:border-0">
              <h2 className="text-lg font-bold text-[#1a3a6b] mb-4">{s.titre}</h2>
              <ul className="space-y-2">
                {s.contenu.map((ligne, i) => (
                  <li key={i} className="text-gray-600 text-sm leading-relaxed">
                    {ligne}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-10 bg-blue-50 border border-blue-100 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[#1a3a6b] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div>
              <p className="text-[#1a3a6b] font-semibold text-sm mb-1">Vos données vous appartiennent</p>
              <p className="text-gray-600 text-sm">
                Vous pouvez supprimer votre compte et toutes vos données à tout moment depuis{' '}
                <a href="/settings" className="text-[#1a3a6b] hover:underline font-medium">Paramètres → Compte</a>.
                La suppression est immédiate et définitive.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
