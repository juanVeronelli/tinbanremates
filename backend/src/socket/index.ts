import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { authService } from "../services/authService.js";
import { bidService } from "../services/bidService.js";
import type { JwtPayload } from "../types/index.js";

export function setupSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CORS_ORIGIN ?? "http://localhost:5173", methods: ["GET", "POST"] },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token ?? socket.handshake.query?.token;
    if (!token) return next();
    try {
      (socket as any).user = authService.verifyToken(token as string) as JwtPayload;
    } catch {}
    next();
  });

  io.on("connection", (socket) => {
    socket.on("join_auction", (auctionId: string) => {
      socket.join(`auction:${auctionId}`);
    });

    socket.on("leave_auction", (auctionId: string) => {
      socket.leave(`auction:${auctionId}`);
    });
  });

  return io;
}

export function emitNewBid(io: Server, auctionId: string, payload: { bid: any; auction: any }) {
  io.to(`auction:${auctionId}`).emit("new_bid", payload);
}

export function emitAuctionUpdate(io: Server, auctionId: string, payload: { endsAt: string; currentPrice: number; status?: string }) {
  io.to(`auction:${auctionId}`).emit("auction_update", payload);
}
