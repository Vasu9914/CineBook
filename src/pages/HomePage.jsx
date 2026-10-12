import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { movieApi } from '../api/movieApi';
import { theatreApi } from '../api/theatreApi';
import { MovieCard } from '../components/MovieCard';
import { Search, MapPin, Ticket, ChevronRight, Star, Sparkles, Filter } from 'lucide-react';

export const HomePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchKeyword = searchParams.get('search') || '';

  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('Surat');
  const [selectedGenre, setSelectedGenre] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let movieData;
        if (searchKeyword) {
          movieData = await movieApi.searchMovies(searchKeyword);
        } else {
          movieData = await movieApi.getMovies();
        }
        setMovies(movieData.content || movieData || []);

        const theatreData = await theatreApi.getTheatres(selectedCity);
        setTheatres(theatreData.content || theatreData || []);
      } catch (err) {
        console.error('Error loading home page data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchKeyword, selectedCity]);

  const featuredMovie = movies.find((m) => m.title === 'Interstellar') || movies[0];

  const genres = ['All', 'Sci-Fi', 'Action', 'Biography', 'Comedy', 'Animation'];

  const filteredMovies = movies.filter((movie) => {
    if (selectedGenre === 'All') return true;
    return movie.genre?.toLowerCase().includes(selectedGenre.toLowerCase());
  });

  return (
    <div className="space-y-12 pb-16">
      
      {/* Featured Hero Banner */}
      {featuredMovie && !searchKeyword && (
        <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-[#0e1422] shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b0f19] via-[#0b0f19]/80 to-transparent z-10"></div>
          
          <img
            src={featuredMovie.bannerUrl || featuredMovie.posterUrl}
            alt={featuredMovie.title}
            className="w-full h-[380px] sm:h-[450px] object-cover object-center opacity-60 scale-105"
          />

          <div className="absolute inset-0 z-20 flex items-center p-6 sm:p-12">
            <div className="max-w-2xl space-y-4">
              
              <div className="flex items-center space-x-3">
                <span className="bg-red-600/90 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                  Featured Movie
                </span>
                <span className="flex items-center text-xs font-bold text-amber-400 bg-black/60 px-2.5 py-1 rounded-full border border-amber-500/40">
                  <Star className="w-3.5 h-3.5 mr-1 fill-amber-400" />
                  {featuredMovie.rating} / 10
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-none">
                {featuredMovie.title}
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 font-medium space-x-2">
                <span>{featuredMovie.language}</span>
                <span>•</span>
                <span>{featuredMovie.durationMinutes} min</span>
                <span>•</span>
                <span>{featuredMovie.genre}</span>
              </p>

              <p className="text-sm text-slate-300 line-clamp-2 sm:line-clamp-3 leading-relaxed max-w-xl">
                {featuredMovie.description}
              </p>

              <div className="pt-2 flex items-center space-x-4">
                <Link
                  to={`/movies/${featuredMovie.id}`}
                  className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-red-900/50 flex items-center space-x-2 transition-all hover:scale-105"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Book Tickets</span>
                </Link>
                
                <Link
                  to={`/movies/${featuredMovie.id}`}
                  className="px-5 py-3 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-medium text-sm rounded-2xl border border-slate-700/80 transition-colors"
                >
                  View Details
                </Link>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Filter & City Selector Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#121824] p-4 rounded-2xl border border-slate-800">
        
        {/* City Selector */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <MapPin className="w-4 h-4 text-red-500" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">City:</span>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
          >
            <option value="Surat">Surat</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Delhi">Delhi</option>
            <option value="Bangalore">Bangalore</option>
          </select>
        </div>

        {/* Genre Pill Filter */}
        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all shrink-0 ${
                selectedGenre === genre
                  ? 'bg-red-600 text-white shadow-md shadow-red-900/40'
                  : 'bg-slate-900 text-slate-300 border border-slate-700/80 hover:border-slate-500'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Section Header */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center">
              <Sparkles className="w-5 h-5 text-amber-400 mr-2" />
              {searchKeyword ? `Search results for "${searchKeyword}"` : 'Now Showing'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">Explore trending blockbusters and reserve your seats</p>
          </div>

          {searchKeyword && (
            <button
              onClick={() => setSearchParams({})}
              className="text-xs text-red-400 hover:underline font-medium"
            >
              Clear Search
            </button>
          )}
        </div>

        {/* Movies Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="aspect-[2/3] bg-slate-800/50 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="text-center py-16 bg-[#121824] rounded-2xl border border-slate-800 space-y-3">
            <Search className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-base font-semibold text-slate-300">No movies found</p>
            <p className="text-xs text-slate-400">Try changing your search keywords or genre filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filteredMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </div>

      {/* Popular Theatres Section */}
      <div id="theatres" className="pt-6 border-t border-slate-800">
        <h2 className="text-2xl font-extrabold text-white tracking-tight mb-4">
          Popular Cinemas in {selectedCity}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {theatres.map((theatre) => (
            <div key={theatre.id} className="bg-[#121824] p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-white">{theatre.name}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {theatre.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">{theatre.address}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {theatre.facilities?.map((f) => (
                  <span key={f} className="text-[10px] bg-slate-900 border border-slate-700/80 px-2 py-0.5 rounded text-slate-300">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
