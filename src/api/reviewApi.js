import { reviewClient } from './axiosInstances';

export const reviewApi = {
  createReview: async (movieId, reviewData) => {
    console.log(`📡 [Review API] POST http://localhost:8086/api/movies/${movieId}/reviews`, reviewData);
    try {
      const res = await reviewClient.post(`/api/movies/${movieId}/reviews`, reviewData);
      return res.data;
    } catch (err) {
      if (err.response) {
        const msg = err.response.data?.message || err.message;
        const customErr = new Error(msg);
        customErr.status = err.response.status;
        throw customErr;
      }
      throw err;
    }
  },

  getMovieReviews: async (movieId, page = 0, size = 20, sort = 'createdAt,desc') => {
    console.log(`📡 [Review API] GET http://localhost:8086/api/movies/${movieId}/reviews?page=${page}&size=${size}&sort=${sort}`);
    const res = await reviewClient.get(`/api/movies/${movieId}/reviews?page=${page}&size=${size}&sort=${sort}`);
    return res.data;
  },

  getReviewSummary: async (movieId) => {
    console.log(`📡 [Review API] GET http://localhost:8086/api/movies/${movieId}/reviews/summary`);
    const res = await reviewClient.get(`/api/movies/${movieId}/reviews/summary`);
    return res.data;
  },

  getMyReviews: async (page = 0, size = 20) => {
    console.log(`📡 [Review API] GET http://localhost:8086/api/movies/users/me/reviews?page=${page}&size=${size}`);
    const res = await reviewClient.get(`/api/movies/users/me/reviews?page=${page}&size=${size}`);
    return res.data;
  },

  updateReview: async (movieId, reviewId, reviewData) => {
    console.log(`📡 [Review API] PUT http://localhost:8086/api/movies/${movieId}/reviews/${reviewId}`, reviewData);
    try {
      const res = await reviewClient.put(`/api/movies/${movieId}/reviews/${reviewId}`, reviewData);
      return res.data;
    } catch (err) {
      if (err.response) {
        const msg = err.response.data?.message || err.message;
        const customErr = new Error(msg);
        customErr.status = err.response.status;
        throw customErr;
      }
      throw err;
    }
  },

  deleteReview: async (movieId, reviewId) => {
    console.log(`📡 [Review API] DELETE http://localhost:8086/api/movies/${movieId}/reviews/${reviewId}`);
    try {
      const res = await reviewClient.delete(`/api/movies/${movieId}/reviews/${reviewId}`);
      return res.data || { success: true };
    } catch (err) {
      if (err.response) {
        const msg = err.response.data?.message || err.message;
        const customErr = new Error(msg);
        customErr.status = err.response.status;
        throw customErr;
      }
      throw err;
    }
  }
};
