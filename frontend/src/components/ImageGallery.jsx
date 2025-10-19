import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  IconButton,
  Typography,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Chip,
} from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import ImageIcon from '@mui/icons-material/Image';

const ImageGallery = ({ 
  images = [], 
  coverImage = null,
  showCoverBadge = true,
  maxColumns = 3,
  imageHeight = 200,
  onImageClick,
}) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleImageClick = (image, index) => {
    if (onImageClick) {
      onImageClick(image, index);
    } else {
      setSelectedImage({ image, index });
      setDialogOpen(true);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedImage(null);
  };

  if (!images || images.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: imageHeight,
          backgroundColor: 'grey.100',
          borderRadius: 2,
          border: '2px dashed',
          borderColor: 'grey.300',
        }}
      >
        <ImageIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          No images available
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Grid container spacing={2}>
        {images.map((image, index) => {
          const isCover = showCoverBadge && coverImage && 
            (coverImage.id === image.id || coverImage.image_base64 === image.image_base64);
          
          return (
            <Grid key={image.id || index} size={{ xs: 12, sm: 6, md: 12 / maxColumns }}>
              <Paper
                elevation={2}
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => handleImageClick(image, index)}
              >
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: imageHeight,
                    backgroundImage: `url(${image.image_base64 || image.base64 || image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Cover Image Badge */}
                  {isCover && (
                    <Chip
                      label="Cover"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        backgroundColor: '#558b2f',
                        color: 'white',
                        fontWeight: 'medium',
                      }}
                    />
                  )}
                  
                  {/* Fullscreen Button */}
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      },
                    }}
                    size="small"
                  >
                    <FullscreenIcon fontSize="small" />
                  </IconButton>
                  
                  {/* Overlay on hover */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0)',
                      transition: 'background-color 0.2s',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      },
                    }}
                  />
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Image Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
          },
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          {selectedImage && (
            <Box
              sx={{
                width: '100%',
                height: '70vh',
                backgroundImage: `url(${selectedImage.image.image_base64 || selectedImage.image.base64 || selectedImage.image})`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
              }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
          <Button onClick={handleCloseDialog} sx={{ color: 'white' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ImageGallery;

