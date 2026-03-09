import type { Request, Response } from "express";
import { auctionService } from "../services/auctionService.js";
import { userRepository } from "../repositories/userRepository.js";
import type { AuctionStatus } from "../types/index.js";

const VISIBLE_WITHOUT_CREDIT: AuctionStatus[] = ["ACTIVE", "PAUSED", "ENDED"];
const VISIBLE_WITH_CREDIT_OR_ADMIN: AuctionStatus[] = ["DRAFT", "ACTIVE", "PAUSED", "ENDED"];

export async function listAuctions(req: Request, res: Response): Promise<void> {
  try {
    const rawStatus = req.query.status;
    const status = typeof rawStatus === "string" && rawStatus && rawStatus !== "undefined"
      ? (rawStatus as AuctionStatus)
      : undefined;
    const rawCategory = req.query.categoryId;
    const categoryId = typeof rawCategory === "string" && rawCategory && rawCategory !== "undefined"
      ? rawCategory
      : undefined;

    let statusIn: AuctionStatus[] | undefined;
    if (status) {
      statusIn = [status];
    } else {
      if (req.user) {
        const user = await userRepository.findById(req.user.userId);
        const canSeeDraft = user && (user.role === "ADMIN" || user.creditApproved === true);
        statusIn = canSeeDraft ? [...VISIBLE_WITH_CREDIT_OR_ADMIN] : [...VISIBLE_WITHOUT_CREDIT];
      } else {
        statusIn = [...VISIBLE_WITHOUT_CREDIT];
      }
    }

    const list = await auctionService.list({ statusIn, categoryId });
    res.json(list);
  } catch {
    res.status(500).json({ error: "LIST_FAILED" });
  }
}

export async function getAuction(req: Request, res: Response): Promise<void> {
  try {
    const isAdmin = (req as any).user?.role === "ADMIN";
    const auction = isAdmin
      ? await auctionService.getByIdWithWinner(req.params.id)
      : await auctionService.getById(req.params.id);
    res.json(auction);
  } catch (e: any) {
    if (e.message === "AUCTION_NOT_FOUND") {
      res.status(404).json({ error: "AUCTION_NOT_FOUND" });
      return;
    }
    res.status(500).json({ error: "FAILED" });
  }
}

export async function getActiveAuction(req: Request, res: Response): Promise<void> {
  try {
    const auction = await auctionService.getActive(req.params.id);
    res.json(auction);
  } catch (e: any) {
    if (e.message === "AUCTION_NOT_FOUND_OR_NOT_ACTIVE") {
      res.status(404).json({ error: "AUCTION_NOT_FOUND_OR_NOT_ACTIVE" });
      return;
    }
    res.status(500).json({ error: "FAILED" });
  }
}

export async function getCategories(req: Request, res: Response): Promise<void> {
  try {
    const list = await auctionService.getCategories();
    res.json(list);
  } catch {
    res.status(500).json({ error: "FAILED" });
  }
}

export async function getAttributeDefs(req: Request, res: Response): Promise<void> {
  try {
    const list = await auctionService.getAttributeDefs();
    res.json(list);
  } catch {
    res.status(500).json({ error: "FAILED" });
  }
}

export async function createAuction(req: Request, res: Response): Promise<void> {
  try {
    const auction = await auctionService.create(req.body);
    res.status(201).json(auction);
  } catch {
    res.status(500).json({ error: "CREATE_FAILED" });
  }
}

export async function updateAuction(req: Request, res: Response): Promise<void> {
  try {
    const auction = await auctionService.update(req.params.id, req.body);
    res.json(auction);
  } catch {
    res.status(500).json({ error: "UPDATE_FAILED" });
  }
}

export async function setAuctionStatus(req: Request, res: Response): Promise<void> {
  try {
    const { status } = req.body as { status: AuctionStatus };
    const auction = await auctionService.setStatus(req.params.id, status);
    res.json(auction);
  } catch {
    res.status(500).json({ error: "UPDATE_STATUS_FAILED" });
  }
}

export async function deleteAuction(req: Request, res: Response): Promise<void> {
  try {
    await auctionService.delete(req.params.id);
    res.status(204).send();
  } catch (e: any) {
    if (e?.code === "P2025") {
      res.status(404).json({ error: "AUCTION_NOT_FOUND" });
      return;
    }
    res.status(500).json({ error: "DELETE_FAILED" });
  }
}

export async function uploadAuctionPhotos(req: Request, res: Response): Promise<void> {
  try {
    const files = (req as any).files as Express.Multer.File[] | undefined;
    if (!files || !files.length) {
      res.status(400).json({ error: "NO_FILES" });
      return;
    }
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const urls = files.map((file) => `${baseUrl}/uploads/${file.filename}`);
    res.status(201).json({ urls });
  } catch {
    res.status(500).json({ error: "UPLOAD_FAILED" });
  }
}
