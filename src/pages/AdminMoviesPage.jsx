import React, { useState, useEffect } from 'react';
import { movieApi } from '../api/movieApi';
import { Modal } from '../components/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Film, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Star } from 'lucide-react';
import { toast } from 'react-toastify';

const movieSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(5, 'Description is required'),
  genre: z.string().min(1, 'Genre is required'),
  language: z.string().min(1, 'Language is required'),
  durationMinutes: z.coerce.number().min(1, 'Duration must be > 0'),
  rating: z.coerce.number().min(1).max(10),
  posterUrl: z.string().url('Must be a valid image URL'),
});

export const AdminMoviesPage = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(movieSchema),
    defaultValues: {
      title: '',
      description: '',
      genre: 'Sci-Fi',
      language: 'English',
      durationMinutes: 120,
      rating: 8.5,
      posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    },
  });

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const res = await movieApi.getMovies();
      setMovies(res.content || res || []);
    } catch (err) {
      toast.error('Failed to load movies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleOpenAdd = () => {
    setEditingMovie(null);
    reset();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (movie) => {
    setEditingMovie(movie);
    setValue('title', movie.title);
    setValue('description', movie.description);
    setValue('genre', movie.genre);
    setValue('language', movie.language);
    setValue('durationMinutes', movie.durationMinutes);
    setValue('rating', movie.rating);
    setValue('posterUrl', movie.posterUrl);
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editingMovie) {
        await movieApi.updateMovie(editingMovie.id, data);
        toast.success('Movie updated successfully!');
      } else {
        await movieApi.createMovie(data);
        toast.success('Movie created successfully!');
      }
      setIsModalOpen(false);
      fetchMovies();
    } catch (err) {
      toast.error('Error saving movie: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this movie?')) return;
    try {
      await movieApi.deleteMovie(id);
      toast.success('Movie deleted.');
      fetchMovies();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleToggleStatus = async (movie) => {
    const newStatus = movie.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await movieApi.updateMovieStatus(movie.id, newStatus);
      toast.success(`Status updated to ${newStatus}`);
      fetchMovies();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center">
            <Film className="w-8 h-8 text-red-500 mr-3" /> Admin — Movie Catalog
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Create, edit, or remove movies available in the system
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-900/40 flex items-center space-x-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Movie</span>
        </button>
      </div>

      {/* Movies Table */}
      <div className="bg-[#121824] rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <th className="p-4">Movie</th>
                <th className="p-4">Genre / Lang</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {movies.map((movie) => (
                <tr key={movie.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-10 h-14 object-cover rounded-lg border border-slate-700 shrink-0"
                      />
                      <div>
                        <span className="font-bold text-white block text-sm">{movie.title}</span>
                        <span className="text-[11px] text-slate-500 line-clamp-1">{movie.director || 'N/A'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-medium text-slate-200 block">{movie.genre}</span>
                    <span className="text-[11px] text-slate-400">{movie.language}</span>
                  </td>
                  <td className="p-4 font-mono">{movie.durationMinutes} min</td>
                  <td className="p-4">
                    <span className="inline-flex items-center text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      <Star className="w-3 h-3 mr-1 fill-amber-400" />
                      {movie.rating}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleStatus(movie)}
                      className={`inline-flex items-center px-2.5 py-1 rounded-full font-bold text-[10px] uppercase border transition-colors ${
                        movie.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {movie.status === 'ACTIVE' ? <ToggleRight className="w-4 h-4 mr-1 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 mr-1 text-slate-500" />}
                      {movie.status || 'ACTIVE'}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleOpenEdit(movie)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                        title="Edit Movie"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(movie.id)}
                        className="p-2 bg-red-950/60 hover:bg-red-900 text-red-400 rounded-lg border border-red-800/60 transition-colors"
                        title="Delete Movie"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMovie ? 'Edit Movie' : 'Add New Movie'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Movie Title</label>
            <input
              {...register('title')}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Genre</label>
              <input
                {...register('genre')}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Language</label>
              <input
                {...register('language')}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Duration (Minutes)</label>
              <input
                type="number"
                {...register('durationMinutes')}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Rating (1-10)</label>
              <input
                type="number"
                step="0.1"
                {...register('rating')}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Movie Poster (`posterUrl`)
            </label>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  {...register('posterUrl')}
                  placeholder="https://images.unsplash.com/... or upload below"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                
                {/* File Upload Button */}
                <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-600 cursor-pointer transition-colors shrink-0">
                  <span>Upload File</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setValue('posterUrl', reader.result);
                          toast.success('Poster image uploaded successfully!');
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>

              {/* Live Image Preview */}
              {watch('posterUrl') && (
                <div className="flex items-center space-x-3 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                  <img
                    src={watch('posterUrl')}
                    alt="Poster Preview"
                    className="w-12 h-16 object-cover rounded-lg border border-slate-700"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <div className="text-[11px] text-slate-400">
                    <span className="font-semibold text-white block">Poster Preview</span>
                    <span className="truncate max-w-[280px] block font-mono text-[10px] text-slate-500">
                      {watch('posterUrl').substring(0, 50)}...
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Description</label>
            <textarea
              rows={3}
              {...register('description')}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl"
            >
              {editingMovie ? 'Save Changes' : 'Create Movie'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
