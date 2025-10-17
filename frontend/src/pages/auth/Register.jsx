import React, { useState, useRef, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Link,
  Paper,
  Avatar,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextUtils';
import { toast } from 'react-toastify';
import { createFormKeyboardHandler, trapFocus } from '../../utils/keyboardNavigation';
import LocationPicker from '../../components/LocationPicker';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    username: '',
    agreeTerms: false,
    location: '',
  });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();
  const formRef = useRef(null);
  const focusableElementsRef = useRef([]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const hasUpper = /[A-Z]/.test(formData.password);
  const hasLower = /[a-z]/.test(formData.password);
  const hasNumber = /\d/.test(formData.password);
  const hasSpecial = /[^A-Za-z0-9]/.test(formData.password);
  const isLongEnough = formData.password.length >= 8;
  const passwordsMatch = formData.password === formData.confirmPassword;
  const validEmail = emailRegex.test(formData.email);
  const allValid =
    hasUpper &&
    hasLower &&
    hasNumber &&
    hasSpecial &&
    isLongEnough &&
    passwordsMatch &&
    validEmail &&
    formData.agreeTerms;

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!allValid) {
      toast.error('Please complete all fields correctly.', { position: 'top-right' });
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          password: formData.password,
          location: formData.location || 'Istanbul',
        }),
      });

      if (!response.ok) {
        toast.error('Registration failed');
        setError('Failed to create an account. Please try again.');
        return;
      }

      const data = await response.json();
      register(data);

      toast.success('Welcome to the community!', { position: 'top-right' });
      navigate('/');
    } catch (err) {
      toast.error('Failed to create an account.', { position: 'top-right' });
      console.error(err);
      setError('Failed to create an account. Please try again.');
      return;
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
          <Box
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
          >
            <Avatar sx={{ m: 1, bgcolor: '#c9dbb6' }}>🌱</Avatar>
            <Typography component="h1" variant="h5" fontWeight="bold">
              Join the Garden Community
            </Typography>
            {error && (
              <Typography color="error" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}

            <Box 
              ref={formRef}
              component="form" 
              onSubmit={handleSubmit} 
              onKeyDown={formKeyboardHandler}
              sx={{ mt: 3, width: '100%' }}
              role="form"
              aria-label="Registration form"
            >
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    name="firstName"
                    required
                    fullWidth
                    label="First Name"
                    value={formData.firstName}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon />
                        </InputAdornment>
                      ),
                    }}
                    aria-label="First name"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    name="lastName"
                    required
                    fullWidth
                    label="Last Name"
                    value={formData.lastName}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    name="username"
                    required
                    fullWidth
                    label="Username"
                    value={formData.username}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BadgeIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    name="email"
                    required
                    fullWidth
                    label="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    error={!!formData.email && !validEmail}
                    helperText={!!formData.email && !validEmail ? 'Invalid email format' : ''}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon />
                        </InputAdornment>
                      ),
                    }}
                    aria-label="Email address"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <LocationPicker
                    value={formData.location}
                    onChange={(value) => setFormData({ ...formData, location: value })}
                    label="Location"
                    required
                    height={200}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    name="password"
                    label="Password"
                    type="password"
                    required
                    fullWidth
                    value={formData.password}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon />
                        </InputAdornment>
                      ),
                    }}
                    aria-label="Password"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    name="confirmPassword"
                    label="Confirm Password"
                    type="password"
                    required
                    fullWidth
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={!!formData.confirmPassword && !passwordsMatch}
                    helperText={
                      !!formData.confirmPassword && !passwordsMatch ? 'Passwords do not match' : ''
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon />
                        </InputAdornment>
                      ),
                    }}
                    aria-label="Confirm password"
                  />
                </Grid>
              </Grid>

              <List dense sx={{ pl: 1, pt: 2 }}>
                {renderRequirement('At least 8 characters', isLongEnough)}
                {renderRequirement('At least one uppercase letter', hasUpper)}
                {renderRequirement('At least one lowercase letter', hasLower)}
                {renderRequirement('At least one number', hasNumber)}
                {renderRequirement('At least one special character (!@#$%)', hasSpecial)}
              </List>

              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="agreeTerms"
                      color="primary"
                      checked={formData.agreeTerms}
                      onChange={handleChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setFormData({
                            ...formData,
                            agreeTerms: !formData.agreeTerms,
                          });
                        }
                      }}
                      sx={{
                        '&:focus': {
                          outline: '2px solid #558b2f',
                          outlineOffset: '2px',
                        },
                      }}
                    />
                  }
                  label="I agree to the terms and conditions"
                />
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={!allValid}
                sx={{
                  mt: 3,
                  mb: 2,
                  background: 'linear-gradient(90deg, #8bc34a 0%, #558b2f 100%)',
                  color: '#fff',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #7cb342 0%, #33691e 100%)',
                  },
                  '&.Mui-disabled': {
                    background: '#cfd8dc',
                    color: '#666',
                  },
                  '&:focus': {
                    outline: '2px solid #558b2f',
                    outlineOffset: '2px',
                  },
                }}
                aria-label="Create your account"
              >
                Sign Up
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{' '}
                  <Link 
                    href="/auth/login" 
                    underline="hover" 
                    color="primary"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate('/auth/login');
                      }
                    }}
                    sx={{
                      '&:focus': {
                        outline: '2px solid #558b2f',
                        outlineOffset: '2px',
                      },
                    }}
                    tabIndex={0}
                    role="link"
                    aria-label="Sign in to your account"
                  >
                    Sign in
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

export default Register;
