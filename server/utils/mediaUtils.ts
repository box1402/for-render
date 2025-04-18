import { getSignedUrlForFile, uploadToS3, deleteFromS3, streamFromS3 } from '../config/s3';
import { Readable } from 'stream';

export interface MediaFile {
  key: string;
  url: string;
  contentType: string;
  size: number;
  lastModified: Date;
}

export async function uploadMediaFile(
  file: Buffer,
  filename: string,
  contentType: string
): Promise<MediaFile> {
  // Generate a unique key for the file
  const key = `media/${Date.now()}-${filename}`;

  // Upload to S3
  await uploadToS3(file, key, contentType);

  // Get signed URL
  const url = await getSignedUrlForFile(key);

  return {
    key,
    url,
    contentType,
    size: file.length,
    lastModified: new Date(),
  };
}

export async function getMediaFile(key: string): Promise<MediaFile> {
  const url = await getSignedUrlForFile(key);
  return {
    key,
    url,
    contentType: '', // This would need to be stored in a database
    size: 0, // This would need to be stored in a database
    lastModified: new Date(), // This would need to be stored in a database
  };
}

export async function deleteMediaFile(key: string): Promise<void> {
  await deleteFromS3(key);
}

export async function streamMediaFile(key: string): Promise<Readable> {
  return streamFromS3(key);
}

// Helper function to get content type from filename
export function getContentType(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();
  const contentTypes: { [key: string]: string } = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    mkv: 'video/x-matroska',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    m4v: 'video/x-m4v',
    mpg: 'video/mpeg',
    mpeg: 'video/mpeg',
    // Add more content types as needed
  };

  return contentTypes[extension || ''] || 'application/octet-stream';
}

// Helper function to validate file size
export function validateFileSize(size: number, maxSize: number = 100 * 1024 * 1024): boolean {
  return size <= maxSize;
}

// Helper function to validate file type
export function validateFileType(filename: string, allowedTypes: string[] = ['mp4', 'webm', 'mkv']): boolean {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? allowedTypes.includes(extension) : false;
} 