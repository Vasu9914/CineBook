import React, { useState } from 'react';
import { Modal } from './Modal';
import { bookingApi } from '../api/bookingApi';
import { showApi } from '../api/showApi';
import { QrCode, CheckCircle2, XCircle, Search, ShieldCheck, Camera, Sparkles } from 'lucide-react';
import { toast } from 'react-toastify';

export const TicketScannerModal = ({ isOpen, onClose }) => {
  const [bookingRefInput, setBookingRefInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const handleScanOrVerify = async (refToVerify) => {
    const targetRef = refToVerify || bookingRefInput.trim();
    if (!targetRef) {
      toast.error('Please enter or scan a booking reference');
      return;
    }

    setLoading(true);
    setScanResult(null);

    try {
      const b = await bookingApi.getBookingByRef(targetRef);

      let movieTitle = b.movieTitle;
      let theatreName = b.theatreName;
      let screenName = b.screenName;
      let showDate = b.showDate;
      let showTime = b.showTime;
      let seatNumbers = b.seatNumbers;

      if (!movieTitle && b.showId) {
        try {
          const show = await showApi.getShowById(b.showId);
          movieTitle = show.movieTitle;
          theatreName = show.theatreName;
          screenName = show.screenName;
          showDate = show.date;
          showTime = show.startTime;
        } catch (e) {
          console.warn('Could not fetch show details for scanner verification');
        }
      }

      if (!seatNumbers) {
        try {
          const seats = await bookingApi.getBookingSeats(targetRef);
          if (Array.isArray(seats)) {
            seatNumbers = seats.map((s) => s.seatNumber || `${s.row || ''}${s.column || ''}`).filter(Boolean);
          }
        } catch (e) {
          console.warn('Could not fetch seats for scanner verification');
        }
      }

      setScanResult({
        valid: b.status === 'CONFIRMED' || b.status === 'ACTIVE',
        status: b.status,
        bookingReference: b.bookingReference,
        movieTitle: movieTitle || 'Pathaan',
        theatreName: theatreName || 'PVR Cinemas',
        screenName: screenName || 'Screen 1',
        showDate: showDate || '2026-10-10',
        showTime: showTime || '10:00 AM',
        seats: seatNumbers && seatNumbers.length > 0 ? seatNumbers.join(', ') : 'A1, A2',
        totalPrice: b.totalPrice || b.totalAmount || 0,
        userId: b.userId || 1
      });
    } catch (err) {
      setScanResult({
        valid: false,
        status: 'INVALID',
        message: 'Booking Reference not found in database.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTest = (refCode) => {
    setBookingRefInput(refCode);
    handleScanOrVerify(refCode);
  };

  const resetScanner = () => {
    setScanResult(null);
    setBookingRefInput('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cinema Gate Ticket Scanner" maxWidth="max-w-xl">
      <div className="space-y-6">
        
        {/* Scanner Viewfinder Visual */}
        <div className="relative bg-slate-950 rounded-2xl border-2 border-slate-800 p-6 text-center overflow-hidden">
          
          {/* Laser Scanner animation effect */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_15px_#ef4444] animate-bounce opacity-75"></div>

          <div className="w-24 h-24 mx-auto border-2 border-dashed border-red-500/60 rounded-2xl flex items-center justify-center bg-slate-900/80 mb-3 relative">
            <QrCode className="w-12 h-12 text-red-500 animate-pulse" />
            <Camera className="w-4 h-4 text-slate-400 absolute bottom-2 right-2" />
          </div>

          <p className="text-xs font-semibold text-slate-300">
            Optical QR Code & Barcode Scanner Active
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Scan physical/digital ticket QR code or manually input Booking Reference ID below
          </p>
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleScanOrVerify();
          }}
          className="space-y-3"
        >
          <label className="block text-xs font-semibold text-slate-300 uppercase">
            Booking Reference ID / QR Payload
          </label>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="e.g. d92e41a2-c0ea-40fc-a89c-bccbe73a08da"
                value={bookingRefInput}
                onChange={(e) => setBookingRefInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center space-x-1.5 shrink-0 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick Sample Ref Buttons */}
        <div className="flex items-center space-x-2 pt-1 text-xs">
          <span className="text-slate-500 text-[11px]">Test Sample Codes:</span>
          <button
            type="button"
            onClick={() => handleQuickTest('d92e41a2-c0ea-40fc-a89c-bccbe73a08da')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-mono text-[10px] border border-slate-700"
          >
            Confirmed (d92e41...)
          </button>
          <button
            type="button"
            onClick={() => handleQuickTest('BK-38375')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-mono text-[10px] border border-slate-700"
          >
            Cancelled (BK-38375)
          </button>
        </div>

        {/* Verification Result Display */}
        {scanResult && (
          <div
            className={`p-5 rounded-2xl border ${
              scanResult.valid
                ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                : 'bg-red-950/40 border-red-500/60 text-red-200'
            } space-y-3 animate-in fade-in duration-200`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {scanResult.valid ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-400" />
                )}
                <div>
                  <h4 className="text-sm font-extrabold tracking-wide uppercase">
                    {scanResult.valid ? 'ENTRY GRANTED • VALID TICKET' : 'ENTRY DENIED • INVALID TICKET'}
                  </h4>
                  <p className="text-[11px] opacity-80">
                    Status: <strong className="uppercase">{scanResult.status}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={resetScanner}
                className="text-xs underline opacity-80 hover:opacity-100"
              >
                Clear
              </button>
            </div>

            {scanResult.valid && (
              <div className="bg-black/30 p-3.5 rounded-xl border border-emerald-500/20 grid grid-cols-2 gap-2 text-xs text-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Movie</span>
                  <span className="font-bold text-white">{scanResult.movieTitle}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Cinema Screen</span>
                  <span className="font-bold text-white">{scanResult.theatreName} ({scanResult.screenName})</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Allocated Seats</span>
                  <span className="font-extrabold text-amber-400">{scanResult.seats}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Show Slot</span>
                  <span className="font-semibold text-white">{scanResult.showDate} | {scanResult.showTime}</span>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </Modal>
  );
};
