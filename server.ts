import express from 'express';
import http from 'http';
import socketIo from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new socketIo.Server(server, {
  cors: {
    // origin: 'https://growup-9psm.onrender.com', // Allow requests from all origins (you may want to be more restrictive in production)
origin: [
      'https://growup-9psm.onrender.com',   // Allow requests from Render domain
      'https://chat-frontend-one-sigma.vercel.app'  // Allow requests from Vercel domain
    ],  
}
});

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(4000, () => {
  console.log('Socket server running on port 4000');
});
