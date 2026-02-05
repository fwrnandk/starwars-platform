// src/services/api.ts

const API_BASE_URL = 'https://swapi-api-bbeth7qriq-rj.a.run.app';

interface LoginCredentials {
  username: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

interface Film {
  id: string;
  title: string;
  episode_id: number;
  director: string;
  producer: string;
  release_date: string;
  opening_crawl: string;
  created: string;
  edited: string;
  characters: string[];
  planets: string[];
  starships: string[];
  vehicles: string[];
  species: string[];
  url: string;
}

interface Character {
  id: string;
  name: string;
  height: string;
  mass: string;
  hair_color: string;
  skin_color: string;
  eye_color: string;
  birth_year: string;
  gender: string;
  homeworld: string;
  films: string[];
  species: string[];
  vehicles: string[];
  starships: string[];
  created: string;
  edited: string;
  url: string;
}

interface PaginatedResponse<T> {
  count: number;
  page: number;
  page_size: number;
  results: T[];
}

interface FilmDetailsResponse {
  film: {
    id: string;
    title: string;
    episode_id: number;
  };
  count: number;
  page: number;
  page_size: number;
  results: Character[];
}

class ApiService {
  private baseURL: string;
  private token: string | null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = this.getStoredToken();
  }

  // ===== TOKEN MANAGEMENT =====
  private getStoredToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    return this.token;
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // ===== GENERIC REQUEST METHOD =====
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Adicionar headers customizados
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = value;
        }
      });
    }

    // Adicionar token se existir (exceto para login e health)
    if (this.token && !endpoint.includes('/auth/login') && !endpoint.includes('/health')) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      // Tratar erro 401 (não autorizado)
      if (response.status === 401) {
        this.clearToken();
        window.dispatchEvent(new CustomEvent('unauthorized'));
        throw new Error('Não autorizado. Faça login novamente.');
      }

      // Tratar erro 404
      if (response.status === 404) {
        throw new Error('Recurso não encontrado.');
      }

      // Tratar outros erros HTTP
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 
          errorData.detail || 
          `Erro HTTP: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ===== AUTHENTICATION =====
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    this.setToken(response.access_token);
    return response;
  }

  logout(): void {
    this.clearToken();
    window.dispatchEvent(new CustomEvent('logout'));
  }

  // ===== HEALTH CHECK =====
  async healthCheck(): Promise<{ status: string }> {
    return this.request('/health');
  }

  // ===== FILMS =====
  async getFilms(params?: {
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<Film>> {
    const queryParams = new URLSearchParams();
    
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.order) queryParams.append('order', params.order);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/v1/films?${queryString}` : '/v1/films';

    return this.request<PaginatedResponse<Film>>(endpoint);
  }

  async getFilmById(id: string): Promise<Film> {
    return this.request<Film>(`/v1/films/${id}`);
  }

  async getFilmCharacters(id: string): Promise<FilmDetailsResponse> {
    return this.request<FilmDetailsResponse>(`/v1/films/${id}/characters`);
  }
}

// Exportar instância singleton
const api = new ApiService();
export default api;

// Exportar tipos
export type { 
  Film, 
  Character, 
  PaginatedResponse, 
  LoginCredentials, 
  LoginResponse,
  FilmDetailsResponse
};