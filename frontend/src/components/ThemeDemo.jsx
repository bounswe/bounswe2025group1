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

const ThemeDemo = () => {
  const theme = useTheme();
  const { currentTheme } = useAppTheme();

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom color="primary">
        Theme Demo - {currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1)} Mode
      </Typography>
      
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Colors & Typography
            </Typography>
            <Typography variant="body1" color="text.primary" gutterBottom>
              Primary text color
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Secondary text color
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
              <Chip label="Primary" color="primary" />
              <Chip label="Secondary" color="secondary" />
              <Chip label="Success" color="success" />
              <Chip label="Error" color="error" />
            </Box>
          </CardContent>
        </Card>

        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Form Elements
            </Typography>
            <TextField
              fullWidth
              label="Sample Input"
              variant="outlined"
              margin="normal"
              defaultValue="Theme-aware input"
            />
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button variant="contained" color="primary">
                Primary Button
              </Button>
              <Button variant="outlined" color="secondary">
                Secondary
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Background Colors
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'background.default', 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1 
              }}>
                Background Default
              </Box>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'background.paper', 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1 
              }}>
                Background Paper
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Theme Information
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Current Theme:</strong> {currentTheme}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Mode:</strong> {theme.palette.mode}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Primary Color:</strong> {theme.palette.primary.main}
            </Typography>
            <Typography variant="body2">
              <strong>Background:</strong> {theme.palette.background.default}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default ThemeDemo;
