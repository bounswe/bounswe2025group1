import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  IconButton,
  Grid,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import { useTranslation } from 'react-i18next';

const ImageUpload = ({
  label = 'Upload Images',
  maxImages = 5,
  maxSizeMB = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  onImagesChange,
  initialImages = [],
  coverImageIndex = 0,
  showCoverToggle = false,
  onCoverImageChange,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const [images, setImages] = useState(initialImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (!acceptedTypes.includes(file.type)) {
      throw new Error(t('imageUpload.fileTypeNotSupported', { 
        fileType: file.type, 
        supportedTypes: acceptedTypes.join(', ') 
      }));
    }
    
    if (file.size > maxSizeMB * 1024 * 1024) {
      throw new Error(t('imageUpload.fileSizeTooLarge', { maxSize: maxSizeMB }));
    }
    
    return true;
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setError(null);
    setUploading(true);

    try {
      const newImages = [];
      
      for (const file of files) {
        validateFile(file);
        
        if (images.length + newImages.length >= maxImages) {
          throw new Error(`Maximum ${maxImages} images allowed`);
        }
        
        const base64 = await fileToBase64(file);
        newImages.push({
          file,
          base64,
          name: file.name,
          size: file.size,
          type: file.type,
        });
      }

      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      
      // Convert to base64 strings for API
      const base64Strings = updatedImages.map(img => img.base64);
      onImagesChange(base64Strings);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    
    // Convert to base64 strings for API - handle both new uploads and existing images
    const base64Strings = updatedImages.map(img => {
      // If it's a new upload with base64 property, use that
      if (img.base64) {
        return img.base64;
      }
      // If it's an existing image from backend, it might already be a string
      return typeof img === 'string' ? img : img.image_base64 || img;
    });
    onImagesChange(base64Strings);
    
    // If we removed the cover image, notify parent
    if (showCoverToggle && index === coverImageIndex && onCoverImageChange) {
      onCoverImageChange(updatedImages.length > 0 ? updatedImages[0].base64 : '');
    }
  };

  const setCoverImage = (index) => {
    if (onCoverImageChange) {
      onCoverImageChange(images[index].base64);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'medium' }}>
        {label}
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Upload Button */}
      <Box sx={{ mb: 2 }}>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={disabled || uploading}
        />
        <Button
          variant="outlined"
          startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading || images.length >= maxImages}
          sx={{
            borderColor: '#558b2f',
            color: '#558b2f',
            '&:hover': {
              borderColor: '#33691e',
              backgroundColor: 'rgba(85, 139, 47, 0.04)',
            },
            '&:focus': {
              outline: '2px solid #558b2f',
              outlineOffset: '2px',
            },
          }}
        >
          {uploading ? t('imageUpload.uploading') : t('imageUpload.uploadImages', { current: images.length, max: maxImages })}
        </Button>
      </Box>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <Grid container spacing={2}>
          {images.map((image, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
              <Paper
                elevation={2}
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 2,
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: 200,
                    backgroundImage: `url(${image.base64})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Cover Image Badge */}
                  {showCoverToggle && index === coverImageIndex && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        backgroundColor: '#558b2f',
                        color: 'white',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.75rem',
                        fontWeight: 'medium',
                      }}
                    >
                      Cover
                    </Box>
                  )}
                  
                  {/* Remove Button */}
                  <IconButton
                    onClick={() => removeImage(index)}
                    disabled={disabled}
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
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                  
                  {/* Set as Cover Button */}
                  {showCoverToggle && index !== coverImageIndex && (
                    <Button
                      onClick={() => setCoverImage(index)}
                      disabled={disabled}
                      size="small"
                      sx={{
                        position: 'absolute',
                        bottom: 8,
                        left: 8,
                        backgroundColor: 'rgba(85, 139, 47, 0.8)',
                        color: 'white',
                        fontSize: '0.75rem',
                        '&:hover': {
                          backgroundColor: 'rgba(85, 139, 47, 1)',
                        },
                      }}
                    >
                      {t('imageUpload.setAsCover')}
                    </Button>
                  )}
                </Box>
                
                {/* Image Info */}
                <Box sx={{ p: 1 }}>
                  <Typography variant="caption" noWrap>
                    {image.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {formatFileSize(image.size)}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Helper Text */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        {t('imageUpload.supportedFormats')}: {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} • 
        {t('imageUpload.maxSize')}: {maxSizeMB}MB • 
        {t('imageUpload.maxImages')}: {maxImages}
      </Typography>
    </Box>
  );
};

export default ImageUpload;

