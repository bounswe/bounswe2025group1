import React, { useState, useRef } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Avatar,
  Checkbox,
  FormControlLabel,
  useTheme,
  Alert,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContextUtils';
import { useTranslation } from 'react-i18next';

const VerifyOTP = () => {
  const { t } = useTranslation();
  const [otpCode, setOtpCode] = useState('');
  const [trustDevice, setTrustDevice] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const theme = useTheme();

  // Get data passed from login page
  const { username, deviceIdentifier, deviceName } = location.state || {};

  // Redirect to login if no state
  if (!username || !deviceIdentifier) {
    navigate('/login');
    return null;
  }

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (otpCode.length !== 6) {
      toast.error(t('auth.otp.invalidCode'));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/verify-otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          otp_code: otpCode,
          device_identifier: deviceIdentifier,
          trust_device: trustDevice,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || t('auth.otp.verificationFailed'));
        return;
      }

      // Login successful - save user and token via context
      await login(data);

      toast.success(t('auth.otp.verificationSuccess'));
      navigate('/');
    } catch (error) {
      toast.error(t('auth.otp.verificationError'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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
              : '0px 6px 20px rgba(85, 139, 47, 0.2)',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar sx={{
              m: 1,
              bgcolor: theme.palette.custom?.avatar || theme.palette.primary.light,
            }}>
              <SecurityIcon />
            </Avatar>
            <Typography component="h1" variant="h5" fontWeight="bold">
              {t('auth.otp.title')}
            </Typography>
            
            <Alert severity="info" sx={{ mt: 2, width: '100%' }}>
              {t('auth.otp.instructions')}
            </Alert>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {t('auth.otp.device')}: {deviceName}
            </Typography>

            <Box
              component="form"
              onSubmit={handleVerify}
              sx={{ mt: 3, width: '100%' }}
            >
              <TextField
                margin="normal"
                required
                fullWidth
                id="otpCode"
                label={t('auth.otp.codeLabel')}
                name="otpCode"
                autoFocus
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputProps={{
                  maxLength: 6,
                  pattern: '[0-9]*',
                  inputMode: 'numeric',
                }}
                placeholder="000000"
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={trustDevice}
                    onChange={(e) => setTrustDevice(e.target.checked)}
                    color="primary"
                  />
                }
                label={t('auth.otp.trustDevice')}
                sx={{ mt: 1 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading || otpCode.length !== 6}
              >
                {loading ? t('auth.otp.verifying') : t('auth.otp.verify')}
              </Button>

              <Button
                fullWidth
                variant="text"
                onClick={() => navigate('/login')}
                sx={{ mt: 1 }}
              >
                {t('auth.otp.backToLogin')}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default VerifyOTP;
