import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingApi } from '../api/bookingApi';
import { useAuthStore } from '../store/useAuthStore';
import { formatDate } from '../utils/dateUtils';
import { Ticket, Calendar, Clock, MapPin, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

import { showApi } from '../api/showApi';

export const MyBookingsPage = () => {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const data = await bookingApi.getUserBookings(user?.id || 1);
        const rawBookings = data.content || data || [];

        const enriched = await Promise.all(
          rawBookings.map(async (b) => {
            let movieTitle = b.movieTitle;
            let moviePoster = b.moviePoster;
            let theatreName = b.theatreName;
            let screenName = b.screenName;
            let showDate = b.showDate;
            let showTime = b.showTime;
            let seatNumbers = b.seatNumbers;

            if (b.showId) {
              try {
                const show = await showApi.getShowById(b.showId);
                if (show) {
                  movieTitle = show.movieTitle || show.movie?.title;
                  moviePoster = show.moviePoster || show.movie?.posterUrl;
                  theatreName = show.theatreName || show.screen?.theatre?.name;
                  screenName = show.screenName || show.screen?.name;
                  showDate = show.date;
                  showTime = show.startTime;
                }
              } catch (e) {
                console.warn('Could not fetch live show details for showId:', b.showId);
              }
            }

            if (b.bookingReference) {
              try {
                const seats = await bookingApi.getBookingSeats(b.bookingReference);
                if (Array.isArray(seats) && seats.length > 0) {
                  seatNumbers = seats.map((s) => s.seatNumber || (s.showSeatId ? `Seat #${s.showSeatId}` : `Seat #${s.id}`));
                }
              } catch (e) {
                console.warn('Could not fetch live seat details for booking:', b.bookingReference);
              }
            }

            return {
              ...b,
              totalPrice: b.totalAmount !== undefined ? b.totalAmount : (b.totalPrice || 0),
              movieTitle: movieTitle || (b.showId ? `Show #${b.showId}` : 'Movie Ticket'),
              moviePoster: moviePoster || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
              theatreName: theatreName || 'Cinema Theatre',
              screenName: screenName || 'Screen 1',
              showDate: showDate || (b.createdAt ? b.createdAt.split('T')[0] : ''),
              showTime: showTime || (b.createdAt ? b.createdAt.split('T')[1]?.substring(0, 5) : ''),
              seatNumbers: Array.isArray(seatNumbers) && seatNumbers.length > 0 ? seatNumbers : []
            };
          })
        );

        setBookings(enriched);
      } catch (err) {
        toast.error('Failed to load your bookings');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  const upcomingBookings = bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'PENDING');
  const pastBookings = bookings.filter((b) => b.status === 'CANCELLED' || b.status === 'COMPLETED');

  const displayedBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          My Bookings
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your upcoming movie reservations and ticket history
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-800 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-3 transition-colors relative ${
            activeTab === 'upcoming'
              ? 'text-red-500 border-b-2 border-red-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Upcoming & Active ({upcomingBookings.length})
        </button>
        
        <button
          onClick={() => setActiveTab('past')}
          className={`pb-3 transition-colors relative ${
            activeTab === 'past'
              ? 'text-red-500 border-b-2 border-red-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Past & Cancelled ({pastBookings.length})
        </button>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 text-xs">Loading your tickets...</p>
        </div>
      ) : displayedBookings.length === 0 ? (
        <div className="bg-[#121824] p-12 rounded-3xl border border-slate-800 text-center space-y-3">
          <Ticket className="w-12 h-12 mx-auto text-slate-600" />
          <p className="text-base font-bold text-white">No {activeTab} bookings found</p>
          <p className="text-xs text-slate-400">Ready for movie night? Check out movies in theaters now.</p>
          <Link
            to="/"
            className="inline-block mt-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all"
          >
            Explore Movies
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedBookings.map((b) => (
            <div
              key={b.bookingReference}
              className="bg-[#121824] p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:border-slate-700 transition-all"
            >
              
              <div className="flex items-center space-x-4">
                <img
                  src={b.moviePoster || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80'}
                  alt={b.movieTitle}
                  className="w-16 h-24 object-cover rounded-xl border border-slate-700 shrink-0"
                />

                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-bold text-white">{b.movieTitle}</h3>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${
                        b.status === 'CONFIRMED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : b.status === 'PENDING'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-red-500 shrink-0" />
                    {b.theatreName} | {b.screenName}
                  </p>

                  <p className="text-xs text-slate-300 flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-amber-500 shrink-0" />
                    {formatDate(b.showDate)} • {b.showTime}
                  </p>

                  <div className="text-xs text-slate-400 pt-1">
                    Seats: <strong className="text-white">{Array.isArray(b.seatNumbers) ? b.seatNumbers.join(', ') : b.seatNumbers}</strong> • Ref: <span className="font-mono text-slate-300">{b.bookingReference}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-800 gap-3">
                <span className="text-lg font-extrabold text-white">₹{b.totalPrice}</span>

                <Link
                  to={`/bookings/${b.bookingReference}`}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center"
                >
                  <span>View Details</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
