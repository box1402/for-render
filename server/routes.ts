import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import { nanoid } from "nanoid";
import crypto from "crypto";
import { 
  roomAuthSchema, 
  sitePasswordSchema,
  type AuthResponse,
  type SiteAuthResponse,
  type VideoSyncMessage,
  type UserStatusMessage,
  type ContentListResponse
} from "@shared/schema";
import AWS from "aws-sdk";

// Setup AWS S3 client
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

// Track active WebSocket connections
interface ActiveConnection {
  socket: WebSocket;
  roomId: number;
  userId: string;
}

// Global connection registry
const connections = new Map<string, ActiveConnection>();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // WebSocket connection handler
  wss.on('connection', (ws) => {
    let userId = nanoid();
    let roomId: number | null = null;
    let connectionId = nanoid();
    
    console.log(`New WebSocket connection: ${connectionId}`);
    
    // Handle incoming messages
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'auth') {
          // Validate auth token
          const { token, roomId: requestedRoomId } = message;
          // In a real application, validate JWT or session token
          // Here we're doing a simple validation
          
          if (token && requestedRoomId) {
            // Convert to number to ensure type safety
            roomId = Number(requestedRoomId);
            
            // Add to active connections
            connections.set(connectionId, { socket: ws, roomId, userId });
            
            // Inform the user they are connected
            ws.send(JSON.stringify({
              type: 'auth_result',
              success: true,
              userId
            }));
            
            // Broadcast user status to room - ensure roomId is a number
            broadcastToRoom(roomId, {
              type: 'status',
              roomId,
              online: true,
              userId
            } as UserStatusMessage, connectionId);
            
            console.log(`User ${userId} authenticated and joined room ${roomId}`);
          } else {
            ws.send(JSON.stringify({
              type: 'auth_result',
              success: false,
              error: 'Invalid authentication'
            }));
          }
        }
        else if (message.type === 'sync' && roomId) {
          // Process video sync message
          const syncMessage: VideoSyncMessage = {
            action: message.action,
            roomId,
            senderId: userId
          };
          
          // Broadcast to all other connections in this room
          broadcastToRoom(roomId, syncMessage, connectionId);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle disconnections
    ws.on('close', () => {
      console.log(`WebSocket connection closed: ${connectionId}`);
      
      // If user was in a room, notify others
      if (roomId !== null) {
        // Ensure roomId is a number
        const numericRoomId = Number(roomId);
        broadcastToRoom(numericRoomId, {
          type: 'status',
          roomId: numericRoomId,
          online: false,
          userId
        } as UserStatusMessage, connectionId);
      }
      
      // Remove from active connections
      connections.delete(connectionId);
    });
  });
  
  // Helper function to broadcast to all connections in a room except sender
  function broadcastToRoom(roomId: number, message: any, excludeId: string) {
    connections.forEach((connection, id) => {
      if (id !== excludeId && connection.roomId === roomId && connection.socket.readyState === WebSocket.OPEN) {
        connection.socket.send(JSON.stringify(message));
      }
    });
  }
  
  // Site authentication
  app.post('/api/site-auth', async (req: Request, res: Response) => {
    try {
      // Validate request body
      const result = sitePasswordSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid password format',
        } as SiteAuthResponse);
      }
      
      const { password } = result.data;
      
      // Validate site password
      const isValid = await storage.validateSitePassword(password);
      
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid site password',
        } as SiteAuthResponse);
      }
      
      // Create a session token
      const token = crypto.randomBytes(32).toString('hex');
      
      // In a real app, you'd store this token in a database
      // For this demo, we'll just return it and let the client store it
      
      // Return success
      res.json({
        success: true,
      } as SiteAuthResponse);
    } catch (error) {
      console.error('Site authentication error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during site authentication',
      } as SiteAuthResponse);
    }
  });
  
  // Get all video content
  app.get('/api/content', async (_req: Request, res: Response) => {
    try {
      // Get all content
      const content = await storage.getAllVideoContent();
      
      res.json({
        success: true,
        content,
      } as ContentListResponse);
    } catch (error) {
      console.error('Error getting content:', error);
      res.status(500).json({
        success: false,
        message: 'Server error retrieving content',
      } as ContentListResponse);
    }
  });
  
  // Get signed URL for content video
  app.get('/api/content/:id/stream', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Verify that the content exists
      const content = await storage.getVideoContent(parseInt(id, 10));
      
      if (!content) {
        return res.status(404).json({
          success: false,
          message: 'Content not found',
        });
      }
      
      // Create signed URL (expires in 5 minutes)
      const bucketName = process.env.AWS_S3_BUCKET || 'video-sync-bucket';
      
      const signedUrl = s3.getSignedUrl('getObject', {
        Bucket: bucketName,
        Key: content.fileKey,
        Expires: 300, // 5 minutes
      });
      
      res.json({
        success: true,
        url: signedUrl,
      });
    } catch (error) {
      console.error('Error getting signed URL:', error);
      res.status(500).json({
        success: false,
        message: 'Server error generating video URL',
      });
    }
  });
  
  // Get content thumbnail
  app.get('/api/content/:id/thumbnail', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Verify that the content exists
      const content = await storage.getVideoContent(parseInt(id, 10));
      
      if (!content || !content.thumbnailKey) {
        return res.status(404).json({
          success: false,
          message: 'Thumbnail not found',
        });
      }
      
      // Create signed URL for the thumbnail
      const bucketName = process.env.AWS_S3_BUCKET || 'video-sync-bucket';
      
      const signedUrl = s3.getSignedUrl('getObject', {
        Bucket: bucketName,
        Key: content.thumbnailKey,
        Expires: 3600, // 1 hour for thumbnails
      });
      
      res.json({
        success: true,
        url: signedUrl,
      });
    } catch (error) {
      console.error('Error getting thumbnail URL:', error);
      res.status(500).json({
        success: false,
        message: 'Server error generating thumbnail URL',
      });
    }
  });
  
  // Room authentication
  app.post('/api/room-auth', async (req: Request, res: Response) => {
    try {
      // Validate request body
      const result = roomAuthSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid room credentials',
        });
      }
      
      const { name, password } = result.data;
      
      // Get room by name
      const room = await storage.getRoomByName(name);
      
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found',
        });
      }
      
      // Validate password
      const isValid = await storage.validateRoomPassword(name, password);
      
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password',
        });
      }
      
      // Count active sessions for this room
      const sessions = await storage.getRoomSessionsByRoomId(room.id);
      
      if (sessions.length >= 2) {
        // Only allow two users in a room at a time
        return res.status(403).json({
          success: false,
          message: 'Room is full (maximum 2 users)',
        });
      }
      
      // Create a session
      const sessionId = nanoid();
      await storage.createRoomSession({
        roomId: room.id,
        userId: null, // Anonymous in this implementation
        sessionId,
        createdAt: new Date().toISOString(),
      });
      
      // Create a simple token (in a real app, use JWT)
      // For demo purposes, we're using a simple token
      const token = crypto.randomBytes(32).toString('hex');
      
      // Return success with room info
      const response: AuthResponse = {
        success: true,
        room: {
          id: room.id,
          name: room.name,
          videoKey: room.videoKey,
        },
        token,
      };
      
      res.json(response);
    } catch (error) {
      console.error('Room authentication error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during room authentication',
      });
    }
  });
  
  // Create room with selected video
  app.post('/api/rooms', async (req: Request, res: Response) => {
    try {
      const { name, password, contentId } = req.body;
      
      if (!name || !password || !contentId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
        });
      }
      
      // Check if room name already exists
      const existingRoom = await storage.getRoomByName(name);
      if (existingRoom) {
        return res.status(409).json({
          success: false,
          message: 'Room name already exists',
        });
      }
      
      // Get the content to link to this room
      const content = await storage.getVideoContent(parseInt(contentId, 10));
      if (!content) {
        return res.status(404).json({
          success: false,
          message: 'Content not found',
        });
      }
      
      // Create the room
      const room = await storage.createRoom({
        name,
        password: password, // This will be hashed in the storage layer
        videoKey: content.fileKey,
        isActive: true,
      });
      
      res.status(201).json({
        success: true,
        roomId: room.id,
        name: room.name,
      });
    } catch (error) {
      console.error('Error creating room:', error);
      res.status(500).json({
        success: false,
        message: 'Server error creating room',
      });
    }
  });
  
  // Get signed URL for S3 video in a room
  app.get('/api/video/:roomId/:videoKey', async (req: Request, res: Response) => {
    try {
      const { roomId, videoKey } = req.params;
      
      // Verify that the room exists
      const room = await storage.getRoom(parseInt(roomId, 10));
      
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found',
        });
      }
      
      // Verify that the requested video belongs to this room
      if (room.videoKey !== videoKey) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
      
      // Create signed URL (expires in 5 minutes)
      const bucketName = process.env.AWS_S3_BUCKET || 'video-sync-bucket';
      
      const signedUrl = s3.getSignedUrl('getObject', {
        Bucket: bucketName,
        Key: videoKey,
        Expires: 300, // 5 minutes
      });
      
      res.json({
        success: true,
        url: signedUrl,
      });
    } catch (error) {
      console.error('Error getting signed URL:', error);
      res.status(500).json({
        success: false,
        message: 'Server error generating video URL',
      });
    }
  });
  
  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });
  
  return httpServer;
}
