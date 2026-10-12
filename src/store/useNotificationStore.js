import { create } from 'zustand';
import { notificationApi } from '../api/notificationApi';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async (userId = 1) => {
    set({ isLoading: true });
    try {
      const data = await notificationApi.getUserNotifications(userId);
      const rawList = data.content || data || [];
      const list = Array.isArray(rawList)
        ? rawList.map((n) => {
            const isRead = n.status === 'READ' || n.read === true;
            let displayTitle = n.title;
            let displayMessage = n.message;
            let type = n.type || 'INFO';

            if (!displayTitle) {
              if (n.eventId?.includes('payment-success') || n.status === 'DELIVERED' || n.status === 'SENT') {
                displayTitle = 'Payment Confirmed & Tickets Sent';
                displayMessage = displayMessage || `Your booking ${n.bookingReference ? `(${n.bookingReference})` : ''} has been confirmed. Confirmation sent via ${n.channel || 'EMAIL'} to ${n.recipient || 'your registered email'}.`;
                type = 'SUCCESS';
              } else if (n.eventId?.includes('booking-cancel')) {
                displayTitle = 'Booking Cancelled';
                displayMessage = displayMessage || `Your booking reservation ${n.bookingReference ? `(${n.bookingReference})` : ''} has been cancelled.`;
                type = 'WARNING';
              } else {
                displayTitle = 'Booking Notification';
                displayMessage = displayMessage || `Notification for booking ref: ${n.bookingReference || n.id}`;
              }
            }

            return {
              ...n,
              read: isRead,
              title: displayTitle,
              message: displayMessage,
              type: type,
              timestamp: n.createdAt || n.sentAt || n.timestamp || new Date().toISOString()
            };
          })
        : [];
      const unread = list.filter((n) => !n.read).length;
      set({ notifications: list, unreadCount: unread, isLoading: false });
    } catch (err) {
      console.warn('Error fetching notifications:', err.message);
      set({ isLoading: false });
    }
  },

  markAsRead: async (notificationId) => {
    try {
      await notificationApi.markAsRead(notificationId);
      const updated = get().notifications.map((n) =>
        String(n.id) === String(notificationId) ? { ...n, read: true } : n
      );
      const unread = updated.filter((n) => !n.read).length;
      set({ notifications: updated, unreadCount: unread });
    } catch (err) {
      console.warn('Error marking notification as read:', err.message);
    }
  },

  markAllAsRead: async (userId = 99) => {
    try {
      await notificationApi.markAllAsRead(userId);
      const updated = get().notifications.map((n) => ({ ...n, read: true }));
      set({ notifications: updated, unreadCount: 0 });
    } catch (err) {
      console.warn('Error marking all notifications as read:', err.message);
    }
  }
}));
