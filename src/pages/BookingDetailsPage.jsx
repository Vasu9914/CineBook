import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { bookingApi } from '../api/bookingApi';
import { paymentApi } from '../api/paymentApi';
import { TicketCard } from '../components/TicketCard';
import { ArrowLeft, XCircle, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';

import { showApi } from '../api/showApi';

export const BookingDetailsPage = () => {
  const { ref } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const bookData = await bookingApi.getBookingByRef(ref);

        let movieTitle = bookData.movieTitle;
        let moviePoster = bookData.moviePoster;
        let theatreName = bookData.theatreName;
        let screenName = bookData.screenName;
        let showDate = bookData.showDate;
        let showTime = bookData.showTime;
        let seatNumbers = bookData.seatNumbers;

        if (bookData.showId) {
          try {
            const show = await showApi.getShowById(bookData.showId);
            if (show) {
              movieTitle = show.movieTitle || show.movie?.title;
              moviePoster = show.moviePoster || show.movie?.posterUrl;
              theatreName = show.theatreName || show.screen?.theatre?.name;
              screenName = show.screenName || show.screen?.name;
              showDate = show.date;
              showTime = show.startTime;
            }
          } catch (e) {
            console.warn('Could not fetch live show details for booking:', ref);
          }
        }

        if (ref) {
          try {
            const seats = await bookingApi.getBookingSeats(ref);
            if (Array.isArray(seats) && seats.length > 0) {
              seatNumbers = seats.map((s) => s.seatNumber || (s.showSeatId ? `Seat #${s.showSeatId}` : `Seat #${s.id}`));
            }
          } catch (e) {
            console.warn('Could not fetch live seat details for booking:', ref);
          }
        }

        const enrichedBooking = {
          ...bookData,
          totalPrice: bookData.totalAmount !== undefined ? bookData.totalAmount : (bookData.totalPrice || 0),
          movieTitle: movieTitle || (bookData.showId ? `Show #${bookData.showId}` : 'Movie Ticket'),
          moviePoster: moviePoster || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
          theatreName: theatreName || 'Cinema Theatre',
          screenName: screenName || 'Screen 1',
          showDate: showDate || (bookData.createdAt ? bookData.createdAt.split('T')[0] : ''),
          showTime: showTime || (bookData.createdAt ? bookData.createdAt.split('T')[1]?.substring(0, 5) : ''),
          seatNumbers: Array.isArray(seatNumbers) && seatNumbers.length > 0 ? seatNumbers : []
        };

        setBooking(enrichedBooking);

        const payData = await paymentApi.getPaymentByBookingRef(ref);
        setPayment(payData);
      } catch (err) {
        toast.error('Failed to load booking details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ref]);

  const handleCancelBooking = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking? Refunds will be initiated as per policy.')) {
      return;
    }

    setActionLoading(true);
    try {
      await bookingApi.cancelBooking(ref);
      if (payment?.paymentReference) {
        await paymentApi.requestRefund(payment.paymentReference, {
          paymentId: payment.id || payment.paymentId || 1,
          amount: booking.totalPrice,
          reason: 'User requested cancellation'
        });
      }
      toast.success('Booking cancelled successfully. Refund initiated.');
      setBooking((prev) => ({ ...prev, status: 'CANCELLED' }));
    } catch (err) {
      toast.error('Failed to cancel booking: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetryPayment = () => {
    navigate('/booking/payment');
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-slate-400 text-sm">Fetching ticket & transaction info...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="py-20 text-center text-slate-300">
        <p>Booking reference not found.</p>
        <Link to="/my-bookings" className="text-red-400 underline text-sm mt-2 inline-block">
          View My Bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      
      {/* Back Button */}
      <div>
        <Link
          to="/my-bookings"
          className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to My Bookings
        </Link>
      </div>

      {/* Ticket Card Component */}
      <TicketCard booking={booking} />

      {/* Payment & Action Controls Card */}
      <div className="bg-[#121824] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
          Payment & Status Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
          <div>
            <span className="text-slate-500 block">Payment Reference</span>
            <span className="font-mono text-white font-semibold">{payment?.paymentReference || 'PAY-MOCK'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Payment Method</span>
            <span className="font-semibold text-white">{payment?.paymentMethod || booking.paymentMethod || 'UPI'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Total Amount</span>
            <span className="font-bold text-emerald-400 text-sm">₹{booking.totalPrice}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Booking Status</span>
            <span className={`font-bold ${booking.status === 'CONFIRMED' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {booking.status}
            </span>
          </div>
        </div>

        {/* Dynamic Buttons */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-3">
          {booking.status === 'CONFIRMED' && (
            <button
              onClick={handleCancelBooking}
              disabled={actionLoading}
              className="px-5 py-2.5 bg-red-950/60 hover:bg-red-900 border border-red-800/80 text-red-300 font-bold text-xs rounded-xl transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4 text-red-400" />
              <span>{actionLoading ? 'Cancelling...' : 'Cancel Booking & Refund'}</span>
            </button>
          )}

          {booking.status === 'PENDING' && (
            <button
              onClick={handleRetryPayment}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-900/40 transition-all flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Payment Now</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
