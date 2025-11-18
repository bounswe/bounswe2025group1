import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { useTranslation } from 'react-i18next';

const InlineImageUpload = ({
  onImagesChange,
  maxImages = 3,
  maxSizeMB = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  initialImages = [],
  disabled = false,
  compact = false,
}) => {
  const { t } = useTranslation();
  const [images, setImages] = useState(initialImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (!acceptedTypes.includes(file.type)) {
      throw new Error(t('imageUpload.fileTypeError', { types: acceptedTypes.join(', ') }));
    }
    
    if (file.size > maxSizeMB * 1024 * 1024) {
      throw new Error(t('imageUpload.fileSizeError', { size: maxSizeMB }));
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
    
    const base64Strings = updatedImages.map(img => img.base64);
    onImagesChange(base64Strings);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={disabled || uploading}
        />
        
        <Tooltip title={`${t('imageUpload.addImages')} (${images.length}/${maxImages})`}>
          <IconButton
            data-testid="inline-upload-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading || images.length >= maxImages}
            size="small"
            sx={{
              color: '#558b2f',
              '&:hover': {
                backgroundColor: 'rgba(85, 139, 47, 0.1)',
              },
            }}
          >
            {uploading ? <CircularProgress size={16} /> : <AttachFileIcon fontSize="small" />}
          </IconButton>
        </Tooltip>

        {images.length > 0 && (
          <Typography variant="caption" color="text.secondary">
            {images.length} {images.length === 1 ? t('imageUpload.image') : t('imageUpload.images')}
          </Typography>
        )}

        {error && (
          <Alert severity="error" sx={{ fontSize: '0.75rem', py: 0.5 }}>
            {error}
          </Alert>
        )}
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 1, fontSize: '0.75rem' }}>
          {error}
        </Alert>
      )}

      {/* Upload Button */}
      <Box sx={{ mb: 1 }}>
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
          size="small"
          startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading || images.length >= maxImages}
          sx={{
            borderColor: '#558b2f',
            color: '#558b2f',
            fontSize: '0.75rem',
            '&:hover': {
              borderColor: '#33691e',
              backgroundColor: 'rgba(85, 139, 47, 0.04)',
            },
          }}
        >
          {uploading ? t('imageUpload.uploading') : `${t('imageUpload.addImages')} (${images.length}/${maxImages})`}
        </Button>
      </Box>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <Grid container spacing={1}>
          {images.map((image, index) => (
            <Grid key={index} size={4}>
              <Paper
                elevation={1}
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 1,
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: 80,
                    backgroundImage: `url(${image.base64})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Remove Button */}
                  <IconButton
                    onClick={() => removeImage(index)}
                    disabled={disabled}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      color: 'white',
                      width: 20,
                      height: 20,
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      },
                    }}
                    size="small"
                  >
                    <DeleteIcon sx={{ fontSize: 12 }} />
                  </IconButton>
                </Box>
                
                {/* Image Info */}
                <Box sx={{ p: 0.5 }}>
                  <Typography variant="caption" noWrap sx={{ fontSize: '0.65rem' }}>
                    {image.name}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default InlineImageUpload;
