import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  Fade,
  Backdrop,
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  CircularProgress,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../contexts/AuthContextUtils';
import { createFormKeyboardHandler, createButtonKeyboardHandler, trapFocus } from '../utils/keyboardNavigation';
import { useTranslation } from 'react-i18next';

const TaskModal = ({
  open,
  onClose,
  onSubmit,
  onDelete,
  handleAcceptTask,
  handleDeclineTask,
  mode = 'create',
  task,
  gardenId, // Current garden ID for creating tasks
}) => {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  // Initialize with default empty values
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'PENDING',
    assigned_to: null,
    custom_type: null,
    garden: parseInt(gardenId),
    ...(task || {}),
  });

  // States for data from API
  const [gardenMembers, setGardenMembers] = useState([]);
  const [customTaskTypes, setCustomTaskTypes] = useState([]);

  // Loading states
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingTaskTypes, setLoadingTaskTypes] = useState(false);

  const [deadline, setDeadline] = useState(task?.due_date ? dayjs(task.due_date) : dayjs());

  const [newTaskTypeName, setNewTaskTypeName] = useState('');
  const [newTaskTypeDescription, setNewTaskTypeDescription] = useState('');
  const modalRef = useRef(null);
  const focusableElementsRef = useRef([]);

  // NOTE: fetch helpers moved into the useEffect below to avoid changing the
  // useEffect dependency array on every render (fixes react-hooks/exhaustive-deps).

  // Fetch data when component mounts or when gardenId changes
  useEffect(() => {
    if (!gardenId) return;

    const fetchGardenMembers = async () => {
      setLoadingMembers(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/gardens/${gardenId}/members/`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Token ${token}`,
            },
          }
        );

        if (!response.ok) {
          toast.error(t('errors.failedToFetchMembers'));
          setLoadingMembers(false);
          return;
        }

        const data = await response.json();
        const members = data
          .filter((member) => member.status === 'ACCEPTED')
          .map((member) => ({ id: member.user_id, name: member.username }));
        setGardenMembers(members);
      } catch (error) {
        console.error('Error fetching garden members:', error);
      } finally {
        setLoadingMembers(false);
      }
    };

    const fetchCustomTaskTypes = async () => {
      setLoadingTaskTypes(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/task-types/?garden=${gardenId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Token ${token}`,
            },
          }
        );

        if (!response.ok) {
          toast.error(t('errors.failedToFetchTaskTypes'));
          setLoadingTaskTypes(false);
          return;
        }

        const data = await response.json();
        const taskTypes = data.map((type) => ({
          id: type.id,
          name: type.name,
          description: type.description,
        }));
        setCustomTaskTypes(taskTypes);
      } catch (error) {
        console.error('Error fetching custom task types:', error);
      } finally {
        setLoadingTaskTypes(false);
      }
    };

    fetchGardenMembers();
    fetchCustomTaskTypes();
  }, [gardenId, token]);

  // Update the form state whenever task changes
  useEffect(() => {
    setTaskForm((prev) => ({
      ...prev,
      ...(task || {}),
    }));
    setDeadline(task?.due_date ? dayjs(task.due_date) : dayjs());
  }, [task]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setTaskForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAssigneeChange = (event) => {
    const { value } = event.target;
    setTaskForm((prev) => ({ ...prev, assigned_to: value }));
  };

  // Create a new custom task type
  const createCustomTaskType = async () => {
    if (!newTaskTypeName || !gardenId) return null;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/task-types/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          garden: gardenId,
          name: newTaskTypeName,
          description: newTaskTypeDescription || t('tasks.tasksRelatedTo', { name: newTaskTypeName }),
        }),
      });

      if (!response.ok) {
        toast.error(t('tasks.failedToCreateTaskType'));
        return null;
      }

      const data = await response.json();

      // Add the new task type to the list
      setCustomTaskTypes((prev) => [
        ...prev,
        {
          id: data.id,
          name: data.name,
          description: data.description,
        },
      ]);

      // Return the ID to set it as the selected value
      return data.id;
    } catch (error) {
      console.error('Error creating custom task type:', error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updatedForm = { ...taskForm };

    // Ensure deadline is a valid dayjs object before calling toISOString
    if (deadline && dayjs(deadline).isValid()) {
      const formattedDeadline = deadline.toISOString();
      updatedForm.due_date = formattedDeadline;
    } else {
      updatedForm.due_date = dayjs().toISOString();
    }

    console.log('Form values before submission:', updatedForm);

    // If we have a new task type to create
    if (taskForm.custom_type === 'new' && newTaskTypeName) {
      const newTypeId = await createCustomTaskType();
      if (newTypeId) {
        updatedForm.custom_type = newTypeId;
      } else {
        updatedForm.custom_type = null;
      }
    } // Final form should match the API requirements
    const finalForm = {
      id: updatedForm.id,
      garden: parseInt(gardenId),
      title: updatedForm.title,
      description: updatedForm.description,
      status: updatedForm.status || 'PENDING',
      assigned_to:
        updatedForm.assigned_to === 'Not Assigned' ? null : updatedForm.assigned_to || null,
      due_date: updatedForm.due_date,
      custom_type:
        updatedForm.custom_type === 'new'
          ? null
          : updatedForm.custom_type === 'No Type'
          ? null
          : updatedForm.custom_type,
    };

    onSubmit(finalForm);
    onClose();
  };

  // Create keyboard handler for the form
  const formKeyboardHandler = createFormKeyboardHandler(handleSubmit, onClose);

  // Set up focus trap when modal opens
  useEffect(() => {
    if (open && modalRef.current) {
      // Get all focusable elements within the modal
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusableElementsRef.current = Array.from(focusableElements);
      
      // Focus the first element
      if (focusableElementsRef.current.length > 0) {
        focusableElementsRef.current[0].focus();
      }
      
      // Set up focus trap
      const cleanup = trapFocus(modalRef.current, focusableElementsRef.current);
      return cleanup;
    }
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{ timeout: 500 }}
    >
      <Fade in={open}>
        <Box
          ref={modalRef}
          component="form"
          onSubmit={handleSubmit}
          onKeyDown={formKeyboardHandler}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '95%', sm: '90%', md: 600 },
            maxWidth: '90vw',
            maxHeight: '90vh',
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            p: { xs: 2, sm: 3, md: 4 },
            overflow: 'auto',
            '&:focus': {
              outline: 'none',
            },
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-modal-title"
        >
          <Typography id="task-modal-title" variant="h6" gutterBottom>
            {mode === 'edit' ? t('tasks.editTask') : t('tasks.addTask')}
          </Typography>

          <TextField
            label={t('tasks.taskTitle')}
            name="title"
            fullWidth
            margin="normal"
            value={taskForm.title}
            onChange={handleFormChange}
            required
          />
          <TextField
            label={t('tasks.description')}
            name="description"
            fullWidth
            margin="normal"
            multiline
            rows={3}
            value={taskForm.description}
            onChange={handleFormChange}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>{t('tasks.status')}</InputLabel>
            <Select
              name="status"
              value={taskForm.status || 'PENDING'}
              onChange={handleFormChange}
              input={<OutlinedInput label="Status" />}
            >
              <MenuItem value="PENDING">{t('tasks.pending')}</MenuItem>
              <MenuItem value="IN_PROGRESS">{t('tasks.inProgress')}</MenuItem>
              <MenuItem value="COMPLETED">{t('tasks.completed')}</MenuItem>
            </Select>
          </FormControl>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ mt: 2 }}>
              <DateTimePicker
                label={t('tasks.deadline')}
                value={deadline}
                onChange={(newValue) => setDeadline(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: 'outlined',
                    margin: 'normal',
                    size: 'medium',
                  },
                }}
              />
            </Box>
          </LocalizationProvider>

          <FormControl fullWidth margin="normal">
            <InputLabel>{t('tasks.assignee')}</InputLabel>
            {loadingMembers ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Select
                value={taskForm.assigned_to || ''}
                onChange={handleAssigneeChange}
                input={<OutlinedInput label="Assignee" />}
              >
                <MenuItem value="Not Assigned">
                  <em>{t('tasks.notAssigned')}</em>
                </MenuItem>
                {gardenMembers.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name}
                  </MenuItem>
                ))}
              </Select>
            )}
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>{t('tasks.taskType')}</InputLabel>
            {loadingTaskTypes ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Select
                name="custom_type"
                value={taskForm.custom_type || ''}
                onChange={handleFormChange}
                input={<OutlinedInput label="Task Type" />}
              >
                <MenuItem value="No Type">
                  <em>{t('tasks.noType')}</em>
                </MenuItem>
                {customTaskTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
                <MenuItem value="new">{t('tasks.createNewType')}</MenuItem>
              </Select>
            )}
          </FormControl>

          {taskForm.custom_type === 'new' && (
            <Box sx={{ mt: 2 }}>
              <TextField
                label={t('tasks.newTaskTypeName')}
                fullWidth
                margin="normal"
                value={newTaskTypeName}
                onChange={(e) => setNewTaskTypeName(e.target.value)}
                required
              />
              <TextField
                label={t('tasks.descriptionOptional')}
                fullWidth
                margin="normal"
                value={newTaskTypeDescription}
                onChange={(e) => setNewTaskTypeDescription(e.target.value)}
              />
            </Box>
          )}

          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'flex-end', 
            mt: 3, 
            gap: 2 
          }}>
            {user && task?.assigned_to === user.user_id && task?.status === 'PENDING' && (
              <>
                <Button
                  variant="outlined"
                  color="success"
                  fullWidth={{ xs: true, sm: false }}
                  onClick={() => {
                    handleAcceptTask(task);
                  }}
                  onKeyDown={createButtonKeyboardHandler(() => {
                    handleAcceptTask(task);
                  })}
                  sx={{
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
                  fullWidth={{ xs: true, sm: false }}
                  onClick={() => {
                    handleDeclineTask(task);
                  }}
                  onKeyDown={createButtonKeyboardHandler(() => {
                    handleDeclineTask(task);
                  })}
                  sx={{
                    '&:focus': {
                      outline: '2px solid #f44336',
                      outlineOffset: '2px',
                    },
                  }}
                >
                  {t('tasks.declineTask')}
                </Button>
              </>
            )}
            {mode === 'edit' && (
              <Button 
                variant="contained" 
                color="error" 
                fullWidth={{ xs: true, sm: false }}
                onClick={onDelete}
                onKeyDown={createButtonKeyboardHandler(onDelete)}
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
            <Button 
              variant="outlined" 
              fullWidth={{ xs: true, sm: false }}
              onClick={onClose}
              onKeyDown={createButtonKeyboardHandler(onClose)}
              sx={{
                '&:focus': {
                  outline: '2px solid #1976d2',
                  outlineOffset: '2px',
                },
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              fullWidth={{ xs: true, sm: false }}
              sx={{ 
                backgroundColor: '#558b2f',
                '&:focus': {
                  outline: '2px solid #558b2f',
                  outlineOffset: '2px',
                },
              }}
            >
              {mode === 'edit' ? t('tasks.saveChanges') : t('tasks.createTask')}
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default TaskModal;
