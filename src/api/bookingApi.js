import { bookingClient } from './axiosInstances';
import { getStoredUser } from '../utils/tokenUtils';

export const normalizeSeat = (s, idx = 0) => {
  if (!s) return s;
  
  let seatNumber = s.seatNumber;
  let rowName = s.rowLabel || s.rowName;
  let columnNumber = s.columnNumber;

  const rawId = s.screenSeatId !== undefined && s.screenSeatId !== null ? s.screenSeatId : (s.id || idx + 1);

  if (typeof rawId === 'string' && rawId.match(/^[A-Z]\d+$/)) {
    seatNumber = rawId;
    rowName = rawId[0];
    columnNumber = parseInt(rawId.substring(1), 10);
  } else {
    const seatIndex = (typeof rawId === 'number' ? rawId : idx + 1) - 1;
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const colsPerRow = 10;
    
    const rIdx = Math.floor(seatIndex / colsPerRow) % rows.length;
    const cIdx = (seatIndex % colsPerRow) + 1;

    rowName = rowName || rows[rIdx];
    columnNumber = columnNumber || cIdx;
    seatNumber = seatNumber || `${rowName}${columnNumber}`;
  }

  const category = s.seatType || s.category || (rowName >= 'I' ? 'PREMIUM' : 'STANDARD');
  const price = s.price || 150.00;

  return {
    id: s.id || idx + 1,
    screenSeatId: s.screenSeatId || s.id || idx + 1,
    seatNumber,
    rowName,
    columnNumber,
    category,
    price,
    status: s.status || 'AVAILABLE',
    reservedUntil: s.reservedUntil || null
  };
};

export const bookingApi = {
  getShowSeatsAvailability: async (showId) => {
    console.log(`📡 [Booking API] GET http://localhost:8083/api/shows/${showId}/seats`);
    const res = await bookingClient.get(`/api/shows/${showId}/seats`);
    const raw = res.data;
    if (Array.isArray(raw)) {
      return raw.map((s, idx) => normalizeSeat(s, idx));
    } else if (raw && Array.isArray(raw.content)) {
      return raw.content.map((s, idx) => normalizeSeat(s, idx));
    }
    return raw;
  },

  holdSeats: async (showId, seatNumbersOrIds) => {
    const user = getStoredUser() || { id: 1 };
    const userId = Number(user.id || 1);

    const seatIds = seatNumbersOrIds.map((s, idx) => {
      if (typeof s === 'number') return s;
      if (typeof s === 'object' && s !== null) return Number(s.id || s.screenSeatId || idx + 1);
      return idx + 1;
    });

    const payload = {
      showId: Number(showId),
      seatIds: seatIds,
      userId: userId
    };

    console.log('📡 [Booking API] POST http://localhost:8083/api/bookings/holds', payload);
    try {
      const res = await bookingClient.post('/api/bookings/holds', payload);
      return res.data;
    } catch (err) {
      console.log(`📡 [Booking API Fallback] POST http://localhost:8083/api/shows/${showId}/holds`);
      const res = await bookingClient.post(`/api/shows/${showId}/holds`, { seatIds });
      return res.data;
    }
  },

  checkHold: async (holdReference) => {
    console.log(`📡 [Booking API] GET http://localhost:8083/api/bookings/holds/${holdReference}`);
    const res = await bookingClient.get(`/api/bookings/holds/${holdReference}`);
    return res.data;
  },

  releaseHold: async (holdReference) => {
    console.log(`📡 [Booking API] DELETE http://localhost:8083/api/bookings/holds/${holdReference}`);
    const res = await bookingClient.delete(`/api/bookings/holds/${holdReference}`);
    return res.data;
  },

  createBooking: async (bookingData) => {
    const user = getStoredUser() || { id: 1 };
    const currentUserId = user.id || 1;
    const headers = { 'X-User-Id': currentUserId };

    let seatIds = Array.isArray(bookingData.seatIds) ? bookingData.seatIds : [];
    if (seatIds.length === 0 && Array.isArray(bookingData.seatNumbers)) {
      seatIds = bookingData.seatNumbers.map((s, idx) => {
        const num = parseInt(String(s).replace(/\D/g, ''), 10);
        return isNaN(num) || num === 0 ? idx + 1 : num;
      });
    }

    const payload = {
      holdReference: bookingData.holdReference || `HOLD-${Date.now()}`,
      showId: Number(bookingData.showId || 1),
      seatIds: seatIds,
      currency: bookingData.currency || 'INR'
    };

    console.log(`📡 [Booking API] POST http://localhost:8083/api/bookings (X-User-Id: ${currentUserId})`, payload);
    const res = await bookingClient.post('/api/bookings', payload, { headers });
    return res.data;
  },

  getBookingByRef: async (bookingReference) => {
    const user = getStoredUser() || { id: 1 };
    const headers = { 'X-User-Id': user.id || 1 };
    console.log(`📡 [Booking API] GET http://localhost:8083/api/bookings/${bookingReference} (X-User-Id: ${user.id || 1})`);
    const res = await bookingClient.get(`/api/bookings/${bookingReference}`, { headers });
    return res.data;
  },

  getUserBookings: async (userId = 1, page = 0, size = 20) => {
    const user = getStoredUser();
    const currentUserId = userId || user?.id || 1;
    console.log(`📡 [Booking API] GET http://localhost:8083/api/bookings/me?page=${page}&size=${size} (X-User-Id: ${currentUserId})`);
    const headers = { 'X-User-Id': currentUserId };
    const res = await bookingClient.get(`/api/bookings/me?page=${page}&size=${size}`, { headers });
    return res.data;
  },

  confirmBooking: async (bookingReference) => {
    const user = getStoredUser() || { id: 1 };
    const headers = { 'X-User-Id': user.id || 1 };
    console.log(`📡 [Booking API] POST http://localhost:8083/api/bookings/${bookingReference}/confirm`);
    const res = await bookingClient.post(`/api/bookings/${bookingReference}/confirm`, {}, { headers });
    return res.data;
  },

  cancelBooking: async (bookingReference) => {
    const user = getStoredUser() || { id: 1 };
    const headers = { 'X-User-Id': user.id || 1 };
    console.log(`📡 [Booking API] POST http://localhost:8083/api/bookings/${bookingReference}/cancel`);
    const res = await bookingClient.post(`/api/bookings/${bookingReference}/cancel`, {}, { headers });
    return res.data || { success: true };
  },

  getBookingSeats: async (bookingReference) => {
    console.log(`📡 [Booking API] GET http://localhost:8083/api/bookings/${bookingReference}/seats`);
    const res = await bookingClient.get(`/api/bookings/${bookingReference}/seats`);
    return res.data;
  },

  getShowSeatSummary: async (showId) => {
    console.log(`📡 [Booking API] GET http://localhost:8083/api/admin/shows/${showId}/seats/summary`);
    const res = await bookingClient.get(`/api/admin/shows/${showId}/seats/summary`);
    return res.data;
  }
};
