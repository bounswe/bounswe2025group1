import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Avatar,
  TextField,
  Box,
  Button,
  IconButton,
  Chip,
  Divider,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import InlineImageUpload from './InlineImageUpload';

const PostComposer = ({
  currentUser,
  onSubmit,
  placeholder,
}) => {
  const { t } = useTranslation();
  const [postText, setPostText] = useState('');
  const [images, setImages] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!postText.trim() && images.length === 0) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        content: postText,
        images: images,
      });
      setPostText('');
      setImages([]);
      setIsExpanded(false);
    } catch (error) {
      console.error('Error submitting post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTextFocus = () => {
    setIsExpanded(true);
  };

  const handleTextChange = (e) => {
    setPostText(e.target.value);
  };

  const handleImagesChange = (newImages) => {
    setImages(newImages);
  };

  return (
    <Card 
      elevation={0} 
      sx={{ 
        mb: 2, 
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <CardContent sx={{ p: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar 
            src={currentUser?.profile?.profile_picture || '/default-avatar.png'}
            sx={{ 
              width: 40, 
              height: 40,
              bgcolor: '#558b2f',
              fontSize: '1.2rem',
              fontWeight: 'bold',
            }}
          >
            {currentUser?.username?.charAt(0) || 'U'}
          </Avatar>
          <TextField
            fullWidth
            placeholder={placeholder || t('forum.whatsOnYourMind')}
            value={postText}
            onChange={handleTextChange}
            onFocus={handleTextFocus}
            variant="outlined"
            multiline
            maxRows={isExpanded ? 4 : 1}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                backgroundColor: '#f5f5f5',
                '&:hover': {
                  backgroundColor: '#eeeeee',
                },
                '&.Mui-focused': {
                  backgroundColor: 'white',
                },
                '& fieldset': {
                  border: 'none',
                },
              },
            }}
          />
        </Box>

        {/* Image Previews */}
        {images.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <InlineImageUpload
              onImagesChange={handleImagesChange}
              maxImages={10}
              maxSizeMB={5}
              initialImages={images.map((img, index) => ({ 
                base64: img, 
                name: `image-${index + 1}.jpg` 
              }))}
              disabled={false}
              compact={false}
            />
          </Box>
        )}

        {/* Image Upload and Submit */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
          <InlineImageUpload
            onImagesChange={setImages}
            maxImages={5}
            maxSizeMB={5}
            initialImages={images.map((img, index) => ({ 
              base64: img, 
              name: `image-${index + 1}.jpg` 
            }))}
            disabled={false}
            compact={true}
          />
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!postText.trim() && images.length === 0 || isSubmitting}
            sx={{
              bgcolor: '#558b2f',
              '&:hover': { bgcolor: '#33691e' },
              textTransform: 'none',
              borderRadius: 3,
              px: 3,
            }}
          >
            {isSubmitting ? t('forum.posting') : t('forum.post')}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PostComposer;
