import React, { useState } from 'react';
import { Copy, Check, QrCode, Calendar, Clock, MapPin, Film, Download, ShieldCheck } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import { toast } from 'react-toastify';
import { TicketScannerModal } from './TicketScannerModal';
import { downloadTicketPDF } from '../utils/ticketExporter';

export const TicketCard = ({ booking }) => {
  const [copied, setCopied] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!booking) return null;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(booking.bookingReference);
    setCopied(true);
    toast.success('Booking reference copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    await downloadTicketPDF(`ticket-card-${booking.bookingReference}`, booking.bookingReference);
    setIsDownloading(false);
  };

  return (
    <div
      id={`ticket-card-${booking.bookingReference}`}
      className="w-full max-w-xl mx-auto bg-[#121824] rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden text-slate-100 print:bg-white print:text-black"
    >
      
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-red-700 via-red-600 to-amber-600 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Film className="w-5 h-5 text-white" />
          <span className="text-sm font-bold tracking-wider uppercase text-white">Digital Cinema Ticket</span>
        </div>
        <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-black/40 text-emerald-300 border border-emerald-400/40">
          {booking.status || 'CONFIRMED'}
        </span>
      </div>

      {/* Main Ticket Body */}
      <div className="p-6">
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          
          {/* QR Code Graphic */}
          <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-slate-200 shrink-0">
            {/* SVG generated QR code mockup */}
            <svg className="w-28 h-28 text-slate-900" viewBox="0 0 100 100" fill="currentColor">
              <rect x="0" y="0" width="30" height="30" rx="4" />
              <rect x="5" y="5" width="20" height="20" fill="white" />
              <rect x="10" y="10" width="10" height="10" />
              
              <rect x="70" y="0" width="30" height="30" rx="4" />
              <rect x="75" y="5" width="20" height="20" fill="white" />
              <rect x="80" y="10" width="10" height="10" />
              
              <rect x="0" y="70" width="30" height="30" rx="4" />
              <rect x="5" y="75" width="20" height="20" fill="white" />
              <rect x="10" y="80" width="10" height="10" />

              <rect x="40" y="10" width="15" height="10" />
              <rect x="40" y="30" width="10" height="20" />
              <rect x="60" y="40" width="15" height="15" />
              <rect x="20" y="40" width="10" height="10" />
              <rect x="40" y="60" width="20" height="10" />
              <rect x="70" y="70" width="15" height="15" />
              <rect x="50" y="80" width="10" height="15" />
            </svg>
            <span className="text-[10px] font-mono font-semibold text-slate-500 mt-1">Scan at Entrance</span>
          </div>

          {/* Ticket Details */}
          <div className="flex-1 w-full space-y-3">
            <div>
              <p className="text-xs text-slate-400 font-medium">Booking Reference</p>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="text-xl font-mono font-extrabold text-white tracking-wider">
                  {booking.bookingReference}
                </span>
                <button
                  onClick={handleCopyRef}
                  className="p-1 rounded-md bg-slate-800 text-slate-300 hover:text-white transition-colors"
                  title="Copy Reference"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <h3 className="text-lg font-bold text-white line-clamp-1">
                {booking.movieTitle || 'Movie Title'}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center text-slate-300">
                <MapPin className="w-3.5 h-3.5 mr-1.5 text-red-400 shrink-0" />
                <span className="truncate">{booking.theatreName} ({booking.screenName})</span>
              </div>

              <div className="flex items-center text-slate-300">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-amber-400 shrink-0" />
                <span>{formatDate(booking.showDate)}</span>
              </div>

              <div className="flex items-center text-slate-300">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-emerald-400 shrink-0" />
                <span>{booking.showTime}</span>
              </div>

              <div className="text-slate-300">
                <span className="text-slate-400">Seats:</span>{' '}
                <span className="font-semibold text-white">
                  {Array.isArray(booking.seatNumbers) ? booking.seatNumbers.join(', ') : booking.seatNumbers}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dashed Separator */}
        <div className="relative my-6 border-b-2 border-dashed border-slate-700/80">
          <div className="absolute -left-9 -top-3 w-6 h-6 bg-[#0b0f19] rounded-full"></div>
          <div className="absolute -right-9 -top-3 w-6 h-6 bg-[#0b0f19] rounded-full"></div>
        </div>

        {/* Footer info & Download button */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div>
            <span>Total Paid: </span>
            <span className="text-base font-bold text-emerald-400">₹{booking.totalPrice || booking.totalAmount || 0}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center space-x-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 px-3 py-2 rounded-xl transition-colors font-medium border border-emerald-700 print:hidden"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Test Scanner</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="flex items-center space-x-1.5 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl transition-all font-bold text-xs shadow-lg shadow-red-900/30 print:hidden disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-white" />
              <span>{isDownloading ? 'Exporting PDF...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Ticket Scanner Modal */}
      <TicketScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
    </div>
  );
};
