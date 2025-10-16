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
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../contexts/AuthContextUtils';
import { createFormKeyboardHandler, trapFocus } from '../../utils/keyboardNavigation';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
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

      if (!response.ok) {
        toast.error('Login failed');
        return;
      }

      const data = await response.json();

      // Save user and token via context
      login(data);

      toast.success('Welcome back to the garden!', {
        position: 'top-right',
        theme: 'colored',
      });

      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      toast.error('Failed to log in. Please check your credentials.', {
        position: 'top-right',
        theme: 'colored',
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
        backgroundColor: '#f1f8e9',
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ToastContainer />
      <Box sx={{ mt: -10 }}>
        <Paper
          elevation={4}
          sx={{
            p: 4,
            borderRadius: 3,
            backgroundColor: '#ffffffee',
            boxShadow: '0px 6px 20px rgba(85, 139, 47, 0.2)',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar sx={{ m: 1, bgcolor: '#c9dbb6' }}>🌿</Avatar>
            <Typography component="h1" variant="h5" fontWeight="bold">
              Sign in to Garden Planner
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
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
                aria-label="Username"
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
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

                aria-label="Password"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 2,
                  background: 'linear-gradient(90deg, #8bc34a 0%, #558b2f 100%)',
                  color: '#fff',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #7cb342 0%, #33691e 100%)',
                  },
                  '&:focus': {
                    outline: '2px solid #558b2f',
                    outlineOffset: '2px',
                  },
                }}
                aria-label="Sign in to your account"
              >
                Sign In
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
                      outline: '2px solid #558b2f',
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
                  Forgot password?
                </Link>
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?{' '}
                  <Link 
                    href="/auth/register" 
                    underline="hover" 
                    color="primary"
                    sx={{
                      '&:focus': {
                        outline: '2px solid #558b2f',
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
                    Sign up
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
