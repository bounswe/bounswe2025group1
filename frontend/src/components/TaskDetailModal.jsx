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
  CircularProgress,
  useTheme,
} from '@mui/material';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useAuth } from '../contexts/AuthContextUtils';
import { toast } from 'react-toastify';
import { createButtonKeyboardHandler, trapFocus } from '../utils/keyboardNavigation';
import { useTranslation } from 'react-i18next';
import { bgForStatus, iconColorForStatus } from '../utils/taskUtils';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const TaskDetailModal = ({ 
  open, 
  onClose, 
  task, 
  onTaskUpdated, 
  onTaskDeleted, 
  canEdit, 
  canDelete,
  handleAcceptTask,
  handleDeclineTask,
  onEditClick,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { token, user } = useAuth();
  const [taskData, setTaskData] = useState(task);
  const [loading, setLoading] = useState(false);
  const dialogRef = useRef(null);
  const focusableElementsRef = useRef([]);

  useEffect(() => {
    setTaskData(task);
  }, [task?.id]);

  useEffect(() => {
    if (open && task?.id && !taskData?.id) {
      fetchTaskDetails();
    }
  }, [open, task?.id]);

  const fetchTaskDetails = async () => {
    if (!taskData?.id || !token) return;

    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks/${taskData.id}/`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTaskData(data);
        if (onTaskUpdated) {
          onTaskUpdated(data);
        }
      }
    } catch (error) {
      console.error('Error fetching task details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('gardens.confirmDeleteTask'))) return;

    if (!taskData?.id || !token) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks/${taskData.id}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
      });

      if (response.ok || response.status === 204) {
        toast.success(t('gardens.taskDeleted'));
        if (onTaskDeleted) {
          onTaskDeleted(taskData.id);
        }
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || t('gardens.failedToDeleteTask');
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error(t('gardens.failedToDeleteTask'));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = dayjs(dateString);
    return date.format('MMMM D, YYYY [at] h:mm A');
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PENDING':
        return t('tasks.pending');
      case 'IN_PROGRESS':
        return t('tasks.in_progress');
      case 'COMPLETED':
        return t('tasks.completed');
      case 'DECLINED':
        return t('tasks.declined');
      default:
        return status;
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleAccept = async () => {
    if (handleAcceptTask && taskData) {
      await handleAcceptTask(taskData);
      // Parent will update task data via props
    }
  };

  const handleDecline = async () => {
    if (handleDeclineTask && taskData) {
      await handleDeclineTask(taskData);
      // Parent will update task data via props
    }
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

  if (!taskData) return null;

  const canAcceptOrDecline = 
    user && 
    taskData.assigned_to && 
    Array.isArray(taskData.assigned_to) &&
    taskData.assigned_to.includes(user.user_id) && 
    taskData.status === 'PENDING';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-detail-title"
    >
      <DialogTitle 
        id="task-detail-title"
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1 
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
          <TaskAltIcon color="primary" />
          <Typography variant="h6" component="span">
            {taskData.title}
          </Typography>
        </Box>
        <Chip
          label={getStatusLabel(taskData.status)}
          size="small"
          sx={{
            backgroundColor: bgForStatus(taskData.status, theme),
            color: iconColorForStatus(taskData.status),
            fontWeight: 'bold',
          }}
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
              {taskData.description && (
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {taskData.description}
                </Typography>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarTodayIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    <strong>{t('tasks.deadline')}:</strong>{' '}
                    {taskData.due_date ? formatDate(taskData.due_date) : t('tasks.notAssigned')}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PeopleIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    <strong>{t('tasks.assignee')}:</strong>{' '}
                    {taskData.assigned_to_usernames && taskData.assigned_to_usernames.length > 0
                      ? taskData.assigned_to_usernames.join(', ')
                      : t('tasks.unassigned')}
                  </Typography>
                </Box>

                {(taskData.custom_type_name || (taskData.custom_type && typeof taskData.custom_type === 'object' && taskData.custom_type.name)) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CategoryIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      <strong>{t('tasks.taskType')}:</strong>{' '}
                      {taskData.custom_type_name || (taskData.custom_type?.name)}
                    </Typography>
                  </Box>
                )}

                {taskData.created_at && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Created:</strong>{' '}
                      {formatDate(taskData.created_at)}
                    </Typography>
                  </Box>
                )}

                {taskData.updated_at && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Updated:</strong>{' '}
                      {formatDate(taskData.updated_at)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {canAcceptOrDecline && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
                    {t('tasks.acceptTask')} / {t('tasks.declineTask')}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={handleAccept}
                      sx={{
                        flex: { xs: '1 1 100%', sm: '1 1 auto' },
                        '&:focus': {
                          outline: '2px solid #4caf50',
                          outlineOffset: '2px',
                        },
                      }}
                    >
                      {t('tasks.acceptTask')}
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={handleDecline}
                      sx={{
                        flex: { xs: '1 1 100%', sm: '1 1 auto' },
                        '&:focus': {
                          outline: '2px solid #f44336',
                          outlineOffset: '2px',
                        },
                      }}
                    >
                      {t('tasks.declineTask')}
                    </Button>
                  </Box>
                </Box>
              </>
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
            onKeyDown={createButtonKeyboardHandler(handleDelete)}
            sx={{
              '&:focus': {
                outline: '2px solid #f44336',
                outlineOffset: '2px',
              },
            }}
          >
            {t('tasks.deleteTask')}
          </Button>
        )}
        {canEdit && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<EditIcon />}
            onClick={onEditClick}
            onKeyDown={createButtonKeyboardHandler(onEditClick)}
            sx={{
              '&:focus': {
                outline: '2px solid #1976d2',
                outlineOffset: '2px',
              },
            }}
          >
            {t('tasks.editTask')}
          </Button>
        )}
        <Button
          variant="outlined"
          onClick={handleClose}
          onKeyDown={createButtonKeyboardHandler(handleClose)}
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

export default TaskDetailModal;

