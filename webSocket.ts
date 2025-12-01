"use client";  // This is required for Next.js client-side components
import { io, Socket } from "socket.io-client";

// Declare the socket variable globally for reuse
let socket: Socket | null = null;

export function initSocket(url?: string) {
  if (!socket) {
    const SOCKET_URL = url || process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000"; // Default to localhost:4000
    socket = io(SOCKET_URL, {
      transports: ["websocket"], // Ensure you're using WebSocket transport
      reconnectionAttempts: 5,   // Allow reconnection attempts
    });

    // Log when the socket successfully connects
    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket?.id);  // This should log when the connection is successful
    });

    // Handle connection errors
    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
    });

    socket.on("connect_timeout", () => {
      console.error("❌ Socket connection timeout");
    });

    // Log disconnection
    socket.on("disconnect", (reason) => {
      console.log(`⚠️ Socket disconnected: ${reason}`);
    });
  }

  return socket;
}

export function getSocket() {
  return socket;
}

export function closeSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
