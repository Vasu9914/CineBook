import React, { useEffect } from 'react';
import { useNotificationStore } from '../store/useNotificationStore';
import { useAuthStore } from '../store/useAuthStore';
import { Bell, CheckCheck, Info, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { formatDateTime } from '../utils/dateUtils';
import { toast } from 'react-toastify';

export const NotificationsPage = () => {
  const { user } = useAuthStore();
  const { notifications, fetchNotifications, markAsRead, markAllAsRead, isLoading } = useNotificationStore();

  useEffect(() => {
    fetchNotifications(user?.id || 99);
  }, [user, fetchNotifications]);

  const handleMarkAll = async () => {
    await markAllAsRead(user?.id || 99);
    toast.success('All notifications marked as read.');
  };

  const getIcon = (type) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center">
            <Bell className="w-7 h-7 text-red-500 mr-2.5" /> Notifications
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Stay updated with your booking alerts, seat holds, and showtime reminders
          </p>
        </div>

        {notifications.some((n) => !n.read) && (
          <button
            onClick={handleMarkAll}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 flex items-center space-x-1.5 transition-colors"
          >
            <CheckCheck className="w-4 h-4 text-emerald-400" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 text-xs">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-[#121824] p-12 rounded-3xl border border-slate-800 text-center space-y-3">
          <Bell className="w-12 h-12 mx-auto text-slate-600" />
          <p className="text-base font-bold text-white">No notifications yet</p>
          <p className="text-xs text-slate-400">Updates regarding your bookings will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                !n.read
                  ? 'bg-[#161f30] border-slate-700 shadow-lg'
                  : 'bg-[#121824]/60 border-slate-800/80 opacity-80'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                  {getIcon(n.type)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-white">{n.title}</h3>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                  
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
                    {n.bookingReference && (
                      <span className="font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-amber-300">
                        Ref: {n.bookingReference}
                      </span>
                    )}
                    {n.channel && (
                      <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-300 uppercase">
                        {n.channel}
                      </span>
                    )}
                    {n.recipient && (
                      <span className="text-slate-400">
                        to {n.recipient}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 flex items-center ml-auto">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDateTime(n.timestamp)}
                    </span>
                  </div>
                </div>
              </div>

              {!n.read && (
                <button
                  onClick={() => markAsRead(n.id)}
                  className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors shrink-0 pt-1"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
