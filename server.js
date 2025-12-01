import express, { json } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware for JSON body parsing
app.use(json());

// Create HTTP server
const server = createServer(app);

// Initialize socket.io with CORS configuration
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",  // Allow all origins or use a specific one like: https://your-frontend-url
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Debugging: Enable socket.io debug logs in development
if (process.env.NODE_ENV === 'development') {
  io.set('transports', ['websocket']);  // Use WebSocket in dev mode for better performance
}

io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);

  // Handle socket events
  socket.on("join", ({ postId }) => {
    if (postId) {
      const room = `post_${postId}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
    }
  });

  socket.on("sendMessage", (msg) => {
    const { senderId, receiverId, content, avatar, id } = msg;
    const room = [senderId, receiverId].sort().join("_");
    const message = { id, senderId, receiverId, content, avatar: avatar || null, created_at: new Date() };

    io.to(room).emit("message:new", message); // Send message to both sender and receiver
    io.to(`user_${receiverId}`).emit("inbox:update", message);
    io.to(`user_${senderId}`).emit("inbox:update", message);
  });

  socket.on("disconnect", (reason) => {
    console.log(`Socket ${socket.id} disconnected: ${reason}`);
  });
});

// Broadcast endpoint for posts (example of your use case)
app.post("/broadcast", (req, res) => {
  const { postId, payload } = req.body;
  if (!postId) return res.status(400).json({ error: "postId required" });

  const room = `post_${postId}`;
  console.log(`Broadcasting to room ${room}:`, payload);
  io.to(room).emit("reactions:update", { postId, payload });
  io.to(room).emit("comments:update", { postId, payload });
  res.json({ ok: true });
});

// Server listening on the specified port
server.listen(PORT, () => {
  console.log(`✅ Socket server running on port ${PORT}`);
});
