import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useBookingStore } from '../store/useBookingStore';
import { useAuthStore } from '../store/useAuthStore';
import { SeatTimer } from '../components/SeatTimer';
import { ArrowLeft, Ticket, Calendar, Clock, MapPin, Shield, CreditCard } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import { bookingApi } from '../api/bookingApi';
import { toast } from 'react-toastify';

export const BookingSummaryPage = () => {
  const navigate = useNavigate();
  const { selectedShow, selectedSeats, selectedSeatIds, holdReference, holdExpiresAt, setActiveBooking } = useBookingStore();
  const { user } = useAuthStore();

  if (!selectedShow || selectedSeats.length === 0) {
    return (
      <div className="py-20 text-center text-slate-300">
        <p>No active seat selection found.</p>
        <Link to="/" className="text-red-400 underline text-sm mt-2 inline-block">
          Return to Home
        </Link>
      </div>
    );
  }

  const basePrice = selectedShow.price || 250;
  const getSeatPrice = (seatNum) => {
    const row = seatNum[0];
    return row >= 'I' ? Math.round(basePrice * 1.2) : basePrice;
  };

  const ticketsTotal = selectedSeats.reduce((sum, seatNum) => sum + getSeatPrice(seatNum), 0);
  const convenienceFee = 20;
  const grandTotal = ticketsTotal + convenienceFee;

  const handleProceedToPayment = async () => {
    try {
      const seatIds = selectedSeatIds && selectedSeatIds.length > 0
        ? selectedSeatIds
        : selectedSeats.map((s, idx) => {
            const num = parseInt(String(s).replace(/\D/g, ''), 10);
            return isNaN(num) || num === 0 ? idx + 1 : num;
          });

      const bookingData = {
        holdReference: holdReference || `HOLD-${Date.now()}`,
        showId: Number(selectedShow.id),
        seatIds: seatIds,
        currency: 'INR'
      };

      const booking = await bookingApi.createBooking(bookingData);
      setActiveBooking(booking);
      navigate('/booking/payment');
    } catch (err) {
      toast.error('Failed to create booking: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* Header with back & Timer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <Link
            to={`/shows/${selectedShow.id}/seats`}
            className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-1"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Seat Map
          </Link>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Booking Summary
          </h1>
        </div>

        {holdExpiresAt && (
          <SeatTimer
            expiresAt={holdExpiresAt}
            onExpire={() => {
              toast.error('Seat hold expired! Please select seats again.');
              navigate(`/shows/${selectedShow.id}/seats`);
            }}
          />
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Movie & Show Info (2 Cols) */}
        <div className="md:col-span-2 space-y-6">
          
          <div className="bg-[#121824] p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col sm:flex-row gap-6">
            <img
              src={selectedShow.moviePoster || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80'}
              alt={selectedShow.movieTitle}
              className="w-full sm:w-32 aspect-[2/3] object-cover rounded-2xl border border-slate-700 shadow-md"
            />

            <div className="space-y-3 flex-1">
              <h2 className="text-xl font-bold text-white">
                {selectedShow.movieTitle}
              </h2>
              <p className="text-xs text-slate-300">
                {selectedShow.movieLanguage || 'English'} • {selectedShow.movieDuration || 150} min
              </p>

              <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-red-500 shrink-0" />
                  <span>{selectedShow.theatreName} ({selectedShow.screenName})</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-amber-500 shrink-0" />
                  <span>{formatDate(selectedShow.date)}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-emerald-500 shrink-0" />
                  <span>{selectedShow.startTime}</span>
                </div>
              </div>
            </div>
          </div>

          {/* User Details Form Card */}
          <div className="bg-[#121824] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Ticket Recipient Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300 pt-1">
              <div>
                <span className="text-slate-500 block">Name</span>
                <span className="font-semibold text-white">{user?.fullName || 'Vasu'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Email</span>
                <span className="font-semibold text-white">{user?.email || 'vasu@example.com'}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-800">
              E-ticket and booking confirmation will be sent to your registered email address.
            </p>
          </div>

        </div>

        {/* Bill Breakdown (1 Col) */}
        <div className="bg-[#121824] p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
              Payment Breakdown
            </h3>

            <div className="space-y-3 mt-4 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Seats ({selectedSeats.join(', ')})</span>
                <span className="font-bold text-white">₹{ticketsTotal}</span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span>Convenience Fee & Taxes</span>
                <span className="font-bold text-white">₹{convenienceFee}</span>
              </div>

              <div className="border-t border-slate-800 pt-3 flex justify-between text-base font-extrabold text-white">
                <span>Total Amount</span>
                <span className="text-emerald-400">₹{grandTotal}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleProceedToPayment}
              className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl shadow-xl shadow-red-900/50 flex items-center justify-center space-x-2 transition-all hover:scale-[1.01]"
            >
              <CreditCard className="w-4 h-4" />
              <span>Proceed to Payment</span>
            </button>
            <p className="text-[10px] text-center text-slate-500 flex items-center justify-center">
              <Shield className="w-3 h-3 mr-1 text-emerald-500" />
              100% Safe & Encrypted Payment
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
