import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
  Grid,
  Paper,
  Typography,
  Fade,
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import GroupsIcon from '@mui/icons-material/Groups';
import NaturePeopleIcon from '@mui/icons-material/NaturePeople';
import CelebrationIcon from '@mui/icons-material/Celebration';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import BuildIcon from '@mui/icons-material/Build';
import CakeIcon from '@mui/icons-material/Cake';
import SchoolIcon from '@mui/icons-material/School';
import FavoriteIcon from '@mui/icons-material/Favorite';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import LocalFloristOutlinedIcon from '@mui/icons-material/LocalFloristOutlined';
import CloudIcon from '@mui/icons-material/Cloud';
import { useAuth } from '../contexts/AuthContextUtils';
import { toast } from 'react-toastify';
import { createFormKeyboardHandler, trapFocus } from '../utils/keyboardNavigation';
import { useTranslation } from 'react-i18next';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';

const getEventCategories = (t) => [
  { 
    id: 'WORKSHOP', 
    labelKey: 'events.category.workshop',
    icon: LocalFloristIcon, 
    color: '#4caf50', 
    exampleDescriptionKey: 'events.exampleDescription.workshop'
  },
  { 
    id: 'POTLUCK', 
    labelKey: 'events.category.potluck',
    icon: RestaurantMenuIcon, 
    color: '#8bc34a', 
    exampleDescriptionKey: 'events.exampleDescription.potluck'
  },
  { 
    id: 'EXCHANGE', 
    labelKey: 'events.category.exchange',
    icon: SwapHorizIcon, 
    color: '#795548', 
    exampleDescriptionKey: 'events.exampleDescription.exchange'
  },
  { 
    id: 'TREASURE_HUNT', 
    labelKey: 'events.category.treasureHunt',
    icon: TravelExploreIcon, 
    color: '#3f51b5', 
    exampleDescriptionKey: 'events.exampleDescription.treasureHunt'
  },
  { 
    id: 'PHOTOGRAPHY', 
    labelKey: 'events.category.photography',
    icon: PhotoCameraIcon, 
    color: '#2196f3', 
    exampleDescriptionKey: 'events.exampleDescription.photography'
  },
  { 
    id: 'CELEBRATION', 
    labelKey: 'events.category.celebration',
    icon: CelebrationIcon, 
    color: '#e91e63', 
    exampleDescriptionKey: 'events.exampleDescription.celebration',
  },
  { 
    id: 'OTHER', 
    labelKey: 'events.category.other',
    icon: EventIcon, 
    color: '#757575', 
    exampleDescriptionKey: 'events.exampleDescription.other'
  },
];

const EventCreateDialog = ({ open, onClose, onEventCreated, gardenId }) => {
  const { t, i18n } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState(dayjs().add(1, 'day'));
  const [endTime, setEndTime] = useState(null);
  const [location, setLocation] = useState('');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();
  const dialogRef = useRef(null);
  const focusableElementsRef = useRef([]);

  // Set dayjs locale based on current language
  useEffect(() => {
    dayjs.locale(i18n.language === 'tr' ? 'tr' : 'en');
  }, [i18n.language]);

  const handleCreateEvent = async () => {
    // Validation
    if (!title.trim()) {
      setError(t('events.titleRequired'));
      return;
    }

    if (!startTime || !dayjs(startTime).isValid()) {
      setError(t('events.startTimeRequired'));
      return;
    }

    if (endTime && dayjs(endTime).isValid() && dayjs(endTime).isBefore(dayjs(startTime))) {
      setError(t('events.endTimeBeforeStart'));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const requestBody = {
        garden: parseInt(gardenId),
        title: title.trim(),
        description: description.trim() || null,
        start_at: dayjs(startTime).toISOString(),
        visibility: visibility,
        event_category: category || 'OTHER',
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/events/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || errorData.error || t('events.failedToCreateEvent');
        toast.error(errorMessage);
        setError(errorMessage);
        setLoading(false);
        return;
      }

      const newEvent = await response.json();

      // Reset form
      setTitle('');
      setDescription('');
      setStartTime(dayjs().add(1, 'day'));
      setEndTime(null);
      setLocation('');
      setVisibility('PUBLIC');
      setCategory('');
      setLoading(false);

      // Show success toast notification
      toast.success(t('events.eventCreatedSuccessfully'));

      // Call the callback function with the new event data
      onEventCreated(newEvent);
      onClose();
    } catch (error) {
      console.error('Error creating event:', error);
      setError(t('events.failedToCreateEventTryLater'));
      setLoading(false);
      toast.error(t('events.failedToCreateEventTryAgain'));
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setStartTime(dayjs().add(1, 'day'));
    setEndTime(null);
    setLocation('');
    setVisibility('PUBLIC');
    setCategory('');
    setError(null);
    onClose();
  };

  const eventCategories = getEventCategories(t);
  const selectedCategory = eventCategories.find(cat => cat.id === category);

  // Determine which example description to use
  const getExampleDescriptionKey = () => {
    if (selectedCategory) {
      return selectedCategory.exampleDescriptionKey;
    }
    return 'events.descriptionPlaceholder';
  };

  // Create keyboard handler for the form
  const formKeyboardHandler = createFormKeyboardHandler(handleCreateEvent, handleClose);

  // Set up focus trap when dialog opens
  useEffect(() => {
    if (open && dialogRef.current) {
      // Get all focusable elements within the dialog
      const focusableElements = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusableElementsRef.current = Array.from(focusableElements);
      
      // Focus the first element
      if (focusableElementsRef.current.length > 0) {
        focusableElementsRef.current[0].focus();
      }
      
      // Set up focus trap
      const cleanup = trapFocus(dialogRef.current, focusableElementsRef.current);
      return cleanup;
    }
  }, [open]);

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      fullWidth 
      maxWidth="md"
      ref={dialogRef}
      onKeyDown={formKeyboardHandler}
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-create-title"
      scroll="body"
      sx={{
        '& .MuiDialog-container': {
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '95vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          margin: 'auto',
        }
      }}
    >
          <DialogTitle 
            id="event-create-title"
            sx={{ 
              background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              py: 3,
              px: 4,
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              width: '100%'
            }}>
              {selectedCategory ? (
                <>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {t('events.createEvent')}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {t(selectedCategory.labelKey)}
                    </Typography>
                  </Box>
                </>
              ) : (
                <>
                  <EventIcon sx={{ fontSize: '2rem' }} />
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {t('events.createEvent')}
                  </Typography>
                </>
              )}
            </Box>
          </DialogTitle>

      <DialogContent sx={{ 
        px: 4, 
        py: 3,
        flex: 1,
        overflowY: 'auto',
        overflowX: 'visible',
        minHeight: 0, // Important for flex child with overflow
      }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Event Categories */}
        <Box sx={{ mb: 3, mt:3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 500, color: 'text.secondary', fontSize: '0.875rem' }}>
            {t('events.selectCategory')}
          </Typography>
          <Grid container spacing={1.5}>
            {eventCategories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.id;
              return (
                <Grid item xs={6} sm={4} md={2} key={cat.id}>
                  <Paper
                    elevation={0}
                    onClick={() => {
                      setCategory(cat.id);
                    }}
                    sx={{
                      p: 1.5,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      border: '2px solid', // Always 2px to prevent layout shift
                      borderColor: isSelected ? cat.color : 'transparent',
                      background: isSelected 
                        ? `${cat.color}08`
                        : 'transparent',
                      borderRadius: 2,
                      minHeight: '80px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      '&:hover': {
                        borderColor: isSelected ? cat.color : `${cat.color}40`,
                        background: `${cat.color}05`,
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    <Icon sx={{ 
                      fontSize: '1.5rem', 
                      color: isSelected ? cat.color : 'text.secondary', 
                      mb: 0.5,
                      transition: 'color 0.2s ease'
                    }} />
                    <Typography variant="caption" sx={{ 
                      fontWeight: isSelected ? 600 : 400, 
                      fontSize: '0.7rem',
                      display: 'block',
                      lineHeight: 1.2,
                      color: isSelected ? cat.color : 'text.secondary',
                      transition: 'all 0.2s ease'
                    }}>
                      {t(cat.labelKey)}
                    </Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>
        <TextField
          autoFocus
          margin="dense"
          label={t('events.title')}
          fullWidth
          variant="outlined"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder={t('events.titlePlaceholder')}
          sx={{ 
            mb: 3,
            '& .MuiOutlinedInput-root': {
              fontSize: '1.1rem',
              '&:focus-within': {
                outline: '2px solid #558b2f',
                outlineOffset: '2px',
              },
            },
          }}
          aria-label="Event title"
        />

        <TextField
          label={t('events.description')}
          multiline
          rows={6}
          fullWidth
          variant="outlined"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t(getExampleDescriptionKey())}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              '&:focus-within': {
                outline: '2px solid #558b2f',
                outlineOffset: '2px',
              },
            },
            '& .MuiInputBase-input::placeholder': {
              opacity: 0.4,
              fontStyle: 'italic',
              fontSize: '0.9rem',
              lineHeight: 1.5,
            },
          }}
          aria-label="Event description"
        />

        <LocalizationProvider 
          dateAdapter={AdapterDayjs} 
          adapterLocale={i18n.language === 'tr' ? 'tr' : 'en'}
        >
          <Box sx={{ mb: 3 }}>
            <DateTimePicker
              label={t('events.startTime')}
              value={startTime}
              onChange={(newValue) => setStartTime(newValue)}
              minDateTime={dayjs()}
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: 'outlined',
                  required: true,
                  sx: {
                    '& .MuiOutlinedInput-root': {
                      '&:focus-within': {
                        outline: '2px solid #558b2f',
                        outlineOffset: '2px',
                      },
                    },
                  },
                },
                popper: {
                  placement: 'bottom-start',
                  modifiers: [
                    {
                      name: 'flip',
                      enabled: true,
                      options: {
                        altBoundary: true,
                        rootBoundary: 'viewport',
                        padding: 8,
                      },
                    },
                    {
                      name: 'preventOverflow',
                      enabled: true,
                      options: {
                        altAxis: true,
                        altBoundary: true,
                        tether: true,
                        rootBoundary: 'viewport',
                        padding: 8,
                      },
                    },
                  ],
                },
              }}
            />
          </Box>
        </LocalizationProvider>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>{t('events.visibility')}</InputLabel>
          <Select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            input={<OutlinedInput label={t('events.visibility')} />}
            sx={{}}
          >
            <MenuItem value="PUBLIC">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box>🌍</Box>
                <Box>{t('events.public')}</Box>
              </Box>
            </MenuItem>
            <MenuItem value="PRIVATE">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box>🔒</Box>
                <Box>{t('events.private')}</Box>
              </Box>
            </MenuItem>
          </Select>
        </FormControl>
      </DialogContent>

      <DialogActions sx={{ 
        p: 2, 
        gap: 1.5, 
        background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.02))',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
        flexShrink: 0, // Prevent shrinking
        borderTop: '1px solid',
        borderColor: 'divider',
      }}>
        <Button 
          onClick={handleClose} 
          variant="outlined"
          onKeyDown={createFormKeyboardHandler(handleClose)}
          sx={{
            px: 2.5,
            py: 1,
            minWidth: '100px',
            '&:focus': {
              outline: '2px solid #558b2f',
              outlineOffset: '2px',
            },
          }}
        >
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleCreateEvent}
          variant="contained"
          disabled={loading}
          onKeyDown={createFormKeyboardHandler(handleCreateEvent)}
          startIcon={selectedCategory ? <span style={{ fontSize: '1rem' }}>{selectedCategory.emoji}</span> : <EventIcon />}
          sx={{
            bgcolor: '#558b2f',
            px: 3,
            py: 1,
            fontSize: '0.95rem',
            fontWeight: 600,
            minWidth: '120px',
            boxShadow: '0 4px 20px rgba(76, 175, 80, 0.3)',
            '&:hover': {
              bgcolor: '#33691e',
              boxShadow: '0 6px 25px rgba(76, 175, 80, 0.4)',
              transform: 'translateY(-2px)',
            },
            '&:focus': {
              outline: '2px solid #558b2f',
              outlineOffset: '2px',
            },
            transition: 'all 0.3s ease',
          }}
        >
          {loading ? (
            <>
              <CircularProgress size={18} sx={{ mr: 1, color: 'white' }} />
              {t('events.creating')}
            </>
          ) : (
            <>
              {t('events.create')}
            </>
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EventCreateDialog;

