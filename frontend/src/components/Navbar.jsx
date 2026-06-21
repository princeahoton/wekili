import React, { useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { getToken, getUser } from '../utils/auth';
import { logout } from '../services/api';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [navSearch, setNavSearch] = useState(searchParams.get('q') || '');

  const handleNavSearchChange = (e) => {
    const val = e.target.value;
    setNavSearch(val);
    if (location.pathname === '/') {
      navigate(val ? `/?q=${encodeURIComponent(val)}` : '/', { replace: true });
    }
  };

  const handleNavSearchSubmit = (e) => {
    e.preventDefault();
    navigate(navSearch.trim() ? `/?q=${encodeURIComponent(navSearch.trim())}` : '/');
  };

  const user = getUser();
  const isLoggedIn = !!getToken();

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">

      {/* ── Barre utilitaire ── */}
      <div className="bg-[#1a3a6b] text-white">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-10">

          {/* Icônes réseaux sociaux */}
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-[#F5A623] transition-colors" aria-label="Facebook">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="#" className="hover:text-[#F5A623] transition-colors" aria-label="Twitter">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="#" className="hover:text-[#F5A623] transition-colors" aria-label="LinkedIn">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
            <a href="#" className="hover:text-[#F5A623] transition-colors" aria-label="YouTube">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
          </div>

          {/* Audiences */}
          <div className="hidden md:flex items-center">
            {['ÉTUDIANTS', 'PARTENAIRES', 'INSTITUTIONNELS'].map((label, i) => (
              <button
                key={label}
                className={`px-5 h-10 font-bold tracking-wide transition-colors text-xs ${
                  i === 0
                    ? 'bg-[#F5A623] text-white'
                    : 'hover:bg-white/10 text-white/80 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Navbar principale ── */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-20">

          {/* Logo */}
          <a href="/" className="flex items-center gap-3 shrink-0">
            <img src="/logo.svg" alt="Wekili" className="h-11 w-auto" />
            <div className="hidden sm:block">
              <p className="text-[#1a3a6b] font-bold text-lg leading-tight">WEKILI</p>
              <p className="text-gray-500 text-xs leading-tight uppercase tracking-wider">Bourses & Études</p>
            </div>
          </a>

          {/* Nav desktop */}
          <nav className="hidden lg:flex items-center h-full">
            {[
              { label: 'Bourses',     href: '#bourses'  },
              { label: 'Pays',        href: '#pays'     },
              { label: 'Préparer',    href: '#preparer' },
              { label: 'Étudier',     href: '#etudier'  },
              { label: 'En savoir +', href: '#faq'      },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="px-5 h-20 flex items-center text-base font-semibold text-[#1a3a6b] border-b-2 border-transparent hover:border-[#F5A623] hover:text-[#F5A623] transition-all"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Boutons droite */}
          <div className="flex items-center gap-3">

            {/* Barre de recherche */}
            <form onSubmit={handleNavSearchSubmit} className="hidden md:flex items-center border border-gray-200 rounded-lg px-3 gap-2 h-9 focus-within:border-[#1a3a6b] transition-colors bg-gray-50">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={navSearch}
                onChange={handleNavSearchChange}
                placeholder="Rechercher une bourse..."
                className="w-36 lg:w-48 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
              />
              {navSearch && (
                <button type="button" onClick={() => { setNavSearch(''); if (location.pathname === '/') navigate('/', { replace: true }); }} className="text-gray-300 hover:text-gray-500">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </form>

            {isLoggedIn ? (
              /* ── Utilisateur connecté ── */
              <div className="hidden md:flex items-center gap-3">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-sm font-semibold bg-[#1a3a6b] text-white px-5 py-2 rounded hover:bg-[#0f2550] transition-colors"
                >
                  Mon tableau de bord
                </button>
                <div className="flex items-center gap-2 cursor-pointer group" onClick={handleLogout} title="Se déconnecter">
                  <div className="w-8 h-8 bg-[#F5A623] rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {user?.prenom?.[0]}{user?.nom?.[0]}
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
              </div>
            ) : (
              /* ── Visiteur non connecté ── */
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="hidden md:block text-sm font-semibold text-[#1a3a6b] hover:text-[#F5A623] transition-colors px-4 py-2 border border-[#1a3a6b] hover:border-[#F5A623] rounded"
                >
                  Connexion
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="hidden md:block text-sm font-semibold bg-[#F5A623] text-white px-5 py-2 rounded hover:bg-orange-500 transition-colors"
                >
                  S'inscrire
                </button>
              </>
            )}

            {/* Burger mobile */}
            <button
              className="lg:hidden p-2 text-[#1a3a6b]"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Sous-navigation ── */}
      <div className="hidden lg:block bg-[#1a3a6b]">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-8 h-10">
          {[
            { label: 'Quelle formation ?',   href: '#comment'  },
            { label: 'Financement',           href: '#bourses'  },
            { label: 'Candidater',            href: '#preparer' },
            { label: 'Arriver en France',     href: '#etudier'  },
            { label: "Vivre à l'étranger",    href: '#etudier'  },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-white/80 hover:text-[#F5A623] text-xs font-medium transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>

      {/* ── Menu mobile ── */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 py-4 flex flex-col gap-3">
            {[
              { label: 'Bourses',     href: '#bourses'  },
              { label: 'Pays',        href: '#pays'     },
              { label: 'Préparer',    href: '#preparer' },
              { label: 'Étudier',     href: '#etudier'  },
              { label: 'En savoir +', href: '#faq'      },
            ].map((item) => (
              <a key={item.label} href={item.href} className="text-[#1a3a6b] font-semibold text-base py-2 border-b border-gray-100" onClick={() => setMenuOpen(false)}>
                {item.label}
              </a>
            ))}
            <div className="flex gap-3 pt-2">
              {isLoggedIn ? (
                <>
                  <button
                    onClick={() => { navigate('/dashboard'); setMenuOpen(false); }}
                    className="flex-1 bg-[#1a3a6b] text-white text-sm py-2.5 rounded font-semibold"
                  >
                    Mon tableau de bord
                  </button>
                  <button
                    onClick={() => { handleLogout(); setMenuOpen(false); }}
                    className="flex-1 border border-red-400 text-red-500 text-sm py-2.5 rounded font-semibold"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { navigate('/login');    setMenuOpen(false); }} className="flex-1 border border-[#1a3a6b] text-[#1a3a6b] text-sm py-2.5 rounded font-semibold">Connexion</button>
                  <button onClick={() => { navigate('/register'); setMenuOpen(false); }} className="flex-1 bg-[#F5A623] text-white text-sm py-2.5 rounded font-semibold">S'inscrire</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
