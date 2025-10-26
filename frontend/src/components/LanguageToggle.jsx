import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Box,
  Typography,
} from '@mui/material';
import {
  Language as LanguageIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const LanguageToggle = () => {
  const { i18n, t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const languages = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇺🇸',
    },
    {
      code: 'tr',
      name: 'Turkish',
      nativeName: 'Türkçe',
      flag: '🇹🇷',
    },
    {
      code: 'ar',
      name: 'Arabic',
      nativeName: 'العربية',
      flag: '🇸🇦',
    },
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = async (languageCode) => {
    try {
      await i18n.changeLanguage(languageCode);
      handleClose();
      
      // Announce language change to screen readers
      const announcement = t('language.currentLanguage', { 
        language: languages.find(lang => lang.code === languageCode)?.nativeName 
      });
      
      // Create temporary live region for announcement
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.textContent = announcement;
      document.body.appendChild(liveRegion);
      
      setTimeout(() => {
        document.body.removeChild(liveRegion);
      }, 1000);
      
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  return (
    <Box>
      <Tooltip title={t('language.languageSelector')}>
        <IconButton
          onClick={handleClick}
          size="small"
          aria-controls={open ? 'language-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          aria-label={t('accessibility.toggleLanguage')}
          sx={{
            color: 'inherit',
            '&:focus': {
              outline: (theme) => theme.palette.mode === 'light' && theme.palette.custom?.loginPaper === '#ffffff'
                ? '3px solid #ffff00'
                : `2px solid ${theme.palette.primary.main}`,
              outlineOffset: '2px',
            },
          }}
        >
          <LanguageIcon />
        </IconButton>
      </Tooltip>
      
      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'language-button',
          role: 'menu',
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1,
            minWidth: 180,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1,
            },
          },
        }}
      >
        {languages.map((language) => {
          const isSelected = i18n.language === language.code;
          
          return (
            <MenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              selected={isSelected}
              role="menuitemradio"
              aria-checked={isSelected}
              sx={{
                '&:focus': {
                  outline: (theme) => theme.palette.mode === 'light' && theme.palette.custom?.loginPaper === '#ffffff'
                    ? '3px solid #ffff00'
                    : `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: '-2px',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {isSelected ? (
                  <CheckIcon fontSize="small" color="primary" />
                ) : (
                  <Box sx={{ width: 20, textAlign: 'center' }}>
                    {language.flag}
                  </Box>
                )}
              </ListItemIcon>
              
              <ListItemText>
                <Box>
                  <Typography variant="body2" fontWeight={isSelected ? 600 : 400}>
                    {language.nativeName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {language.name}
                  </Typography>
                </Box>
              </ListItemText>
            </MenuItem>
          );
        })}
      </Menu>
      
      {/* Screen reader only current language indicator */}
      <Box
        component="span"
        sx={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
        aria-live="polite"
        aria-atomic="true"
      >
        {t('language.currentLanguage', { language: currentLanguage.nativeName })}
      </Box>
    </Box>
  );
};

export default LanguageToggle;
