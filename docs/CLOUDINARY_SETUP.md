# Cloudinary Image Upload Setup Guide

## Overview
Images are uploaded to Cloudinary in original quality (no compression), and secure URLs are stored in PostgreSQL.

## Step 1: Get Cloudinary Credentials

1. Sign up at [https://cloudinary.com](https://cloudinary.com)
2. Go to Dashboard
3. Copy: Cloud Name, API Key, API Secret

## Step 2: Configure Environment Variables

Add to `.env`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Step 3: Run Database Migration

```bash
psql -U your_username -d freelance_platform -f migrations/add-cloudinary-public-id.sql
```

## Step 4: Start Application

```bash
# Backend
npm run dev

# Frontend
cd chat-client
pnpm dev
```

## Upload Flow

1. User selects image → Frontend validates
2. Frontend uploads via POST `/chat/upload`
3. Backend validates (max 50MB, jpeg/png/webp/gif only)
4. Backend streams to Cloudinary (no disk storage)
5. Cloudinary returns secure URL
6. Backend saves to database
7. Socket.IO emits message with attachment
8. Frontend displays from Cloudinary URL

## File Restrictions

- **Max size**: 50MB
- **Types**: JPEG, PNG, WebP, GIF
- **Storage**: Cloudinary folder `chat_images/`

## Testing

```bash
curl -X POST http://localhost:4000/chat/upload -F "file=@test.jpg"
```

## Troubleshooting

- **Upload failed**: Check credentials in `.env`
- **Invalid file type**: Only jpeg/png/webp/gif allowed
- **Size limit**: Max 50MB per image
