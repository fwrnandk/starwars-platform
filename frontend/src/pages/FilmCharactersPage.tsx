// src/pages/FilmCharactersPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { type Character } from '../services/api';
import './FilmCharactersPage.css';

// Mapeamento de posters
const filmPosters: Record<number, string> = {
  1: 'https://image.tmdb.org/t/p/w500/6wkfovpn7Eq8dYNKaG5PY3q2oq6.jpg',
  2: 'https://image.tmdb.org/t/p/w500/oZNPzxqM2s5DyVWab09NTQScDQt.jpg',
  3: 'https://image.tmdb.org/t/p/w500/xfSAoBEm9MNBjmlNcDYLvLSMlnq.jpg',
  4: 'https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg',
  5: 'https://image.tmdb.org/t/p/w500/2l05cFWJacyIsTpsqSgH0wQXe4V.jpg',
  6: 'https://image.tmdb.org/t/p/w500/mDCBQNhR6R0PVFucJl0O4pY5PRN.jpg',
};

const FilmCharactersPage: React.FC = () => {
  const { filmId } = useParams<{ filmId: string }>();
  const navigate = useNavigate();
  const [filmTitle, setFilmTitle] = useState<string>('');
  const [episodeId, setEpisodeId] = useState<number>(0);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFilmCharacters = useCallback(async () => {
    if (!filmId) return;

    setLoading(true);
    setError('');

    try {
      // Busca apenas os personagens - que já inclui info do filme!
      const data = await api.getFilmCharacters(filmId);
      
      setFilmTitle(data.film.title);
      setEpisodeId(data.film.episode_id);
      setCharacters(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [filmId]);

  useEffect(() => {
    if (!api.isAuthenticated()) {
      navigate('/login');
      return;
    }

    loadFilmCharacters();
  }, [loadFilmCharacters, navigate]);

  if (loading) {
    return (
      <div className="film-characters-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando personagens...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="film-characters-page">
        <div className="error-page">
          <svg width="64" height="64" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p>{error}</p>
          <button onClick={() => navigate('/films')} className="back-btn">Voltar para Filmes</button>
        </div>
      </div>
    );
  }

  return (
    <div className="film-characters-page">
      <div className="stars"></div>
      <div className="stars2"></div>
      <div className="stars3"></div>

      <button onClick={() => navigate('/films')} className="back-button">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Voltar
      </button>

      <div className="film-header">
        <div className="film-header-backdrop" style={{
          backgroundImage: `url(${filmPosters[episodeId]})`,
        }}></div>
        
        <div className="film-header-content">
          <div className="film-header-poster">
            <img 
              src={filmPosters[episodeId] || 'https://via.placeholder.com/300x450/1a1a2e/FFE81F?text=Star+Wars'} 
              alt={filmTitle}
            />
          </div>
          
          <div className="film-header-info">
            <div className="episode-number">Episódio {episodeId}</div>
            <h1>{filmTitle}</h1>
            
            <p className="film-description">
              Conheça todos os personagens que fazem parte desta épica aventura na galáxia muito, muito distante.
            </p>
          </div>
        </div>
      </div>

      <div className="characters-section">
        <h2>
          <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
          Personagens ({characters.length})
        </h2>

        <div className="characters-grid">
          {characters.map((character, index) => (
            <div key={character.id} className="character-card" style={{
              animationDelay: `${index * 0.05}s`
            }}>
              <div className="character-header">
                <div className="character-avatar">
                  {character.name.charAt(0)}
                </div>
                <h3>{character.name}</h3>
              </div>
              
              <div className="character-stats">
                <div className="stat">
                  <span className="stat-label">Altura</span>
                  <span className="stat-value">{character.height} cm</span>
                </div>
                
                <div className="stat">
                  <span className="stat-label">Peso</span>
                  <span className="stat-value">{character.mass} kg</span>
                </div>
                
                <div className="stat">
                  <span className="stat-label">Cabelo</span>
                  <span className="stat-value">{character.hair_color}</span>
                </div>
                
                <div className="stat">
                  <span className="stat-label">Olhos</span>
                  <span className="stat-value">{character.eye_color}</span>
                </div>
                
                <div className="stat">
                  <span className="stat-label">Nascimento</span>
                  <span className="stat-value">{character.birth_year}</span>
                </div>
                
                <div className="stat">
                  <span className="stat-label">Gênero</span>
                  <span className="stat-value">{character.gender}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {characters.length === 0 && (
          <div className="no-characters">
            <svg width="64" height="64" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            <p>Nenhum personagem encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilmCharactersPage;