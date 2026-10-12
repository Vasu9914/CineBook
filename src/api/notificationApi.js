import { notificationClient } from './axiosInstances';

export const notificationApi = {
  getUserNotifications: async (userId = 1, page = 0, size = 20) => {
    console.log(`📡 [Notification API] GET http://localhost:8085/api/notifications/me?userId=${userId}&page=${page}&size=${size}`);
    const res = await notificationClient.get(`/api/notifications/me?userId=${userId}&page=${page}&size=${size}`);
    return res.data;
  },

  markAsRead: async (notificationId) => {
    console.log(`📡 [Notification API] PATCH http://localhost:8085/api/notifications/${notificationId}/read`);
    const res = await notificationClient.patch(`/api/notifications/${notificationId}/read`);
    return res.data;
  },

  markAllAsRead: async (userId = 1) => {
    console.log(`📡 [Notification API] PATCH http://localhost:8085/api/notifications/read-all?userId=${userId}`);
    const res = await notificationClient.patch(`/api/notifications/read-all?userId=${userId}`);
    return res.data;
  }
};
