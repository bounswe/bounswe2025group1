import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../contexts/AuthContextUtils';
import { useTranslation } from 'react-i18next';

const Suspended = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  const [suspensionInfo, setSuspensionInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuspensionStatus = async () => {
      if (!token) {
        navigate('/auth/login');
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/suspension-status/`, {
          headers: {
            'Authorization': `Token ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (!data.is_suspended) {
            // User is not suspended, redirect to home
            navigate('/');
            return;
          }
          setSuspensionInfo(data);
        }
      } catch (error) {
        console.error('Failed to fetch suspension status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuspensionStatus();
  }, [token, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('suspended.indefinite', 'Indefinitely');
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <BlockIcon
          sx={{
            fontSize: 80,
            color: 'error.main',
            mb: 2,
          }}
        />

        <Typography variant="h4" component="h1" gutterBottom color="error">
          {t('suspended.title', 'Account Suspended')}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {t('suspended.description', 'Your account has been suspended due to a violation of our community guidelines.')}
        </Typography>

        <Alert severity="warning" sx={{ width: '100%', mb: 3 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            {t('suspended.reason', 'Reason')}:
          </Typography>
          <Typography variant="body2">
            {suspensionInfo?.suspension_reason || t('suspended.noReason', 'No reason provided')}
          </Typography>
        </Alert>

        <Box
          sx={{
            width: '100%',
            p: 2,
            bgcolor: 'background.default',
            borderRadius: 1,
            mb: 3,
          }}
        >
          <Typography variant="subtitle2" color="text.secondary">
            {t('suspended.until', 'Suspended Until')}:
          </Typography>
          <Typography variant="h6" color="text.primary">
            {formatDate(suspensionInfo?.suspended_until)}
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('suspended.contact', 'If you believe this is a mistake, please contact our support team.')}
        </Typography>

        <Button
          variant="contained"
          color="primary"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          fullWidth
        >
          {t('suspended.logout', 'Logout')}
        </Button>
      </Paper>
    </Container>
  );
};

export default Suspended;
