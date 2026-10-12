import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { showApi } from '../api/showApi';
import { bookingApi } from '../api/bookingApi';
import { useBookingStore } from '../store/useBookingStore';
import { SeatGrid } from '../components/SeatGrid';
import { ArrowLeft, Trash2, ShieldCheck, Ticket, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

export const SeatSelectionPage = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const {
    selectedShow,
    setSelectedShow,
    selectedSeats,
    toggleSeat,
    setSelectedSeats,
    setHoldDetails
  } = useBookingStore();

  const [show, setShow] = useState(selectedShow);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [holding, setHolding] = useState(false);

  useEffect(() => {
    const fetchShowAndSeats = async () => {
      setLoading(true);
      try {
        let showData = selectedShow;
        if (!showData || String(showData.id) !== String(showId)) {
          showData = await showApi.getShowById(showId);
          setShow(showData);
          setSelectedShow(showData);
        } else {
          setShow(showData);
        }

        const seatData = await bookingApi.getShowSeatsAvailability(showId);
        setSeats(seatData);
      } catch (err) {
        toast.error('Failed to load seat availability');
        console.error(err);
      } font: {
        setLoading(false);
      }
    };

    fetchShowAndSeats();
  }, [showId, selectedShow, setSelectedShow]);

  // Calculate prices
  const basePrice = show?.price || 250;
  const getSeatPrice = (seatNum) => {
    const row = seatNum[0];
    const isPremium = row >= 'I';
    return isPremium ? Math.round(basePrice * 1.2) : basePrice;
  };

  const totalAmount = selectedSeats.reduce((sum, seatNum) => sum + getSeatPrice(seatNum), 0);

  const handleHoldAndProceed = async () => {
    if (selectedSeats.length === 0) {
      toast.warning('Please select at least one seat to proceed.');
      return;
    }

    setHolding(true);
    try {
      const seatIdsToHold = selectedSeats.map((seatNum, idx) => {
        const found = seats.find((s) => s.seatNumber === seatNum);
        return found ? (found.id || found.screenSeatId) : (idx + 1);
      });

      const holdRes = await bookingApi.holdSeats(showId, seatIdsToHold);
      const targetMs = holdRes?.expiresAt ? new Date(holdRes.expiresAt).getTime() : 0;
      const validExpiresAt = targetMs > Date.now()
        ? holdRes.expiresAt
        : new Date(Date.now() + 10 * 60 * 1000).toISOString();

      setHoldDetails(holdRes?.holdReference || `HOLD-${Date.now()}`, validExpiresAt, seatIdsToHold);
      toast.success(`Held ${selectedSeats.length} seat(s) for 10 minutes!`);
      navigate('/booking/summary');
    } catch (err) {
      toast.error(err.message || 'Failed to hold seats.');
    } finally {
      setHolding(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-slate-400 text-sm">Generating auditorium seat map...</p>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="py-20 text-center text-slate-300">
        <p>Showtime details not found.</p>
        <Link to="/" className="text-red-400 underline text-sm mt-2 inline-block">
          Return to Movies
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <Link
            to={show.movieId ? `/movies/${show.movieId}` : '/'}
            className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-1"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Movie Details
          </Link>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {show.movieTitle || 'Movie'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {show.theatreName} ({show.screenName}) • {show.date} • <span className="text-red-400 font-bold">{show.startTime}</span>
          </p>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Seat Map (2 Cols on desktop) */}
        <div className="lg:col-span-2 bg-[#121824] p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col items-center">
          <SeatGrid
            seats={seats}
            selectedSeats={selectedSeats}
            onToggleSeat={toggleSeat}
            basePrice={basePrice}
          />
        </div>

        {/* Selected Seats Summary (1 Col) */}
        <div className="bg-[#121824] p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between h-fit space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>Selected Seats</span>
              <span className="text-xs font-semibold bg-red-500/10 text-red-400 px-2.5 py-0.5 rounded-full border border-red-500/30">
                {selectedSeats.length} {selectedSeats.length === 1 ? 'Seat' : 'Seats'}
              </span>
            </h2>

            {selectedSeats.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Ticket className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs">No seats selected yet</p>
                <p className="text-[11px] text-slate-600">Click on available seats in the map to select</p>
              </div>
            ) : (
              <div className="space-y-3 mt-4 max-h-60 overflow-y-auto pr-1">
                {selectedSeats.map((seatNum) => {
                  const price = getSeatPrice(seatNum);
                  return (
                    <div
                      key={seatNum}
                      className="flex items-center justify-between bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-800"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-7 h-7 rounded-lg bg-red-600 text-white font-bold text-xs flex items-center justify-center">
                          {seatNum}
                        </span>
                        <span className="text-xs font-medium text-slate-300">
                          {seatNum[0] >= 'I' ? 'Premium' : 'Standard'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-bold text-white">₹{price}</span>
                        <button
                          onClick={() => toggleSeat(seatNum)}
                          className="text-slate-500 hover:text-red-400 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pricing & Submit CTA */}
          <div className="border-t border-slate-800 pt-4 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400 font-medium">Total Amount</span>
              <span className="text-2xl font-extrabold text-white">₹{totalAmount}</span>
            </div>

            <button
              onClick={handleHoldAndProceed}
              disabled={selectedSeats.length === 0 || holding}
              className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl shadow-xl shadow-red-900/50 flex items-center justify-center space-x-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>{holding ? 'Holding Seats...' : 'Hold & Proceed to Summary'}</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
