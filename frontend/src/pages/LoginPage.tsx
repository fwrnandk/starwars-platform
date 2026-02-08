// pages/LoginPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Login from '../components/Login';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    navigate('/films');
  };

  return <Login onLoginSuccess={handleLoginSuccess} />;
};

export default LoginPage;