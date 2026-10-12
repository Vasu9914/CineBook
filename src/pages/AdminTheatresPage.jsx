import React, { useState, useEffect } from 'react';
import { theatreApi } from '../api/theatreApi';
import { screenApi } from '../api/screenApi';
import { Modal } from '../components/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Plus, Edit2, Tv, MapPin, Grid, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';

const theatreSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  facilitiesStr: z.string().optional(),
});

const screenSchema = z.object({
  name: z.string().min(1, 'Screen name required (e.g. Screen 1)'),
  screenType: z.string().optional(),
  totalSeats: z.coerce.number().min(10, 'Minimum 10 seats'),
});

const seatConfigSchema = z.object({
  rowsStr: z.string().min(1, 'Rows required (e.g. A,B,C,D,E)'),
  columnsPerRow: z.coerce.number().min(1).max(25),
  seatType: z.string(),
});

export const AdminTheatresPage = () => {
  const [theatres, setTheatres] = useState([]);
  const [screensMap, setScreensMap] = useState({});
  const [loading, setLoading] = useState(true);

  const [isTheatreModalOpen, setIsTheatreModalOpen] = useState(false);
  const [isScreenModalOpen, setIsScreenModalOpen] = useState(false);
  const [isSeatsModalOpen, setIsSeatsModalOpen] = useState(false);

  const [selectedTheatre, setSelectedTheatre] = useState(null);
  const [selectedScreen, setSelectedScreen] = useState(null);
  const [editingTheatre, setEditingTheatre] = useState(null);

  const {
    register: registerTheatre,
    handleSubmit: handleTheatreSubmit,
    reset: resetTheatre,
    setValue: setTheatreValue,
    formState: { errors: theatreErrors },
  } = useForm({
    resolver: zodResolver(theatreSchema),
  });

  const {
    register: registerScreen,
    handleSubmit: handleScreenSubmit,
    reset: resetScreen,
  } = useForm({
    resolver: zodResolver(screenSchema),
    defaultValues: {
      name: 'Screen 1',
      screenType: 'NORMAL',
      totalSeats: 100,
    },
  });

  const {
    register: registerSeats,
    handleSubmit: handleSeatsSubmit,
    reset: resetSeats,
  } = useForm({
    resolver: zodResolver(seatConfigSchema),
    defaultValues: {
      rowsStr: 'A, B, C, D, E, F, G, H, I, J',
      columnsPerRow: 10,
      seatType: 'NORMAL',
    },
  });

  const fetchTheatres = async () => {
    setLoading(true);
    try {
      const res = await theatreApi.getTheatres();
      const list = res.content || res || [];
      setTheatres(list);

      // Fetch screens per theatre
      const map = {};
      for (const t of list) {
        try {
          const scs = await theatreApi.getTheatreScreens(t.id);
          map[t.id] = scs.content || scs || [];
        } catch (e) {
          map[t.id] = [];
        }
      }
      setScreensMap(map);
    } catch (err) {
      toast.error('Failed to fetch theatres');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheatres();
  }, []);

  const handleOpenAddTheatre = () => {
    setEditingTheatre(null);
    resetTheatre();
    setIsTheatreModalOpen(true);
  };

  const handleOpenEditTheatre = (t) => {
    setEditingTheatre(t);
    setTheatreValue('name', t.name);
    setTheatreValue('address', t.address);
    setTheatreValue('city', t.city);
    setTheatreValue('facilitiesStr', t.facilities ? t.facilities.join(', ') : '');
    setIsTheatreModalOpen(true);
  };

  const handleOpenAddScreen = (t) => {
    setSelectedTheatre(t);
    resetScreen();
    setIsScreenModalOpen(true);
  };

  const handleOpenConfigureSeats = (sc) => {
    setSelectedScreen(sc);
    resetSeats();
    setIsSeatsModalOpen(true);
  };

  const onTheatreSubmit = async (data) => {
    try {
      const facilities = data.facilitiesStr
        ? data.facilitiesStr.split(',').map((s) => s.trim())
        : ['Dolby Atmos', 'Parking'];

      if (editingTheatre) {
        await theatreApi.updateTheatre(editingTheatre.id, { ...data, facilities });
        toast.success('Theatre updated successfully!');
      } else {
        await theatreApi.createTheatre({ ...data, facilities });
        toast.success('Theatre created successfully!');
      }
      setIsTheatreModalOpen(false);
      fetchTheatres();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const onScreenSubmit = async (data) => {
    try {
      await theatreApi.addScreenToTheatre(selectedTheatre.id, data);
      toast.success(`Screen "${data.name}" added to ${selectedTheatre.name}!`);
      setIsScreenModalOpen(false);
      fetchTheatres();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const onSeatsSubmit = async (data) => {
    try {
      const rows = data.rowsStr.split(',').map((r) => r.trim().toUpperCase()).filter(Boolean);
      await screenApi.addSeatsToScreen(selectedScreen.id, {
        rows,
        columnsPerRow: Number(data.columnsPerRow),
        seatType: data.seatType,
      });
      toast.success(`Created ${rows.length * data.columnsPerRow} seats for ${selectedScreen.name}!`);
      setIsSeatsModalOpen(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleToggleStatus = async (t) => {
    const newStatus = t.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await theatreApi.updateTheatreStatus(t.id, newStatus);
      toast.success(`Status set to ${newStatus}`);
      fetchTheatres();
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
            <Building2 className="w-8 h-8 text-amber-400 mr-3" /> Admin — Theatres, Screens & Seats
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Create multiplexes (2.10), add screens (2.13), and configure seat layouts (2.17)
          </p>
        </div>

        <button
          onClick={handleOpenAddTheatre}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl shadow-lg flex items-center space-x-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Theatre</span>
        </button>
      </div>

      {/* Theatres List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {theatres.map((t) => {
          const screens = screensMap[t.id] || [];
          return (
            <div key={t.id} className="bg-[#121824] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
              
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold text-white">{t.name}</h3>
                  <button
                    onClick={() => handleToggleStatus(t)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                      t.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}
                  >
                    {t.status || 'ACTIVE'}
                  </button>
                </div>

                <p className="text-xs text-slate-400 flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-red-500 shrink-0" />
                  {t.address} ({t.city})
                </p>

                {/* Screens Breakdown */}
                <div className="border-t border-slate-800/80 pt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span className="flex items-center">
                      <Tv className="w-3.5 h-3.5 mr-1.5 text-amber-400" /> Screens ({screens.length})
                    </span>
                    <button
                      onClick={() => handleOpenAddScreen(t)}
                      className="text-[11px] text-amber-400 hover:underline font-bold"
                    >
                      + Add Screen
                    </button>
                  </div>

                  {screens.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic">No screens added yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {screens.map((sc) => (
                        <div key={sc.id} className="flex items-center justify-between bg-slate-900 p-2 rounded-xl text-xs border border-slate-800">
                          <div>
                            <span className="font-bold text-white">{sc.name}</span>
                            <span className="text-[10px] text-slate-400 block">{sc.totalSeats || 100} Seats</span>
                          </div>

                          <button
                            onClick={() => handleOpenConfigureSeats(sc)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-bold rounded-lg border border-slate-700 flex items-center space-x-1"
                            title="Configure Seat Matrix (POST /api/screens/{id}/seats)"
                          >
                            <Grid className="w-3 h-3" />
                            <span>Add Seats</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end space-x-2">
                <button
                  onClick={() => handleOpenEditTheatre(t)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Theatre Modal (POST /api/theatres) */}
      <Modal
        isOpen={isTheatreModalOpen}
        onClose={() => setIsTheatreModalOpen(false)}
        title={editingTheatre ? 'Edit Theatre' : 'Add New Theatre (POST /api/theatres)'}
      >
        <form onSubmit={handleTheatreSubmit(onTheatreSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Theatre Name</label>
            <input
              {...registerTheatre('name')}
              placeholder="e.g. PVR Cinemas"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {theatreErrors.name && <p className="text-xs text-red-400 mt-1">{theatreErrors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">City</label>
              <input
                {...registerTheatre('city')}
                placeholder="Surat"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Facilities (Comma Separated)</label>
              <input
                {...registerTheatre('facilitiesStr')}
                placeholder="Dolby Atmos, Parking, Recliner"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Address</label>
            <textarea
              rows={2}
              {...registerTheatre('address')}
              placeholder="CG Road, Surat, Gujarat"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsTheatreModalOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl"
            >
              Save Theatre
            </button>
          </div>
        </form>
      </Modal>

      {/* Screen Modal (POST /api/theatres/{theatreId}/screens) */}
      <Modal
        isOpen={isScreenModalOpen}
        onClose={() => setIsScreenModalOpen(false)}
        title={`Add Screen to ${selectedTheatre?.name} (POST /api/theatres/${selectedTheatre?.id}/screens)`}
      >
        <form onSubmit={handleScreenSubmit(onScreenSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Screen Name</label>
            <input
              {...registerScreen('name')}
              placeholder="Screen 1"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Screen Type</label>
              <input
                {...registerScreen('screenType')}
                placeholder="NORMAL / PREMIUM"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Total Capacity Seats</label>
              <input
                type="number"
                {...registerScreen('totalSeats')}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsScreenModalOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl"
            >
              Create Screen
            </button>
          </div>
        </form>
      </Modal>

      {/* Seat Layout Configuration Modal (POST /api/screens/{screenId}/seats) */}
      <Modal
        isOpen={isSeatsModalOpen}
        onClose={() => setIsSeatsModalOpen(false)}
        title={`Configure Seats for ${selectedScreen?.name} (POST /api/screens/${selectedScreen?.id}/seats)`}
      >
        <form onSubmit={handleSeatsSubmit(onSeatsSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Auditorium Rows (Comma Separated)</label>
            <input
              {...registerSeats('rowsStr')}
              placeholder="A, B, C, D, E, F, G, H, I, J"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Columns Per Row</label>
              <input
                type="number"
                {...registerSeats('columnsPerRow')}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Seat Type</label>
              <select
                {...registerSeats('seatType')}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="NORMAL">NORMAL</option>
                <option value="PREMIUM">PREMIUM</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400">
            <p className="font-semibold text-white">API Payload Preview:</p>
            <code className="text-[11px] text-amber-300 block mt-1">
              POST /api/screens/{selectedScreen?.id}/seats <br />
              &#123; "rows": ["A", "B", "C"], "columnsPerRow": 10, "seatType": "NORMAL" &#125;
            </code>
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsSeatsModalOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl"
            >
              Generate Seats Matrix
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
