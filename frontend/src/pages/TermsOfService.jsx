import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const SECTIONS = [
  {
    titre: '1. Présentation du service',
    contenu: [
      'Wekili est une plateforme gratuite d\'aide à la recherche de bourses internationales pour les étudiants africains francophones.',
      'Le service propose : analyse IA du dossier de candidature, recommandation de bourses, aide à la rédaction de lettre de motivation et CV, suivi des candidatures, et informations sur les universités.',
      'Wekili n\'est pas un organisme de bourses et ne garantit pas l\'obtention d\'une bourse ou d\'une admission dans un établissement.',
    ],
  },
  {
    titre: '2. Accès au service',
    contenu: [
      'L\'inscription est gratuite et ouverte à toute personne remplissant les conditions suivantes : être étudiant ou futur étudiant, avoir au moins 16 ans, disposer d\'une adresse email valide.',
      'Lors de l\'inscription, vous devez fournir des informations exactes et les maintenir à jour.',
      'Vous êtes responsable de la confidentialité de vos identifiants de connexion.',
    ],
  },
  {
    titre: '3. Utilisation acceptable',
    contenu: [
      'Vous vous engagez à utiliser le service de bonne foi et uniquement à des fins personnelles légitimes.',
      'Il est interdit de : tenter d\'accéder aux données d\'autres utilisateurs, soumettre des informations fausses ou trompeuses, utiliser le service à des fins commerciales sans autorisation, tenter de compromettre la sécurité de la plateforme.',
    ],
  },
  {
    titre: '4. Vos documents et données',
    contenu: [
      'Vous conservez la propriété entière de tous les documents que vous uploadez (CV, relevés de notes, lettres, etc.).',
      'Vous nous accordez le droit de traiter ces documents uniquement pour fournir le service (analyse IA, recommandations).',
      'Vos documents sont stockés de manière chiffrée. Vous pouvez les supprimer à tout moment.',
      'Wekili ne partage pas vos documents avec des tiers sans votre consentement explicite.',
    ],
  },
  {
    titre: '5. Résultats de l\'analyse IA',
    contenu: [
      'L\'analyse de votre dossier est réalisée par intelligence artificielle et est fournie à titre indicatif uniquement.',
      'Wekili ne garantit pas l\'exactitude, la complétude ou l\'adéquation des recommandations générées.',
      'Les résultats ne constituent pas un avis juridique ou une garantie d\'admission ou d\'attribution de bourse.',
      'Consultez toujours les sites officiels des organismes de bourses pour les informations à jour.',
    ],
  },
  {
    titre: '6. Disponibilité du service',
    contenu: [
      'Wekili s\'efforce d\'assurer la disponibilité du service 24h/24, 7j/7, mais ne peut garantir une disponibilité sans interruption.',
      'Des maintenances peuvent occasionnellement rendre le service temporairement indisponible.',
    ],
  },
  {
    titre: '7. Responsabilité',
    contenu: [
      'Wekili ne peut être tenu responsable des décisions prises par des tiers (organismes de bourses, universités) concernant votre candidature.',
      'Wekili n\'est pas responsable des pertes ou préjudices indirects liés à l\'utilisation du service.',
    ],
  },
  {
    titre: '8. Suppression du compte',
    contenu: [
      'Vous pouvez supprimer votre compte à tout moment depuis Paramètres → Compte → Supprimer mon compte.',
      'La suppression entraîne la suppression définitive et irréversible de toutes vos données et documents.',
      'Wekili peut suspendre un compte en cas de violation des présentes conditions.',
    ],
  },
  {
    titre: '9. Modifications des conditions',
    contenu: [
      'Ces conditions peuvent être modifiées. Vous serez informé par email en cas de changement significatif.',
      'La poursuite de l\'utilisation du service après notification vaut acceptation des nouvelles conditions.',
      'Date de dernière mise à jour : juin 2026.',
    ],
  },
  {
    titre: '10. Contact',
    contenu: [
      'Pour toute question relative aux présentes conditions : contact@wekili.africa',
    ],
  },
];

export default function TermsOfService() {
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

          <span className="inline-block bg-orange-50 text-orange-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            Mise à jour : juin 2026
          </span>
          <h1 className="text-3xl font-bold text-[#1a3a6b] mb-3">Conditions d'utilisation</h1>
          <p className="text-gray-500 text-base leading-relaxed">
            En créant un compte sur Wekili, vous acceptez les présentes conditions d'utilisation. Veuillez les lire attentivement avant d'utiliser le service.
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

        <div className="mt-10 bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
          <p className="text-gray-500 text-sm">
            Des questions ? Contactez-nous à{' '}
            <a href="mailto:contact@wekili.africa" className="text-[#1a3a6b] hover:underline font-medium">
              contact@wekili.africa
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
