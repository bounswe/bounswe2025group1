import { useState, useEffect } from 'react';
import AuthContext from './AuthContextUtils';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const login = (data) => {
    setUser(data);
    setToken(data.token);
    localStorage.setItem('user', JSON.stringify(data));
    localStorage.setItem('token', data.token);
    return true;
  };

  const register = (data) => {
    setUser(data);
    setToken(data.token);
    localStorage.setItem('user', JSON.stringify(data));
    localStorage.setItem('token', data.token);
    return true;
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${import.meta.env.VITE_API_URL}/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
      });

      if (!response.ok) {
        toast.error('Logout failed');
      }

      localStorage.removeItem('token'); // clear token
      localStorage.removeItem('user'); // clear user
      setUser(null);
      setToken(null);
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export default AuthProvider;
