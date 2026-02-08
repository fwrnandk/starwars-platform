// src/pages/FilmsPage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { type Film } from '../services/api';
import './FilmsPage.css';

// Mapeamento de posters por episódio
const filmPosters: Record<number, string> = {
  1: 'https://image.tmdb.org/t/p/w500/6wkfovpn7Eq8dYNKaG5PY3q2oq6.jpg',
  2: 'https://image.tmdb.org/t/p/w500/oZNPzxqM2s5DyVWab09NTQScDQt.jpg',
  3: 'https://image.tmdb.org/t/p/w500/xfSAoBEm9MNBjmlNcDYLvLSMlnq.jpg',
  4: 'https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg',
  5: 'https://image.tmdb.org/t/p/w500/2l05cFWJacyIsTpsqSgH0wQXe4V.jpg',
  6: 'https://image.tmdb.org/t/p/w500/mDCBQNhR6R0PVFucJl0O4pY5PRN.jpg',
};

// Função auxiliar para extrair ID da URL
const extractIdFromUrl = (url: string): string => {
  const matches = url.match(/\/(\d+)\/?$/);
  return matches ? matches[1] : '';
};

// Função para garantir que temos um ID válido
const getFilmId = (film: Film): string => {
  // Se o ID existir e for válido, use-o
  if (film.id && film.id !== 'undefined' && film.id !== '') {
    return film.id;
  }
  // Caso contrário, extraia da URL
  return extractIdFromUrl(film.url);
};

const FilmsPage: React.FC = () => {
  const navigate = useNavigate();
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'release_date' | 'title' | 'episode_id'>('episode_id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const searchTimerRef = useRef<number | undefined>(undefined);

  const loadFilms = useCallback(async (search: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await api.getFilms({
        search: search || undefined,
        sort: sortBy,
        order: sortOrder,
      });
      setFilms(response.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar filmes');
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder]);

  useEffect(() => {
    if (!api.isAuthenticated()) {
      navigate('/login');
      return;
    }
    loadFilms(searchTerm);
  }, [sortBy, sortOrder, navigate, loadFilms, searchTerm]);

  useEffect(() => {
    if (searchTimerRef.current) {
      window.clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = window.setTimeout(() => {
      if (api.isAuthenticated()) {
        loadFilms(searchTerm);
      }
    }, 500);

    return () => {
      if (searchTimerRef.current) {
        window.clearTimeout(searchTimerRef.current);
      }
    };
  }, [searchTerm, loadFilms]);

  const handleLogout = () => {
    api.logout();
    navigate('/login');
  };

  const handleFilmClick = (film: Film) => {
    const filmId = getFilmId(film);
    console.log('Navigating to film:', filmId, film); // Para debug
    navigate(`/films/${filmId}/characters`);
  };

  if (loading && films.length === 0) {
    return (
      <div className="films-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando a galáxia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="films-page">
      <div className="stars"></div>
      <div className="stars2"></div>
      <div className="stars3"></div>

      <header className="films-header">
        <div className="header-content">
          <h1>
            <span className="star-wars-text">Star Wars</span>
            <span className="films-subtitle">A Saga Completa</span>
          </h1>
          <button onClick={handleLogout} className="logout-btn">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm11 4.414l-4.293 4.293a1 1 0 01-1.414 0L4 7.414 5.414 6l3.293 3.293L13.586 6 15 7.414z" clipRule="evenodd" />
            </svg>
            Sair
          </button>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <div className="filters-container">
        <div className="search-box">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            placeholder="Buscar filme..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {loading && films.length > 0 && (
            <div className="search-loading">
              <div className="mini-spinner"></div>
            </div>
          )}
        </div>

        <div className="filters-group">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as 'release_date' | 'title' | 'episode_id')}
          >
            <option value="episode_id">Episódio</option>
            <option value="release_date">Data de Lançamento</option>
            <option value="title">Título</option>
          </select>

          <select 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
          >
            <option value="asc">Crescente</option>
            <option value="desc">Decrescente</option>
          </select>
        </div>
      </div>

      <div className="films-grid">
        {films.map((film) => {
          const filmId = getFilmId(film);
          return (
            <div 
              key={filmId || film.url}
              className="film-card"
              onClick={() => handleFilmClick(film)}
            >
              <div className="film-poster">
                <img 
                  src={filmPosters[film.episode_id] || 'https://via.placeholder.com/300x450/1a1a2e/FFE81F?text=Star+Wars'} 
                  alt={film.title}
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/300x450/1a1a2e/FFE81F?text=Star+Wars';
                  }}
                />
                <div className="episode-badge">Episódio {film.episode_id}</div>
              </div>
              
              <div className="film-info">
                <h3 className="film-title">{film.title}</h3>
                
                <div className="film-meta">
                  <div className="meta-item">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span>{film.director}</span>
                  </div>
                  
                  <div className="meta-item">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <span>{new Date(film.release_date).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                <p className="opening-crawl">{film.opening_crawl.substring(0, 120)}...</p>
                
                <button className="view-details-btn" onClick={(e) => {
                  e.stopPropagation();
                  handleFilmClick(film);
                }}>
                  Ver Personagens
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {films.length === 0 && !loading && (
        <div className="no-results">
          <svg width="64" height="64" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p>Nenhum filme encontrado na galáxia</p>
        </div>
      )}
    </div>
  );
};

export default FilmsPage;