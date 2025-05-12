import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import './App.css';

// Components
import Navbar from './components/Navbar';
import WeatherWidget from './components/WeatherWidget';

// Pages
import Home from './pages/home/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import GardenList from './pages/garden/GardenList';
import GardenDetail from './pages/garden/GardenDetail';
import ForumList from './pages/forum/ForumList';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Profile from './pages/profile/Profile';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context providers
import { AuthProvider } from './contexts/AuthContext';

// Create theme with custom green palette for our garden app
let theme = createTheme({
  palette: {
    primary: {
      main: '#558b2f',
      light: '#7cb342',
      dark: '#33691e',
    },
    secondary: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    background: {
      default: '#f9fbf6',
    },
  },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
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
});

// Make typography responsive
theme = responsiveFontSizes(theme);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light" // options: 'light', 'dark', 'colored'
        toastClassName="custom-toast"
        bodyClassName="custom-toast-body"
      />

      <CssBaseline />
      <AuthProvider>
        <Router>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
            <Navbar />
            <WeatherWidget position="topRight" />
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                pt: { xs: 1, md: 2 },
                pb: { xs: 2, md: 4 },
                width: '100%',
                maxWidth: '100%',
                overflowX: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch'
              }}
            >
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/register" element={<Register />} />
                <Route path="/gardens" element={<GardenList />} />
                <Route path="/gardens/:gardenId" element={<GardenDetail />} />
                <Route path="/forum" element={<ForumList />} />
                <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                <Route path="/auth/reset-password" element={<ResetPassword />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:userId" element={<Profile />} />
                {/* Additional routes will be implemented later */}
                <Route path="*" element={<Home />} />
              </Routes>
            </Box>
            <Box
              component="footer"
              sx={{
                py: 3,
                px: 2,
                mt: 'auto',
                backgroundColor: '#f5f5f5',
                textAlign: 'center',
                width: '100%'
              }}
            >
              <Box sx={{ color: 'text.secondary' }}>
                © {new Date().getFullYear()} Community Garden Planner
              </Box>
            </Box>
          </Box>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
