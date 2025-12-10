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
  TextFields as TextFieldsIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const FontSizeSelector = () => {
  const { currentFontSize, changeFontSize } = useTheme();
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const fontSizes = [
    {
      value: 'small',
      label: t('accessibility.fontSize.small'),
    },
    {
      value: 'medium',
      label: t('accessibility.fontSize.medium'),
    },
    {
      value: 'large',
      label: t('accessibility.fontSize.large'),
    },
  ];

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleFontSizeChange = (fontSize) => {
    changeFontSize(fontSize);
    handleClose();
    
    // Announce font size change to screen readers
    const selectedSize = fontSizes.find(size => size.value === fontSize);
    const announcement = `${t('accessibility.fontSize.current')}: ${selectedSize?.label}`;
    
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
  };

  const currentFontSizeData = fontSizes.find(size => size.value === currentFontSize) || fontSizes[1];

  return (
    <Box>
      <Tooltip title={t('accessibility.fontSize.selector')}>
        <IconButton
          onClick={handleClick}
          size="small"
          aria-controls={open ? 'font-size-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          aria-label={t('accessibility.fontSize.selector')}
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
          <TextFieldsIcon />
        </IconButton>
      </Tooltip>
      
      <Menu
        id="font-size-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'font-size-button',
          role: 'menu',
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1,
            minWidth: 160,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1,
            },
          },
        }}
      >
        {fontSizes.map((fontSize) => {
          const isSelected = currentFontSize === fontSize.value;
          
          return (
            <MenuItem
              key={fontSize.value}
              onClick={() => handleFontSizeChange(fontSize.value)}
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
                {isSelected && (
                  <CheckIcon fontSize="small" color="primary" />
                )}
              </ListItemIcon>
              
              <ListItemText>
                <Typography variant="body2" fontWeight={isSelected ? 600 : 400}>
                  {fontSize.label}
                </Typography>
              </ListItemText>
            </MenuItem>
          );
        })}
      </Menu>
      
      {/* Screen reader only current font size indicator */}
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
        {t('accessibility.fontSize.current')}: {currentFontSizeData.label}
      </Box>
    </Box>
  );
};

export default FontSizeSelector;
