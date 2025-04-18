import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const bucketName = process.env.AWS_BUCKET_NAME!;
const signedUrlExpiry = parseInt(process.env.AWS_SIGNED_URL_EXPIRY || '3600', 10);

export const s3Config = {
  client: s3Client,
  bucketName,
  signedUrlExpiry,
};

export async function uploadToS3(file: Buffer, key: string, contentType: string) {
  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    await s3Client.send(command);
    return key;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload file to S3');
  }
}

export async function getSignedUrlForFile(key: string) {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: signedUrlExpiry });
    return url;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Failed to generate signed URL');
  }
}

export async function deleteFromS3(key: string) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw new Error('Failed to delete file from S3');
  }
}

export async function streamFromS3(key: string): Promise<Readable> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await s3Client.send(command);
    if (!response.Body) {
      throw new Error('No body in S3 response');
    }

    return response.Body as Readable;
  } catch (error) {
    console.error('Error streaming from S3:', error);
    throw new Error('Failed to stream file from S3');
  }
}

// Validate S3 configuration
export function validateS3Config() {
  const requiredEnvVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_REGION',
    'AWS_BUCKET_NAME',
  ];

  const missingVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar] || process.env[envVar] === 'your_' + envVar.toLowerCase()
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing or invalid S3 configuration. Please set the following environment variables: ${missingVars.join(
        ', '
      )}`
    );
  }
} 