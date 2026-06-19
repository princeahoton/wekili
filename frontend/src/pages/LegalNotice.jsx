import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function LegalNotice() {
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

          <span className="inline-block bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            Mise à jour : juin 2026
          </span>
          <h1 className="text-3xl font-bold text-[#1a3a6b] mb-3">Mentions légales</h1>
        </div>

        <div className="space-y-8">

          <section className="border-b border-gray-100 pb-8">
            <h2 className="text-lg font-bold text-[#1a3a6b] mb-4">Éditeur du site</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-semibold text-gray-700">Nom :</span> Wekili</p>
              <p><span className="font-semibold text-gray-700">Email :</span>{' '}
                <a href="mailto:contact@wekili.africa" className="text-[#1a3a6b] hover:underline">contact@wekili.africa</a>
              </p>
              <p><span className="font-semibold text-gray-700">Site web :</span> wekili.vercel.app</p>
              <p className="text-gray-400 text-xs mt-3">
                Informations légales complètes (numéro d'immatriculation, adresse du siège) disponibles sur demande à contact@wekili.africa
              </p>
            </div>
          </section>

          <section className="border-b border-gray-100 pb-8">
            <h2 className="text-lg font-bold text-[#1a3a6b] mb-4">Hébergement</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                <p className="font-semibold text-gray-700 mb-1">Frontend (application web)</p>
                <p>Vercel Inc. — 340 Pine Street, Suite 701, San Francisco, CA 94104, USA</p>
                <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-[#1a3a6b] hover:underline text-xs">vercel.com</a>
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-1">Backend (API)</p>
                <p>Render Services Inc. — 525 Brannan St Suite 300, San Francisco, CA 94107, USA</p>
                <a href="https://render.com" target="_blank" rel="noopener noreferrer" className="text-[#1a3a6b] hover:underline text-xs">render.com</a>
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-1">Base de données</p>
                <p>PostgreSQL hébergée sur Render (voir ci-dessus)</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-1">Stockage des documents</p>
                <p>Amazon Web Services (S3) — Amazon.com, Inc., Seattle, WA 98109, USA</p>
                <a href="https://aws.amazon.com" target="_blank" rel="noopener noreferrer" className="text-[#1a3a6b] hover:underline text-xs">aws.amazon.com</a>
              </div>
            </div>
          </section>

          <section className="border-b border-gray-100 pb-8">
            <h2 className="text-lg font-bold text-[#1a3a6b] mb-4">Propriété intellectuelle</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p>L'ensemble du contenu de ce site (textes, logo, interface, code) est protégé par le droit d'auteur et appartient à Wekili.</p>
              <p>Toute reproduction ou représentation, en tout ou partie, est interdite sans autorisation préalable écrite de Wekili.</p>
              <p>Les données sur les bourses et universités sont issues de sources publiques officielles.</p>
            </div>
          </section>

          <section className="border-b border-gray-100 pb-8">
            <h2 className="text-lg font-bold text-[#1a3a6b] mb-4">Limitation de responsabilité</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Wekili s'efforce de maintenir les informations sur le site à jour et exactes, mais ne peut garantir l'exhaustivité ou l'exactitude de toutes les informations relatives aux bourses et aux programmes d'études.</p>
              <p>Les informations fournies sont à titre indicatif uniquement. Wekili ne saurait être tenu responsable des décisions prises sur la base des informations disponibles sur le site.</p>
              <p>Pour toute candidature à une bourse, consultez impérativement le site officiel de l'organisme concerné.</p>
            </div>
          </section>

          <section className="border-b border-gray-100 pb-8">
            <h2 className="text-lg font-bold text-[#1a3a6b] mb-4">Protection des données</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                Le traitement de vos données personnelles est détaillé dans notre{' '}
                <a href="/confidentialite" className="text-[#1a3a6b] hover:underline font-medium">Politique de confidentialité</a>.
              </p>
              <p>Responsable du traitement : Wekili — contact@wekili.africa</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1a3a6b] mb-4">Droit applicable</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Les présentes mentions légales sont soumises au droit applicable dans le pays d'enregistrement de Wekili.</p>
              <p>Pour tout litige, une solution amiable sera recherchée en priorité via contact@wekili.africa.</p>
            </div>
          </section>

        </div>

        <div className="mt-10 bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
          <p className="text-gray-500 text-sm">
            Contact :{' '}
            <a href="mailto:contact@wekili.africa" className="text-[#1a3a6b] hover:underline font-medium">
              contact@wekili.africa
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}
