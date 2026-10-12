import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../store/useAuthStore';
import { authApi } from '../api/authApi';
import { User, Mail, Phone, Lock, Save, ShieldCheck, KeyRound } from 'lucide-react';
import { toast } from 'react-toastify';

const profileSchema = z.object({
  name: z.string().min(2, 'Name is required'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Current password must be at least 6 characters'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

import { reviewApi } from '../api/reviewApi';
import { Star, MessageSquare, Trash2 } from 'lucide-react';

export const ProfilePage = () => {
  const { user, updateProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(false);

  const [myReviews, setMyReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const fetchMyReviews = async () => {
    setReviewsLoading(true);
    try {
      const data = await reviewApi.getMyReviews();
      setMyReviews(data.content || data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'reviews') {
      fetchMyReviews();
    }
  };

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || user?.fullName || 'John Doe',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const onUpdateProfile = async (data) => {
    setLoading(true);
    try {
      await updateProfile(data);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Profile update failed.');
    } finally {
      setLoading(false);
    }
  };

  const onChangePassword = async (data) => {
    setLoading(true);
    try {
      await authApi.changePassword(data);
      toast.success('Password updated successfully!');
      resetPasswordForm();
    } catch (err) {
      toast.error(err.message || 'Password update failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      
      {/* Profile Header */}
      <div className="bg-[#121824] p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex items-center space-x-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-red-900/40 shrink-0">
          {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {user?.fullName || 'User Profile'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {user?.email} • <span className="text-amber-400 font-semibold">{user?.role || 'USER'}</span>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-6 text-sm font-semibold">
        <button
          onClick={() => handleTabChange('details')}
          className={`pb-3 transition-colors flex items-center space-x-2 ${
            activeTab === 'details'
              ? 'text-red-500 border-b-2 border-red-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Edit Profile</span>
        </button>
        
        <button
          onClick={() => handleTabChange('security')}
          className={`pb-3 transition-colors flex items-center space-x-2 ${
            activeTab === 'security'
              ? 'text-red-500 border-b-2 border-red-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Security & Password</span>
        </button>

        <button
          onClick={() => handleTabChange('reviews')}
          className={`pb-3 transition-colors flex items-center space-x-2 ${
            activeTab === 'reviews'
              ? 'text-red-500 border-b-2 border-red-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>My Reviews</span>
        </button>
      </div>

      {/* Edit Profile Details */}
      {activeTab === 'details' && (
        <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="bg-[#121824] p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-5">
          <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
            Personal Details
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Full Name (`name`)
            </label>
            <div className="relative">
              <input
                {...registerProfile('name')}
                type="text"
                placeholder="John Doe"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 pl-10 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
            {profileErrors.name && (
              <p className="mt-1 text-xs text-red-400">{profileErrors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Email Address (Read-only)
            </label>
            <div className="relative">
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-sm text-slate-500 cursor-not-allowed"
              />
              <Mail className="w-4 h-4 text-slate-600 absolute left-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-900/40 flex items-center space-x-2 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </form>
      )}

      {/* Change Password */}
      {activeTab === 'security' && (
        <form onSubmit={handlePasswordSubmit(onChangePassword)} className="bg-[#121824] p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-5">
          <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
            Change Password
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Current Password (`currentPassword`)
            </label>
            <div className="relative">
              <input
                {...registerPassword('currentPassword')}
                type="password"
                placeholder="OldPass123"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 pl-10 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
            {passwordErrors.currentPassword && (
              <p className="mt-1 text-xs text-red-400">{passwordErrors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                {...registerPassword('newPassword')}
                type="password"
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 pl-10 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
            {passwordErrors.newPassword && (
              <p className="mt-1 text-xs text-red-400">{passwordErrors.newPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-900/40 flex items-center space-x-2 transition-all disabled:opacity-50"
          >
            <KeyRound className="w-4 h-4" />
            <span>{loading ? 'Updating...' : 'Update Password'}</span>
          </button>
        </form>
      )}

      {/* My Reviews List */}
      {activeTab === 'reviews' && (
        <div className="bg-[#121824] p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
            <span>My Submitted Reviews</span>
            <span className="text-xs text-slate-400 font-normal">{myReviews.length} Reviews Total</span>
          </h2>

          {reviewsLoading ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-400 text-xs">Fetching your reviews...</p>
            </div>
          ) : myReviews.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              You haven't written any movie reviews yet.
            </div>
          ) : (
            <div className="space-y-4">
              {myReviews.map((rev) => (
                <div key={rev.id} className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Movie #{rev.movieId}</span>
                    <div className="flex items-center space-x-1 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-extrabold text-amber-400">{rev.rating}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300">"{rev.comment}"</p>
                  <p className="text-[10px] text-slate-500">{new Date(rev.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
