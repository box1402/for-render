import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyToken } from './auth';
import { storage } from './storage';

interface SocketData {
  roomId: number;
  userId: string;
}

export function initializeSocket(server: HttpServer): Server {
  const io = new Server(server, {
    path: process.env.WS_PATH || '/socket.io',
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.CLIENT_URL 
        : 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token missing'));
      }

      const decoded = await verifyToken(token);
      if (!decoded) {
        return next(new Error('Invalid token'));
      }

      socket.data = decoded;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join room
    socket.on('join', async ({ roomId }: { roomId: number }) => {
      try {
        const room = await storage.getRoom(roomId);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        socket.join(`room:${roomId}`);
        socket.emit('joined', { roomId });
        
        // Notify other users in the room
        socket.to(`room:${roomId}`).emit('userJoined', {
          userId: socket.data.userId,
          roomId
        });
      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Leave room
    socket.on('leave', ({ roomId }: { roomId: number }) => {
      socket.leave(`room:${roomId}`);
      socket.to(`room:${roomId}`).emit('userLeft', {
        userId: socket.data.userId,
        roomId
      });
    });

    // Video sync events
    socket.on('play', ({ roomId, time }: { roomId: number; time: number }) => {
      socket.to(`room:${roomId}`).emit('play', { time });
    });

    socket.on('pause', ({ roomId, time }: { roomId: number; time: number }) => {
      socket.to(`room:${roomId}`).emit('pause', { time });
    });

    socket.on('seek', ({ roomId, time }: { roomId: number; time: number }) => {
      socket.to(`room:${roomId}`).emit('seek', { time });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
} 