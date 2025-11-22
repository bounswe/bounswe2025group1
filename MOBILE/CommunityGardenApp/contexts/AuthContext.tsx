import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../constants/Config';
import { registerDeviceForPushNotifications } from '../utils/pushNotifications';

interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      const storedToken = await AsyncStorage.getItem('token');

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
        axios.defaults.headers.common['Authorization'] = `Token ${storedToken}`;
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (token: string) => {
    try {
      const response = await axios.get(`${API_URL}/profile/`, {
        headers: { Authorization: `Token ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/login/`, {
        username,
        password,
      });

      const { token: newToken, user_id, username: responseUsername } = response.data;

      // Fetch profile to get role and other user data
      const profile = await fetchUserProfile(newToken);

      const userData = {
        id: user_id,
        username: responseUsername,
        email: profile?.email || '',
        firstName: profile?.first_name,
        lastName: profile?.last_name,
        role: profile?.role,
      };

      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      setToken(newToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Token ${newToken}`;

      // Register device for push notifications
      registerDeviceForPushNotifications(newToken).catch(err => {
        console.warn('Failed to register for push notifications:', err);
      });
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw error;
    }
  };
  const register = async (userData: any) => {
    try {
      // Step 1: Register the user
      const response = await axios.post(`${API_URL}/register/`, userData);
      const { token: newToken } = response.data;

      // Step 2: Fetch profile to get role and other user data
      const profile = await fetchUserProfile(newToken);

      // Step 3: Store token and user
      const user = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        role: profile?.role,
      };

      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      // Step 4: Set context and headers
      setToken(newToken);
      setUser(user);
      axios.defaults.headers.common['Authorization'] = `Token ${newToken}`;

      // Register device for push notifications
      registerDeviceForPushNotifications(newToken).catch(err => {
        console.warn('Failed to register for push notifications:', err);
      });

      // ✅ Step 5: Ensure profile exists
      try {
        await axios.put(`${API_URL}/profile/`, {
          location: userData.location || '',
          profile_picture: null
        }, {
          headers: { Authorization: `Token ${newToken}` }
        });
      } catch (error) {
        if (error.response?.status === 404) {
          // Profile not created by backend – log this clearly
          console.warn('Profile update failed: no profile found. Consider creating it explicitly if backend allows POST.');
        } else {
          throw error;  // rethrow other unexpected errors
        }
      }

    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await axios.post(`${API_URL}/logout/`, {}, {
          headers: { Authorization: `Token ${token}` }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setToken(null);
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 