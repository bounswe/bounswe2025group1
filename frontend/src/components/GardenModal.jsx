import {
  Modal, Fade, Backdrop, Box, Typography, TextField, Switch, Button
} from '@mui/material';

const GardenModal = ({ open, onClose, form, handleChange, handleTogglePublic, handleSubmit }) => {
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
          component="form"
          onSubmit={handleSubmit}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 500,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Create New Garden
          </Typography>

          <TextField
            label="Garden Name"
            name="name"
            fullWidth
            margin="normal"
            value={form.name}
            onChange={handleChange}
            required
          />

          <TextField
            label="Type"
            name="type"
            fullWidth
            margin="normal"
            value={form.type}
            onChange={handleChange}
          />

          <TextField
            label="Description"
            name="description"
            fullWidth
            margin="normal"
            multiline
            rows={3}
            value={form.description}
            onChange={handleChange}
          />

          <TextField
            label="Location"
            name="location"
            fullWidth
            margin="normal"
            value={form.location}
            onChange={handleChange}
            required
          />

          <TextField
            label="Size (m²)"
            name="size"
            type="number"
            fullWidth
            margin="normal"
            value={form.size}
            onChange={handleChange}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <Typography variant="body1" sx={{ mr: 2 }}>
              Do you wish this garden to be public?
            </Typography>
            <Switch
              checked={form.isPublic}
              onChange={handleTogglePublic}
              color="success"
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            <Button
              type="submit"
              variant="contained"
              sx={{ backgroundColor: '#558b2f', '&:hover': { backgroundColor: '#33691e' } }}
            >
              Create Garden
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default GardenModal;
