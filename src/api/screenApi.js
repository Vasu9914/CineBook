import { movieClient } from './axiosInstances';

export const screenApi = {
  getScreenById: async (id) => {
    console.log(`📡 [Screen API] GET http://localhost:8082/api/screens/${id}`);
    const res = await movieClient.get(`/api/screens/${id}`);
    return res.data;
  },

  getScreenSeats: async (screenId) => {
    console.log(`📡 [Screen API] GET http://localhost:8082/api/screens/${screenId}/seats`);
    const res = await movieClient.get(`/api/screens/${screenId}/seats`);
    return res.data;
  },

  addSeatsToScreen: async (screenId, seatConfig) => {
    console.log(`📡 [Screen API] POST http://localhost:8082/api/screens/${screenId}/seats`, seatConfig);
    const res = await movieClient.post(`/api/screens/${screenId}/seats`, seatConfig);
    return res.data;
  }
};
