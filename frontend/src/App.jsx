import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import './App.css';
import { useTranslation } from 'react-i18next';

// Initialize i18n
import './i18n/config';

// Helper to check if current language is RTL
const isRTLLanguage = (lang) => {
  const RTL_LANGUAGES = ['ar', 'fa', 'ur'];
  return RTL_LANGUAGES.includes(lang);
};

// Components
import Navbar from './components/Navbar';
import ChatWidget from './components/ChatWidget';
// Pages
import Home from './pages/home/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import GardenList from './pages/garden/GardenList';
import GardenDetail from './pages/garden/GardenDetail';
import ForumList from './pages/forum/ForumList';
import ForumPost from './pages/forum/ForumPost';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Profile from './pages/profile/Profile';
import ModerationDashboard from './pages/moderation/ModerationDashboard';
import InfohubHome from './pages/infohub/InfohubHome';
import InfohubDetail from './pages/infohub/InfohubDetail';
import PlantList from './pages/infohub/PlantList';
import PlantDetail from './pages/infohub/PlantDetail';
import SoilTypes from './pages/infohub/SoilTypes';
import ToolGuide from './pages/infohub/ToolGuide';
import { ToastContainer } from 'react-toastify';
import Tasks from './pages/task/Tasks';
import 'react-toastify/dist/ReactToastify.css';

// Context providers
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

function AppContent() {
  const { currentTheme } = useTheme();
  const { i18n } = useTranslation();

  const getToastTheme = () => {
    if (currentTheme === 'dark') return 'dark';
    if (currentTheme === 'highContrast') return 'light';
    return 'light';
  };

  const isRTL = isRTLLanguage(i18n.language);

  return (
    <>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100vh',
              width: '100%',
              maxWidth: '100%',
              overflow: 'hidden',
            }}
          >
            <Navbar />
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
                alignItems: 'stretch',
              }}
            >
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/register" element={<Register />} />
                <Route path="/gardens" element={<GardenList />} />
                <Route path="/gardens/:gardenId" element={<GardenDetail />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/forum" element={<ForumList />} />
                <Route path="/forum/:postId" element={<ForumPost />} />
                <Route path="/infohub" element={<InfohubHome />} />
                <Route path="/infohub/plants" element={<PlantList />} />
                <Route path="/infohub/plants/:plantId" element={<PlantDetail />} />
                <Route path="/infohub/soil-types" element={<SoilTypes />} />
                <Route path="/infohub/tool-guide" element={<ToolGuide />} />
                <Route path="/infohub/:categoryId" element={<InfohubDetail />} />
                <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                <Route path="/auth/reset-password" element={<ResetPassword />} />
                <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:userId" element={<Profile />} />
                <Route path="/moderation" element={<ModerationDashboard />} />
                {/* Additional routes will be implemented later */}
                <Route path="*" element={<Home />} />
              </Routes>
            </Box>

            {/* Chat Widget - appears on all pages when user is logged in */}
            <ChatWidget />

            <Box
              component="footer"
              sx={{
                py: 3,
                px: 2,
                mt: 'auto',
                backgroundColor: 'background.paper',
                textAlign: 'center',
                width: '100%',
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ color: 'text.secondary' }}>
                © {new Date().getFullYear()} Community Garden Planner
              </Box>
            </Box>
          </Box>
        </Router>
      </AuthProvider>
    </>
  );
}

function App() {
  return (
    <>
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
        theme="colored"
        toastClassName="custom-toast"
        bodyClassName="custom-toast-body"
      />
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </>
  );
}

export default App;
