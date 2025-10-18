import React, { useRef, useEffect, useState } from 'react';
import { Modal, Fade, Backdrop, Box, Typography, TextField, Switch, Button, Divider } from '@mui/material';
import { createFormKeyboardHandler, createButtonKeyboardHandler, trapFocus } from '../utils/keyboardNavigation';
import LocationPicker from './LocationPicker';
import ImageUpload from './ImageUpload';

const GardenModal = ({
  open,
  onClose,
  form,
  handleChange,
  handleTogglePublic,
  handleSubmit,
  handleDelete,
  mode = 'create',
  existingImages = null,
}) => {
  const modalRef = useRef(null);
  const focusableElementsRef = useRef([]);
  const [coverImage, setCoverImage] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);

  // Create keyboard handler for the form
  const formKeyboardHandler = createFormKeyboardHandler(handleSubmit, onClose);

  // Handle form submission with images
  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    // Add image data to form
    const formData = {
      ...form,
      cover_image_base64: coverImage,
      gallery_base64: galleryImages,
    };
    
    // Call the original handleSubmit with enhanced form data
    handleSubmit(e, formData);
  };

  // Initialize images when modal opens or existing images change
  useEffect(() => {
    if (open && existingImages) {
      if (existingImages.cover_image) {
        setCoverImage(existingImages.cover_image.image_base64);
      }
      if (existingImages.images && existingImages.images.length > 0) {
        setGalleryImages(existingImages.images.map(img => img.image_base64));
      }
    } else if (open && mode === 'create') {
      setCoverImage('');
      setGalleryImages([]);
    }
  }, [open, existingImages, mode]);

  // Reset form when modal closes
  const handleClose = () => {
    setCoverImage('');
    setGalleryImages([]);
    onClose();
  };

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
          onSubmit={handleFormSubmit}
          onKeyDown={formKeyboardHandler}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 500,
            maxHeight: '90vh',
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            display: 'flex',
            flexDirection: 'column',
            '&:focus': {
              outline: 'none',
            },
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="garden-modal-title"
        >
          {/* Header - Fixed */}
          <Box sx={{ p: 4, pb: 2, flexShrink: 0 }}>
            <Typography id="garden-modal-title" variant="h6" gutterBottom>
              {mode === 'edit' ? 'Edit Garden' : 'Create New Garden'}
            </Typography>
          </Box>

          {/* Scrollable Content */}
          <Box sx={{ 
            flex: 1, 
            overflow: 'auto', 
            px: 4,
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'rgba(0,0,0,0.1)',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#558b2f',
              borderRadius: '4px',
              '&:hover': {
                backgroundColor: '#33691e',
              },
            },
          }}>
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
              label="Description"
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
              label="Garden Location"
              required
              height={250}
              sx={{ mt: 2, mb: 2 }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <Typography variant="body1" sx={{ mr: 2 }}>
                Do you wish this garden to be public?
              </Typography>
              <Switch checked={form.isPublic} onChange={handleTogglePublic} color="success" />
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Cover Image Upload */}
            <ImageUpload
              label="Cover Image"
              maxImages={1}
              maxSizeMB={5}
              onImagesChange={(images) => setCoverImage(images[0] || '')}
              initialImages={coverImage ? [{ base64: coverImage, name: 'cover.jpg' }] : []}
              showCoverToggle={false}
              disabled={false}
            />

            <Divider sx={{ my: 2 }} />

            {/* Gallery Images Upload */}
            <ImageUpload
              label="Gallery Images"
              maxImages={10}
              maxSizeMB={5}
              onImagesChange={setGalleryImages}
              initialImages={galleryImages.map((img, index) => ({ 
                base64: img, 
                name: `gallery-${index + 1}.jpg` 
              }))}
              showCoverToggle={false}
              disabled={false}
            />
          </Box>
          {/* Footer - Fixed */}
          <Box sx={{ 
            p: 4, 
            pt: 2, 
            flexShrink: 0, 
            borderTop: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            borderRadius: '0 0 8px 8px',
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
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
                  Delete Garden
                </Button>
              )}
              <Button 
                variant="outlined" 
                onClick={handleClose}
                onKeyDown={createButtonKeyboardHandler(handleClose)}
                sx={{
                  '&:focus': {
                    outline: '2px solid #1976d2',
                    outlineOffset: '2px',
                  },
                }}
              >
                Cancel
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
                {mode === 'edit' ? 'Save Changes' : 'Create Garden'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default GardenModal;
