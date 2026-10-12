import { movieClient } from './axiosInstances';

export const normalizeMovie = (m) => {
  if (!m) return m;
  const defaultPoster = 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80';
  return {
    ...m,
    posterUrl: m.posterUrl || m.poster || m.imageUrl || defaultPoster,
    bannerUrl: m.bannerUrl || m.posterUrl || m.poster || defaultPoster,
    genre: m.genre || 'General',
    rating: m.rating || 0.0,
  };
};

export const movieApi = {
  getMovies: async (page = 0, size = 20) => {
    console.log(`📡 [Movie API] GET http://localhost:8082/api/movies?page=${page}&size=${size}`);
    const res = await movieClient.get(`/api/movies?page=${page}&size=${size}`);
    const raw = res.data;
    if (raw && Array.isArray(raw.content)) {
      return { ...raw, content: raw.content.map(normalizeMovie) };
    } else if (Array.isArray(raw)) {
      return raw.map(normalizeMovie);
    }
    return raw;
  },

  getMovieById: async (id) => {
    console.log(`📡 [Movie API] GET http://localhost:8082/api/movies/${id}`);
    const res = await movieClient.get(`/api/movies/${id}`);
    return normalizeMovie(res.data);
  },

  searchMovies: async (keyword, page = 0, size = 20) => {
    console.log(`📡 [Movie API] GET http://localhost:8082/api/movies/search?keyword=${encodeURIComponent(keyword)}`);
    const res = await movieClient.get(`/api/movies/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`);
    const raw = res.data;
    if (raw && Array.isArray(raw.content)) {
      return { ...raw, content: raw.content.map(normalizeMovie) };
    } else if (Array.isArray(raw)) {
      return raw.map(normalizeMovie);
    }
    return raw;
  },

  createMovie: async (movieData) => {
    console.log('📡 [Movie API] POST http://localhost:8082/api/movies', movieData);
    const res = await movieClient.post('/api/movies', movieData);
    return normalizeMovie(res.data);
  },

  updateMovie: async (id, movieData) => {
    console.log(`📡 [Movie API] PUT http://localhost:8082/api/movies/${id}`, movieData);
    const res = await movieClient.put(`/api/movies/${id}`, movieData);
    return normalizeMovie(res.data);
  },

  deleteMovie: async (id) => {
    console.log(`📡 [Movie API] DELETE http://localhost:8082/api/movies/${id}`);
    const res = await movieClient.delete(`/api/movies/${id}`);
    return res.data;
  },

  updateMovieStatus: async (id, status) => {
    console.log(`📡 [Movie API] PATCH http://localhost:8082/api/movies/${id}/status`, { status });
    const res = await movieClient.patch(`/api/movies/${id}/status`, { status });
    return normalizeMovie(res.data);
  }
};
