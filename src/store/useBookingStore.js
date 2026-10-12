import { create } from 'zustand';

export const useBookingStore = create((set, get) => ({
  selectedMovie: null,
  selectedShow: null,
  selectedSeats: [],
  selectedSeatIds: [],
  holdReference: null,
  holdExpiresAt: null,
  activeBooking: null,

  setSelectedMovie: (movie) => set({ selectedMovie: movie }),
  
  setSelectedShow: (show) => set({ selectedShow: show, selectedSeats: [], selectedSeatIds: [], holdReference: null, holdExpiresAt: null }),
  
  toggleSeat: (seatNumber) => {
    const current = get().selectedSeats;
    const exists = current.includes(seatNumber);
    if (exists) {
      set({ selectedSeats: current.filter((s) => s !== seatNumber) });
    } else {
      set({ selectedSeats: [...current, seatNumber] });
    }
  },

  setSelectedSeats: (seats) => set({ selectedSeats: seats }),
  setSelectedSeatIds: (seatIds) => set({ selectedSeatIds: seatIds }),

  setHoldDetails: (holdRef, expiresAt, seatIds = []) => set({ holdReference: holdRef, holdExpiresAt: expiresAt, selectedSeatIds: seatIds }),

  setActiveBooking: (booking) => set({ activeBooking: booking }),

  clearBookingFlow: () => set({
    selectedSeats: [],
    selectedSeatIds: [],
    holdReference: null,
    holdExpiresAt: null,
    activeBooking: null
  })
}));
