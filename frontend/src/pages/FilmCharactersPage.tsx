// src/pages/FilmCharactersPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { type Character, type Film } from '../services/api';

const FilmCharactersPage: React.FC = () => {
  const { filmId } = useParams<{ filmId: string }>();
  const navigate = useNavigate();
  const [film, setFilm] = useState<Film | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFilmAndCharacters = useCallback(async () => {
    if (!filmId) return;

    setLoading(true);
    setError('');

    try {
      // Carregar filme e personagens em paralelo
      const [filmData, charactersData] = await Promise.all([
        api.getFilmById(filmId),
        api.getFilmCharacters(filmId),
      ]);

      setFilm(filmData);
      setCharacters(charactersData.results);
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

    loadFilmAndCharacters();
  }, [loadFilmAndCharacters, navigate]);

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  if (error) {
    return (
      <div className="error-page">
        <p>{error}</p>
        <button onClick={() => navigate('/films')}>Voltar para Filmes</button>
      </div>
    );
  }

  return (
    <div className="film-characters-page">
      <button onClick={() => navigate('/films')}>← Voltar</button>

      {film && (
        <div className="film-header">
          <h1>Episode {film.episode_id}: {film.title}</h1>
          <p><strong>Director:</strong> {film.director}</p>
          <p><strong>Producer:</strong> {film.producer}</p>
          <p><strong>Release Date:</strong> {new Date(film.release_date).toLocaleDateString()}</p>
        </div>
      )}

      <h2>Personagens ({characters.length})</h2>

      <div className="characters-grid">
        {characters.map((character) => (
          <div key={character.id} className="character-card">
            <h3>{character.name}</h3>
            <p><strong>Height:</strong> {character.height}cm</p>
            <p><strong>Mass:</strong> {character.mass}kg</p>
            <p><strong>Hair Color:</strong> {character.hair_color}</p>
            <p><strong>Eye Color:</strong> {character.eye_color}</p>
            <p><strong>Birth Year:</strong> {character.birth_year}</p>
            <p><strong>Gender:</strong> {character.gender}</p>
          </div>
        ))}
      </div>

      {characters.length === 0 && (
        <p>Nenhum personagem encontrado.</p>
      )}
    </div>
  );
};

export default FilmCharactersPage;