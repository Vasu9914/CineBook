import { userClient } from './axiosInstances';
import { setToken, setStoredUser, getStoredUser } from '../utils/tokenUtils';

const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const authApi = {
  // 1.1 Register: POST /api/auth/register
  register: async (userData) => {
    console.log('📡 [Auth API] POST http://localhost:8081/api/auth/register', userData);
    const payload = {
      name: userData.name || userData.fullName || 'John Doe',
      email: userData.email,
      password: userData.password,
    };
    const res = await userClient.post('/api/auth/register', payload);
    const user = {
      ...res.data,
      fullName: res.data?.name || res.data?.fullName || payload.name,
      role: 'ADMIN'
    };
    setStoredUser(user);
    return user;
  },

  // 1.2 Login: POST /api/auth/login
  login: async (credentials) => {
    console.log('📡 [Auth API] POST http://localhost:8081/api/auth/login', credentials);
    const payload = {
      email: credentials.email,
      password: credentials.password,
    };
    const res = await userClient.post('/api/auth/login', payload);
    
    const token = typeof res.data === 'string' ? res.data : (res.data?.token || res.data?.jwtToken || res.data?.accessToken);
    const email = res.data?.email || credentials.email;

    let extractedUserId = res.data?.id;
    if (token) {
      setToken(token);
      const decoded = parseJwt(token);
      if (decoded && (decoded.userId || decoded.id)) {
        extractedUserId = decoded.userId || decoded.id;
      }
    }

    let user = {
      id: Number(extractedUserId || 1),
      name: email.split('@')[0],
      fullName: email.split('@')[0],
      email: email,
      role: 'ADMIN'
    };

    setStoredUser(user);

    // Fetch live profile to sync exact database id & name
    try {
      const profile = await userClient.get('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (profile.data && profile.data.id) {
        user = {
          ...user,
          ...profile.data,
          fullName: profile.data.name || user.fullName
        };
        setStoredUser(user);
      }
    } catch (e) {
      console.warn('Profile fetch sync notice:', e.message);
    }

    return { token, user };
  },

  // 1.3 Get Profile: GET /api/users/me
  getCurrentUser: async () => {
    console.log('📡 [Auth API] GET http://localhost:8081/api/users/me');
    const res = await userClient.get('/api/users/me');
    const user = {
      ...res.data,
      fullName: res.data?.name || res.data?.fullName || 'User',
      role: res.data?.role || 'ADMIN'
    };
    setStoredUser(user);
    return user;
  },

  // 1.4 Update Profile: PATCH /api/users/me
  updateProfile: async (data) => {
    console.log('📡 [Auth API] PATCH http://localhost:8081/api/users/me', data);
    const payload = {
      name: data.name || data.fullName
    };
    const res = await userClient.patch('/api/users/me', payload);
    const updatedUser = {
      ...res.data,
      fullName: res.data?.name || payload.name
    };
    setStoredUser(updatedUser);
    return updatedUser;
  },

  // 1.5 Change Password: PATCH /api/users/me/password
  changePassword: async (passData) => {
    console.log('📡 [Auth API] PATCH http://localhost:8081/api/users/me/password');
    const payload = {
      currentPassword: passData.currentPassword || passData.oldPassword,
      newPassword: passData.newPassword,
    };
    const res = await userClient.patch('/api/users/me/password', payload);
    return res.data || { success: true };
  }
};
