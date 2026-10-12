import React, { useState, useEffect } from 'react';
import { reviewApi } from '../api/reviewApi';
import { useAuthStore } from '../store/useAuthStore';
import { Star, MessageSquare, Edit2, Trash2, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import { toast } from 'react-toastify';

export const MovieReviewsSection = ({ movieId }) => {
  const { user, isAuthenticated } = useAuthStore();

  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ averageRating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(true);

  // Form states
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);

  const fetchReviewsAndSummary = async () => {
    setLoading(true);
    try {
      const summaryData = await reviewApi.getReviewSummary(movieId);
      setSummary(summaryData);

      const reviewsData = await reviewApi.getMovieReviews(movieId);
      const list = reviewsData.content || reviewsData || [];
      setReviews(list);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (movieId) {
      fetchReviewsAndSummary();
    }
  }, [movieId]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Please enter a review comment');
      return;
    }

    setSubmitting(true);
    try {
      if (editingReviewId) {
        await reviewApi.updateReview(movieId, editingReviewId, { rating, comment });
        toast.success('Review updated successfully!');
        setEditingReviewId(null);
      } else {
        await reviewApi.createReview(movieId, { rating, comment });
        toast.success('Review published successfully!');
      }

      setComment('');
      setRating(5);
      fetchReviewsAndSummary();
    } catch (err) {
      if (err.status === 409) {
        toast.warning('You have already reviewed this movie');
      } else if (err.status === 403) {
        toast.error('You must have a valid confirmed booking for this movie to write a review');
      } else {
        toast.error(err.message || 'Failed to submit review');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (review) => {
    setEditingReviewId(review.id);
    setRating(review.rating);
    setComment(review.comment);
    // Scroll to review form
    window.scrollTo({ top: document.getElementById('review-form-section')?.offsetTop - 100, behavior: 'smooth' });
  };

  const handleDeleteClick = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;

    try {
      await reviewApi.deleteReview(movieId, reviewId);
      toast.success('Review deleted.');
      fetchReviewsAndSummary();
    } catch (err) {
      toast.error(err.message || 'Failed to delete review');
    }
  };

  const cancelEdit = () => {
    setEditingReviewId(null);
    setComment('');
    setRating(5);
  };

  return (
    <div className="space-y-8 pt-8 border-t border-slate-800 text-slate-100">
      
      {/* Header & Rating Summary Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#121824] p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center">
            <MessageSquare className="w-6 h-6 text-red-500 mr-2.5" /> Ratings & User Reviews
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real feedback from verified moviegoers who booked tickets
          </p>
        </div>

        {/* Rating Score Card */}
        <div className="flex items-center space-x-4 bg-slate-900/80 px-5 py-3 rounded-2xl border border-slate-800 shrink-0">
          <div className="text-center">
            <div className="text-3xl font-extrabold text-white flex items-center justify-center">
              <span>{summary && summary.totalReviews > 0 ? Number(summary.averageRating).toFixed(1) : '—'}</span>
              <Star className="w-5 h-5 text-amber-400 fill-amber-400 ml-1.5" />
            </div>
            <span className="text-[11px] text-slate-400 block font-medium">Average Rating</span>
          </div>

          <div className="h-10 w-[1px] bg-slate-800"></div>

          <div className="text-center">
            <div className="text-2xl font-bold text-slate-200">
              {summary?.totalReviews || 0}
            </div>
            <span className="text-[11px] text-slate-400 block font-medium">Total Reviews</span>
          </div>
        </div>
      </div>

      {/* Write / Edit Review Form */}
      <div id="review-form-section" className="bg-[#121824] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h3 className="text-base font-bold text-white flex items-center">
            {editingReviewId ? 'Edit Your Review' : 'Write a Review'}
          </h3>
          {editingReviewId && (
            <button
              onClick={cancelEdit}
              className="text-xs text-red-400 hover:underline"
            >
              Cancel Edit
            </button>
          )}
        </div>

        {isAuthenticated ? (
          <form onSubmit={handleSubmitReview} className="space-y-4">
            
            {/* Interactive Star Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Your Rating (1 to 5 Stars)
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const active = starVal <= (hoverRating || rating);
                  return (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => setRating(starVal)}
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 focus:outline-none transition-transform hover:scale-125"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          active
                            ? 'text-amber-400 fill-amber-400 shadow-amber-500/50'
                            : 'text-slate-600'
                        } transition-colors`}
                      />
                    </button>
                  );
                })}
                <span className="text-xs font-bold text-amber-400 ml-2">
                  {hoverRating || rating} / 5 Stars
                </span>
              </div>
            </div>

            {/* Comment Area */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                Your Review
              </label>
              <textarea
                rows={3}
                required
                placeholder="Share your thoughts about the performance, visuals, or story..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl p-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-900/40 flex items-center space-x-2 transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{editingReviewId ? 'Update Review' : 'Post Review'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 text-center space-y-2">
            <p className="text-xs text-slate-400">
              Please sign in to share your review and rating for this movie.
            </p>
          </div>
        )}
      </div>

      {/* Reviews Feed List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-400 text-xs">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-[#121824] p-8 rounded-3xl border border-slate-800 text-center text-slate-400 text-xs">
            No reviews yet. Be the first to share your experience!
          </div>
        ) : (
          reviews.map((rev) => {
            const isMyReview = isAuthenticated && user?.id && String(rev.userId) === String(user.id);

            return (
              <div
                key={rev.id}
                className="bg-[#121824] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-3 hover:border-slate-700/80 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-r from-red-600 to-amber-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {rev.userName ? rev.userName[0].toUpperCase() : 'U'}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-white">
                          {rev.userName || `User #${rev.userId}`}
                        </span>
                        {isMyReview && (
                          <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {formatDate(rev.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center space-x-1 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-extrabold text-amber-400">{rev.rating}</span>
                  </div>
                </div>

                {/* Comment */}
                <p className="text-xs text-slate-300 leading-relaxed pl-1">
                  "{rev.comment}"
                </p>

                {/* Edit / Delete Buttons for Owner */}
                {isMyReview && (
                  <div className="pt-2 border-t border-slate-800/60 flex justify-end space-x-3 text-xs">
                    <button
                      onClick={() => handleEditClick(rev)}
                      className="text-slate-400 hover:text-white flex items-center space-x-1 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteClick(rev.id)}
                      className="text-red-400 hover:text-red-300 flex items-center space-x-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
