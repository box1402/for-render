import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import dotenv from 'dotenv';
import mediaRoutes from './routes/media';
import authRoutes from './routes/auth';
import { authenticateToken, checkRoomAccess, checkFileAccess } from './middleware/auth';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
  },
  path: process.env.WS_PATH || '/socket.io',
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max file size
  abortOnLimit: true,
}));

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/media', authenticateToken, checkFileAccess, mediaRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join', (data: { roomId: string; token: string }) => {
    try {
      const user = jwt.verify(data.token, process.env.JWT_SECRET!) as { username: string };
      socket.join(data.roomId);
      console.log(`Client ${socket.id} (${user.username}) joined room ${data.roomId}`);
    } catch (error) {
      console.error('Invalid token:', error);
      socket.disconnect();
    }
  });

  socket.on('leave', (roomId: string) => {
    socket.leave(roomId);
    console.log(`Client ${socket.id} left room ${roomId}`);
  });

  socket.on('play', (data: { roomId: string; time: number }) => {
    socket.to(data.roomId).emit('play', { time: data.time });
  });

  socket.on('pause', (data: { roomId: string; time: number }) => {
    socket.to(data.roomId).emit('pause', { time: data.time });
  });

  socket.on('seek', (data: { roomId: string; time: number }) => {
    socket.to(data.roomId).emit('seek', { time: data.time });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
const WS_PORT = process.env.WS_PORT || 5001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server running on port ${WS_PORT}`);
});
