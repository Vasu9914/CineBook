import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { movieApi } from '../api/movieApi';
import { theatreApi } from '../api/theatreApi';
import { showApi } from '../api/showApi';
import { Film, Building2, Tv, DollarSign, Plus, ArrowRight, ShieldCheck } from 'lucide-react';

import { TicketScannerModal } from '../components/TicketScannerModal';
import { QrCode } from 'lucide-react';

export const AdminDashboardPage = () => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [stats, setStats] = useState({
    moviesCount: 0,
    theatresCount: 0,
    showsCount: 0,
    revenue: 148500
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const mRes = await movieApi.getMovies();
        const tRes = await theatreApi.getTheatres();
        const sRes = await showApi.getShows();

        setStats({
          moviesCount: mRes.totalElements || (mRes.content ? mRes.content.length : 5),
          theatresCount: tRes.totalElements || (tRes.content ? tRes.content.length : 3),
          showsCount: sRes.totalElements || (sRes.content ? sRes.content.length : 14),
          revenue: 148500
        });
      } catch (err) {
        console.error(err);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center">
            <ShieldCheck className="w-8 h-8 text-amber-400 mr-3" /> Admin Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage cinema inventory, theaters, auditoriums, showtime schedules, and ticket check-ins
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5 transition-all"
          >
            <QrCode className="w-4 h-4" />
            <span>Gate Scanner</span>
          </button>
          <Link
            to="/admin/movies"
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Movie</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-[#121824] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Movies</span>
            <div className="p-2.5 rounded-xl bg-red-600/10 border border-red-500/30 text-red-500">
              <Film className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">{stats.moviesCount}</p>
        </div>

        <div className="bg-[#121824] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Theatres</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">{stats.theatresCount}</p>
        </div>

        <div className="bg-[#121824] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Scheduled Shows</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Tv className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">{stats.showsCount}</p>
        </div>

        <div className="bg-[#121824] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gross Revenue</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">₹{stats.revenue.toLocaleString()}</p>
        </div>

      </div>

      {/* Quick Access Admin Modules */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight mb-4">
          Management Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <Link
            to="/admin/movies"
            className="group bg-[#121824] p-6 rounded-3xl border border-slate-800 hover:border-red-500/80 transition-all shadow-xl space-y-4"
          >
            <div className="p-3 bg-red-600/10 border border-red-500/30 text-red-500 rounded-2xl w-fit">
              <Film className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors flex items-center">
                Movies Catalog <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Add new movies, edit cast/genre, update release status, and delete entries.
              </p>
            </div>
          </Link>

          <Link
            to="/admin/theatres"
            className="group bg-[#121824] p-6 rounded-3xl border border-slate-800 hover:border-amber-500/80 transition-all shadow-xl space-y-4"
          >
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl w-fit">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors flex items-center">
                Theatres & Screens <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Manage cinema multiplexes, add auditoriums (Audis), and configure seat layouts.
              </p>
            </div>
          </Link>

          <Link
            to="/admin/shows"
            className="group bg-[#121824] p-6 rounded-3xl border border-slate-800 hover:border-emerald-500/80 transition-all shadow-xl space-y-4"
          >
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl w-fit">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center">
                Showtime Scheduler <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Schedule movie showtimes per theater screen, assign prices, or cancel shows.
              </p>
            </div>
          </Link>

        </div>
      </div>

      <TicketScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />

    </div>
  );
};
