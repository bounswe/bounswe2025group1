import React, { useRef, useEffect } from 'react';
import { Modal, Fade, Backdrop, Box, Typography, TextField, Switch, Button } from '@mui/material';
import { createFormKeyboardHandler, createButtonKeyboardHandler, trapFocus } from '../utils/keyboardNavigation';
import LocationPicker from './LocationPicker';
import { useTranslation } from 'react-i18next';

const GardenModal = ({
  open,
  onClose,
  form,
  handleChange,
  handleTogglePublic,
  handleSubmit,
  handleDelete,
  mode = 'create',
}) => {
  const { t } = useTranslation();
  const modalRef = useRef(null);
  const focusableElementsRef = useRef([]);

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
            width: 500,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            '&:focus': {
              outline: 'none',
            },
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="garden-modal-title"
        >
          <Typography id="garden-modal-title" variant="h6" gutterBottom>
            {mode === 'edit' ? t('gardens.editGarden') : t('gardens.createGarden')}
          </Typography>
          <TextField
            label={t('gardens.gardenName')}
            name="name"
            fullWidth
            margin="normal"
            value={form.name}
            onChange={handleChange}
            required
          />
          <TextField
            label={t('gardens.description')}
            name="description"
            fullWidth
            margin="normal"
            multiline
            rows={3}
            value={form.description}
            onChange={handleChange}
          />
          <LocationPicker
            value={form.location}
            onChange={(value) => handleChange({ target: { name: 'location', value } })}
            label={t('gardens.gardenLocation')}
            required
            height={250}
            sx={{ mt: 2, mb: 2 }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <Typography variant="body1" sx={{ mr: 2 }}>
              {t('gardens.makeGardenPublic')}
            </Typography>
            <Switch checked={form.isPublic} onChange={handleTogglePublic} color="success" />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4, gap: 2 }}>
            {mode === 'edit' && (
              <Button 
                variant="contained" 
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
                {t('gardens.deleteGarden')}
              </Button>
            )}
            <Button 
              variant="outlined" 
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
              sx={{ 
                backgroundColor: '#558b2f', 
                '&:hover': { backgroundColor: '#33691e' },
                '&:focus': {
                  outline: '2px solid #558b2f',
                  outlineOffset: '2px',
                },
              }}
            >
              {mode === 'edit' ? t('gardens.saveChanges') : t('gardens.createGarden')}
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default GardenModal;
