// pages/LoginPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Login from '../components/Login';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    // Redirecionar para a página de filmes após login
    navigate('/films');
  };

  return (
    <div className="login-page">
      <Login onLoginSuccess={handleLoginSuccess} />
    </div>
  );
};

export default LoginPage;