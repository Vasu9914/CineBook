import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { movieApi } from '../api/movieApi';
import { showApi } from '../api/showApi';
import { theatreApi } from '../api/theatreApi';
import { useBookingStore } from '../store/useBookingStore';
import { getNextNDays } from '../utils/dateUtils';
import { Star, Clock, Calendar, Ticket, MapPin, ArrowLeft, Film } from 'lucide-react';
import { toast } from 'react-toastify';
import { MovieReviewsSection } from '../components/MovieReviewsSection';
import { reviewApi } from '../api/reviewApi';

export const MovieDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setSelectedMovie, setSelectedShow } = useBookingStore();

  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const days = getNextNDays(5);
  const [selectedDate, setSelectedDate] = useState(days[0].fullDate);

  useEffect(() => {
    const fetchMovieData = async () => {
      setLoading(true);
      try {
        const movieData = await movieApi.getMovieById(id);
        setMovie(movieData);
        setSelectedMovie(movieData);

        // Fetch all shows for this movie
        const showsRes = await showApi.getShows({ movieId: id });
        const allMovieShows = showsRes.content || showsRes || [];

        // Filter by selected date if available, otherwise show all active shows for this movie
        const filteredByDate = allMovieShows.filter((s) => !s.date || s.date === selectedDate || s.startTime?.includes(selectedDate));
        const finalShows = filteredByDate.length > 0 ? filteredByDate : allMovieShows;
        
        setShows(finalShows);

        const theatreRes = await theatreApi.getTheatres();
        setTheatres(theatreRes.content || theatreRes || []);

        try {
          const summaryData = await reviewApi.getMovieReviewSummary(id);
          setReviewSummary(summaryData);
        } catch (e) {
          console.warn('Could not fetch live review summary:', e.message);
        }
      } catch (err) {
        toast.error('Failed to load movie details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();
  }, [id, selectedDate, setSelectedMovie]);

  const handleSelectShow = (show) => {
    setSelectedShow(show);
    navigate(`/shows/${show.id}/seats`);
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-slate-400 text-sm">Loading showtimes and cinema details...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="py-20 text-center text-slate-300">
        <p>Movie not found.</p>
        <Link to="/" className="text-red-400 underline text-sm mt-2 inline-block">
          Return to Home
        </Link>
      </div>
    );
  }

  // Group shows by Theatre
  const theatreMap = {};

  // First seed from theatre list so all active theatres display
  theatres.forEach((t) => {
    theatreMap[t.id] = {
      info: t,
      shows: []
    };
  });

  // Attach shows to respective theatres
  shows.forEach((show) => {
    const tId = show.theatreId || show.screen?.theatre?.id || 101;
    if (!theatreMap[tId]) {
      theatreMap[tId] = {
        info: {
          id: tId,
          name: show.theatreName || 'PVR Cinemas',
          address: show.theatreAddress || 'Surat, Gujarat',
          facilities: show.theatreFacilities || ['Dolby Atmos', 'Parking']
        },
        shows: []
      };
    }
    theatreMap[tId].shows.push(show);
  });

  // Filter out theatres with 0 shows
  const activeTheatresWithShows = Object.values(theatreMap).filter((item) => item.shows.length > 0);

  return (
    <div className="space-y-8 pb-16">
      
      {/* Back button */}
      <div>
        <Link to="/" className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Movies
        </Link>
      </div>

      {/* Movie Details Header Card */}
      <div className="bg-[#121824] rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl flex flex-col md:flex-row gap-8">
        {/* Poster */}
        <div className="w-full md:w-56 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden shadow-xl border border-slate-700/80">
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Details */}
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {movie.title}
              </h1>
              <div className="flex items-center space-x-3 text-xs text-slate-300 mt-2 font-medium">
                <span className="bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">{movie.language || 'English'}</span>
                <span>•</span>
                <span className="flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {movie.durationMinutes} min
                </span>
                <span>•</span>
                <span>{movie.genre}</span>
                <span>•</span>
                <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">U/A</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-black/60 px-4 py-2 rounded-2xl border border-amber-500/40">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <div>
                <span className="text-lg font-bold text-white">
                  {reviewSummary && reviewSummary.totalReviews > 0 ? Number(reviewSummary.averageRating).toFixed(1) : '—'}
                </span>
                <span className="text-xs text-slate-400">
                  {reviewSummary && reviewSummary.totalReviews > 0 ? `/5 (${reviewSummary.totalReviews} reviews)` : ' (No reviews yet)'}
                </span>
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed pt-2">
            {movie.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs text-slate-400">
            <div>
              <span className="text-slate-500 font-semibold uppercase">Starring:</span>{' '}
              <span className="text-slate-200">{movie.cast || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold uppercase">Director:</span>{' '}
              <span className="text-slate-200">{movie.director || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Date Selector Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-red-500" /> Select Date & Showtimes
        </h2>

        <div className="flex items-center space-x-3 overflow-x-auto pb-2 no-scrollbar">
          {days.map((day) => {
            const isSelected = selectedDate === day.fullDate;
            return (
              <button
                key={day.fullDate}
                onClick={() => setSelectedDate(day.fullDate)}
                className={`flex flex-col items-center min-w-[85px] py-3 px-4 rounded-2xl border transition-all shrink-0 ${
                  isSelected
                    ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/50 scale-105'
                    : 'bg-[#121824] border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider opacity-90">{day.dayName}</span>
                <span className="text-lg font-bold mt-0.5">{day.dateNum}</span>
                <span className="text-[10px] font-medium opacity-80">{day.monthName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Theatre & Showtimes List */}
      <div className="space-y-6">
        {activeTheatresWithShows.length === 0 ? (
          <div className="bg-[#121824] p-8 rounded-2xl border border-slate-800 text-center text-slate-400">
            <Film className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-base font-semibold text-slate-300">No showtimes currently scheduled for this movie</p>
            <p className="text-xs text-slate-500 mt-1">Go to Admin $\rightarrow$ Shows to schedule new showtimes.</p>
          </div>
        ) : (
          activeTheatresWithShows.map(({ info, shows: tShows }) => {
            const validPrices = tShows.map((s) => Number(s.price)).filter((p) => !isNaN(p) && p > 0);
            const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 250;

            return (
              <div key={info.id || info.name} className="bg-[#121824] rounded-2xl p-6 border border-slate-800 space-y-4">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center">
                      {info.name}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center mt-1">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      {info.address}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                      ₹{minPrice} onwards
                    </span>
                  </div>
                </div>

                {/* Facility Tags */}
                <div className="flex flex-wrap gap-2">
                  {info.facilities?.map((f) => (
                    <span key={f} className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full">
                      {f}
                    </span>
                  ))}
                </div>

                {/* Time Slot Buttons */}
                <div className="pt-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Available Showtimes</p>
                  <div className="flex flex-wrap gap-3">
                    {tShows.map((show) => (
                      <button
                        key={show.id}
                        onClick={() => handleSelectShow(show)}
                        className="group relative bg-slate-900 border border-slate-700/80 hover:border-red-500 hover:bg-red-600/90 text-slate-100 hover:text-white px-4 py-2.5 rounded-xl transition-all shadow-md flex flex-col items-center min-w-[100px]"
                      >
                        <span className="text-sm font-bold">{show.startTime}</span>
                        <span className="text-[10px] text-slate-400 group-hover:text-red-100 font-medium">
                          {show.screenName || 'Screen 1'} • ₹{show.price}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Reviews & Ratings Section */}
      <MovieReviewsSection movieId={id} />

    </div>
  );
};
