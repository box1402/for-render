import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Room schema to define video rooms
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  password: text("password").notNull(),
  videoKey: text("video_key").notNull(),
  isActive: boolean("is_active").default(true),
});

// Room Session schema to track connected users
export const roomSessions = pgTable("room_sessions", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  userId: integer("user_id"),
  sessionId: text("session_id").notNull().unique(),
  createdAt: text("created_at").notNull(),
});

// Schema for video content
export const videoContent = pgTable("video_content", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  fileKey: text("file_key").notNull(),
  thumbnailKey: text("thumbnail_key"),
  contentType: text("content_type").notNull(), // 'movie', 'tv', etc
  duration: integer("duration"), // in seconds
  createdAt: text("created_at").notNull(),
});

// Schema for user insert operations
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Schema for room insert operations
export const insertRoomSchema = createInsertSchema(rooms).pick({
  name: true,
  password: true,
  videoKey: true,
  isActive: true,
});

// Schema for room session insert operations
export const insertRoomSessionSchema = createInsertSchema(roomSessions).pick({
  roomId: true,
  userId: true,
  sessionId: true,
  createdAt: true,
});

// Schema for video content insert operations
export const insertVideoContentSchema = createInsertSchema(videoContent).pick({
  title: true,
  description: true,
  fileKey: true,
  thumbnailKey: true,
  contentType: true,
  duration: true,
  createdAt: true,
});

// Schema for room authentication
export const roomAuthSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  password: z.string().min(1, "Password is required"),
});

// Schema for site password
export const sitePasswordSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

// Types for ORM
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;

export type InsertRoomSession = z.infer<typeof insertRoomSessionSchema>;
export type RoomSession = typeof roomSessions.$inferSelect;

export type InsertVideoContent = z.infer<typeof insertVideoContentSchema>;
export type VideoContent = typeof videoContent.$inferSelect;

// Authentication response types
export type AuthResponse = {
  success: boolean;
  message?: string;
  room?: {
    id: number;
    name: string;
    videoKey: string;
  };
  token?: string;
};

// Site authentication response
export type SiteAuthResponse = {
  success: boolean;
  message?: string;
};

// Video sync message types
export type VideoSyncAction = 
  | { type: 'play'; timestamp: number }
  | { type: 'pause'; timestamp: number }
  | { type: 'seek'; timestamp: number };

export type VideoSyncMessage = {
  action: VideoSyncAction;
  roomId: number;
  senderId: string;
};

export type UserStatusMessage = {
  type: 'status';
  roomId: number;
  online: boolean;
  userId: string;
};

// Content response type for listing videos
export type ContentListResponse = {
  success: boolean;
  content?: VideoContent[];
  message?: string;
};
