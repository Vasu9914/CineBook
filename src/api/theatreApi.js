import { movieClient } from './axiosInstances';

export const theatreApi = {
  getTheatres: async (city = '', page = 0, size = 20) => {
    console.log(`📡 [Theatre API] GET http://localhost:8082/api/theatres?city=${city}&page=${page}&size=${size}`);
    const query = city ? `?city=${encodeURIComponent(city)}&page=${page}&size=${size}` : `?page=${page}&size=${size}`;
    const res = await movieClient.get(`/api/theatres${query}`);
    return res.data;
  },

  getTheatreById: async (id) => {
    console.log(`📡 [Theatre API] GET http://localhost:8082/api/theatres/${id}`);
    const res = await movieClient.get(`/api/theatres/${id}`);
    return res.data;
  },

  createTheatre: async (theatreData) => {
    console.log('📡 [Theatre API] POST http://localhost:8082/api/theatres', theatreData);
    const res = await movieClient.post('/api/theatres', theatreData);
    return res.data;
  },

  updateTheatre: async (id, theatreData) => {
    console.log(`📡 [Theatre API] PUT http://localhost:8082/api/theatres/${id}`, theatreData);
    const res = await movieClient.put(`/api/theatres/${id}`, theatreData);
    return res.data;
  },

  updateTheatreStatus: async (id, status) => {
    console.log(`📡 [Theatre API] PATCH http://localhost:8082/api/theatres/${id}/status`, { status });
    const res = await movieClient.patch(`/api/theatres/${id}/status`, { status });
    return res.data;
  },

  addScreenToTheatre: async (theatreId, screenData) => {
    console.log(`📡 [Theatre API] POST http://localhost:8082/api/theatres/${theatreId}/screens`, screenData);
    const res = await movieClient.post(`/api/theatres/${theatreId}/screens`, screenData);
    return res.data;
  },

  getTheatreScreens: async (theatreId, page = 0, size = 20) => {
    console.log(`📡 [Theatre API] GET http://localhost:8082/api/theatres/${theatreId}/screens?page=${page}&size=${size}`);
    const res = await movieClient.get(`/api/theatres/${theatreId}/screens?page=${page}&size=${size}`);
    return res.data;
  }
};
