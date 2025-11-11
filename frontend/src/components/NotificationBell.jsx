import React, { useState, useEffect } from 'react';
import { IconButton, Badge, Popover, List, ListItem, ListItemText, Button, Typography, Divider, Box, ListItemIcon, ListItemButton } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useAuth } from '../contexts/AuthContextUtils';
import { toast } from 'react-toastify';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

const NotificationBell = () => {
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
      toast.success("Marked as read");
    } catch (err) {
      toast.error("Failed to mark as read");
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
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error("Failed to mark all as read");
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
            width: '350px',
          },
        }}
      >
        {/* 3. The Content Inside the Box */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          <Button size="small" onClick={handleMarkAllAsRead} disabled={notifications.length === 0}>
            Mark All Read
          </Button>
        </Box>
        <Divider />

        <List dense sx={{ p: 0 }}>
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  secondaryAction={
                    !notification.read && (
                      <Button 
                        size="small" 
                        variant="outlined" 
                        onClick={() => handleMarkAsRead(notification.id)}
                        sx={{ borderRadius: '20px' }}
                      >
                        Mark Read
                      </Button>
                    )
                  }
                  sx={{ 
                    bgcolor: notification.read ? 'transparent' : 'action.hover',
                    '& .MuiListItemText-root': {
                      paddingRight: '100px' 
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: '30px' }}>
                    {!notification.read && (
                      <FiberManualRecordIcon sx={{ fontSize: '10px' }} color="primary" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={notification.message}
                    secondary={new Date(notification.timestamp).toLocaleString()}
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))
          ) : (
            <ListItem>
              <ListItemText primary="You have no notifications." sx={{ textAlign: 'center' }} />
            </ListItem>
          )}
        </List>
      </Popover>
    </>
  );
};

export default NotificationBell;