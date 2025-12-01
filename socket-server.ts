// import express from "express";
// import http from "http";
// import { Server as IOServer } from "socket.io";

// const app = express();
// const server = http.createServer(app);

// const io = new IOServer(server, {
//   cors: {
//     origin: "http://localhost:3000",  // The frontend URL
//     methods: ["GET", "POST"],
//     credentials: true,
//   },
// });

// io.on("connection", (socket) => {
//   console.log(`User connected: ${socket.id}`);

//   socket.on("disconnect", () => {
//     console.log(`User disconnected: ${socket.id}`);
//   });

//   // Handle custom socket events here
//   socket.on("message", (message) => {
//     console.log("Message received:", message);
//     // Broadcast to all connected clients
//     io.emit("message", message);
//   });
// });

// const PORT = process.env.PORT || 4000;
// server.listen(PORT, () => {
//   console.log(`✅ Socket server running on port ${PORT}`);
// });


















import express from "express";
import http from "http";
import { Server as IOServer, Socket } from "socket.io";

// const PORT = 4000;

 //  const PORT = process.env.PORT || 4000;
 const PORT = process.env.PORT || 4000;
// const PORT = 5000;
const app = express();

app.use(express.json());

const server = http.createServer(app);
// const io = new IOServer(server, {
//   cors: { origin: ["https://growup-9psm.onrender.com"], methods: ["GET", "POST"], credentials: true },
// });
const io = new IOServer(server, {
  cors: {
    origin: "http://localhost:3000",  // The frontend URL
    methods: ["GET", "POST"],
    credentials: true,
  },
});
// const io = new IOServer(server, {
//   cors: {
//     origin: "https://growup-9psm.onrender.com", 
//      // Allow your frontend domain
//     // origin: '*',  // Allow all origins, or specify your frontend domain 
//     methods: ["GET", "POST"],
//     credentials: true,
//   }
// });
// console.log("🚀 Starting Socket Server...");
interface UnsendMessagePayload {
  id: string;
  senderId: string;
  receiverId: string;
}

// interface UnsentMessageBroadcast {
//   id: string;
//   content: string;
//   isUnsent: boolean;
// }
interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  avatar: string | null;
  created_at: Date;
}
io.on("connection", (socket: Socket) => {
  console.log("✅ Socket connected:", socket.id);

  // Join post room
  socket.on("join", ({ postId }: { postId: number | string }) => {
    if (!postId) return;
    const room = `post_${postId}`;
    socket.join(room);
    console.log(`Socket ${socket.id} joined room ${room}`);
  });

  // Join user-specific notification room
  socket.on("joinUserRoom", ({ userId }: { userId: number | string }) => {
    if (!userId) return;
    const room = `user_${userId}`;
    // socket.join(room);
      socket.join(`user_${userId}`);

    console.log(`👤 Socket ${socket.id} joined user room ${room}`);
  });

// socket.on("joinChat", ({ userId, otherUserId }: { userId: string; otherUserId: string }) => {
//     if (!userId || !otherUserId) return;
//     const room = [userId, otherUserId].sort().join("_"); // ensures same room for both users
//     socket.join(room);
//     console.log(`💬 Socket ${socket.id} joined chat room ${room}`);
//   });
socket.on("joinChat", ({ userId, otherUserId }) => {
  if (!userId || !otherUserId) return;
  const room = [userId, otherUserId].sort().join("_"); // same room for both users
  socket.join(room);
  console.log(`💬 Socket ${socket.id} joined chat room ${room}`);
});

socket.on("sendMessage", (msg: ChatMessage) => {
  const { senderId, receiverId, content, avatar, id } = msg;
  const room = [senderId, receiverId].sort().join("_");

  const message = {
    id,
    senderId,
    receiverId,
    content,
    avatar: avatar || null,
    created_at: new Date(),
  };

  io.to(room).emit("message:new", message);
  io.to(`user_${receiverId}`).emit("inbox:update", message);
  io.to(`user_${senderId}`).emit("inbox:update", message);
});


socket.on("unsendMessage", (msg: UnsendMessagePayload) => {
  const { id, senderId, receiverId } = msg;
  if (!id || !senderId || !receiverId) return;

  // The chat room is the sorted IDs so both users join same room
  const room = [senderId, receiverId].sort().join("_");

  // Emit to all users in the room (both sender and receiver)
  io.to(room).emit("message:unsent", {
    id,
    content: "This message was removed",
    isUnsent: true,
  });

  console.log(`Message ${id} unsent -> room ${room}`);
});


// socket.on("typing:start", ({ senderId, receiverId, senderName }) => {
//   if (!senderId || !receiverId) return;
//   const room = [senderId, receiverId].sort().join("_");
//   socket.to(room).emit("typing:update", { senderName, typing: true });
// });

// socket.on("typing:stop", ({ senderId, receiverId, senderName }) => {
//   if (!senderId || !receiverId) return;
//   const room = [senderId, receiverId].sort().join("_");
//   socket.to(room).emit("typing:update", { senderName, typing: false });
// });
// socket.on("typing:start", ({ senderId, receiverId, senderName }) => {
//   if (!senderId || !receiverId) return;
//   const room = [senderId, receiverId].sort().join("_");
//   socket.to(room).emit("typing:update", { senderName, typing: true });
// });

// socket.on("typing:stop", ({ senderId, receiverId, senderName }) => {
//   if (!senderId || !receiverId) return;
//   const room = [senderId, receiverId].sort().join("_");
//   socket.to(room).emit("typing:update", { senderName, typing: false });
// });
// socket.on("typing:start", ({ senderId, receiverId, senderName }) => {
//   if (!senderId || !receiverId) return;
//   io.to(`user_${receiverId}`).emit("typing:update", { senderName, typing: true });
// });

// socket.on("typing:stop", ({ senderId, receiverId, senderName }) => {
//   if (!senderId || !receiverId) return;
//   io.to(`user_${receiverId}`).emit("typing:update", { senderName, typing: false });
// });
socket.on("typing:start", ({ senderId, receiverId, senderName }) => {
  if (!senderId || !receiverId) return;

  socket.to(`user_${receiverId}`).emit("typing:update", {
    senderId,
    senderName,
    typing: true
  });
});

socket.on("typing:stop", ({ senderId, receiverId, senderName }) => {
  if (!senderId || !receiverId) return;

  socket.to(`user_${receiverId}`).emit("typing:update", {
    senderId,
    senderName,
    typing: false
  });
});


socket.on("leaveChat", ({ room }: { room: string }) => {
  socket.leave(room);
  console.log(`💬 Socket ${socket.id} left chat room ${room}`);
});



  socket.on("disconnect", (reason) => {
    console.log(`Socket disconnected: ${socket.id} (${reason})`);
  });
});

// Broadcast post updates
app.post("/broadcast", (req, res) => {
  const { postId, payload } = req.body;
  if (!postId) return res.status(400).json({ error: "postId required" });

  const room = `post_${postId}`;
    console.log(`📝 New comment for post ${postId}:`, payload);

  io.to(room).emit("reactions:update", { postId, payload });
  io.to(room).emit("comments:update", { postId, payload });
  
  console.log(`✅ Broadcasted to room ${room}`);
  res.json({ ok: true });
});
// socket.ts

app.post("/online-status", (req, res) => {
  const { userId, online } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  io.emit("onlineStatus:update", { userId, online });
  console.log(`🌐 Online status changed: User ${userId} → ${online}`);

  res.json({ ok: true });
});

// Send notification to user
app.post("/notify", (req, res) => {
  const { userId, notification, action, post_id, type, title, actorName } = req.body;
  if (!userId || !notification) {
    return res.status(400).json({ error: "userId & notification required" });
  }

  const room = `user_${userId}`;
  const event =
    action === "update"
      ? "notification:update"
      : action === "delete"
      ? "notification:delete"
      : "notification:new";

  const payload =
    event === "notification:new"
      ? {
          ...notification,
          type: type || "comment",
          // post_id: post_id,
                  post_id: notification.post_id || post_id || null,

          // title: title || "",
                  title: notification.title || title || "", // <- use notification.title first

          actorName: actorName || "",
          created_at: new Date(),
          is_read: false,
        }
      : notification;

  io.to(room).emit(event, payload);
  console.log(`🔔 [${event}] -> ${room}:`, payload);

  res.json({ ok: true });
});

server.listen(PORT, () => console.log(`✅ Socket server running on port ${PORT}`));
