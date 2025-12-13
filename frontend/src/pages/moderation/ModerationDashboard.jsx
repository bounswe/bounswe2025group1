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
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContextUtils';
import { useNavigate } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const ModerationDashboard = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewDialog, setReviewDialog] = useState({ open: false, report: null, isValid: false });
  const [viewContentDialog, setViewContentDialog] = useState({ open: false, content: null, contentType: null });
  const [userProfiles, setUserProfiles] = useState({}); // Store reporter usernames
  const [filter, setFilter] = useState('pending'); // pending, reviewed

  useEffect(() => {
    fetchReports();
  }, [token]);

  useEffect(() => {
    // Fetch user profiles for reporters
    if (reports.length > 0 && token) {
      fetchReporterProfiles();
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

  const handleSuspendUser = async (report) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/reports/${report.id}/suspend_user/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          suspension_days: 7,
          reason: report.description || '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to suspend user');
      }

      toast.success(t('moderation.userSuspended', 'User has been suspended'), {
        position: 'top-right',
      });
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        {t('moderation.title', 'Moderation Dashboard')}
      </Typography>

      <Paper sx={{ mb: 3 }}>
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
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('moderation.date', 'Date')}</TableCell>
                <TableCell>{t('moderation.reporter', 'Reporter')}</TableCell>
                <TableCell>{t('moderation.type', 'Type')}</TableCell>
                <TableCell>{t('moderation.reason', 'Reason')}</TableCell>
                <TableCell>{t('moderation.description', 'Description')}</TableCell>
                <TableCell>{t('moderation.status', 'Status')}</TableCell>
                <TableCell align="right">{t('moderation.actions', 'Actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    {t('moderation.noReports', 'No reports found')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {(() => {
                          const reporterId = typeof report.reporter === 'object' ? report.reporter.id : report.reporter;
                          const profile = userProfiles[reporterId];
                          return profile?.profile_picture ? (
                            <Avatar
                              src={profile.profile_picture}
                              sx={{ width: 24, height: 24 }}
                            />
                          ) : null;
                        })()}
                        <Typography variant="body2">
                          {getReporterUsername(report)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getContentTypeLabel(report.content_type)} 
                        size="small" 
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{getReasonLabel(report.reason)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {report.description || t('moderation.noDescription', 'No description')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {report.reviewed ? (
                        <Chip
                          label={report.is_valid ? t('moderation.valid', 'Valid (Removed)') : t('moderation.invalid', 'Invalid (Kept)')}
                          color={report.is_valid ? 'error' : 'success'}
                          size="small"
                        />
                      ) : (
                        <Chip label={t('moderation.pending', 'Pending')} color="warning" size="small" />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleViewContent(report)}
                          sx={{ minWidth: 'auto' }}
                        >
                          {t('moderation.view', 'View')}
                        </Button>
                        {!report.reviewed && (
                          <>
                            {report.content_type?.toLowerCase() === 'user' ? (
                              <>
                                <Button
                                  variant="outlined"
                                  color="warning"
                                  size="small"
                                  onClick={() => handleSuspendUser(report)}
                                >
                                  {t('moderation.suspend', 'Suspend')}
                                </Button>
                                <Button
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  onClick={() => handleBanUser(report)}
                                >
                                  {t('moderation.ban', 'Ban')}
                                </Button>
                                <Button
                                  variant="outlined"
                                  color="success"
                                  size="small"
                                  startIcon={<CancelIcon />}
                                  onClick={() => setReviewDialog({ open: true, report, isValid: false })}
                                >
                                  {t('moderation.dismiss', 'Dismiss')}
                                </Button>
                              </>
                            ) : report.content_type?.toLowerCase() === 'garden' ? (
                              <>
                                <Button
                                  variant="outlined"
                                  color="warning"
                                  size="small"
                                  onClick={() => handleHideGarden(report)}
                                >
                                  {t('moderation.hide', 'Hide')}
                                </Button>
                                <Button
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  onClick={() => handleDeleteGarden(report)}
                                >
                                  {t('moderation.delete', 'Delete')}
                                </Button>
                                <Button
                                  variant="outlined"
                                  color="success"
                                  size="small"
                                  startIcon={<CancelIcon />}
                                  onClick={() => setReviewDialog({ open: true, report, isValid: false })}
                                >
                                  {t('moderation.dismiss', 'Dismiss')}
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  startIcon={<CheckCircleIcon />}
                                  onClick={() => setReviewDialog({ open: true, report, isValid: true })}
                                >
                                  {t('moderation.accept', 'Accept')}
                                </Button>
                                <Button
                                  variant="outlined"
                                  color="success"
                                  size="small"
                                  startIcon={<CancelIcon />}
                                  onClick={() => setReviewDialog({ open: true, report, isValid: false })}
                                >
                                  {t('moderation.dismiss', 'Dismiss')}
                                </Button>
                              </>
                            )}
                          </>
                        )}
                        {report.reviewed && report.content_type?.toLowerCase() === 'garden' && report.is_valid && (
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            onClick={() => handleUnhideGarden(report)}
                          >
                            {t('moderation.unhide', 'Unhide')}
                          </Button>
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
    </Container>
  );
};

export default ModerationDashboard;

