import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { prisma } from "./lib/prisma.js";
import authRoutes from "./routes/authRoutes.js";
import auctionRoutes from "./routes/auctionRoutes.js";
import bidRoutes from "./routes/bidRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { setupSocket } from "./socket/index.js";

const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:5173", credentials: true }));
app.use(express.json());

app.set("io", setupSocket(httpServer));

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

const PORT = Number(process.env.PORT) || 4000;
httpServer.listen(PORT, () => {
  console.log(`Tinban Remates API listening on http://localhost:${PORT}`);
});
