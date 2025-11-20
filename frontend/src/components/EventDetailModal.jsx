import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  useTheme,
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useAuth } from '../contexts/AuthContextUtils';
import { toast } from 'react-toastify';
import { createFormKeyboardHandler, trapFocus } from '../utils/keyboardNavigation';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const EventDetailModal = ({ open, onClose, event, onEventUpdated, onEventDeleted, canEdit, canDelete }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { token, user } = useAuth();
  const [eventData, setEventData] = useState(event);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAttendances, setLoadingAttendances] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [voting, setVoting] = useState(false);
  const dialogRef = useRef(null);
  const focusableElementsRef = useRef([]);

  useEffect(() => {
    setEventData(event);
  }, [event?.id]); // Only update eventData when event ID changes

  useEffect(() => {
    if (open && event?.id) {
      // Only fetch details on initial open, not on every event prop change
      fetchEventDetails();
      if (activeTab === 1) {
        fetchAttendances();
      }
    }
  }, [open, event?.id]); // Remove 'event' dependency to prevent infinite loop

  useEffect(() => {
    if (open && activeTab === 1 && eventData?.id) {
      fetchAttendances();
    }
  }, [activeTab, open, eventData?.id]);

  const fetchEventDetails = async (shouldUpdateParent = false) => {
    if (!eventData?.id || !token) return;

    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events/${eventData.id}/`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEventData(data);
        // Only update parent when explicitly requested (e.g., after voting)
        if (shouldUpdateParent && onEventUpdated) {
          onEventUpdated(data);
        }
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendances = async () => {
    if (!eventData?.id || !token) return;

    try {
      setLoadingAttendances(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events/${eventData.id}/attendances/`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAttendances(data);
      } else if (response.status === 403) {
        toast.error(t('events.notMemberOfGarden'));
      }
    } catch (error) {
      console.error('Error fetching attendances:', error);
      toast.error(t('events.failedToFetchAttendances'));
    } finally {
      setLoadingAttendances(false);
    }
  };

  const handleVote = async (status) => {
    if (!eventData?.id || !token) return;

    try {
      setVoting(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events/${eventData.id}/vote/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.detail || t('events.failedToVote');
        toast.error(errorMessage);
        setVoting(false);
        return;
      }

      const attendance = await response.json();
      
      // Refresh event data to get updated counts and update parent
      await fetchEventDetails(true);
      
      toast.success(t('events.voteRecorded'));
      setVoting(false);
    } catch (error) {
      console.error('Error voting:', error);
      toast.error(t('events.failedToVote'));
      setVoting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('events.confirmDeleteEvent'))) return;

    if (!eventData?.id || !token) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events/${eventData.id}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
      });

      if (response.ok || response.status === 204) {
        toast.success(t('events.eventDeleted'));
        if (onEventDeleted) {
          onEventDeleted(eventData.id);
        }
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || t('events.failedToDeleteEvent');
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error(t('events.failedToDeleteEvent'));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = dayjs(dateString);
    return date.format('MMMM D, YYYY [at] h:mm A');
  };

  const getAttendanceStatusIcon = (status) => {
    switch (status) {
      case 'GOING':
        return <CheckCircleIcon color="success" />;
      case 'NOT_GOING':
        return <CancelIcon color="error" />;
      case 'MAYBE':
        return <HelpOutlineIcon color="warning" />;
      default:
        return null;
    }
  };

  const getAttendanceStatusLabel = (status) => {
    switch (status) {
      case 'GOING':
        return t('events.going');
      case 'NOT_GOING':
        return t('events.notGoing');
      case 'MAYBE':
        return t('events.maybe');
      default:
        return '';
    }
  };

  const handleClose = () => {
    setActiveTab(0);
    onClose();
  };

  // Set up focus trap when dialog opens
  useEffect(() => {
    if (open && dialogRef.current) {
      const focusableElements = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusableElementsRef.current = Array.from(focusableElements);
      
      if (focusableElementsRef.current.length > 0) {
        focusableElementsRef.current[0].focus();
      }
      
      const cleanup = trapFocus(dialogRef.current, focusableElementsRef.current);
      return cleanup;
    }
  }, [open]);

  if (!eventData) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-detail-title"
    >
      <DialogTitle 
        id="event-detail-title"
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1 
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
          <EventIcon color="primary" />
          <Typography variant="h6" component="span">
            {eventData.title}
          </Typography>
        </Box>
        <Chip
          icon={eventData.visibility === 'PUBLIC' ? <PublicIcon /> : <LockIcon />}
          label={eventData.visibility === 'PUBLIC' ? t('events.public') : t('events.private')}
          size="small"
        />
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 3 }}>
              {eventData.description && (
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {eventData.description}
                </Typography>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EventIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    <strong>{t('events.startTime')}:</strong> {formatDate(eventData.start_at || eventData.start_time)}
                  </Typography>
                </Box>

                {(eventData.end_at || eventData.end_time) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EventIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      <strong>{t('events.endTime')}:</strong> {formatDate(eventData.end_at || eventData.end_time)}
                    </Typography>
                  </Box>
                )}

                {eventData.location && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOnIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      <strong>{t('events.location')}:</strong> {eventData.location}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PeopleIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    <strong>{t('events.attendance')}:</strong>{' '}
                    {t('events.goingCount', { count: eventData.going_count || 0 })}
                    {' • '}
                    {t('events.maybeCount', { count: eventData.maybe_count || 0 })}
                    {' • '}
                    {t('events.notGoingCount', { count: eventData.not_going_count || 0 })}
                  </Typography>
                </Box>

                {eventData.created_by && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>{t('events.createdBy')}:</strong> {eventData.created_by.username}
                    </Typography>
                  </Box>
                )}
              </Box>

              {eventData.my_attendance && (
                <Alert severity="info" sx={{ mb: 2 }}>
                {t('events.yourResponse')}: <strong>{getAttendanceStatusLabel(eventData.my_attendance)}</strong>
                </Alert>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                <Tab label={t('events.vote')} />
                <Tab label={t('events.attendances')} />
              </Tabs>
            </Box>

            {activeTab === 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
                  {t('events.selectYourResponse')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant={eventData.my_attendance === 'GOING' ? 'contained' : 'outlined'}
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => handleVote('GOING')}
                    disabled={voting}
                    sx={{
                      flex: { xs: '1 1 100%', sm: '1 1 auto' },
                      '&:focus': {
                        outline: '2px solid #4caf50',
                        outlineOffset: '2px',
                      },
                    }}
                  >
                    {t('events.going')}
                  </Button>
                  <Button
                    variant={eventData.my_attendance === 'MAYBE' ? 'contained' : 'outlined'}
                    color="warning"
                    startIcon={<HelpOutlineIcon />}
                    onClick={() => handleVote('MAYBE')}
                    disabled={voting}
                    sx={{
                      flex: { xs: '1 1 100%', sm: '1 1 auto' },
                      '&:focus': {
                        outline: '2px solid #ff9800',
                        outlineOffset: '2px',
                      },
                    }}
                  >
                    {t('events.maybe')}
                  </Button>
                  <Button
                    variant={eventData.my_attendance === 'NOT_GOING' ? 'contained' : 'outlined'}
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => handleVote('NOT_GOING')}
                    disabled={voting}
                    sx={{
                      flex: { xs: '1 1 100%', sm: '1 1 auto' },
                      '&:focus': {
                        outline: '2px solid #f44336',
                        outlineOffset: '2px',
                      },
                    }}
                  >
                    {t('events.notGoing')}
                  </Button>
                </Box>
                {voting && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                )}
              </Box>
            )}

            {activeTab === 1 && (
              <Box>
                {loadingAttendances ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : attendances.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    {t('events.noAttendancesYet')}
                  </Typography>
                ) : (
                  <List>
                    {attendances.map((attendance) => (
                      <ListItem key={attendance.id}>
                        <ListItemAvatar>
                          <Avatar>
                            {attendance.user?.username?.[0]?.toUpperCase() || 'U'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={attendance.user?.username || t('events.unknownUser')}
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              {getAttendanceStatusIcon(attendance.status)}
                              <Typography variant="body2" component="span">
                                {getAttendanceStatusLabel(attendance.status)}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        {canDelete && (
          <Button
            variant="outlined"
            color="error"
            onClick={handleDelete}
            sx={{
              '&:focus': {
                outline: '2px solid #f44336',
                outlineOffset: '2px',
              },
            }}
          >
            {t('events.deleteEvent')}
          </Button>
        )}
        <Button
          variant="outlined"
          onClick={handleClose}
          sx={{
            '&:focus': {
              outline: '2px solid #558b2f',
              outlineOffset: '2px',
            },
          }}
        >
          {t('common.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EventDetailModal;

