import React, { useState } from 'react';
import {
  Modal, Fade, Backdrop, Box, Typography, TextField, MenuItem, Button, FormControl, InputLabel, Select, OutlinedInput, Checkbox, ListItemText
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';

const cropOptions = [
  { label: 'Tomato', emoji: '🍅' },
  { label: 'Carrot', emoji: '🥕' },
  { label: 'Cucumber', emoji: '🥒' },
  { label: 'Lettuce', emoji: '🥬' },
  { label: 'Strawberry', emoji: '🍓' },
];

const maintenanceOptions = [
  { label: 'Irrigation', emoji: '💧' },
  { label: 'Fertilizer', emoji: '🧪' },
  { label: 'Pest Control', emoji: '🐛' },
  { label: 'Pruning', emoji: '✂️' },
];

const userOptions = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Charlie' },
];

const TaskModal = ({ open, onClose, onSubmit }) => {
  const [taskForm, setTaskForm] = useState({
    type: 'Custom',
    title: '',
    description: '',
    status: 'Not Started',
    assignment_status: 'Unassigned',
    assignees: [],
    harvest_amounts: {},
    maintenance_type: '',
    custom_type: '',
  });

  const [deadline, setDeadline] = useState(dayjs());
  const [harvestCrop, setHarvestCrop] = useState('');
  const [customCrop, setCustomCrop] = useState('');
  const [harvestAmount, setHarvestAmount] = useState('');
  const [harvestUnit, setHarvestUnit] = useState('kg');
  const [customMaintenance, setCustomMaintenance] = useState('');

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setTaskForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAssigneeChange = (event) => {
    const { value } = event.target;
    setTaskForm(prev => ({ ...prev, assignees: typeof value === 'string' ? value.split(',') : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedForm = { ...taskForm };
    const formattedDeadline = deadline.toISOString();
    updatedForm.deadline = formattedDeadline;

    if (taskForm.type === 'Harvest') {
      const cropName = harvestCrop === 'custom' ? customCrop : harvestCrop;
      if (!cropName || !harvestAmount) {
        alert("Please fill all required fields.");
        return;
      }
      updatedForm.harvest_amounts = {
        [cropName]: `${harvestAmount} ${harvestUnit}`
      };
    }

    if (taskForm.type === 'Maintenance' && taskForm.maintenance_type === 'custom') {
      updatedForm.maintenance_type = customMaintenance;
    }

    onSubmit(updatedForm);
    setTaskForm({
      type: 'Custom',
      title: '',
      description: '',
      status: 'Not Started',
      assignment_status: 'Unassigned',
      assignees: [],
      harvest_amounts: {},
      maintenance_type: '',
      custom_type: '',
    });
    setDeadline(dayjs());
    setHarvestCrop('');
    setCustomCrop('');
    setHarvestAmount('');
    setHarvestUnit('kg');
    setCustomMaintenance('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} closeAfterTransition BackdropComponent={Backdrop} BackdropProps={{ timeout: 500 }}>
      <Fade in={open}>
        <Box component="form" onSubmit={handleSubmit} sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 500, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 24, p: 4 }}>
          <Typography variant="h6" gutterBottom>Add Task</Typography>

          <TextField select label="Type" name="type" value={taskForm.type} onChange={handleFormChange} fullWidth margin="normal">
            <MenuItem value="Harvest">Harvest</MenuItem>
            <MenuItem value="Maintenance">Maintenance</MenuItem>
            <MenuItem value="Custom">Custom</MenuItem>
          </TextField>

          <TextField label="Title" name="title" fullWidth margin="normal" value={taskForm.title} onChange={handleFormChange} required />

          <TextField label="Description" name="description" fullWidth margin="normal" multiline rows={3} value={taskForm.description} onChange={handleFormChange} />

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ mt: 2 }}>
              <DateTimePicker
                label="Deadline"
                value={deadline}
                onChange={(newValue) => setDeadline(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: 'outlined',
                    margin: 'normal',
                    size: 'medium',
                  }
                }}
              />
            </Box>
          </LocalizationProvider>

          {/* Assignee Selector */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Assignees</InputLabel>
            <Select
              multiple
              value={taskForm.assignees}
              onChange={handleAssigneeChange}
              input={<OutlinedInput label="Assignees" />}
              renderValue={(selected) => selected.map(id => userOptions.find(u => u.id === id)?.name).join(', ')}
            >
              {userOptions.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  <Checkbox checked={taskForm.assignees.indexOf(user.id) > -1} />
                  <ListItemText primary={user.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {taskForm.type === 'Harvest' && (
            <>
              <TextField select label="Crop Type" fullWidth margin="normal" value={harvestCrop} onChange={(e) => setHarvestCrop(e.target.value)} required>
                {cropOptions.map((option) => (
                  <MenuItem key={option.label} value={option.label}>{`${option.emoji} ${option.label}`}</MenuItem>
                ))}
                <MenuItem value="custom">📝 Custom</MenuItem>
              </TextField>

              {harvestCrop === 'custom' && (
                <TextField label="Custom Crop Name" fullWidth margin="normal" value={customCrop} onChange={(e) => setCustomCrop(e.target.value)} required />
              )}

              <TextField label="Amount" type="number" fullWidth margin="normal" value={harvestAmount} onChange={(e) => setHarvestAmount(e.target.value)} required />

              <TextField select label="Unit" fullWidth margin="normal" value={harvestUnit} onChange={(e) => setHarvestUnit(e.target.value)}>
                <MenuItem value="kg">kg</MenuItem>
                <MenuItem value="lb">lb</MenuItem>
                <MenuItem value="pieces">pieces</MenuItem>
                <MenuItem value="bunch">bunch</MenuItem>
              </TextField>
            </>
          )}

          {taskForm.type === 'Maintenance' && (
            <>
              <TextField
                select
                label="Maintenance Type"
                name="maintenance_type"
                fullWidth
                margin="normal"
                value={taskForm.maintenance_type}
                onChange={handleFormChange}
                required
              >
                {maintenanceOptions.map((option) => (
                  <MenuItem key={option.label} value={option.label}>{`${option.emoji} ${option.label}`}</MenuItem>
                ))}
                <MenuItem value="custom">📝 Custom</MenuItem>
              </TextField>
              {taskForm.maintenance_type === 'custom' && (
                <TextField
                  label="Custom Maintenance"
                  fullWidth
                  margin="normal"
                  value={customMaintenance}
                  onChange={(e) => setCustomMaintenance(e.target.value)}
                  required
                />
              )}
            </>
          )}

          {taskForm.type === 'Custom' && (
            <TextField label="Custom Type" name="custom_type" fullWidth margin="normal" value={taskForm.custom_type} onChange={handleFormChange} required />
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button type="submit" variant="contained" sx={{ backgroundColor: '#558b2f', '&:hover': { backgroundColor: '#33691e' } }}>
              Create Task
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default TaskModal;
