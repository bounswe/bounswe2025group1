import React from 'react';
import { useState, useEffect } from 'react';
import {
  Container, Box, Typography, TextField, Button, Paper, Avatar, InputAdornment, Link, List, ListItem, ListItemIcon, ListItemText
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isLongEnough = password.length >= 8;
  const allValid = hasUpper && hasLower && hasNumber && hasSpecial && isLongEnough;

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing token.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      toast.error('Reset token is missing.', { position: 'top-right' });
      return setError('Reset token is missing.');
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.', { position: 'top-right' });
      return setError('Passwords do not match.');
    }

    if (!allValid) {
      toast.error('Password does not meet all requirements.', { position: 'top-right' });
      return setError('Password does not meet all requirements.');
    }

    try {
      const response = await fetch('/api/reset-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.detail || 'Failed to reset password.');
      }

      toast.success('Password reset successfully!', { position: 'top-right' });
      setSubmitted(true);
      setTimeout(() => navigate('/auth/login'), 2000);
    } catch (err) {
      toast.error(err.message, { position: 'top-right' });
      setError(err.message);
    }
  };

  const renderRequirement = (label, met) => (
    <ListItem dense sx={{ color: met ? 'success.main' : 'text.secondary' }}>
      <ListItemIcon sx={{ minWidth: 30 }}>
        {met ? <CheckCircleIcon fontSize="small" /> : <RadioButtonUncheckedIcon fontSize="small" />}
      </ListItemIcon>
      <ListItemText primary={label} />
    </ListItem>
  );

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
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar sx={{ m: 1, bgcolor: '#c9dbb6' }}>🌼</Avatar>
            <Typography component="h1" variant="h5" fontWeight="bold">
              Reset Your Password
            </Typography>
            {error && (
              <Typography color="error" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}
            {submitted ? (
              <Typography sx={{ mt: 3 }} color="success.main">
                Password reset. Redirecting to login...
              </Typography>
            ) : (
              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="New Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <List dense sx={{ pl: 1, mb: 2 }}>
                  {renderRequirement('At least 8 characters', isLongEnough)}
                  {renderRequirement('At least one uppercase letter', hasUpper)}
                  {renderRequirement('At least one lowercase letter', hasLower)}
                  {renderRequirement('At least one number', hasNumber)}
                  {renderRequirement('At least one special character (!@#$%)', hasSpecial)}
                </List>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  startIcon={<LockResetIcon />}
                  disabled={!allValid}
                  sx={{
                    mt: 1,
                    background: 'linear-gradient(90deg, #8bc34a 0%, #558b2f 100%)',
                    color: '#fff',
                    '&:hover': {
                      background: 'linear-gradient(90deg, #7cb342 0%, #33691e 100%)',
                    },
                    '&.Mui-disabled': {
                      background: '#cfd8dc', // optional gray disabled state
                      color: '#666',
                    }
                  }}
                >
                  Reset Password
                </Button>

              </Box>
            )}
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Back to{' '}
                <Link href="/auth/login" underline="hover" color="primary">
                  Login
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ResetPassword;
