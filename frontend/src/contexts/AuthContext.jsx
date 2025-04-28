import { useState, useEffect } from 'react';
import AuthContext from './AuthContextUtils';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      setCurrentUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setLoading(false);
  }, []);


  const login = (userData, jwtToken) => {
    setCurrentUser(userData);
    setToken(jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', jwtToken);
    return true;
  };


  const register = (userData, jwtToken) => {
    setCurrentUser(userData);
    setToken(jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', jwtToken);
    return true;
  };


  const logout = async () => {
    try {
      const token = localStorage.getItem('token'); 
  
      const response = await fetch(`${import.meta.env.VITE_API_URL}/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        }
      });
  
      if (!response.ok) {
        throw new Error('Logout failed');
      }
  
      localStorage.removeItem('token'); // clear token
      setCurrentUser(null);
      setToken(null);
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  };
  
  const value = {
    currentUser,
    token,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
