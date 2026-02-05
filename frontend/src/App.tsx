// src/App.tsx
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import api from './services/api';
import LoginPage from './pages/LoginPage';
import FilmsPage from './pages/FilmsPage';
import FilmCharactersPage from './pages/FilmCharactersPage';
import './App.css';

// Componente para escutar eventos de autenticação
const AuthListener: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleUnauthorized = () => {
      navigate('/login');
    };

    const handleLogout = () => {
      navigate('/login');
    };

    window.addEventListener('unauthorized', handleUnauthorized);
    window.addEventListener('logout', handleLogout);

    return () => {
      window.removeEventListener('unauthorized', handleUnauthorized);
      window.removeEventListener('logout', handleLogout);
    };
  }, [navigate]);

  return null;
};

// Componente de rota protegida
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = api.isAuthenticated();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <AuthListener />
      <Routes>
        {/* Rota pública */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rotas protegidas */}
        <Route
          path="/films"
          element={
            <ProtectedRoute>
              <FilmsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/films/:filmId/characters"
          element={
            <ProtectedRoute>
              <FilmCharactersPage />
            </ProtectedRoute>
          }
        />

        {/* Rota padrão - redireciona para films */}
        <Route path="/" element={<Navigate to="/films" replace />} />

        {/* Rota 404 */}
        <Route path="*" element={<Navigate to="/films" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;