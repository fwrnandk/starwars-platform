// src/pages/FilmsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { type Film } from '../services/api';

const FilmsPage: React.FC = () => {
  const navigate = useNavigate();
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'release_date' | 'title' | 'episode_id'>('release_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const loadFilms = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.getFilms({
        search: searchTerm || undefined,
        sort: sortBy,
        order: sortOrder,
      });
      setFilms(response.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar filmes');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, sortBy, sortOrder]);

  useEffect(() => {
    // Verificar autenticação
    if (!api.isAuthenticated()) {
      navigate('/login');
      return;
    }

    loadFilms();
  }, [loadFilms, navigate]);

  const handleLogout = () => {
    api.logout();
    navigate('/login');
  };

  const handleFilmClick = (filmId: string) => {
    navigate(`/films/${filmId}/characters`);
  };

  if (loading) {
    return <div className="loading">Carregando filmes...</div>;
  }

  return (
    <div className="films-page">
      <header>
        <h1>Star Wars Films</h1>
        <button onClick={handleLogout}>Logout</button>
      </header>

      {error && <div className="error">{error}</div>}

      <div className="filters">
        <input
          type="text"
          placeholder="Buscar filme..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value as 'release_date' | 'title' | 'episode_id')}
        >
          <option value="release_date">Data de Lançamento</option>
          <option value="title">Título</option>
          <option value="episode_id">Episódio</option>
        </select>

        <select 
          value={sortOrder} 
          onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
        >
          <option value="asc">Crescente</option>
          <option value="desc">Decrescente</option>
        </select>
      </div>

      <div className="films-grid">
        {films.map((film) => (
          <div 
            key={film.id} 
            className="film-card"
            onClick={() => handleFilmClick(film.id)}
            style={{ cursor: 'pointer' }}
          >
            <h3>Episode {film.episode_id}: {film.title}</h3>
            <p><strong>Director:</strong> {film.director}</p>
            <p><strong>Release Date:</strong> {new Date(film.release_date).toLocaleDateString()}</p>
            <p className="opening-crawl">{film.opening_crawl.substring(0, 150)}...</p>
          </div>
        ))}
      </div>

      {films.length === 0 && !loading && (
        <p>Nenhum filme encontrado.</p>
      )}
    </div>
  );
};

export default FilmsPage;