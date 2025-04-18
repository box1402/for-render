import express from 'express';
import { uploadMediaFile, getMediaFile, deleteMediaFile, streamMediaFile, validateFileSize, validateFileType, getContentType } from '../utils/mediaUtils';
import { validateS3Config } from '../config/s3';
import { UploadedFile } from 'express-fileupload';

const router = express.Router();

// Validate S3 configuration on startup
validateS3Config();

// Upload media file
router.post('/upload', async (req: express.Request & { files?: { file: UploadedFile } }, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.files.file;
    const filename = file.name;
    const fileBuffer = file.data;
    const contentType = getContentType(filename);

    // Validate file type
    if (!validateFileType(filename)) {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    // Validate file size (default 100MB)
    if (!validateFileSize(fileBuffer.length)) {
      return res.status(400).json({ error: 'File too large' });
    }

    const mediaFile = await uploadMediaFile(fileBuffer, filename, contentType);
    res.json(mediaFile);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Get media file URL
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const mediaFile = await getMediaFile(key);
    res.json(mediaFile);
  } catch (error) {
    console.error('Error getting file:', error);
    res.status(500).json({ error: 'Failed to get file' });
  }
});

// Stream media file
router.get('/stream/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const stream = await streamMediaFile(key);

    stream.on('error', (error) => {
      console.error('Error streaming file:', error);
      res.status(500).json({ error: 'Failed to stream file' });
    });

    stream.pipe(res);
  } catch (error) {
    console.error('Error streaming file:', error);
    res.status(500).json({ error: 'Failed to stream file' });
  }
});

// Delete media file
router.delete('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    await deleteMediaFile(key);
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router; 