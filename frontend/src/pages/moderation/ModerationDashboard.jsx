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
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContextUtils';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';

const ModerationDashboard = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewDialog, setReviewDialog] = useState({ open: false, report: null, isValid: false });
  const [filter, setFilter] = useState('pending'); // pending, reviewed

  useEffect(() => {
    fetchReports();
  }, [token]);

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
                    <TableCell>{report.reporter?.username || report.reporter}</TableCell>
                    <TableCell>
                        <Chip label={report.content_type} size="small" />
                        <Typography variant="caption" display="block">ID: {report.object_id}</Typography>
                    </TableCell>
                    <TableCell>{getReasonLabel(report.reason)}</TableCell>
                    <TableCell>{report.description}</TableCell>
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
                      {!report.reviewed && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
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
                        </Box>
                      )}
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
    </Container>
  );
};

export default ModerationDashboard;

