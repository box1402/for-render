import { apiRequest } from "../lib/queryClient";

// Get a signed URL for a video in S3
export async function getSignedVideoUrl(roomId: number, videoKey: string): Promise<string> {
  try {
    const response = await apiRequest('GET', `/api/video/${roomId}/${videoKey}`);
    const data = await response.json();
    
    if (data.success && data.url) {
      return data.url;
    }
    
    throw new Error(data.message || 'Failed to get video URL');
  } catch (error) {
    console.error('Error getting signed URL:', error);
    throw error;
  }
}
