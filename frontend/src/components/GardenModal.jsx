import React, { useRef, useEffect, useState } from 'react';
import { Modal, Fade, Backdrop, Box, Typography, TextField, Switch, Button, Divider } from '@mui/material';
import { createFormKeyboardHandler, createButtonKeyboardHandler, trapFocus } from '../utils/keyboardNavigation';
import LocationPicker from './LocationPicker';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      } else {
        setCoverImage('');
      }
      
      if (existingImages.images && existingImages.images.length > 0) {
        // Filter out cover image from gallery images to avoid duplicates
        const galleryImages = existingImages.images
          .filter(img => !img.is_cover)
          .map(img => img.image_base64);
        setGalleryImages(galleryImages);
      } else {
        setGalleryImages([]);
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
            height={{ xs: 200, sm: 250, md: 300 }}
            sx={{ mt: 2, mb: 2 }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <Typography variant="body1" sx={{ mr: 2 }}>
              {t('gardens.makeGardenPublic')}
            </Typography>
            <Switch checked={form.isPublic} onChange={handleTogglePublic} color="success" />
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          {/* Cover Image Upload */}
          <ImageUpload
            label={t('gardens.coverImage')}
            maxImages={1}
            maxSizeMB={5}
            onImagesChange={(images) => {
              setCoverImage(images[0] || '');
            }}
            initialImages={coverImage ? [{ base64: coverImage, name: 'cover.jpg', size: 0, type: 'image/jpeg' }] : []}
          />
          
          <Divider sx={{ my: 3 }} />
          
          {/* Gallery Images Upload */}
          <ImageUpload
            label={t('gardens.galleryImages')}
            maxImages={10}
            maxSizeMB={5}
            onImagesChange={(images) => {
              setGalleryImages(images);
            }}
            initialImages={galleryImages.map((img, idx) => ({ 
              base64: img, 
              name: `gallery-${idx}.jpg`, 
              size: 0, 
              type: 'image/jpeg' 
            }))}
          />
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'flex-end', 
            mt: 4, 
            gap: 2 
          }}>
            {mode === 'edit' && (
              <Button 
                variant="contained" 
                color="error" 
                onClick={handleDelete}
                onKeyDown={createButtonKeyboardHandler(handleDelete)}
                fullWidth={{ xs: true, sm: false }}
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
              fullWidth={{ xs: true, sm: false }}
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
