// Login.jsx
import React from 'react';
import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Paper,
  Avatar,
  InputAdornment
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextUtils';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    try {
      const success = login({
        email,
        name: 'Demo User',
        id: '123456'
      });

      if (success) {
        toast.success('🌿 Welcome back to the garden!', {
          position: 'top-right',
          theme: 'colored'
        });
        navigate('/');
      }
    } catch (err) {
      toast.error('❌ Failed to log in. Please check your credentials.', {
        position: 'top-right',
        theme: 'colored'
      });
      console.error(err);
    }
  };

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
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
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
                  }
                }}
              >
                Sign In
              </Button>
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Link href="/auth/forgot-password" variant="body2" underline="hover" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Forgot password?
                </Link>
                <Typography variant="body2" color="text.secondary">
                  Don’t have an account?{' '}
                  <Link href="/auth/register" underline="hover" color="primary">
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