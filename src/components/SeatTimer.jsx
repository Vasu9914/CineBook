import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

export const SeatTimer = ({ expiresAt, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState({ minutes: 10, seconds: 0 });
  const [isLow, setIsLow] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;

    let target = new Date(expiresAt).getTime();
    const now = Date.now();
    // If backend timestamp is in the past (e.g. 2025 sample date), fallback to 10 mins from now
    if (isNaN(target) || target <= now) {
      target = now + 10 * 60 * 1000;
    }

    const interval = setInterval(() => {
      const currentNow = Date.now();
      const diff = target - currentNow;

      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft({ minutes: 0, seconds: 0 });
        if (onExpire) onExpire();
      } else {
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ minutes: mins, seconds: secs });
        if (mins < 2) {
          setIsLow(true);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div
      className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold tracking-wide transition-all ${
        isLow
          ? 'bg-red-950/60 border-red-500 text-red-300 animate-pulse'
          : 'bg-amber-950/40 border-amber-500/50 text-amber-300'
      }`}
    >
      {isLow ? <AlertTriangle className="w-4 h-4 text-red-400" /> : <Clock className="w-4 h-4 text-amber-400" />}
      <span>Time left</span>
      <span className="font-mono text-sm font-bold">
        {pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
      </span>
    </div>
  );
};
