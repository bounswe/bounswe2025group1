// Login.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Paper,
  Avatar,
  InputAdornment,
  useTheme,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../contexts/AuthContextUtils';
import { createFormKeyboardHandler, trapFocus } from '../../utils/keyboardNavigation';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const theme = useTheme();
  const formRef = useRef(null);
  const focusableElementsRef = useRef([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      // Check if OTP is required (new device)
      if (response.status === 202 && data.otp_required) {
        toast.info(t('auth.login.otpRequired'), {
          position: 'top-right',
        });
        
        // Navigate to OTP verification with device info
        navigate('/auth/verify-otp', {
          state: {
            username,
            deviceIdentifier: data.device_identifier,
            deviceName: data.device_name,
          },
        });
        return;
      }

      if (!response.ok) {
        toast.error(t('auth.login.loginFailed'));
        return;
      }

      // Save user and token via context (now async)
      await login(data);

      toast.success(t('auth.login.welcomeBack'), {
        position: 'top-right',
      });

      navigate('/');
    } catch (error) {
      toast.error(t('auth.login.failedToLogin'), {
        position: 'top-right',
      });
      console.error(error);
      return;
    }
  };

  // Create keyboard handler for the form
  const formKeyboardHandler = (e) => {
    // Don't handle Enter key on links - let them handle their own navigation
    if (e.target.tagName === 'A' || e.target.getAttribute('role') === 'link') {
      return;
    }
    // Use the default form keyboard handler for other elements
    createFormKeyboardHandler(handleSubmit, () => navigate('/'))(e);
  };

  // Set up focus trap when component mounts
  useEffect(() => {
    if (formRef.current) {
      // Get all focusable elements within the form
      const focusableElements = formRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusableElementsRef.current = Array.from(focusableElements);

      // Focus the first element
      if (focusableElementsRef.current.length > 0) {
        focusableElementsRef.current[0].focus();
      }

      // Set up focus trap
      const cleanup = trapFocus(formRef.current, focusableElementsRef.current);
      return cleanup;
    }
  }, []);

  return (
    <Container
      component="main"
      maxWidth="sm"
      sx={{
        backgroundColor: theme.palette.custom?.loginBg || theme.palette.background.default,
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box sx={{ mt: -10 }}>
        <Paper
          elevation={4}
          sx={{
            p: 4,
            borderRadius: 3,
            backgroundColor: theme.palette.custom?.loginPaper || theme.palette.background.paper,
            boxShadow: theme.palette.mode === 'dark'
              ? '0px 6px 20px rgba(35, 134, 54, 0.3)'
              : theme.palette.mode === 'light'
              ? '0px 6px 20px rgba(85, 139, 47, 0.2)'
              : '0px 6px 20px rgba(0, 0, 0, 0.5)',
            border: theme.palette.mode === 'light' && theme.palette.custom?.loginPaper === '#ffffff'
              ? '2px solid #000000'
              : 'none',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar sx={{
              m: 1,
              bgcolor: theme.palette.custom?.avatar || theme.palette.primary.light,
              color: theme.palette.mode === 'dark' ? '#ffffff' : 'inherit',
            }}>🌿</Avatar>
            <Typography component="h1" variant="h5" fontWeight="bold">
              {t('auth.login.title')}
            </Typography>
            <Box
              ref={formRef}
              component="form"
              onSubmit={handleSubmit}
              onKeyDown={formKeyboardHandler}
              sx={{ mt: 1, width: '100%' }}
              role="form"
              aria-label="Login form"
            >
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                data-testid="username"
                label={t('auth.login.username')}
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
                aria-label={t('auth.login.username')}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label={t('auth.login.password')}
                type="password"
                id="password"
                data-testid="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon />
                    </InputAdornment>
                  ),
                }}

                aria-label={t('auth.login.password')}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 2,
                  background: theme.palette.custom?.buttonGradient || theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  border: theme.palette.mode === 'light' && theme.palette.custom?.loginPaper === '#ffffff'
                    ? '2px solid #000000'
                    : 'none',
                  '&:hover': {
                    background: theme.palette.custom?.buttonGradientHover || theme.palette.primary.dark,
                  },
                  '&:focus': {
                    outline: theme.palette.mode === 'light' && theme.palette.custom?.loginPaper === '#ffffff'
                      ? '3px solid #ffff00'
                      : `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: '2px',
                  },
                }}
                aria-label={t('auth.login.signInButton')}
              >
                {t('auth.login.signInButton')}
              </Button>
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Link
                  href="/auth/forgot-password"
                  variant="body2"
                  underline="hover"
                  color="text.secondary"
                  sx={{
                    display: 'block',
                    mb: 1,
                    '&:focus': {
                      outline: theme.palette.mode === 'light' && theme.palette.custom?.loginPaper === '#ffffff'
                        ? '3px solid #ffff00'
                        : `2px solid ${theme.palette.primary.main}`,
                      outlineOffset: '2px',
                    },
                  }}
                  tabIndex={0}
                  role="link"
                  aria-label="Reset your password"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate('/auth/forgot-password');
                    }
                  }}
                >
                  {t('auth.login.forgotPassword')}
                </Link>
                <Typography variant="body2" color="text.secondary">
                  {t('auth.login.noAccount')}{' '}
                  <Link
                    href="/auth/register"
                    underline="hover"
                    color="primary"
                    sx={{
                      '&:focus': {
                        outline: theme.palette.mode === 'light' && theme.palette.custom?.loginPaper === '#ffffff'
                          ? '3px solid #ffff00'
                          : `2px solid ${theme.palette.primary.main}`,
                        outlineOffset: '2px',
                      },
                    }}
                    tabIndex={0}
                    role="link"
                    aria-label="Create a new account"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate('/auth/register');
                      }
                    }}
                  >
                    {t('auth.login.signUpLink')}
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
