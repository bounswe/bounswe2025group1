import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Divider,
  Typography,
  Box,
} from '@mui/material';
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Contrast as HighContrastIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';
import { themeNames } from '../themes/themeConfig';

const ThemeToggle = () => {
  const { currentTheme, changeTheme, toggleHighContrast, availableThemes } = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleThemeChange = (themeName) => {
    changeTheme(themeName);
    handleClose();
  };

  const getThemeIcon = (themeName) => {
    switch (themeName) {
      case 'light':
        return <LightModeIcon />;
      case 'dark':
        return <DarkModeIcon />;
      case 'highContrast':
        return <HighContrastIcon />;
      default:
        return <PaletteIcon />;
    }
  };

  const getCurrentThemeIcon = () => {
    return getThemeIcon(currentTheme);
  };

  return (
    <>
      <Tooltip title="Change theme">
        <IconButton
          onClick={handleClick}
          color="inherit"
          aria-label="Change theme"
          aria-haspopup="true"
          aria-expanded={open}
          sx={{
            '&:focus': {
              outline: '2px solid white',
              outlineOffset: '2px',
            },
          }}
        >
          {getCurrentThemeIcon()}
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        sx={{ mt: 1 }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Choose Theme
          </Typography>
        </Box>
        <Divider />
        
        {availableThemes.map((themeName) => (
          <MenuItem
            key={themeName}
            onClick={() => handleThemeChange(themeName)}
            selected={currentTheme === themeName}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              py: 1.5,
              '&:focus': {
                outline: currentTheme === 'highContrast' ? '3px solid #ffff00' : '2px solid #558b2f',
                outlineOffset: '2px',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 'auto' }}>
              {getThemeIcon(themeName)}
            </ListItemIcon>
            <ListItemText primary={themeNames[themeName]} />
          </MenuItem>
        ))}
        
        <Divider />
        
        <MenuItem
          onClick={() => {
            toggleHighContrast();
            handleClose();
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            py: 1.5,
            '&:focus': {
              outline: currentTheme === 'highContrast' ? '3px solid #ffff00' : '2px solid #558b2f',
              outlineOffset: '2px',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 'auto' }}>
            <HighContrastIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Toggle High Contrast" 
            secondary="Quick accessibility toggle"
          />
        </MenuItem>
      </Menu>
    </>
  );
};

export default ThemeToggle;
