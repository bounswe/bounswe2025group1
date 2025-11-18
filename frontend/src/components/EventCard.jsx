import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  Button,
  Avatar,
  useTheme,
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const EventCard = ({ event, onViewDetails, onVote }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = dayjs(dateString);
    return date.format('MMM D, YYYY [at] h:mm A');
  };

  const getAttendanceStatusColor = (status) => {
    switch (status) {
      case 'GOING':
        return 'success';
      case 'NOT_GOING':
        return 'error';
      case 'MAYBE':
        return 'warning';
      default:
        return 'default';
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
        return t('events.rsvp');
    }
  };

  return (
    <Card
      sx={{
        mb: 2,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
              {event.title}
            </Typography>
            {event.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 2,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {event.description}
              </Typography>
            )}
          </Box>
          <Chip
            icon={event.visibility === 'PUBLIC' ? <PublicIcon /> : <LockIcon />}
            label={event.visibility === 'PUBLIC' ? t('events.public') : t('events.private')}
            size="small"
            sx={{ ml: 1 }}
          />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EventIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {formatDate(event.start_at || event.start_time)}
              {(event.end_at || event.end_time) && ` - ${dayjs(event.end_at || event.end_time).format('h:mm A')}`}
            </Typography>
          </Box>

          {event.location && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOnIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {event.location}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {t('events.goingCount', { count: event.going_count || 0 })}
              {' • '}
              {t('events.maybeCount', { count: event.maybe_count || 0 })}
              {' • '}
              {t('events.notGoingCount', { count: event.not_going_count || 0 })}
            </Typography>
          </Box>

          {event.created_by && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                {event.created_by.username?.[0]?.toUpperCase() || 'U'}
              </Avatar>
              <Typography variant="body2" color="text.secondary">
                {t('events.createdBy')} {event.created_by.username}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, justifyContent: 'space-between' }}>
        <Button
          size="small"
          variant="outlined"
          onClick={() => onViewDetails(event)}
          sx={{
            '&:focus': {
              outline: '2px solid #558b2f',
              outlineOffset: '2px',
            },
          }}
        >
          {t('events.viewDetails')}
        </Button>
        {event.my_attendance && (
          <Chip
            label={getAttendanceStatusLabel(event.my_attendance)}
            color={getAttendanceStatusColor(event.my_attendance)}
            size="small"
          />
        )}
      </CardActions>
    </Card>
  );
};

export default EventCard;

