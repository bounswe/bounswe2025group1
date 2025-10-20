import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Chip,
  useTheme,
} from '@mui/material';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const ThemeDemo = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { currentTheme } = useAppTheme();

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom color="primary">
        {t('theme.demoTitle', { theme: currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1) })}
      </Typography>
      
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('theme.colorsTypography')}
            </Typography>
            <Typography variant="body1" color="text.primary" gutterBottom>
              {t('theme.primaryTextColor')}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('theme.secondaryTextColor')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
              <Chip label={t('theme.primary')} color="primary" />
              <Chip label={t('theme.secondary')} color="secondary" />
              <Chip label={t('theme.success')} color="success" />
              <Chip label={t('theme.error')} color="error" />
            </Box>
          </CardContent>
        </Card>

        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('theme.formElements')}
            </Typography>
            <TextField
              fullWidth
              label={t('theme.sampleInput')}
              variant="outlined"
              margin="normal"
              defaultValue={t('theme.themeAwareInput')}
            />
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button variant="contained" color="primary">
                {t('theme.primaryButton')}
              </Button>
              <Button variant="outlined" color="secondary">
                {t('theme.secondary')}
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('theme.backgroundColors')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'background.default', 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1 
              }}>
                {t('theme.backgroundDefault')}
              </Box>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'background.paper', 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1 
              }}>
                {t('theme.backgroundPaper')}
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('theme.themeInformation')}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>{t('theme.currentTheme')}:</strong> {currentTheme}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>{t('theme.mode')}:</strong> {theme.palette.mode}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>{t('theme.primaryColor')}:</strong> {theme.palette.primary.main}
            </Typography>
            <Typography variant="body2">
              <strong>{t('theme.background')}:</strong> {theme.palette.background.default}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default ThemeDemo;
