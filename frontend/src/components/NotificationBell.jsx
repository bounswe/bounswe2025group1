import React, { useState, useEffect } from 'react';
import { IconButton, Badge, Popover, List, ListItem, ListItemText, Button, Typography, Divider, Box, ListItemIcon, ListItemButton } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useAuth } from '../contexts/AuthContextUtils';
import { toast } from 'react-toastify';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { token } = useAuth();

  const fetchUnreadCount = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/notifications/unread_count/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unread_count);
      }
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  };

  const fetchNotifications = async () => {
    if (!token) return;
    try {

      const response = await fetch(`${import.meta.env.VITE_API_URL}/notifications/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };


  useEffect(() => {
    fetchUnreadCount();
  }, [token]);

  useEffect(() => {
    const handleNewNotification = () => {
      console.log("NotificationBell heard 'new-notification' event!");
      setUnreadCount(prevCount => prevCount + 1);
    };

    document.addEventListener('new-notification', handleNewNotification);
    return () => {
      document.removeEventListener('new-notification', handleNewNotification);
    };
  }, []);


  const handleOpen = (event) => {
    fetchNotifications();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/notifications/${id}/mark_as_read/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` }
      });
      fetchNotifications();
      fetchUnreadCount();
    } catch (err) {
      toast.error(t('notifications.failedToMarkAsRead'));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/notifications/mark_all_as_read/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` }
      });
      fetchNotifications();
      fetchUnreadCount();
      handleClose();
      toast.success(t('notifications.allMarkedAsRead'));
    } catch (err) {
      toast.error(t('notifications.failedToMarkAllAsRead'));
    }
  };

  const handleNotificationClick = (notification) => {
    handleClose();
    if (notification.link) {
      navigate(notification.link);
    }
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
  };

  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;

  return (
    <>
      {/* 1. The Bell Icon & Badge */}
      <IconButton color="inherit" aria-describedby={id} onClick={handleOpen}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      {/* 2. The Popover Box */}
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          style: {
            maxHeight: 400,
            width: 400,
          },
        }}
      >
        {/* 3. The Content Inside the Box */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{t('notifications.title')}</Typography>
          <IconButton
            size="small"
            onClick={handleMarkAllAsRead}
            disabled={notifications.length === 0 || unreadCount === 0}
          >
            <DoneAllIcon />
          </IconButton>
        </Box>
        <Divider />

        <List dense sx={{ p: 0 }}>
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItemButton
                  onClick={() => handleNotificationClick(notification)}
                  alignItems="flex-start"
                  sx={{
                    bgcolor: notification.read ? 'transparent' : 'action.hover',
                    '& .MuiListItemText-root': {
                      paddingRight: '40px' // Adjusted padding
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: '30px', mt: 1 }}>
                    {!notification.read && (
                      <FiberManualRecordIcon sx={{ fontSize: '10px' }} color="primary" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={notification.message}
                    secondary={new Date(notification.timestamp).toLocaleString(i18n.language === 'tr' ? 'tr-TR' : i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  />
                  <Box sx={{ position: 'absolute', right: 8, top: 8 }}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification.id);
                      }}
                      disabled={notification.read}
                    >
                      <MarkEmailReadIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </ListItemButton>
                <Divider component="li" />
              </React.Fragment>
            ))
          ) : (
            <ListItem>
              <ListItemText primary={t('notifications.noNotifications')} sx={{ textAlign: 'center' }} />
            </ListItem>
          )}
        </List>
      </Popover>
    </>
  );
};

export default NotificationBell;