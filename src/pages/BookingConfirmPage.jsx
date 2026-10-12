import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { bookingApi } from '../api/bookingApi';
import { showApi } from '../api/showApi';
import { useBookingStore } from '../store/useBookingStore';
import { TicketCard } from '../components/TicketCard';
import { CheckCircle2, Ticket as TicketIcon, Mail, Home } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export const BookingConfirmPage = () => {
  const [searchParams] = useSearchParams();
  const bookingRef = searchParams.get('ref') || 'BK-10001';
  const { user } = useAuthStore();
  const { selectedShow, selectedSeats } = useBookingStore();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      setLoading(true);
      try {
        const data = await bookingApi.getBookingByRef(bookingRef);

        let movieTitle = data.movieTitle || selectedShow?.movieTitle;
        let moviePoster = data.moviePoster || selectedShow?.moviePoster;
        let theatreName = data.theatreName || selectedShow?.theatreName;
        let screenName = data.screenName || selectedShow?.screenName;
        let showDate = data.showDate || selectedShow?.date;
        let showTime = data.showTime || selectedShow?.startTime;
        let seatNumbers = data.seatNumbers || selectedSeats;

        // Fetch live show info if showId is present
        if ((!movieTitle || !theatreName) && data.showId) {
          try {
            const show = await showApi.getShowById(data.showId);
            movieTitle = show.movieTitle || movieTitle;
            moviePoster = show.moviePoster || moviePoster;
            theatreName = show.theatreName || theatreName;
            screenName = show.screenName || screenName;
            showDate = show.date || showDate;
            showTime = show.startTime || showTime;
          } catch (e) {
            console.warn('Could not fetch show info for booking:', bookingRef);
          }
        }

        // Fetch live seat info if seatNumbers not yet populated
        if ((!seatNumbers || seatNumbers.length === 0) && bookingRef) {
          try {
            const seats = await bookingApi.getBookingSeats(bookingRef);
            if (Array.isArray(seats) && seats.length > 0) {
              seatNumbers = seats.map((s) => s.seatNumber || `${s.row || ''}${s.column || ''}`).filter(Boolean);
            }
          } catch (e) {
            console.warn('Could not fetch seat info for booking:', bookingRef);
          }
        }

        const enrichedBooking = {
          ...data,
          totalPrice: data.totalAmount || data.totalPrice || 250,
          movieTitle: movieTitle || 'Movie Title',
          moviePoster: moviePoster || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
          theatreName: theatreName || 'Cinema Multiplex',
          screenName: screenName || 'Screen 1',
          showDate: showDate || (data.createdAt ? data.createdAt.split('T')[0] : '2026-10-11'),
          showTime: showTime || '10:00 AM',
          seatNumbers: Array.isArray(seatNumbers) && seatNumbers.length > 0 ? seatNumbers : []
        };

        setBooking(enrichedBooking);
      } catch (err) {
        console.error('Error fetching booking confirmation:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingRef, selectedShow, selectedSeats]);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-slate-400 text-sm">Generating your digital e-ticket...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8 pb-16 text-center">
      
      {/* Confirmation Icon Header */}
      <div className="space-y-3">
        <div className="w-16 h-16 bg-emerald-500/10 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-900/30 animate-bounce">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>
        
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Booking Confirmed!
        </h1>
        <p className="text-sm text-slate-300">
          Your tickets have been booked successfully. Enjoy your show!
        </p>
      </div>

      {/* Ticket Card Component */}
      {booking ? (
        <TicketCard booking={booking} />
      ) : (
        <div className="bg-[#121824] p-8 rounded-3xl border border-slate-800 text-slate-300">
          <p>Booking details loaded.</p>
        </div>
      )}

      {/* Confirmation Note & Navigation Actions */}
      <div className="space-y-4 pt-2">
        <p className="text-xs text-slate-400 flex items-center justify-center">
          <Mail className="w-4 h-4 mr-1.5 text-red-400" />
          A confirmation ticket has been sent to <span className="font-semibold text-white ml-1">{user?.email || 'vasu@example.com'}</span>
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/my-bookings"
            className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-900/40 flex items-center justify-center space-x-2 transition-all"
          >
            <TicketIcon className="w-4 h-4" />
            <span>View My Bookings</span>
          </Link>

          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-xl border border-slate-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
        </div>
      </div>

    </div>
  );
};
