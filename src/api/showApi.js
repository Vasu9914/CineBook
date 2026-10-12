import { movieClient } from './axiosInstances';
import { formatTime } from '../utils/dateUtils';

const DEFAULT_POSTER = 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80';

export const normalizeShow = (show) => {
  if (!show) return show;

  const movieObj = show.movie || {};
  const screenObj = show.screen || {};
  const theatreObj = screenObj.theatre || show.theatre || {};

  const rawStartTime = show.startTime || '10:00 AM';
  const displayStartTime = formatTime(rawStartTime);
  const datePart = show.date || (rawStartTime.includes('T') ? rawStartTime.split('T')[0] : '2026-10-10');

  const priceVal = Number(show.price);
  const validPrice = !isNaN(priceVal) && priceVal > 0 ? priceVal : 250;

  return {
    ...show,
    id: show.id,
    movieId: show.movieId || movieObj.id,
    movieTitle: show.movieTitle || movieObj.title || 'Movie',
    moviePoster: show.moviePoster || movieObj.posterUrl || movieObj.poster || DEFAULT_POSTER,
    movieLanguage: show.movieLanguage || movieObj.language || 'English',
    movieDuration: show.movieDuration || movieObj.durationMinutes || 145,
    theatreId: show.theatreId || theatreObj.id,
    theatreName: show.theatreName || theatreObj.name || 'Cinema',
    theatreAddress: show.theatreAddress || theatreObj.address || '',
    theatreFacilities: show.theatreFacilities || theatreObj.facilities || ['Dolby Atmos', 'Parking'],
    screenId: show.screenId || screenObj.id,
    screenName: show.screenName || screenObj.name || 'Screen 1',
    price: validPrice,
    date: datePart,
    startTime: displayStartTime,
    rawStartTime: rawStartTime
  };
};

export const showApi = {
  getShows: async ({ movieId, theatreId, date, page = 0, size = 20 } = {}) => {
    console.log(`📡 [Show API] GET http://localhost:8082/api/shows (movieId: ${movieId}, theatreId: ${theatreId}, date: ${date})`);
    const params = new URLSearchParams();
    if (movieId) params.append('movieId', movieId);
    if (theatreId) params.append('theatreId', theatreId);
    if (date) params.append('dateFrom', `${date}T00:00:00`);
    params.append('page', page);
    params.append('size', size);

    const res = await movieClient.get(`/api/shows?${params.toString()}`);
    const raw = res.data;
    if (raw && Array.isArray(raw.content)) {
      return { ...raw, content: raw.content.map(normalizeShow) };
    } else if (Array.isArray(raw)) {
      return raw.map(normalizeShow);
    }
    return raw;
  },

  getShowById: async (id) => {
    console.log(`📡 [Show API] GET http://localhost:8082/api/shows/${id}`);
    const res = await movieClient.get(`/api/shows/${id}`);
    return normalizeShow(res.data);
  },

  createShow: async (showData) => {
    console.log('📡 [Show API] POST http://localhost:8082/api/shows', showData);
    const res = await movieClient.post('/api/shows', showData);
    return normalizeShow(res.data);
  },

  updateShow: async (id, showData) => {
    console.log(`📡 [Show API] PUT http://localhost:8082/api/shows/${id}`, showData);
    const res = await movieClient.put(`/api/shows/${id}`, showData);
    return normalizeShow(res.data);
  },

  updateShowStatus: async (id, status) => {
    console.log(`📡 [Show API] PATCH http://localhost:8082/api/shows/${id}/status`, { status });
    const res = await movieClient.patch(`/api/shows/${id}/status`, { status });
    return normalizeShow(res.data);
  },

  cancelShow: async (id) => {
    console.log(`📡 [Show API] PUT http://localhost:8082/api/shows/${id}/cancel`);
    const res = await movieClient.put(`/api/shows/${id}/cancel`);
    return res.data;
  }
};
