import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Avatar,
  InputAdornment,
  Link
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import LockIcon from '@mui/icons-material/Lock';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing token.');
    }
  }, [token]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      return setError('Reset token is missing.');
    }
    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    try {
      // Replace this with your actual API call
      console.log('Sending new password to backend with token:', token);
      setSubmitted(true);
      setTimeout(() => navigate('/auth/login'), 2000); // Simulate redirect
    } catch (err) {
      setError('Failed to reset password. Please try again.');
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
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar sx={{ m: 1, bgcolor: '#c9dbb6' }}>
              🌼
            </Avatar>
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
                ✅ Password reset! Redirecting to login...
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
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  startIcon={<LockResetIcon />}
                  sx={{
                    mt: 3,
                    background: 'linear-gradient(90deg, #8bc34a 0%, #558b2f 100%)',
                    color: '#fff',
                    '&:hover': {
                      background: 'linear-gradient(90deg, #7cb342 0%, #33691e 100%)',
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
