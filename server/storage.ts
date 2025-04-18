import {
  users, type User, type InsertUser,
  rooms, type Room, type InsertRoom,
  roomSessions, type RoomSession, type InsertRoomSession,
  videoContent, type VideoContent, type InsertVideoContent
} from "@shared/schema";
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Room operations
  getRoom(id: number): Promise<Room | undefined>;
  getRoomByName(name: string): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  validateRoomPassword(roomName: string, password: string): Promise<boolean>;
  
  // Room session operations
  createRoomSession(session: InsertRoomSession): Promise<RoomSession>;
  getRoomSessionsByRoomId(roomId: number): Promise<RoomSession[]>;
  getRoomSessionBySessionId(sessionId: string): Promise<RoomSession | undefined>;
  removeRoomSession(sessionId: string): Promise<void>;
  
  // Video content operations
  getVideoContent(id: number): Promise<VideoContent | undefined>;
  getAllVideoContent(): Promise<VideoContent[]>;
  createVideoContent(content: InsertVideoContent): Promise<VideoContent>;
  
  // Site password validation
  validateSitePassword(password: string): Promise<boolean>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private rooms: Map<number, Room>;
  private roomSessions: Map<number, RoomSession>;
  private videos: Map<number, VideoContent>;
  private currentUserId: number;
  private currentRoomId: number;
  private currentSessionId: number;
  private currentVideoId: number;
  private sitePassword: string;

  constructor() {
    this.users = new Map();
    this.rooms = new Map();
    this.roomSessions = new Map();
    this.videos = new Map();
    this.currentUserId = 1;
    this.currentRoomId = 1;
    this.currentSessionId = 1;
    this.currentVideoId = 1;
    
    // Set site password from environment variable
    const sitePassword = process.env.SITE_PASSWORD;
    if (!sitePassword) {
      throw new Error('SITE_PASSWORD environment variable is not set');
    }
    this.sitePassword = this.hashPassword(sitePassword);
    
    // Initialize with sample rooms and videos
    this.initializeRooms();
    this.initializeVideos();
  }

  private initializeRooms() {
    const roomConfigs = process.env.ROOM_CONFIGS ? JSON.parse(process.env.ROOM_CONFIGS) : [];
    
    // If no rooms are configured, create a default demo room
    if (roomConfigs.length === 0) {
      const demoRoom: InsertRoom = {
        name: 'demo',
        // In a real app, we'd never store passwords in plain text
        // Here we're storing a hashed version of 'password'
        password: this.hashPassword('password'),
        videoKey: 'sample.mp4',
        isActive: true
      };
      this.createRoom(demoRoom);
    } else {
      // Initialize rooms from configuration
      for (const config of roomConfigs) {
        const room: InsertRoom = {
          name: config.name,
          password: this.hashPassword(config.password),
          videoKey: config.videoKey,
          isActive: true
        };
        this.createRoom(room);
      }
    }
  }
  
  private initializeVideos() {
    // Sample movies
    const sampleVideos: InsertVideoContent[] = [
      {
        title: 'Big Buck Bunny',
        description: 'A short animated film about a large rabbit dealing with bullies',
        fileKey: 'big_buck_bunny.mp4',
        thumbnailKey: 'big_buck_bunny.jpg',
        contentType: 'movie',
        duration: 596, // 9:56
        createdAt: new Date().toISOString()
      },
      {
        title: 'Sintel',
        description: 'A short film about a girl searching for a dragon',
        fileKey: 'sintel.mp4',
        thumbnailKey: 'sintel.jpg',
        contentType: 'movie',
        duration: 888, // 14:48
        createdAt: new Date().toISOString()
      },
      {
        title: 'Tears of Steel',
        description: 'Sci-fi short film about robots and human emotions',
        fileKey: 'tears_of_steel.mp4',
        thumbnailKey: 'tears_of_steel.jpg',
        contentType: 'movie',
        duration: 734, // 12:14
        createdAt: new Date().toISOString()
      },
      {
        title: 'Elephant\'s Dream',
        description: 'Surreal short film made with open source tools',
        fileKey: 'elephants_dream.mp4',
        thumbnailKey: 'elephants_dream.jpg',
        contentType: 'movie',
        duration: 654, // 10:54
        createdAt: new Date().toISOString()
      }
    ];
    
    // TV Shows
    const tvShowEpisodes: InsertVideoContent[] = [
      {
        title: 'Nature Documentary: Episode 1',
        description: 'The wonders of the natural world',
        fileKey: 'nature_ep1.mp4',
        thumbnailKey: 'nature_ep1.jpg',
        contentType: 'tv',
        duration: 1440, // 24:00
        createdAt: new Date().toISOString()
      },
      {
        title: 'Nature Documentary: Episode 2',
        description: 'Exploring forests and jungles',
        fileKey: 'nature_ep2.mp4',
        thumbnailKey: 'nature_ep2.jpg',
        contentType: 'tv',
        duration: 1440, // 24:00
        createdAt: new Date().toISOString()
      },
      {
        title: 'Cooking Show: Season 1 Episode 1',
        description: 'Learn to cook delicious meals',
        fileKey: 'cooking_s1e1.mp4',
        thumbnailKey: 'cooking_s1e1.jpg',
        contentType: 'tv',
        duration: 1800, // 30:00
        createdAt: new Date().toISOString()
      },
      {
        title: 'Cooking Show: Season 1 Episode 2',
        description: 'Mastering the art of baking',
        fileKey: 'cooking_s1e2.mp4',
        thumbnailKey: 'cooking_s1e2.jpg',
        contentType: 'tv',
        duration: 1800, // 30:00
        createdAt: new Date().toISOString()
      }
    ];
    
    // Add all videos
    [...sampleVideos, ...tvShowEpisodes].forEach(video => {
      this.createVideoContent(video);
    });
  }

  private hashPassword(password: string): string {
    // In a real application, use a proper password hashing library with salt
    // This is a simple hash for demonstration purposes
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Room operations
  async getRoom(id: number): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async getRoomByName(name: string): Promise<Room | undefined> {
    return Array.from(this.rooms.values()).find(
      (room) => room.name === name && room.isActive,
    );
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const id = this.currentRoomId++;
    // Ensure required fields are present, with defaults as needed
    const room: Room = { 
      ...insertRoom, 
      id,
      isActive: insertRoom.isActive ?? true // Default to true if not provided
    };
    this.rooms.set(id, room);
    return room;
  }

  async validateRoomPassword(roomName: string, password: string): Promise<boolean> {
    const room = await this.getRoomByName(roomName);
    if (!room) return false;
    
    // Compare the hashed password
    const hashedPassword = this.hashPassword(password);
    return room.password === hashedPassword;
  }

  // Room session operations
  async createRoomSession(insertSession: InsertRoomSession): Promise<RoomSession> {
    const id = this.currentSessionId++;
    // Ensure required fields are present with defaults
    const session: RoomSession = { 
      ...insertSession, 
      id,
      userId: insertSession.userId ?? null // Default to null if not provided
    };
    this.roomSessions.set(id, session);
    return session;
  }

  async getRoomSessionsByRoomId(roomId: number): Promise<RoomSession[]> {
    return Array.from(this.roomSessions.values()).filter(
      (session) => session.roomId === roomId,
    );
  }

  async getRoomSessionBySessionId(sessionId: string): Promise<RoomSession | undefined> {
    return Array.from(this.roomSessions.values()).find(
      (session) => session.sessionId === sessionId,
    );
  }

  async removeRoomSession(sessionId: string): Promise<void> {
    const session = await this.getRoomSessionBySessionId(sessionId);
    if (session) {
      this.roomSessions.delete(session.id);
    }
  }
  
  // Video content operations
  async getVideoContent(id: number): Promise<VideoContent | undefined> {
    return this.videos.get(id);
  }
  
  async getAllVideoContent(): Promise<VideoContent[]> {
    return Array.from(this.videos.values());
  }
  
  async createVideoContent(insertContent: InsertVideoContent): Promise<VideoContent> {
    const id = this.currentVideoId++;
    // Ensure required fields are present with defaults
    const content: VideoContent = {
      ...insertContent,
      id,
      description: insertContent.description ?? null,
      thumbnailKey: insertContent.thumbnailKey ?? null,
      duration: insertContent.duration ?? null
    };
    this.videos.set(id, content);
    return content;
  }
  
  // Site password validation
  async validateSitePassword(password: string): Promise<boolean> {
    const hashedPassword = this.hashPassword(password);
    return this.sitePassword === hashedPassword;
  }
}

export const storage = new MemStorage();
