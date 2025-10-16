# Image Support API Documentation

## Overview
Garden, forum posts, and comments now support image galleries with base64-encoded data stored in the database.

## Endpoints

### Garden Images

#### Create Garden with Images
**POST** `/api/gardens/`

**Request Body:**
```json
{
  "name": "Community Garden",
  "description": "Herbs and veggies", 
  "location": "Central Park",
  "is_public": true,
  "cover_image_base64": "data:image/jpeg;base64,/9j/4AAQ...",
  "gallery_base64": [
    "data:image/png;base64,iVBORw0KGgo...",
    "data:image/jpeg;base64,/9j/4AAQ..."
  ]
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Community Garden",
  "cover_image": {
    "id": 1,
    "is_cover": true,
    "mime_type": "image/jpeg",
    "image_base64": "data:image/jpeg;base64,/9j/4AAQ..."
  },
  "images": [
    {
      "id": 2,
      "is_cover": false,
      "mime_type": "image/png", 
      "image_base64": "data:image/png;base64,iVBORw0KGgo..."
    }
  ]
}
```

#### Update Garden Images
**PATCH** `/api/gardens/{id}/`

**Request Body:**
```json
{
  "cover_image_base64": "data:image/png;base64,iVBORw0KGgoNEWCOVER...",
  "gallery_base64": [
    "data:image/jpeg;base64,/9j/NEW1...",
    "data:image/jpeg;base64,/9j/NEW2..."
  ]
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Community Garden",
  "cover_image": {
    "id": 3,
    "is_cover": true,
    "mime_type": "image/png",
    "image_base64": "data:image/png;base64,iVBORw0KGgoNEWCOVER..."
  },
  "images": [
    {
      "id": 4,
      "is_cover": false,
      "mime_type": "image/jpeg",
      "image_base64": "data:image/jpeg;base64,/9j/NEW1..."
    },
    {
      "id": 5,
      "is_cover": false,
      "mime_type": "image/jpeg", 
      "image_base64": "data:image/jpeg;base64,/9j/NEW2..."
    }
  ]
}
```

**Notes:**
- `cover_image_base64`: string (empty string to clear cover)
- `gallery_base64`: array of strings (replaces entire gallery)

### Forum Post Images

#### Create Forum Post with Images
**POST** `/api/forum/`

**Request Body:**
```json
{
  "title": "Autumn Planting",
  "content": "What should we plant this season?",
  "images_base64": [
    "data:image/png;base64,iVBORw0KGgo...",
    "data:image/jpeg;base64,/9j/4AAQ..."
  ]
}
```

**Response:**
```json
{
  "id": 1,
  "title": "Autumn Planting",
  "content": "What should we plant this season?",
  "images": [
    {
      "id": 1,
      "mime_type": "image/png",
      "image_base64": "data:image/png;base64,iVBORw0KGgo..."
    }
  ]
}
```

### Comment Images

#### Create Comment with Images
**POST** `/api/forum/comments/`

**Request Body:**
```json
{
  "forum_post": 1,
  "content": "Let's try garlic and kale.",
  "images_base64": [
    "data:image/jpeg;base64,/9j/4AAQ..."
  ]
}
```

## Image Format Support

- **Input**: Data URLs (`data:image/png;base64,...`) or raw base64 strings
- **Output**: Always data URLs for direct use in `<img src="">` or React Native `<Image>`
- **Storage**: Binary data in database with MIME type metadata
- **Supported formats**: PNG, JPEG, GIF, WebP (any valid image MIME type)

## Notes

- All image fields are optional
- Garden cover image: only one per garden (setting new cover unsets previous)
- Gallery images: array replaces entire gallery on update
- Images are returned in creation order
- Requires authentication for create/update operations
