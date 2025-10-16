import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Avatar,
  InputAdornment,
  Link,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockResetIcon from '@mui/icons-material/LockReset';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/forgot-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const resData = await response.json();
        toast.error(resData.detail || 'Failed to send reset link.');
        setError(resData.detail || 'Failed to send reset link.');
        return;
      }

      setSubmitted(true);
      toast.info('Reset link has been sent if such an email exists.', {
        position: 'top-right',
      });
    } catch (err) {
      toast.error(err.message, { position: 'top-right' });
      setError(err.message);
      console.error('Error during password reset request:', err);
      return;
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
      <Box>
        <Paper
          elevation={4}
          sx={{
            p: 4,
            borderRadius: 3,
            backgroundColor: '#ffffffee',
            boxShadow: '0px 6px 20px rgba(85, 139, 47, 0.2)',
          }}
        >
          <ToastContainer />
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: '#c9dbb6' }}>🌾</Avatar>
            <Typography component="h1" variant="h5" fontWeight="bold">
              Forgot your password?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
              Enter your email and we'll send you a link to reset your password if it exists.
            </Typography>
            {error && (
              <Typography color="error" role="alert" data-testid="error-message" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}
            {submitted ? (
              <Typography sx={{ mt: 3 }} color="success.main">
                Please check your email.
              </Typography>
            ) : (
              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
                <TextField
                  required
                  fullWidth
                  label="Email Address"
                  type="email"
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
                  }}
                  startIcon={<LockResetIcon />}
                >
                  Send Reset Link
                </Button>
              </Box>
            )}
            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="outlined"
                href="/auth/login"
                sx={{
                  textTransform: 'none',
                  borderColor: '#8bc34a',
                  marginTop: 3,
                  color: '#558b2f',
                  '&:hover': {
                    backgroundColor: '#f1f8e9',
                    borderColor: '#558b2f',
                  },
                }}
              >
                ← Back to Login
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPassword;
