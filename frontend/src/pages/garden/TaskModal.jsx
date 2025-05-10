import React, { useState } from 'react';
import {
  Modal, Fade, Backdrop, Box, Typography, TextField, MenuItem, Button
} from '@mui/material';

const cropOptions = [
  { label: 'Tomato', emoji: '🍅' },
  { label: 'Carrot', emoji: '🥕' },
  { label: 'Cucumber', emoji: '🥒' },
  { label: 'Lettuce', emoji: '🥬' },
  { label: 'Strawberry', emoji: '🍓' },
];

const TaskModal = ({ open, onClose, onSubmit }) => {
  const [taskForm, setTaskForm] = useState({
    type: 'Custom',
    title: '',
    description: '',
    deadline: '',
    status: 'Pending',
    assignment_status: 'Unassigned',
    assignees: [],
    harvest_amounts: {},
    maintenance_type: '',
    custom_type: '',
  });

  const [harvestCrop, setHarvestCrop] = useState('');
  const [customCrop, setCustomCrop] = useState('');
  const [harvestAmount, setHarvestAmount] = useState('');
  const [harvestUnit, setHarvestUnit] = useState('kg');

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setTaskForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedForm = { ...taskForm };

    if (taskForm.type === 'Harvest') {
      const cropName = harvestCrop === 'custom' ? customCrop : harvestCrop;
      if (!cropName || !harvestAmount || !taskForm.deadline) {
        alert("Please fill all required fields.");
        return;
      }
      updatedForm.harvest_amounts = {
        [cropName]: `${harvestAmount} ${harvestUnit}`
      };
    }

    onSubmit(updatedForm);
    setTaskForm({
      type: 'Custom',
      title: '',
      description: '',
      deadline: '',
      status: 'Pending',
      assignment_status: 'Unassigned',
      assignees: [],
      harvest_amounts: {},
      maintenance_type: '',
      custom_type: '',
    });
    setHarvestCrop('');
    setCustomCrop('');
    setHarvestAmount('');
    setHarvestUnit('kg');
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

          <TextField label="Deadline" type="datetime-local" name="deadline" fullWidth margin="normal" InputLabelProps={{ shrink: true }} value={taskForm.deadline} onChange={handleFormChange} required />

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
            <TextField label="Maintenance Type" name="maintenance_type" fullWidth margin="normal" value={taskForm.maintenance_type} onChange={handleFormChange} required />
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
