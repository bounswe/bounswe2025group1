import { useState, useEffect } from 'react';
import AuthContext from './AuthContextUtils';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTranslation } from 'react-i18next';

export const AuthProvider = ({ children }) => {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspensionInfo, setSuspensionInfo] = useState(null);

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
                }
              } catch (error) {
                console.error('Profile fetch error on init:', error);
              }
            } else {
              // Fallback to stored user data
              setUser(parsedUser);
              setToken(storedToken);
            }

            // Check suspension status
            try {
              const suspensionResponse = await fetch(`${import.meta.env.VITE_API_URL}/suspension-status/`, {
                headers: {
                  'Authorization': `Token ${storedToken}`,
                },
              });

              if (suspensionResponse.ok) {
                const suspensionData = await suspensionResponse.json();
                setIsSuspended(suspensionData.is_suspended);
                if (suspensionData.is_suspended) {
                  setSuspensionInfo(suspensionData);
                }
              }
            } catch (error) {
              console.error('Suspension status check failed:', error);
            }
          } else if (response.status === 403) {
            // Check if user is suspended
            const errorData = await response.json();
            if (errorData.error === 'suspended') {
              setIsSuspended(true);
              setSuspensionInfo(errorData);
              setUser(JSON.parse(storedUser));
              setToken(storedToken);
            } else {
              // Token is invalid, clear stored data
              localStorage.removeItem('user');
              localStorage.removeItem('token');
              console.log('Invalid token detected, cleared stored authentication');
            }
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

  const fetchAndSetUserData = async (data) => {
    // Check if user is suspended from login response
    if (data.is_suspended) {
      setIsSuspended(true);
      setSuspensionInfo({
        is_suspended: true,
        suspension_reason: data.suspension_reason,
        suspended_until: data.suspended_until,
      });
    } else {
      setIsSuspended(false);
      setSuspensionInfo(null);
    }

    // If data doesn't include profile, fetch it
    if (!data.profile) {
      try {
        const profileResponse = await fetch(`${import.meta.env.VITE_API_URL}/profile/`, {
          headers: {
            'Authorization': `Token ${data.token}`,
          },
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();

          // Merge data with profile data
          const completeUserData = {
            ...data,
            ...profileData
          };

          console.log("Complete user data:", completeUserData);

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

  const login = async (data) => {
    return await fetchAndSetUserData(data);
  };

  const register = async (data) => {
    return await fetchAndSetUserData(data);
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
        toast.error(t('auth.logoutFailed'));
        return false;
      }

      localStorage.removeItem('token'); // clear token
      localStorage.removeItem('user'); // clear user
      setUser(null);
      setToken(null);
      setIsSuspended(false);
      setSuspensionInfo(null);
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
    isSuspended,
    suspensionInfo,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export default AuthProvider;
