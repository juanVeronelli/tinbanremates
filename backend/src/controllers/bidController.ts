import type { Request, Response } from "express";
import { bidService } from "../services/bidService.js";
import { emitNewBid } from "../socket/index.js";

export async function placeBid(req: Request, res: Response): Promise<void> {
  try {
    const { amount } = req.body;
    const auctionId = req.params.id;
    const userId = req.user!.userId;
    const result = await bidService.placeBid({ auctionId, userId, amount: Number(amount) });
    const io = (req as any).app?.get?.("io");
    if (io) emitNewBid(io, auctionId, { bid: result.bid, auction: result.auction });
    res.status(201).json(result);
  } catch (e: any) {
    const msg = e.message;
    if (msg === "AUCTION_NOT_FOUND" || msg === "AUCTION_NOT_FOUND_OR_NOT_ACTIVE") {
      res.status(404).json({ error: msg });
      return;
    }
    if (msg === "AUCTION_NOT_ACTIVE" || msg === "AUCTION_ENDED") {
      res.status(400).json({ error: msg });
      return;
    }
    if (msg === "CREDIT_NOT_APPROVED" || msg === "CREDIT_LIMIT_EXCEEDED") {
      res.status(403).json({ error: msg });
      return;
    }
    if (msg === "BID_TOO_LOW") {
      res.status(400).json({ error: msg });
      return;
    }
    res.status(500).json({ error: "BID_FAILED" });
  }
}

export async function getBidHistory(req: Request, res: Response): Promise<void> {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const list = await bidService.getHistory(req.params.id, limit);
    res.json(list);
  } catch {
    res.status(500).json({ error: "FAILED" });
  }
}
