import React, { useState, useEffect } from 'react';
import { showApi } from '../api/showApi';
import { movieApi } from '../api/movieApi';
import { theatreApi } from '../api/theatreApi';
import { Modal } from '../components/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tv, Plus, XCircle, Calendar, Clock, DollarSign } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import { toast } from 'react-toastify';

const showSchema = z.object({
  movieId: z.string().min(1, 'Please select a movie'),
  theatreId: z.string().min(1, 'Please select a theatre'),
  screenId: z.string().min(1, 'Please select a screen'),
  date: z.string().min(1, 'Please pick a date'),
  startTimeVal: z.string().min(1, 'Please select start time'),
  endTimeVal: z.string().min(1, 'Please select end time'),
  price: z.coerce.number().min(50, 'Price must be at least ₹50'),
});

export const AdminShowsPage = () => {
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(showSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      startTimeVal: '10:00',
      endTimeVal: '12:25',
      price: 250,
    },
  });

  const selectedTheatreId = watch('theatreId');

  const fetchData = async () => {
    setLoading(true);
    try {
      const showsData = await showApi.getShows();
      setShows(showsData.content || showsData || []);

      const moviesData = await movieApi.getMovies();
      setMovies(moviesData.content || moviesData || []);

      const theatresData = await theatreApi.getTheatres();
      setTheatres(theatresData.content || theatresData || []);
    } catch (err) {
      toast.error('Failed to load shows data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedTheatreId) {
      theatreApi.getTheatreScreens(selectedTheatreId).then((scs) => setScreens(scs.content || scs || []));
    }
  }, [selectedTheatreId]);

  const handleOpenAdd = () => {
    reset();
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      // Construct ISO timestamps according to section 2.20 spec
      const startTimeIso = `${data.date}T${data.startTimeVal}:00`;
      const endTimeIso = `${data.date}T${data.endTimeVal}:00`;

      await showApi.createShow({
        movieId: Number(data.movieId),
        screenId: Number(data.screenId),
        theatreId: Number(data.theatreId),
        startTime: startTimeIso,
        endTime: endTimeIso,
        price: data.price
      });

      toast.success('Showtime scheduled successfully!');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to create show: ' + err.message);
    }
  };

  const handleCancelShow = async (showId) => {
    if (!window.confirm('Cancel this showtime? Bookings for this show will be impacted.')) return;
    try {
      await showApi.cancelShow(showId);
      toast.success('Showtime cancelled.');
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center">
            <Tv className="w-8 h-8 text-emerald-400 mr-3" /> Admin — Schedule Showtimes
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Assign movies to screens (POST /api/shows with movieId, screenId, startTime, endTime)
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center space-x-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Show</span>
        </button>
      </div>

      {/* Shows Table */}
      <div className="bg-[#121824] rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <th className="p-4">Movie</th>
                <th className="p-4">Theatre & Screen</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Price</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {shows.map((show) => (
                <tr key={show.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4">
                    <span className="font-bold text-white text-sm block">{show.movieTitle}</span>
                  </td>
                  <td className="p-4">
                    <span className="font-medium text-slate-200 block">{show.theatreName}</span>
                    <span className="text-[11px] text-slate-400">{show.screenName || 'Screen 1'}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>{formatDate(show.date)}</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-0.5 text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-bold text-white">{show.startTime}</span>
                    </div>
                  </td>
                  <td className="p-4 font-bold text-white">₹{show.price}</td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                        show.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}
                    >
                      {show.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {show.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleCancelShow(show.id)}
                        className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1 ml-auto"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel Show</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Modal (POST /api/shows) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule New Movie Show (POST /api/shows)"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Select Movie</label>
            <select
              {...register('movieId')}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- Choose Movie --</option>
              {movies.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.language})
                </option>
              ))}
            </select>
            {errors.movieId && <p className="text-xs text-red-400 mt-1">{errors.movieId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Select Theatre</label>
              <select
                {...register('theatreId')}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Choose Theatre --</option>
                {theatres.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Select Screen</label>
              <select
                {...register('screenId')}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Choose Screen --</option>
                {screens.length > 0 ? (
                  screens.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.name} ({sc.totalSeats} seats)
                    </option>
                  ))
                ) : (
                  <>
                    <option value="1">Screen 1 (100 seats)</option>
                    <option value="2">Screen 2 (80 seats)</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Show Date</label>
              <input
                type="date"
                {...register('date')}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Start Time</label>
              <input
                type="time"
                {...register('startTimeVal')}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">End Time</label>
              <input
                type="time"
                {...register('endTimeVal')}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Ticket Price (₹)</label>
            <input
              type="number"
              {...register('price')}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400">
            <p className="font-semibold text-white">API Payload Preview:</p>
            <code className="text-[11px] text-emerald-400 block mt-1">
              POST /api/shows <br />
              &#123; "movieId": 1, "screenId": 1, "startTime": "2025-01-10T10:00:00", "endTime": "2025-01-10T12:25:00" &#123;
            </code>
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl"
            >
              Schedule Show
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
