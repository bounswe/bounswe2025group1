import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  TextField,
  List,
  ListItemText,
  ListItemButton,
  Avatar,
  Divider,
  InputAdornment,
  Badge,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  DoneAll as DoneAllIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContextUtils';
import { db } from '../config/firebaseConfig';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { useTheme } from '@mui/material/styles';

const ChatWidget = () => {
  const theme = useTheme();
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'chat'
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [firebaseUid, setFirebaseUid] = useState(null);
  const [userProfiles, setUserProfiles] = useState({}); // Cache for user profiles (username + picture)
  const [unreadCounts, setUnreadCounts] = useState({}); // Unread message counts per chat
  const messagesEndRef = useRef(null);

  // Get Firebase UID for the current user
  useEffect(() => {
    if (!user) return;
    
    // Firebase UID format: django_{userId}
    const uid = `django_${user.id}`;
    setFirebaseUid(uid);
  }, [user]);

  // Subscribe to chats list
  useEffect(() => {
    if (!firebaseUid || !db) return;

    const chatsQuery = query(
      collection(db, 'chats'),
      where('members', 'array-contains', firebaseUid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      chatsQuery,
      (snapshot) => {
        const chatsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setChats(chatsList);
      },
      (error) => {
        console.error('Error fetching chats:', error);
      }
    );

    return () => unsubscribe();
  }, [firebaseUid]);

  // Calculate unread counts for all chats
  useEffect(() => {
    if (!firebaseUid || !db || chats.length === 0) return;

    const unsubscribes = [];
    
    chats.forEach((chat) => {
      const messagesQuery = query(
        collection(db, 'chats', chat.id, 'messages'),
        where('senderId', '!=', firebaseUid) // Only count messages from others
      );

      const unsubscribe = onSnapshot(
        messagesQuery,
        (snapshot) => {
          const unreadCount = snapshot.docs.filter((doc) => {
            const data = doc.data();
            // Message is unread if readBy array doesn't include current user
            return !data.readBy || !data.readBy.includes(firebaseUid);
          }).length;

          if(unreadCount){
            console.log(`Chat ${chat.id} has ${unreadCount} unread messages.`);
          }

          setUnreadCounts((prev) => ({
            ...prev,
            [chat.id]: unreadCount,
          }));
        },
        (error) => {
          console.error(`Error fetching unread count for chat ${chat.id}:`, error);
        }
      );

      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [chats, firebaseUid]);

  // Fetch user profiles (username + profile picture) for chats
  useEffect(() => {
    if (!token) return;

    const fetchUserProfiles = async () => {
      const userIdsToFetch = new Set();
      
      // Collect all user IDs from direct message chats
      chats.forEach((chat) => {
        if (chat.type === 'direct') {
          const otherUserId = chat.members.find((id) => id !== firebaseUid);
          if (otherUserId) {
            const djangoUserId = otherUserId.replace('django_', '');
            if (!userProfiles[djangoUserId]) {
              userIdsToFetch.add(djangoUserId);
            }
          }
        }
      });

      // Also collect user IDs from messages
      messages.forEach((message) => {
        if (message.senderId !== firebaseUid) {
          const djangoUserId = message.senderId.replace('django_', '');
          if (!userProfiles[djangoUserId]) {
            userIdsToFetch.add(djangoUserId);
          }
        }
      });

      // Fetch user profiles from backend
      if (userIdsToFetch.size > 0) {
        const newUserProfiles = { ...userProfiles };
        
        for (const userId of userIdsToFetch) {
          try {
            const response = await fetch(
              `${import.meta.env.VITE_API_URL}/profile/${userId}/`,
              {
                headers: {
                  Authorization: `Token ${token}`,
                },
              }
            );
            
            if (response.ok) {
              const data = await response.json();
              newUserProfiles[userId] = {
                username: data.username || `User ${userId}`,
                profile_picture: data.profile?.profile_picture || null,
              };
            }
          } catch (error) {
            console.error(`Error fetching profile for user ${userId}:`, error);
            newUserProfiles[userId] = {
              username: `User ${userId}`,
              profile_picture: null,
            };
          }
        }
        
        setUserProfiles(newUserProfiles);
      }
    };

    fetchUserProfiles();
  }, [chats, messages, firebaseUid, token, userProfiles]);

  // Subscribe to messages for selected chat
  useEffect(() => {
    if (!selectedChat || !db) return;

    const messagesQuery = query(
      collection(db, 'chats', selectedChat.id, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messagesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(messagesList);
      },
      (error) => {
        console.error('Error fetching messages:', error);
      }
    );

    return () => unsubscribe();
  }, [selectedChat]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (!selectedChat || !firebaseUid || !db || messages.length === 0) return;

    const markMessagesAsRead = async () => {
      try {
        const batch = writeBatch(db);
        let batchCount = 0;

        messages.forEach((message) => {
          // Skip messages sent by current user
          if (message.senderId === firebaseUid) return;
          
          // Skip messages already read by current user
          if (message.readBy && message.readBy.includes(firebaseUid)) return;

          const messageRef = doc(db, 'chats', selectedChat.id, 'messages', message.id);
          const updatedReadBy = message.readBy ? [...message.readBy, firebaseUid] : [firebaseUid];
          
          batch.update(messageRef, {
            readBy: updatedReadBy,
          });
          
          batchCount++;
        });

        // Only commit if there are updates
        if (batchCount > 0) {
          await batch.commit();
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    };

    markMessagesAsRead();
  }, [selectedChat, messages, firebaseUid]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen for openDirectMessage events
  useEffect(() => {
    const handleOpenDirectMessage = (event) => {
      const { chatId } = event.detail;
      
      // Find the chat in the chats list
      const chat = chats.find((c) => c.id === chatId);
      
      if (chat) {
        // Open the widget and select the chat
        setIsOpen(true);
        setSelectedChat(chat);
        setCurrentView('chat');
      } else {
        // If chat not found yet, wait a bit and try again (it might be loading)
        setTimeout(() => {
          const retryChat = chats.find((c) => c.id === chatId);
          if (retryChat) {
            setIsOpen(true);
            setSelectedChat(retryChat);
            setCurrentView('chat');
          } else {
            // Just open the widget to show the new chat in the list
            setIsOpen(true);
          }
        }, 500);
      }
    };

    window.addEventListener('openDirectMessage', handleOpenDirectMessage);
    return () => window.removeEventListener('openDirectMessage', handleOpenDirectMessage);
  }, [chats]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !firebaseUid) return;

    try {
      const batch = writeBatch(db);

      // Add message to messages subcollection
      const messagesRef = collection(db, 'chats', selectedChat.id, 'messages');
      await addDoc(messagesRef, {
        text: newMessage,
        senderId: firebaseUid,
        createdAt: serverTimestamp(),
        readBy: [firebaseUid], // Mark as read by sender
      });

      // Update chat's lastMessage and updatedAt
      const chatRef = doc(db, 'chats', selectedChat.id);
      batch.update(chatRef, {
        lastMessage: {
          text: newMessage,
          createdAt: serverTimestamp(),
          senderId: firebaseUid,
        },
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    setCurrentView('chat');
  };

  const handleBackToList = () => {
    setSelectedChat(null);
    setCurrentView('list');
  };

  const getChatDisplayName = (chat) => {
    if (chat.type === 'group') {
      return chat.groupName || 'Garden Chat';
    }
    // For direct messages, show the other user's username
    const otherUserId = chat.members.find((id) => id !== firebaseUid);
    if (!otherUserId) return 'Direct Message';
    
    // Extract Django user ID from Firebase UID (format: django_{userId})
    const djangoUserId = otherUserId.replace('django_', '');
    return userProfiles[djangoUserId]?.username || `User ${djangoUserId}`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Calculate total unread count across all chats
  const totalUnreadCount = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  if (!user || !firebaseUid) return null;

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 0,
        right: 20,
        width: 380,
        height: isOpen ? 600 : 56,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'all 0.3s ease-in-out',
        borderRadius: isOpen ? '8px 8px 0 0' : '8px 8px 0 0',
      }}
    >
      {/* Header - Clickable to expand/collapse */}
      <Box
        onClick={() => setIsOpen(!isOpen)}
        sx={{
          p: 1.5,
          bgcolor: theme.palette.primary.main,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          minHeight: 56,
          '&:hover': {
            bgcolor: theme.palette.primary.dark,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Badge 
            badgeContent={totalUnreadCount} 
            color="error"
            max={99}
          >
            <ChatIcon />
          </Badge>
          <Typography variant="h6">
            {currentView === 'list' || !isOpen
              ? 'Messages'
              : selectedChat
                ? getChatDisplayName(selectedChat)
                : 'Chat'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {isOpen && currentView === 'chat' && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleBackToList();
              }}
              sx={{ color: 'white' }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            sx={{ color: 'white' }}
          >
            {isOpen ? <ExpandMore /> : <ExpandLess />}
          </IconButton>
        </Box>
      </Box>

      {/* Content - Only show when open */}
      {isOpen && (
        <>
          {currentView === 'list' ? (
            // Chats list
            <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
              {chats.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No chats yet. Join a garden to start chatting!
                  </Typography>
                </Box>
              ) : (
                chats.map((chat) => (
                  <div key={chat.id}>
                    <ListItemButton onClick={() => handleSelectChat(chat)}>
                      <Avatar sx={{ mr: 2, bgcolor: theme.palette.secondary.main }}>
                        {chat.type === 'group' ? <GroupIcon /> : <PersonIcon />}
                      </Avatar>
                      <ListItemText
                        primary={
                          <Box
                            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          >
                            <Typography variant="subtitle2">{getChatDisplayName(chat)}</Typography>
                            {unreadCounts[chat.id] > 0 && (
                              <Badge 
                                badgeContent={unreadCounts[chat.id]} 
                                color="error"
                                max={99}
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                              {chat.lastMessage?.text || 'No messages yet'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatTimestamp(chat.lastMessage?.createdAt)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                    <Divider />
                  </div>
                ))
              )}
            </List>
          ) : (
            // Messages view
            <>
              <Box
                sx={{
                  flexGrow: 1,
                  overflow: 'auto',
                  p: 2,
                  bgcolor: theme.palette.background.default,
                }}
              >
                {messages.map((message) => {
                  const isOwn = message.senderId === firebaseUid;
                  const djangoUserId = message.senderId.replace('django_', '');
                  const userProfile = userProfiles[djangoUserId] || {};
                  const senderUsername = userProfile.username || `User ${djangoUserId}`;
                  const senderProfilePicture = userProfile.profile_picture;

                  return (
                    <Box
                      key={message.id}
                      sx={{
                        display: 'flex',
                        justifyContent: isOwn ? 'flex-end' : 'flex-start',
                        mb: 1,
                        alignItems: 'flex-start',
                      }}
                    >
                      {!isOwn && (
                        <Avatar
                          src={senderProfilePicture || '/default-avatar.png'}
                          sx={{
                            width: 32,
                            height: 32,
                            mr: 1,
                            bgcolor: '#8bc34a',
                            fontSize: '0.9rem',
                          }}
                        >
                          {senderUsername.charAt(0).toUpperCase()}
                        </Avatar>
                      )}
                      <Box sx={{ 
                        maxWidth: '70%', 
                        minWidth: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isOwn ? 'flex-end' : 'flex-start',
                      }}>
                        <Paper
                          elevation={1}
                          sx={{
                            py: 1,
                            px: 1.5,
                            bgcolor: isOwn 
                              ? theme.palette.primary.main 
                              : theme.palette.mode === 'dark' 
                                ? theme.palette.grey[800] 
                                : theme.palette.grey[100],
                            color: isOwn ? 'white' : 'text.primary',
                            width: 'fit-content',
                          }}
                        >
                          <Typography variant="body2" sx={{ textAlign: 'left', fontSize: "medium" }}>
                            {message.text}
                          </Typography>
                        </Paper>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mt: 0.3,
                            px: 0.5,
                            overflow: 'hidden',
                          }}
                        >
                          {!isOwn && (
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: "small",
                                fontWeight: 400,
                                color: theme.palette.text.secondary,
                                textAlign: 'left',
                                mr: 0,
                                p: 0,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                flexShrink: 1,
                              }}
                            >
                              {senderUsername} ·
                            </Typography>
                          )}
                          <Box sx={{ display: 'flex', alignItems: 'center', ml: isOwn ? 'auto' : 0, gap: 0.5 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: "small",
                                fontWeight: 400,
                                color: theme.palette.text.secondary,
                                textAlign: isOwn ? 'right' : 'left',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                              }}
                            >
                              {formatTimestamp(message.createdAt)}
                            </Typography>

                            {/* Read indicator for own messages */}
                            {isOwn && (() => {
                              const readBy = message.readBy || [];
                              let isRead = false;
                              if (selectedChat?.type === 'group') {
                                // For garden/group chats, require everyone to have read
                                const members = selectedChat.members || [];
                                isRead = members.length > 0 && members.every((m) => readBy.includes(m));
                              } else {
                                // Direct chat: read if the other member is in readBy
                                const other = selectedChat?.members?.find((m) => m !== firebaseUid);
                                isRead = other ? readBy.includes(other) : false;
                              }

                              return (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  {isRead ? (
                                    <DoneAllIcon sx={{ fontSize: 16, color: theme.palette.primary.light }} />
                                  ) : (
                                    <DoneAllIcon sx={{ fontSize: 16, color: theme.palette.text.disabled, opacity: 0.4 }} />
                                  )}
                                </Box>
                              );
                            })()}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
                <div ref={messagesEndRef} />
              </Box>

              {/* Message input */}
              <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim()}
                          >
                            <SendIcon />
                          </IconButton>
                        </InputAdornment>
                    ),
                    }
                  }}
                />
              </Box>
            </>
          )}
        </>
      )}
    </Paper>
  );
};

export default ChatWidget;
