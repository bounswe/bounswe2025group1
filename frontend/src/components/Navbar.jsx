import React, { useState, useEffect, useRef } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  Badge,
  Fade,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import HomeIcon from '@mui/icons-material/Home';
import YardIcon from '@mui/icons-material/Yard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ForumIcon from '@mui/icons-material/Forum';
import CloseIcon from '@mui/icons-material/Close';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContextUtils';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createRovingTabindex, createButtonKeyboardHandler, createLinkKeyboardHandler } from '../utils/keyboardNavigation';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';
import { useTheme as useMuiTheme } from '@mui/material/styles';

const pages = [
  { name: 'Home', path: '/', icon: <HomeIcon /> },
  { name: 'Gardens', path: '/gardens', icon: <YardIcon /> },
  { name: 'Tasks', path: '/tasks', icon: <AssignmentIcon /> },
  { name: 'Forum', path: '/forum', icon: <ForumIcon /> },
];

const settings = [
  { name: 'Profile', path: '/profile', icon: <PersonIcon /> },
  // TODO: Implement Settings page
  // { name: 'Settings', path: '/settings', icon: <SettingsIcon /> },
  { name: 'Logout', icon: <LogoutIcon />, action: 'logout' },
];

function Navbar() {
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { currentTheme } = useTheme();
  const muiTheme = useMuiTheme();
  const drawerItemsRef = useRef([]);
  const settingsMenuRef = useRef([]);

  // Track scroll position to add shadow when scrolled
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleMenuAction = (path, action) => {
    handleCloseUserMenu();

    if (action === 'logout') {
      logout();
      toast.success("You've been logged out.", {
        position: 'top-right',
        theme: 'colored',
      });
      setTimeout(() => navigate('/'), 2000);
    } else if (path) {
      navigate(path);
    }
  };

  const toggleDrawer = (open) => (event) => {
    if (event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  // Navigation buttons use normal Tab navigation (no roving tabindex needed)

  // Set up roving tabindex for drawer items
  useEffect(() => {
    if (drawerOpen && drawerItemsRef.current.length > 0) {
      const rovingTabindex = createRovingTabindex(drawerItemsRef.current, 0);
      return () => rovingTabindex.updateTabindex();
    }
  }, [drawerOpen, drawerItemsRef.current.length]);

  // Set up roving tabindex for settings menu
  useEffect(() => {
    if (Boolean(anchorElUser) && settingsMenuRef.current.length > 0) {
      const rovingTabindex = createRovingTabindex(settingsMenuRef.current, 0);
      return () => rovingTabindex.updateTabindex();
    }
  }, [Boolean(anchorElUser), settingsMenuRef.current.length]);

  const isActivePath = (path) => {
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: muiTheme.palette.primary.main,
        width: '100%',
        left: 0,
        right: 0,
        transition: 'box-shadow 0.3s ease',
        boxShadow: scrolled ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none',
        backgroundImage: muiTheme.palette.custom?.navbarGradient || `linear-gradient(to right, ${muiTheme.palette.primary.main}, ${muiTheme.palette.primary.dark})`,
        borderRadius: '0px',
      }}
    >
      <Container maxWidth={false} disableGutters sx={{ width: '100%' }}>
        <Toolbar sx={{ px: { xs: 2, sm: 4 } }}>
          {/* Logo for large screens */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
            <Typography
              variant="h6"
              noWrap
              component="a"
              href="/"
              sx={{
                mr: 2,
                fontFamily: 'monospace',
                fontWeight: 700,
                color: 'inherit',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                '&:hover': {
                  color: 'inherit',
                },
              }}
            >
              <YardIcon sx={{ mr: 1, fontSize: 28, color: '#ffffff' }} />
              <span style={{ borderBottom: '2px solid rgba(255,255,255,0.7)' }}>
                Community Garden Planner
              </span>
            </Typography>
          </Box>

          {/* Mobile menu toggle */}
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={toggleDrawer(true)}
            onKeyDown={createButtonKeyboardHandler(() => toggleDrawer(true)())}
            sx={{ 
              mr: 2, 
              display: { md: 'none' },
              '&:focus': {
                outline: '2px solid white',
                outlineOffset: '2px',
              },
            }}
          >
            <MenuIcon />
          </IconButton>

          {/* Logo for small screens */}
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="/"
            sx={{
              flexGrow: 1,
              display: { xs: 'flex', md: 'none' },
              fontFamily: 'monospace',
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
              alignItems: 'center',
            }}
          >
            <YardIcon sx={{ mr: 1, fontSize: 24 }} /> CGP
          </Typography>

          {/* Desktop menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, ml: 3 }}>
            {pages.map((page, index) => (
              <Button
                key={page.name}
                onClick={() => navigate(page.path)}
                onKeyDown={createButtonKeyboardHandler(() => navigate(page.path))}
                sx={{
                  my: 2,
                  mx: 0.5,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '8px',
                  padding: '6px 16px',
                  position: 'relative',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  },
                  '&:focus': {
                    outline: '2px solid white',
                    outlineOffset: '2px',
                  },
                  ...(isActivePath(page.path) && {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: '20%',
                      width: '60%',
                      height: '3px',
                      borderRadius: '3px',
                      backgroundColor: 'white',
                    },
                  }),
                }}
                aria-current={isActivePath(page.path) ? 'page' : undefined}
              >
                {page.icon}
                <Box component="span" sx={{ ml: 1 }}>
                  {page.name}
                </Box>
              </Button>
            ))}
          </Box>

          {/* Theme toggle - always visible */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: user ? 2 : 0 }}>
            <ThemeToggle />
          </Box>

          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {/* Profile menu */}
              <Tooltip title="Open settings">
                <IconButton
                  onClick={handleOpenUserMenu}
                  onKeyDown={createButtonKeyboardHandler(handleOpenUserMenu)}
                  sx={{
                    p: 0,
                    border: '2px solid rgba(255, 255, 255, 0.7)',
                    '&:hover': {
                      border: '2px solid white',
                    },
                    '&:focus': {
                      outline: '2px solid white',
                      outlineOffset: '2px',
                    },
                  }}
                  aria-label="Open user menu"
                  aria-haspopup="true"
                  aria-expanded={Boolean(anchorElUser)}
                >
                  <Avatar 
                    alt="User" 
                    src={user?.profile?.profile_picture || '/default-avatar.png'} 
                    sx={{ width: 36, height: 36 }}
                  >
                    <AccountCircleIcon />
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
                TransitionComponent={Fade}
              >
                <Box sx={{ px: 2, py: 1, textAlign: 'center', borderBottom: '1px solid #eee' }}>
                  <Typography variant="subtitle1" component="div">
                    {user?.username || 'Guest'}
                  </Typography>
                </Box>
                {settings.map((setting, index) => (
                  <MenuItem
                    key={setting.name}
                    ref={(el) => (settingsMenuRef.current[index] = el)}
                    onClick={() => handleMenuAction(setting.path, setting.action)}
                    onKeyDown={createButtonKeyboardHandler(() => handleMenuAction(setting.path, setting.action))}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      py: 1.5,
                      borderRadius: '4px',
                      mx: 1,
                      my: 0.5,
                      '&:hover': {
                        backgroundColor: '#f0f7eb',
                      },
                      '&:focus': {
                        outline: '2px solid #558b2f',
                        outlineOffset: '2px',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 'auto', color: '#558b2f' }}>
                      {setting.icon}
                    </ListItemIcon>
                    <Typography textAlign="center">{setting.name}</Typography>
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          )}

          {/* Login and Register buttons when user is not signed in */}
          {!user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/auth/login')}
                onKeyDown={createButtonKeyboardHandler(() => navigate('/auth/login'))}
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                  '&:focus': {
                    outline: '2px solid white',
                    outlineOffset: '2px',
                  },
                }}
              >
                Login
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/auth/register')}
                onKeyDown={createButtonKeyboardHandler(() => navigate('/auth/register'))}
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                  '&:focus': {
                    outline: '2px solid white',
                    outlineOffset: '2px',
                  },
                }}
              >
                Sign Up
              </Button>
            </Box>
          )}
        </Toolbar>
      </Container>

      {/* Mobile drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: '85%',
            maxWidth: '300px',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            bgcolor: muiTheme.palette.primary.main,
            color: 'white',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <YardIcon sx={{ mr: 1 }} />
            <Typography variant="h6" component="div">
              Menu
            </Typography>
          </Box>
          <IconButton 
            color="inherit" 
            onClick={toggleDrawer(false)}
            onKeyDown={createButtonKeyboardHandler(() => toggleDrawer(false)())}
            sx={{
              '&:focus': {
                outline: '2px solid white',
                outlineOffset: '2px',
              },
            }}
            aria-label="Close menu"
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider />

        <List sx={{ pt: 0 }}>
          {pages.map((page, index) => (
            <ListItem key={page.name} disablePadding>
              <ListItemButton
                ref={(el) => (drawerItemsRef.current[index] = el)}
                onClick={() => {
                  navigate(page.path);
                  setDrawerOpen(false);
                }}
                onKeyDown={createButtonKeyboardHandler(() => {
                  navigate(page.path);
                  setDrawerOpen(false);
                })}
                sx={{
                  py: 1.5,
                  '&:focus': {
                    outline: '2px solid #558b2f',
                    outlineOffset: '2px',
                  },
                  ...(isActivePath(page.path) && {
                    bgcolor: '#f0f7eb',
                    borderLeft: '4px solid #558b2f',
                  }),
                }}
                aria-current={isActivePath(page.path) ? 'page' : undefined}
              >
                <ListItemIcon sx={{ color: '#558b2f', minWidth: '40px' }}>{page.icon}</ListItemIcon>
                <ListItemText primary={page.name} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 1 }} />

        {user ? (
          <>
            <Typography
              variant="subtitle2"
              sx={{ px: 2, py: 1, fontWeight: 'bold', color: 'text.secondary' }}
            >
              User Settings
            </Typography>
            <List sx={{ pt: 0 }}>
              {settings.map((setting, index) => (
                <ListItem key={setting.name} disablePadding>
                  <ListItemButton
                    ref={(el) => (drawerItemsRef.current[pages.length + index] = el)}
                    onClick={() => {
                      setDrawerOpen(false);

                      if (setting.action === 'logout') {
                        logout();
                        toast.info("You've been logged out.", {
                          position: 'top-right',
                          theme: 'colored',
                        });
                        setTimeout(() => navigate('/'), 2000);
                      } else if (setting.path) {
                        navigate(setting.path);
                      }
                    }}
                    onKeyDown={createButtonKeyboardHandler(() => {
                      setDrawerOpen(false);

                      if (setting.action === 'logout') {
                        logout();
                        toast.info("You've been logged out.", {
                          position: 'top-right',
                          theme: 'colored',
                        });
                        setTimeout(() => navigate('/'), 2000);
                      } else if (setting.path) {
                        navigate(setting.path);
                      }
                    })}
                    sx={{ 
                      py: 1.5,
                      '&:focus': {
                        outline: '2px solid #558b2f',
                        outlineOffset: '2px',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: '#558b2f', minWidth: '40px' }}>
                      {setting.icon}
                    </ListItemIcon>
                    <ListItemText primary={setting.name} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </>
        ) : (
          <Box sx={{ p: 2 }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => {
                navigate('/');
                setDrawerOpen(false);
              }}
              onKeyDown={createButtonKeyboardHandler(() => {
                navigate('/');
                setDrawerOpen(false);
              })}
              sx={{ 
                mb: 1,
                '&:focus': {
                  outline: '2px solid #558b2f',
                  outlineOffset: '2px',
                },
              }}
            >
              Login
            </Button>
            <Button
              variant="outlined"
              color="primary"
              fullWidth
              onClick={() => {
                navigate('/auth/register');
                setDrawerOpen(false);
              }}
              onKeyDown={createButtonKeyboardHandler(() => {
                navigate('/auth/register');
                setDrawerOpen(false);
              })}
              sx={{
                '&:focus': {
                  outline: '2px solid #558b2f',
                  outlineOffset: '2px',
                },
              }}
            >
              Register
            </Button>
          </Box>
        )}
      </Drawer>
    </AppBar>
  );
}

export default Navbar;
