import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { getToken, getUser } from './utils/auth';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Documents from './pages/Documents';
import Analysis from './pages/Analysis';
import Bourses from './pages/Bourses';
import Universities from './pages/Universities';
import Logement from './pages/Logement';
import Settings from './pages/Settings';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import LegalNotice from './pages/LegalNotice';
import AdminOverview    from './pages/admin/AdminOverview';
import AdminUsers       from './pages/admin/AdminUsers';
import AdminBourses     from './pages/admin/AdminBourses';
import AdminUniversites from './pages/admin/AdminUniversites';

// Redirige vers /login si pas de token (en passant la destination pour y revenir après connexion)
function ProtectedRoute({ children }) {
  const token = getToken();
  const location = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}

// Redirige vers /dashboard si déjà connecté
function PublicOnlyRoute({ children }) {
  const token = getToken();
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
}

// Redirige vers /dashboard si pas admin
function ProtectedAdminRoute({ children }) {
  const token = getToken();
  const user  = getUser();
  const location = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!['admin', 'superadmin'].includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login"    element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile"   element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
        <Route path="/analysis"  element={<ProtectedRoute><Analysis /></ProtectedRoute>} />
        <Route path="/bourses"      element={<ProtectedRoute><Bourses /></ProtectedRoute>} />
        <Route path="/universities" element={<ProtectedRoute><Universities /></ProtectedRoute>} />
        <Route path="/logement"     element={<ProtectedRoute><Logement /></ProtectedRoute>} />
        <Route path="/settings"       element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        {/* Vérification email (public) */}
        <Route path="/verify-email"     element={<VerifyEmail />} />
        <Route path="/forgot-password"  element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
        {/* Pages légales (publiques) */}
        <Route path="/confidentialite"  element={<PrivacyPolicy />} />
        <Route path="/cgu"              element={<TermsOfService />} />
        <Route path="/mentions-legales" element={<LegalNotice />} />
        {/* Admin */}
        <Route path="/admin"              element={<ProtectedAdminRoute><AdminOverview /></ProtectedAdminRoute>} />
        <Route path="/admin/users"        element={<ProtectedAdminRoute><AdminUsers /></ProtectedAdminRoute>} />
        <Route path="/admin/bourses"      element={<ProtectedAdminRoute><AdminBourses /></ProtectedAdminRoute>} />
        <Route path="/admin/universities" element={<ProtectedAdminRoute><AdminUniversites /></ProtectedAdminRoute>} />
        {/* Catch-all → accueil */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
