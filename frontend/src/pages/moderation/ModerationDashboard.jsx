import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Box,
  Tabs,
  Tab,
  Link,
  Card,
  CardContent,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
  ButtonGroup,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContextUtils';
import { useNavigate } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import BlockIcon from '@mui/icons-material/Block';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import PersonOffIcon from '@mui/icons-material/PersonOff';

const ModerationDashboard = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewDialog, setReviewDialog] = useState({ open: false, report: null, isValid: false });
  const [viewContentDialog, setViewContentDialog] = useState({ open: false, content: null, contentType: null });
  const [suspendDialog, setSuspendDialog] = useState({
    open: false,
    report: null,
    reason: '',
    days: 7
  });
  const [userProfiles, setUserProfiles] = useState({}); // Store reporter usernames
  const [reportedContent, setReportedContent] = useState({}); // Store reported content info
  const [filter, setFilter] = useState('pending'); // pending, reviewed

  useEffect(() => {
    fetchReports();
  }, [token]);

  useEffect(() => {
    // Fetch user profiles for reporters and reported content
    if (reports.length > 0 && token) {
      fetchReporterProfiles();
      fetchReportedContent();
    }
  }, [reports, token]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/reports/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error(t('moderation.fetchError', 'Failed to load reports'), {
        position: 'top-right',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReporterProfiles = async () => {
    const userIdsToFetch = new Set();
    
    // Collect unique reporter IDs
    reports.forEach((report) => {
      const reporterId = typeof report.reporter === 'object' ? report.reporter.id : report.reporter;
      if (reporterId && !userProfiles[reporterId]) {
        userIdsToFetch.add(reporterId);
      }
    });

    if (userIdsToFetch.size === 0) return;

    // Fetch user profiles in parallel
    const profilePromises = Array.from(userIdsToFetch).map(async (userId) => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/profile/${userId}/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          return {
            userId,
            username: data.username || `User ${userId}`,
            profile_picture: data.profile?.profile_picture || null,
          };
        }
      } catch (error) {
        console.error(`Error fetching profile for user ${userId}:`, error);
      }
      return {
        userId,
        username: `User ${userId}`,
        profile_picture: null,
      };
    });

    const profiles = await Promise.all(profilePromises);
    const newProfiles = { ...userProfiles };
    profiles.forEach((profile) => {
      if (profile) {
        newProfiles[profile.userId] = {
          username: profile.username,
          profile_picture: profile.profile_picture,
        };
      }
    });
    setUserProfiles(newProfiles);
  };

  const fetchReportedContent = async () => {
    const contentToFetch = [];
    const userIdsToFetch = new Set();
    
    // Collect unique reported content that needs fetching
    reports.forEach((report) => {
      const contentType = report.content_type?.toLowerCase();
      const objectId = report.object_id;
      const contentKey = `${contentType}_${objectId}`;
      
      if (contentType && objectId && !reportedContent[contentKey]) {
        contentToFetch.push({ contentType, objectId, contentKey });
        
        // For non-user content, we'll need to fetch the author/creator
        if (contentType !== 'user') {
          // We'll extract author ID from the fetched content
        }
      }
    });

    if (contentToFetch.length === 0) return;

    // Fetch reported content in parallel
    const contentPromises = contentToFetch.map(async ({ contentType, objectId, contentKey }) => {
      try {
        let url = '';
        if (contentType === 'user') {
          url = `${import.meta.env.VITE_API_URL}/profile/${objectId}/`;
        } else if (contentType === 'forumpost') {
          url = `${import.meta.env.VITE_API_URL}/forum/${objectId}/`;
        } else if (contentType === 'comment') {
          url = `${import.meta.env.VITE_API_URL}/forum/comments/${objectId}/`;
        } else if (contentType === 'garden') {
          url = `${import.meta.env.VITE_API_URL}/gardens/${objectId}/`;
        } else {
          return null;
        }

        const response = await fetch(url, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          // Extract author/creator information
          let authorId = null;
          let authorUsername = null;
          let authorProfilePicture = null;
          
          if (contentType === 'user') {
            authorId = objectId;
            // For user reports, use username directly from UserSerializer
            authorUsername = data.username || `User ${objectId}`;
            authorProfilePicture = data.profile?.profile_picture;
          } else if (contentType === 'forumpost') {
            authorId = typeof data.author === 'object' ? data.author.id : data.author;
            authorUsername = data.author_username;
            authorProfilePicture = data.author_profile_picture;
          } else if (contentType === 'comment') {
            authorId = typeof data.author === 'object' ? data.author.id : data.author;
            authorUsername = data.author_username;
            authorProfilePicture = data.author_profile_picture;
          } else if (contentType === 'garden') {
            // For gardens, fetch the manager
            try {
              const gardenResponse = await fetch(`${import.meta.env.VITE_API_URL}/gardens/${objectId}/members/`, {
                headers: {
                  Authorization: `Token ${token}`,
                },
              });
              if (gardenResponse.ok) {
                const members = await gardenResponse.json();
                const manager = members.find(m => m.role === 'MANAGER');
                if (manager) {
                  authorId = manager.user_id || (typeof manager.user === 'object' ? manager.user.id : manager.user);
                  authorUsername = manager.username;
                }
              }
            } catch (error) {
              console.error(`Error fetching garden manager for ${objectId}:`, error);
            }
          }
          
          if (authorId) {
            userIdsToFetch.add(authorId);
          }
          
          return { 
            contentKey, 
            data, 
            contentType,
            authorId,
            authorUsername,
            authorProfilePicture
          };
        }
      } catch (error) {
        console.error(`Error fetching reported content ${contentKey}:`, error);
      }
      return null;
    });

    const contents = await Promise.all(contentPromises);
    
    // Fetch author profiles for all unique authors
    const authorProfilePromises = Array.from(userIdsToFetch).map(async (userId) => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/profile/${userId}/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          return {
            userId,
            username: data.username || `User ${userId}`,
            profile_picture: data.profile?.profile_picture || null,
          };
        }
      } catch (error) {
        console.error(`Error fetching author profile for user ${userId}:`, error);
      }
      return {
        userId,
        username: `User ${userId}`,
        profile_picture: null,
      };
    });
    
    const authorProfiles = await Promise.all(authorProfilePromises);
    const authorProfilesMap = {};
    authorProfiles.forEach((profile) => {
      if (profile) {
        authorProfilesMap[profile.userId] = {
          username: profile.username,
          profile_picture: profile.profile_picture,
        };
      }
    });
    
    // Combine content with author info
    const newContent = { ...reportedContent };
    contents.forEach((content) => {
      if (content) {
        const authorInfo = content.authorId ? authorProfilesMap[content.authorId] : null;
        // For user reports, prioritize the username from the initial fetch (content.authorUsername)
        // For other content types, use the fetched author profile username
        const finalUsername = content.contentType === 'user' 
          ? (content.authorUsername || authorInfo?.username || `User ${content.authorId}`)
          : (authorInfo?.username || content.authorUsername || `User ${content.authorId}`);
        
        newContent[content.contentKey] = {
          data: content.data,
          contentType: content.contentType,
          authorId: content.authorId,
          authorUsername: finalUsername,
          authorProfilePicture: authorInfo?.profile_picture || content.authorProfilePicture || null,
        };
      }
    });
    setReportedContent(newContent);
  };

  const getReportedUserDisplay = (report) => {
    const contentType = report.content_type?.toLowerCase();
    const objectId = report.object_id;
    const contentKey = `${contentType}_${objectId}`;
    const content = reportedContent[contentKey];

    if (!content) {
      return t('moderation.loading', 'Loading...');
    }

    return {
      username: content.authorUsername || `User ${content.authorId}`,
      profilePicture: content.authorProfilePicture,
    };
  };

  const handleReview = async () => {
    const { report, isValid } = reviewDialog;
    if (!report) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/reports/${report.id}/review/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ is_valid: isValid }),
      });

      if (!response.ok) {
        throw new Error('Failed to review report');
      }

      toast.success(t('moderation.reviewSuccess', 'Report reviewed successfully'), {
        position: 'top-right',
      });
      setReviewDialog({ open: false, report: null, isValid: false });
      fetchReports(); // Refresh list
    } catch (error) {
      console.error('Error reviewing report:', error);
      toast.error(t('moderation.reviewError', 'Failed to submit review'), {
        position: 'top-right',
      });
    }
  };

  const filteredReports = reports.filter((report) => {
    if (filter === 'pending') return !report.reviewed;
    if (filter === 'reviewed') return report.reviewed;
    return true;
  });

  const getReasonLabel = (reason) => {
    const reasons = {
      abuse: t('report.abuse', 'Abusive'),
      spam: t('report.spam', 'Spam'),
      illegal: t('report.illegal', 'Illegal'),
      other: t('report.other', 'Other'),
    };
    return reasons[reason] || reason;
  };

  const getContentTypeLabel = (contentType) => {
    const typeMap = {
      forumpost: t('moderation.typeForumPost', 'Forum Post'),
      comment: t('moderation.typeComment', 'Comment'),
      garden: t('moderation.typeGarden', 'Garden'),
      event: t('moderation.typeEvent', 'Event'),
      task: t('moderation.typeTask', 'Task'),
      user: t('moderation.typeUser', 'User'),
    };
    // Convert to lowercase for matching
    const normalizedType = contentType?.toLowerCase() || '';
    return typeMap[normalizedType] || contentType || t('moderation.typeUnknown', 'Unknown');
  };

  const getReporterUsername = (report) => {
    // First check if backend provides reporter_username directly
    if (report.reporter_username) {
      return report.reporter_username;
    }
    
    const reporterId = typeof report.reporter === 'object' ? report.reporter.id : report.reporter;
    if (userProfiles[reporterId]) {
      return userProfiles[reporterId].username;
    }
    // Fallback to username if reporter is an object with username
    if (typeof report.reporter === 'object' && report.reporter.username) {
      return report.reporter.username;
    }
    return reporterId ? `User ${reporterId}` : t('moderation.unknownReporter', 'Unknown');
  };

  const handleViewContent = async (report) => {
    try {
      const contentType = report.content_type?.toLowerCase();
      const objectId = report.object_id;

      if (contentType === 'forumpost') {
        // For forum posts, navigate directly
        navigate(`/forum/${objectId}`);
      } else if (contentType === 'comment') {
        // For comments, fetch the comment to get the parent post ID
        const response = await fetch(`${import.meta.env.VITE_API_URL}/forum/comments/${objectId}/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });

        if (response.ok) {
          const commentData = await response.json();
          // Navigate to the forum post page (the comment will be visible there)
          navigate(`/forum/${commentData.forum_post}`);
        } else {
          // If we can't fetch the comment, try to show it in a dialog
          fetchContentForPreview(report);
        }
      } else if (contentType === 'user') {
        // For users, navigate to their profile
        navigate(`/profile/${objectId}`);
      } else if (contentType === 'garden') {
        // For gardens, navigate directly
        navigate(`/gardens/${objectId}`);
      } else {
        // For other content types, try to fetch and show in preview
        fetchContentForPreview(report);
      }
    } catch (error) {
      console.error('Error viewing content:', error);
      toast.error(t('moderation.viewContentError', 'Failed to load content'), {
        position: 'top-right',
      });
    }
  };

  const fetchContentForPreview = async (report) => {
    try {
      const contentType = report.content_type?.toLowerCase();
      const objectId = report.object_id;
      let contentData = null;
      let url = '';

      if (contentType === 'forumpost') {
        url = `${import.meta.env.VITE_API_URL}/forum/${objectId}/`;
      } else if (contentType === 'comment') {
        url = `${import.meta.env.VITE_API_URL}/forum/comments/${objectId}/`;
      } else if (contentType === 'user') {
        url = `${import.meta.env.VITE_API_URL}/profile/${objectId}/`;
      } else if (contentType === 'garden') {
        url = `${import.meta.env.VITE_API_URL}/gardens/${objectId}/`;
      } else {
        toast.error(t('moderation.unsupportedContentType', 'Content type not supported for preview'), {
          position: 'top-right',
        });
        return;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      if (response.ok) {
        contentData = await response.json();
        setViewContentDialog({
          open: true,
          content: contentData,
          contentType: contentType,
        });
      } else {
        toast.error(t('moderation.contentNotFound', 'Content not found or has been deleted'), {
          position: 'top-right',
        });
      }
    } catch (error) {
      console.error('Error fetching content for preview:', error);
      toast.error(t('moderation.fetchContentError', 'Failed to fetch content'), {
        position: 'top-right',
      });
    }
  };

  const handleOpenSuspendDialog = (report) => {
    setSuspendDialog({
      open: true,
      report,
      reason: '',
      days: 7
    });
  };

  const handleCloseSuspendDialog = () => {
    setSuspendDialog({
      open: false,
      report: null,
      reason: '',
      days: 7
    });
  };

  const handleSuspendUser = async () => {
    const { report, reason, days } = suspendDialog;
    if (!report) return;

    if (!reason.trim()) {
      toast.error(t('moderation.reasonRequired', 'Please enter a suspension reason'), {
        position: 'top-right',
      });
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/reports/${report.id}/suspend_user/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          suspension_days: days,
          reason: reason,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to suspend user');
      }

      toast.success(t('moderation.userSuspended', 'User has been suspended'), {
        position: 'top-right',
      });
      handleCloseSuspendDialog();
      fetchReports(); // Refresh list
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error(t('moderation.suspendError', 'Failed to suspend user'), {
        position: 'top-right',
      });
    }
  };

  const handleBanUser = async (report) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/reports/${report.id}/ban_user/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          reason: report.description || '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to ban user');
      }

      toast.success(t('moderation.userBanned', 'User has been banned'), {
        position: 'top-right',
      });
      fetchReports(); // Refresh list
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error(t('moderation.banError', 'Failed to ban user'), {
        position: 'top-right',
      });
    }
  };

  const handleHideGarden = async (report) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/reports/${report.id}/hide_garden/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          reason: report.description || '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to hide garden');
      }

      toast.success(t('moderation.gardenHidden', 'Garden has been hidden'), {
        position: 'top-right',
      });
      fetchReports(); // Refresh list
    } catch (error) {
      console.error('Error hiding garden:', error);
      toast.error(t('moderation.hideGardenError', 'Failed to hide garden'), {
        position: 'top-right',
      });
    }
  };

  const handleUnhideGarden = async (report) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/reports/${report.id}/unhide_garden/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to unhide garden');
      }

      toast.success(t('moderation.gardenUnhidden', 'Garden has been unhidden'), {
        position: 'top-right',
      });
      fetchReports(); // Refresh list
    } catch (error) {
      console.error('Error unhiding garden:', error);
      toast.error(t('moderation.unhideGardenError', 'Failed to unhide garden'), {
        position: 'top-right',
      });
    }
  };

  const handleUnsuspendUser = async (report) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/reports/${report.id}/unsuspend_user/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to unsuspend user');
      }

      toast.success(t('moderation.userUnsuspended', 'User has been unsuspended'), {
        position: 'top-right',
      });
      fetchReports(); // Refresh list
    } catch (error) {
      console.error('Error unsuspending user:', error);
      toast.error(t('moderation.unsuspendError', 'Failed to unsuspend user'), {
        position: 'top-right',
      });
    }
  };

  const handleDeleteGarden = async (report) => {
    if (!window.confirm(t('moderation.confirmDeleteGarden', 'Are you sure you want to delete this garden? This action cannot be undone.'))) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/reports/${report.id}/delete_garden/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete garden');
      }

      toast.success(t('moderation.gardenDeleted', 'Garden has been deleted'), {
        position: 'top-right',
      });
      fetchReports(); // Refresh list
    } catch (error) {
      console.error('Error deleting garden:', error);
      toast.error(t('moderation.deleteGardenError', 'Failed to delete garden'), {
        position: 'top-right',
      });
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          py: 2,
          px: { xs: 2, sm: 3 },
          overflow: 'hidden',
        }}
      >
        <Typography variant="h4" sx={{ mb: 2, flexShrink: 0 }}>
          {t('moderation.title', 'Moderation Dashboard')}
        </Typography>

        <Paper sx={{ mb: 2, flexShrink: 0 }}>
          <Tabs
            value={filter}
            onChange={(e, newValue) => setFilter(newValue)}
            indicatorColor="primary"
            textColor="primary"
            centered
          >
            <Tab label={t('moderation.pending', 'Pending Reviews')} value="pending" />
            <Tab label={t('moderation.reviewed', 'Reviewed History')} value="reviewed" />
          </Tabs>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer
            component={Paper}
            sx={{
              flex: 1,
              overflow: 'auto',
              boxShadow: 2,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Table stickyHeader sx={{ width: '100%' }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper', py: 1.5, fontSize: '0.875rem' }}>{t('moderation.date', 'Date')}</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper', py: 1.5, fontSize: '0.875rem' }}>{t('moderation.reporter', 'Reporter')}</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper', py: 1.5, fontSize: '0.875rem' }}>{t('moderation.reported', 'Reported')}</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper', py: 1.5, fontSize: '0.875rem' }}>{t('moderation.type', 'Type')}</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper', py: 1.5, fontSize: '0.875rem' }}>{t('moderation.reason', 'Reason')}</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper', minWidth: 150, maxWidth: 200, py: 1.5, fontSize: '0.875rem' }}>{t('moderation.description', 'Description')}</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper', py: 1.5, fontSize: '0.875rem' }}>{t('moderation.status', 'Status')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, bgcolor: 'background.paper', minWidth: 160, py: 1.5, fontSize: '0.875rem' }}>{t('moderation.actions', 'Actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    {t('moderation.noReports', 'No reports found')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredReports.map((report) => (
                  <TableRow 
                    key={report.id}
                    sx={{ 
                      '&:hover': { bgcolor: 'action.hover' },
                      transition: 'background-color 0.2s',
                      '& td': { py: 1, fontSize: '0.875rem' }
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(report.created_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {(() => {
                          const reporterId = typeof report.reporter === 'object' ? report.reporter.id : report.reporter;
                          const profile = userProfiles[reporterId];
                          return profile?.profile_picture ? (
                            <Avatar
                              src={profile.profile_picture}
                              sx={{ width: 28, height: 28 }}
                            />
                          ) : null;
                        })()}
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {getReporterUsername(report)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {report.reported_username || t('moderation.unknownUser', 'Unknown')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getContentTypeLabel(report.content_type)} 
                        size="small" 
                        color="primary"
                        variant="outlined"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getReasonLabel(report.reason)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip 
                        title={report.description || t('moderation.noDescription', 'No description')} 
                        arrow
                        placement="top"
                      >
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            maxWidth: 180, 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: report.description ? 'text.primary' : 'text.secondary',
                            fontStyle: report.description ? 'normal' : 'italic',
                            fontSize: '0.875rem'
                          }}
                        >
                          {report.description || t('moderation.noDescription', 'No description')}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {report.reviewed ? (
                        <Chip
                          label={report.is_valid ? t('moderation.valid', 'Valid (Removed)') : t('moderation.invalid', 'Invalid (Kept)')}
                          color={report.is_valid ? 'error' : 'success'}
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                      ) : (
                        <Chip 
                          label={t('moderation.pending', 'Pending')} 
                          color="warning" 
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ minWidth: 160 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                        {/* View Button - Always visible */}
                        <Tooltip title={t('moderation.view', 'View')}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewContent(report)}
                            sx={{ 
                              border: '1px solid',
                              borderColor: 'primary.main',
                              '&:hover': {
                                bgcolor: 'primary.light',
                                borderColor: 'primary.dark',
                              }
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {/* Action Buttons - Only for pending reports */}
                        {!report.reviewed && (
                          <Box sx={{ display: 'flex', gap: 0.5, ml: 0.5, borderLeft: '1px solid', borderColor: 'divider', pl: 0.5 }}>
                            {report.content_type?.toLowerCase() === 'user' ? (
                              <>
                                <Tooltip title={t('moderation.suspend', 'Suspend')}>
                                  <IconButton
                                    size="small"
                                    color="warning"
                                    onClick={() => handleOpenSuspendDialog(report)}
                                    sx={{
                                      border: '1px solid',
                                      borderColor: 'warning.main',
                                      '&:hover': { bgcolor: 'warning.light' }
                                    }}
                                  >
                                    <BlockIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={t('moderation.ban', 'Ban')}>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleBanUser(report)}
                                    sx={{ 
                                      border: '1px solid',
                                      borderColor: 'error.main',
                                      '&:hover': { bgcolor: 'error.light' }
                                    }}
                                  >
                                    <BlockIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={t('moderation.reject', 'Reject')}>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => setReviewDialog({ open: true, report, isValid: false })}
                                    sx={{ 
                                      border: '1px solid',
                                      borderColor: 'error.main',
                                      '&:hover': { bgcolor: 'error.light' }
                                    }}
                                  >
                                    <CancelIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            ) : report.content_type?.toLowerCase() === 'garden' ? (
                              <>
                                <Tooltip title={t('moderation.hide', 'Hide')}>
                                  <IconButton
                                    size="small"
                                    color="warning"
                                    onClick={() => handleHideGarden(report)}
                                    sx={{ 
                                      border: '1px solid',
                                      borderColor: 'warning.main',
                                      '&:hover': { bgcolor: 'warning.light' }
                                    }}
                                  >
                                    <VisibilityOffIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={t('moderation.delete', 'Delete')}>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteGarden(report)}
                                    sx={{ 
                                      border: '1px solid',
                                      borderColor: 'error.main',
                                      '&:hover': { bgcolor: 'error.light' }
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={t('moderation.reject', 'Reject')}>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => setReviewDialog({ open: true, report, isValid: false })}
                                    sx={{ 
                                      border: '1px solid',
                                      borderColor: 'error.main',
                                      '&:hover': { bgcolor: 'error.light' }
                                    }}
                                  >
                                    <CancelIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            ) : (
                              <>
                                <Tooltip title={t('moderation.accept', 'Accept')}>
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => setReviewDialog({ open: true, report, isValid: true })}
                                    sx={{ 
                                      border: '1px solid',
                                      borderColor: 'success.main',
                                      '&:hover': { bgcolor: 'success.light' }
                                    }}
                                  >
                                    <CheckCircleIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={t('moderation.reject', 'Reject')}>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => setReviewDialog({ open: true, report, isValid: false })}
                                    sx={{ 
                                      border: '1px solid',
                                      borderColor: 'error.main',
                                      '&:hover': { bgcolor: 'error.light' }
                                    }}
                                  >
                                    <CancelIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Box>
                        )}

                        {/* Unhide Button - For reviewed and hidden gardens */}
                        {report.reviewed && report.content_type?.toLowerCase() === 'garden' && report.is_valid && (
                          <Tooltip title={t('moderation.unhide', 'Unhide')}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleUnhideGarden(report)}
                              sx={{ 
                                ml: 0.5,
                                borderLeft: '1px solid',
                                borderColor: 'divider',
                                pl: 0.5,
                                border: '1px solid',
                                borderColor: 'primary.main',
                                '&:hover': { bgcolor: 'primary.light' }
                              }}
                            >
                              <LockOpenIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Unsuspend Button - For reviewed and suspended users */}
                        {report.reviewed && report.content_type?.toLowerCase() === 'user' && report.is_valid && (
                          <Tooltip title={t('moderation.unsuspend', 'Unsuspend')}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleUnsuspendUser(report)}
                              sx={{ 
                                ml: 0.5,
                                borderLeft: '1px solid',
                                borderColor: 'divider',
                                pl: 0.5,
                                border: '1px solid',
                                borderColor: 'primary.main',
                                '&:hover': { bgcolor: 'primary.light' }
                              }}
                            >
                              <PersonOffIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        )}
      </Container>

      <Dialog
        open={reviewDialog.open}
        onClose={() => setReviewDialog({ open: false, report: null, isValid: false })}
      >
        <DialogTitle>
          {reviewDialog.isValid
            ? t('moderation.confirmAcceptTitle', 'Confirm Report Validity')
            : t('moderation.confirmDismissTitle', 'Confirm Report Dismissal')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {reviewDialog.isValid
              ? t('moderation.confirmAcceptText', 'Are you sure this content is inappropriate? Accepting this report will remove the content.')
              : t('moderation.confirmDismissText', 'Are you sure this content is safe? Dismissing this report will keep the content visible.')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog({ open: false, report: null, isValid: false })}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleReview}
            color={reviewDialog.isValid ? 'error' : 'primary'}
            variant="contained"
            autoFocus
          >
            {t('common.confirm', 'Confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Content Preview Dialog */}
      <Dialog
        open={viewContentDialog.open}
        onClose={() => setViewContentDialog({ open: false, content: null, contentType: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {t('moderation.contentPreview', 'Content Preview')}
        </DialogTitle>
        <DialogContent>
          {viewContentDialog.content && (
            <Box>
              {viewContentDialog.contentType === 'forumpost' && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {viewContentDialog.content.title}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {viewContentDialog.content.content}
                    </Typography>
                    {viewContentDialog.content.author_username && (
                      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {t('moderation.author', 'Author')}: {viewContentDialog.content.author_username}
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<OpenInNewIcon />}
                        onClick={() => {
                          navigate(`/forum/${viewContentDialog.content.id}`);
                          setViewContentDialog({ open: false, content: null, contentType: null });
                        }}
                      >
                        {t('moderation.openInNewTab', 'Open Full Post')}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              )}
              {viewContentDialog.contentType === 'comment' && (
                <Card>
                  <CardContent>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {viewContentDialog.content.content}
                    </Typography>
                    {viewContentDialog.content.author_username && (
                      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {t('moderation.author', 'Author')}: {viewContentDialog.content.author_username}
                        </Typography>
                      </Box>
                    )}
                    {viewContentDialog.content.forum_post && (
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="contained"
                          startIcon={<OpenInNewIcon />}
                          onClick={() => {
                            navigate(`/forum/${viewContentDialog.content.forum_post}`);
                            setViewContentDialog({ open: false, content: null, contentType: null });
                          }}
                        >
                          {t('moderation.viewParentPost', 'View Parent Post')}
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )}
              {viewContentDialog.contentType === 'user' && (
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar 
                        src={viewContentDialog.content.profile?.profile_picture || '/default-avatar.png'}
                        sx={{ width: 64, height: 64 }}
                      >
                        {viewContentDialog.content.username?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          {viewContentDialog.content.username}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {viewContentDialog.content.email}
                        </Typography>
                        {viewContentDialog.content.profile?.location && (
                          <Typography variant="caption" color="text.secondary">
                            {viewContentDialog.content.profile.location}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        {t('moderation.profileInfo', 'Profile Information')}
                      </Typography>
                      <Typography variant="body2">
                        <strong>{t('moderation.role', 'Role')}:</strong> {viewContentDialog.content.profile?.role || 'MEMBER'}
                      </Typography>
                      {viewContentDialog.content.profile?.is_suspended && (
                        <Typography variant="body2" color="warning.main">
                          <strong>{t('moderation.status', 'Status')}:</strong> {t('moderation.suspended', 'Suspended')}
                          {viewContentDialog.content.profile.suspension_reason && (
                            <> - {viewContentDialog.content.profile.suspension_reason}</>
                          )}
                        </Typography>
                      )}
                      {viewContentDialog.content.profile?.is_banned && (
                        <Typography variant="body2" color="error.main">
                          <strong>{t('moderation.status', 'Status')}:</strong> {t('moderation.banned', 'Banned')}
                          {viewContentDialog.content.profile.ban_reason && (
                            <> - {viewContentDialog.content.profile.ban_reason}</>
                          )}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<OpenInNewIcon />}
                        onClick={() => {
                          navigate(`/profile/${viewContentDialog.content.id}`);
                          setViewContentDialog({ open: false, content: null, contentType: null });
                        }}
                      >
                        {t('moderation.viewProfile', 'View Full Profile')}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              )}
              {viewContentDialog.contentType === 'garden' && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {viewContentDialog.content.name}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                      {viewContentDialog.content.description || t('moderation.noDescription', 'No description')}
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>{t('moderation.location', 'Location')}:</strong> {viewContentDialog.content.location || t('moderation.notSpecified', 'Not specified')}
                      </Typography>
                      {viewContentDialog.content.members_count !== undefined && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          <strong>{t('moderation.members', 'Members')}:</strong> {viewContentDialog.content.members_count}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        <strong>{t('moderation.visibility', 'Visibility')}:</strong> {viewContentDialog.content.is_public ? t('moderation.public', 'Public') : t('moderation.private', 'Private')}
                      </Typography>
                      {viewContentDialog.content.is_hidden && (
                        <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
                          <strong>{t('moderation.status', 'Status')}:</strong> {t('moderation.hidden', 'Hidden')}
                          {viewContentDialog.content.hidden_reason && (
                            <> - {viewContentDialog.content.hidden_reason}</>
                          )}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<OpenInNewIcon />}
                        onClick={() => {
                          navigate(`/gardens/${viewContentDialog.content.id}`);
                          setViewContentDialog({ open: false, content: null, contentType: null });
                        }}
                      >
                        {t('moderation.viewGarden', 'View Full Garden')}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewContentDialog({ open: false, content: null, contentType: null })}>
            {t('common.close', 'Close')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Suspend User Dialog */}
      <Dialog
        open={suspendDialog.open}
        onClose={handleCloseSuspendDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {t('moderation.suspendUserTitle', 'Suspend User')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {t('moderation.suspendUserDescription', 'Enter a reason for the suspension that will be shown to the user, and select the suspension duration.')}
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label={t('moderation.suspensionReason', 'Suspension Reason')}
            placeholder={t('moderation.suspensionReasonPlaceholder', 'Explain why this user is being suspended...')}
            fullWidth
            multiline
            rows={3}
            value={suspendDialog.reason}
            onChange={(e) => setSuspendDialog(prev => ({ ...prev, reason: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>{t('moderation.suspensionDuration', 'Suspension Duration')}</InputLabel>
            <Select
              value={suspendDialog.days}
              label={t('moderation.suspensionDuration', 'Suspension Duration')}
              onChange={(e) => setSuspendDialog(prev => ({ ...prev, days: e.target.value }))}
            >
              <MenuItem value={1}>{t('moderation.days1', '1 Day')}</MenuItem>
              <MenuItem value={3}>{t('moderation.days3', '3 Days')}</MenuItem>
              <MenuItem value={7}>{t('moderation.days7', '7 Days')}</MenuItem>
              <MenuItem value={14}>{t('moderation.days14', '14 Days')}</MenuItem>
              <MenuItem value={30}>{t('moderation.days30', '30 Days')}</MenuItem>
              <MenuItem value={90}>{t('moderation.days90', '90 Days')}</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSuspendDialog}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleSuspendUser}
            color="warning"
            variant="contained"
          >
            {t('moderation.confirmSuspend', 'Suspend User')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ModerationDashboard;

