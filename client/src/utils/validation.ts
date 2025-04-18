import { z } from "zod";
import { roomAuthSchema } from "@shared/schema";

// Extend the room auth schema with additional validation if needed
export const extendedRoomAuthSchema = roomAuthSchema.extend({
  name: z.string()
    .min(1, "Room name is required")
    .max(50, "Room name cannot exceed 50 characters"),
  password: z.string()
    .min(1, "Password is required")
    .max(100, "Password is too long"),
});

// Validate room auth credentials
export function validateRoomCredentials(roomName: string, password: string): {
  valid: boolean;
  errors: Record<string, string>;
} {
  try {
    extendedRoomAuthSchema.parse({ name: roomName, password });
    return { valid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      
      error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      
      return { valid: false, errors };
    }
    
    return { 
      valid: false, 
      errors: { general: "Invalid input" } 
    };
  }
}
