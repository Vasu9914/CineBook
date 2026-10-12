import React from 'react';
import { Check } from 'lucide-react';

export const SeatGrid = ({ seats = [], selectedSeats = [], onToggleSeat, basePrice = 250 }) => {
  // Group seats by row
  const rowsMap = {};
  seats.forEach((seat) => {
    const row = seat.rowName || seat.seatNumber[0];
    if (!rowsMap[row]) rowsMap[row] = [];
    rowsMap[row].push(seat);
  });

  // Sort rows alphabetically
  const rowKeys = Object.keys(rowsMap).sort();

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      
      {/* Screen Graphic */}
      <div className="w-full mb-10 flex flex-col items-center">
        <div className="relative w-3/4 h-8 overflow-hidden flex justify-center">
          <div className="w-full h-16 border-t-4 border-red-500/80 rounded-[100%] shadow-[0_-10px_25px_rgba(239,68,68,0.4)] bg-gradient-to-b from-red-500/10 to-transparent"></div>
        </div>
        <p className="text-[11px] font-semibold text-slate-400 tracking-[0.3em] uppercase -mt-4">
          All Eyes This Way — Screen
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center items-center gap-5 mb-8 bg-slate-900/80 px-6 py-3 rounded-full border border-slate-800 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-slate-800 border border-slate-700"></div>
          <span className="text-slate-300 font-medium">Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-red-600 shadow-md shadow-red-900/50 flex items-center justify-center text-white font-bold">
            <Check className="w-2.5 h-2.5" />
          </div>
          <span className="text-slate-300 font-medium">Selected</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-amber-500/20 border border-amber-500"></div>
          <span className="text-amber-300 font-medium">Held / Reserved</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-slate-900 border border-slate-800 opacity-40 line-through text-slate-600 flex items-center justify-center text-[9px]">✕</div>
          <span className="text-slate-400 font-medium">Booked</span>
        </div>
      </div>

      {/* Seat Grid Layout */}
      <div className="overflow-x-auto w-full pb-4 flex justify-center">
        <div className="flex flex-col space-y-3 min-w-[500px]">
          {rowKeys.map((rowKey) => {
            const rowSeats = rowsMap[rowKey].sort((a, b) => a.columnNumber - b.columnNumber);
            
            return (
              <div key={rowKey} className="flex items-center justify-center space-x-2 sm:space-x-3">
                {/* Row Label Left */}
                <span className="w-6 text-center font-bold text-xs text-slate-400 select-none">
                  {rowKey}
                </span>

                {/* Seat Buttons */}
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  {rowSeats.map((seat) => {
                    const isSelected = selectedSeats.includes(seat.seatNumber);
                    const isBooked = seat.status === 'BOOKED' || seat.status === 'TAKEN' || seat.status === 'OCCUPIED';
                    const isHeld = seat.status === 'HELD' || seat.status === 'RESERVED' || Boolean(seat.reservedUntil);
                    const isAvailable = seat.status === 'AVAILABLE' && !isBooked && !isHeld;
                    const isPremium = seat.category === 'PREMIUM' || rowKey >= 'I';

                    // Aisle breaks after col 4 & col 8
                    const hasAisleRight = seat.columnNumber === 4 || seat.columnNumber === 8;

                    let seatColorClasses = '';
                    if (isBooked) {
                      seatColorClasses = 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed line-through opacity-40';
                    } else if (isSelected) {
                      seatColorClasses = 'bg-red-600 border border-red-500 text-white shadow-lg shadow-red-900/60 scale-105 z-10';
                    } else if (isHeld) {
                      seatColorClasses = 'bg-amber-950/60 border border-amber-500/80 text-amber-300 cursor-not-allowed opacity-70';
                    } else if (isPremium) {
                      seatColorClasses = 'bg-amber-950/30 border border-amber-500/60 text-amber-200 hover:bg-amber-500 hover:text-black hover:scale-110';
                    } else {
                      seatColorClasses = 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-500 hover:scale-105';
                    }

                    return (
                      <React.Fragment key={seat.seatNumber}>
                        <button
                          disabled={isBooked || isHeld}
                          onClick={() => onToggleSeat(seat.seatNumber)}
                          title={`${seat.seatNumber} (${seat.status}) - ₹${seat.price || basePrice}`}
                          className={`
                            w-7 h-7 sm:w-8 sm:h-8 rounded-md text-[11px] font-semibold transition-all duration-150 flex items-center justify-center select-none relative group
                            ${seatColorClasses}
                          `}
                        >
                          {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : seat.columnNumber}
                        </button>

                        {/* Aisle spacing */}
                        {hasAisleRight && <div className="w-4 sm:w-6" />}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Row Label Right */}
                <span className="w-6 text-center font-bold text-xs text-slate-400 select-none">
                  {rowKey}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
