import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContextUtils';

const ReportDialog = ({ open, onClose, contentType, objectId }) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [reason, setReason] = useState('abuse');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!contentType || !objectId) return;

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/reports/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          content_type: contentType,
          object_id: objectId,
          reason,
          description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.detail || t('common.errorOccurred');
        
        // Translate common backend error messages
        let translatedError = errorMessage;
        if (errorMessage.includes('already reported') || errorMessage.includes('You already reported')) {
          translatedError = t('report.alreadyReported', 'You have already reported this content.');
        }
        
        throw new Error(translatedError);
      }

      toast.success(t('report.success', 'Report submitted successfully!'), {
        position: 'top-right',
      });
      onClose();
      setDescription('');
      setReason('abuse');
    } catch (error) {
      console.error('Report error:', error);
      toast.error(error.message || t('report.error', 'Failed to submit report. Please try again.'), {
        position: 'top-right',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('report.title', 'Report Content')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          {t('report.instruction', 'Please provide a reason for reporting this content.')}
        </Typography>
        
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="report-reason-label">{t('report.reason', 'Reason')}</InputLabel>
          <Select
            labelId="report-reason-label"
            id="report-reason-select"
            value={reason}
            label={t('report.reason', 'Reason')}
            onChange={(e) => setReason(e.target.value)}
          >
            <MenuItem value="abuse">{t('report.abuse', 'Abusive or Harassing')}</MenuItem>
            <MenuItem value="spam">{t('report.spam', 'Spam or Misleading')}</MenuItem>
            <MenuItem value="illegal">{t('report.illegal', 'Illegal Content')}</MenuItem>
            <MenuItem value="other">{t('report.other', 'Other')}</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          multiline
          rows={4}
          label={t('report.description', 'Description (Optional)')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          variant="outlined"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          {t('common.cancel', 'Cancel')}
        </Button>
        <Button 
          onClick={handleSubmit} 
          color="error" 
          variant="contained"
          disabled={loading}
        >
          {loading ? t('common.submitting', 'Submitting...') : t('report.submit', 'Report')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportDialog;

