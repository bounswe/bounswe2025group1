import { useState, useEffect } from 'react';
import AuthContext from './AuthContextUtils';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateStoredAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      
      if (storedUser && storedToken) {
        try {
          // Validate token with backend
          const response = await fetch(`${import.meta.env.VITE_API_URL}/profile/`, {
            headers: {
              'Authorization': `Token ${storedToken}`,
            },
          });
          
          if (response.ok) {
            // Token is valid, set user and token
            const parsedUser = JSON.parse(storedUser);
            
            // If user doesn't have profile data, fetch it
            if (!parsedUser.profile) {
              try {
                
                const profileResponse = await fetch(`${import.meta.env.VITE_API_URL}/profile/`, {
                  headers: {
                    'Authorization': `Token ${storedToken}`,
                  },
                });
                
                if (profileResponse.ok) {
                  const profileData = await profileResponse.json();
                  
                  // Merge stored user with fresh profile data
                  const completeUserData = {
                    ...parsedUser,
                    ...profileData
                  };
                  
                  setUser(completeUserData);
                  setToken(storedToken);
                  localStorage.setItem('user', JSON.stringify(completeUserData));
                  return;
                }
              } catch (error) {
                console.error('Profile fetch error on init:', error);
              }
            }
            
            // Fallback to stored user data
            setUser(parsedUser);
            setToken(storedToken);
          } else {
            // Token is invalid, clear stored data
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            console.log('Invalid token detected, cleared stored authentication');
          }
        } catch (error) {
          // Network error or invalid token, clear stored data
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          console.log('Authentication validation failed, cleared stored data');
        }
      }
      setLoading(false);
    };
    
    validateStoredAuth();
  }, []);

  const login = async (data) => {
    
    // If login data doesn't include profile, fetch it
    if (!data.profile) {
      try {
        
        const profileResponse = await fetch(`${import.meta.env.VITE_API_URL}/profile/`, {
          headers: {
            'Authorization': `Token ${data.token}`,
          },
        });
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          
          // Merge login data with profile data
          const completeUserData = {
            ...data,
            ...profileData
          };
          
          setUser(completeUserData);
          setToken(data.token);
          localStorage.setItem('user', JSON.stringify(completeUserData));
          localStorage.setItem('token', data.token);
          return true;
        } else {
          console.error('Profile fetch failed:', profileResponse.status, profileResponse.statusText);
        }
      } catch (error) {
        console.error('Profile fetch error:', error);
      }
    }
    
    // Fallback to original data if profile fetch fails
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
        return false;
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

  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
    localStorage.setItem('user', JSON.stringify(updatedUserData));
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export default AuthProvider;
