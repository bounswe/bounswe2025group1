import { useState } from 'react';
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
import EmailIcon from '@mui/icons-material/Email';
import LockResetIcon from '@mui/icons-material/LockReset';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    // Placeholder for API call
    try {
      // Simulate success
      setSubmitted(true);
    } catch (err) {
      setError('Failed to send reset link. Try again later.');
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
        justifyContent: 'center'
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
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: '#c9dbb6' }}>
              🌾
            </Avatar>
            <Typography component="h1" variant="h5" fontWeight="bold">
              Forgot your password?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
              Enter your email and we'll send you a link to reset your password if it exists.
            </Typography>
            {error && (
              <Typography color="error" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}
            {submitted ? (
              <Typography sx={{ mt: 3 }} color="success.main">
                🌿 Reset link sent! Please check your email.
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
                    }
                  }}
                  startIcon={<LockResetIcon />}
                >
                  Send Reset Link
                </Button>
              </Box>
            )}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                <Link href="/auth/login" underline="hover" color="primary">
                  Go back to login
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPassword;
