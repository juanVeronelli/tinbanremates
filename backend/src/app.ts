import express from "express";
import cors from "cors";
import path from "node:path";
import { prisma } from "./lib/prisma.js";
import authRoutes from "./routes/authRoutes.js";
import auctionRoutes from "./routes/auctionRoutes.js";
import bidRoutes from "./routes/bidRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

export const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin) { callback(null, true); return; }
      // Permitir cualquier puerto localhost en desarrollo
      const isLocalhost = /^http:\/\/localhost:\d+$/.test(origin);
      if (isLocalhost || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Not allowed by CORS: ${origin}`));
    },
  }),
);
app.use(express.json());
app.use("/uploads", express.static(path.resolve("uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/auctions", bidRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: "connected" });
  } catch (e) {
    console.error("Health check DB error:", e);
    res.status(503).json({ ok: false, db: "error" });
  }
});

