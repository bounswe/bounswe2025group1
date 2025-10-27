import { createTheme } from '@mui/material/styles';

// Base theme configuration shared across all themes
const baseTheme = {
  typography: {
    fontFamily: "'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    body1: {
      fontWeight: 400,
    },
    body2: {
      fontWeight: 400,
    },
    button: {
      fontWeight: 500,
      letterSpacing: '0.01em',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontSize: '0.9375rem',
          fontWeight: 500,
          padding: '10px 24px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: 16,
          paddingRight: 16,
          '@media (min-width:600px)': {
            paddingLeft: 24,
            paddingRight: 24,
          },
          maxWidth: '100%',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          width: '100%',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
};

// Light theme configuration
export const lightTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'light',
    primary: {
      main: '#2e7d32', 
      light: '#4caf50',
      dark: '#1b5e20',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f9fbf6',
      paper: '#ffffff',
    },
    text: {
      primary: '#213547',
      secondary: '#666666',
    },
    divider: '#e0e0e0',
    action: {
      hover: 'rgba(85, 139, 47, 0.04)',
      selected: 'rgba(85, 139, 47, 0.08)',
    },
    // Custom colors for our app
    custom: {
      loginBg: '#f9fbf6',
      loginPaper: '#ffffffee',
      avatar: '#c9dbb6',
      navbarGradient: 'linear-gradient(to right, #2e7d32, #1b5e20)',
      buttonGradient: 'linear-gradient(90deg, #4caf50 0%, #2e7d32 100%)',
      buttonGradientHover: 'linear-gradient(90deg, #388e3c 0%, #1b5e20 100%)',
    },
  },
});

// Dark theme configuration
export const darkTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: '#4caf50', 
      light: '#81c784',
      dark: '#388e3c',
      contrastText: '#000000',
    },
    secondary: {
      main: '#ffb74d',
      light: '#ffd54f',
      dark: '#ff9800',
      contrastText: '#000000',
    },
    background: {
      default: '#191A19',
      paper: '#161b22',
    },
    text: {
      primary: '#e6edf3',
      secondary: '#b2b9c2',
    },
    divider: '#30363d',
    action: {
      hover: 'rgba(124, 179, 66, 0.08)',
      selected: 'rgba(124, 179, 66, 0.12)',
    },
    // Custom colors for dark mode
    custom: {
      loginBg: '#191A19',
      loginPaper: '#161b22',
      avatar: '#f9fbf6',
      navbarGradient: 'linear-gradient(to right, #4caf50, #388e3c)',
      buttonGradient: 'linear-gradient(90deg, #4caf50 0%, #388e3c 100%)',
      buttonGradientHover: 'linear-gradient(90deg, #66bb6a 0%, #4caf50 100%)',
    },
  },
});

// High contrast theme for accessibility
export const highContrastTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'light',
    primary: {
      main: '#000000',
      light: '#333333',
      dark: '#000000',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ffff00',
      light: '#ffff66',
      dark: '#cccc00',
      contrastText: '#000000',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    text: {
      primary: '#000000',
      secondary: '#000000',
    },
    divider: '#000000',
    action: {
      hover: 'rgba(0, 0, 0, 0.08)',
      selected: 'rgba(0, 0, 0, 0.12)',
    },
    error: {
      main: '#ff0000',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#ff6600',
      contrastText: '#ffffff',
    },
    info: {
      main: '#0066ff',
      contrastText: '#ffffff',
    },
    success: {
      main: '#008800',
      contrastText: '#ffffff',
    },
    // Custom colors for high contrast
    custom: {
      loginBg: '#ffffff',
      loginPaper: '#ffffff',
      avatar: '#000000',
      navbarGradient: 'linear-gradient(to right, #000000, #000000)',
      buttonGradient: 'linear-gradient(90deg, #000000 0%, #000000 100%)',
      buttonGradientHover: 'linear-gradient(90deg, #333333 0%, #333333 100%)',
    },
  },
  components: {
    ...baseTheme.components,
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontSize: '0.9375rem',
          fontWeight: 600,
          padding: '10px 24px',
          border: '2px solid #000000',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
          '&:hover': {
            backgroundColor: '#f0f0f0',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
            transform: 'translateY(-1px)',
          },
          '&:focus': {
            outline: '3px solid #ffff00',
            outlineOffset: '2px',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '& fieldset': {
              borderColor: '#000000',
              borderWidth: '2px',
            },
            '&:hover fieldset': {
              borderColor: '#000000',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#000000',
              borderWidth: '3px',
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '2px solid #000000',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '2px solid #000000',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
  },
});

export const themes = {
  light: lightTheme,
  dark: darkTheme,
  highContrast: highContrastTheme,
};

export const themeNames = {
  light: 'Light Mode',
  dark: 'Dark Mode',
  highContrast: 'High Contrast',
};
