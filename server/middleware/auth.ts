import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; username: string };
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

export function checkRoomAccess(req: AuthRequest, res: Response, next: NextFunction) {
  const roomId = req.params.roomId;
  // Add your room access logic here
  // For example, check if the user is a member of the room
  next();
}

export function checkFileAccess(req: AuthRequest, res: Response, next: NextFunction) {
  const fileKey = req.params.key;
  // Add your file access logic here
  // For example, check if the user has permission to access the file
  next();
} 