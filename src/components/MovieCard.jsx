import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, Ticket } from 'lucide-react';

export const MovieCard = ({ movie }) => {
  return (
    <div className="group relative bg-[#121824] rounded-2xl overflow-hidden border border-slate-800/80 shadow-lg hover:shadow-2xl hover:shadow-red-950/30 hover:border-slate-700 transition-all duration-300 flex flex-col h-full">
      {/* Poster Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900">
        <img
          src={movie.posterUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80'}
          alt={movie.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Rating Badge */}
        {movie.rating ? (
          <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-full border border-amber-500/40 flex items-center space-x-1 shadow-md">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-xs font-bold text-amber-300">{movie.rating}</span>
          </div>
        ) : (
          <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-500/40 flex items-center space-x-1 shadow-md">
            <span className="text-[10px] font-bold text-emerald-300 uppercase">{movie.status || 'ACTIVE'}</span>
          </div>
        )}

        {/* Genre Pill */}
        <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-0.5 rounded-md text-[11px] font-medium text-slate-300 border border-slate-700/60">
          {movie.genre || 'Sci-Fi'}
        </div>

        {/* Hover Overlay with Quick Book Button */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-slate-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <Link
            to={`/movies/${movie.id}`}
            className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-red-900/50 flex items-center justify-center space-x-2 transition-transform duration-200 hover:scale-[1.02]"
          >
            <Ticket className="w-4 h-4" />
            <span>Book Tickets</span>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow justify-between bg-gradient-to-b from-[#121824] to-[#0e131d]">
        <div>
          <Link to={`/movies/${movie.id}`}>
            <h3 className="text-base font-semibold text-white group-hover:text-red-400 transition-colors line-clamp-1">
              {movie.title}
            </h3>
          </Link>
          <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1.5">
            <span>{movie.language || 'English'}</span>
            <span>•</span>
            <span className="flex items-center">
              <Clock className="w-3 h-3 mr-1 text-slate-400" />
              {movie.durationMinutes || 150} min
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
