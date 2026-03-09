import type { Request, Response } from "express";
import { creditService } from "../services/creditService.js";
import { creditRequestRepository } from "../repositories/creditRequestRepository.js";
import { categoryRepository } from "../repositories/categoryRepository.js";
import { attributeRepository } from "../repositories/attributeRepository.js";
import { auctionService } from "../services/auctionService.js";
import type { CreditStatus } from "../types/index.js";

export async function listCreditRequests(req: Request, res: Response): Promise<void> {
  try {
    const list = await creditService.listPending();
    res.json(list);
  } catch {
    res.status(500).json({ error: "FAILED" });
  }
}

export async function resolveCreditRequest(req: Request, res: Response): Promise<void> {
  try {
    const { status, adminNote } = req.body as { status: CreditStatus; adminNote?: string };
    const result = await creditService.resolveRequest(req.params.id, status, adminNote);
    res.json(result);
  } catch {
    res.status(500).json({ error: "RESOLVE_FAILED" });
  }
}

export async function listCategories(req: Request, res: Response): Promise<void> {
  try {
    const list = await categoryRepository.findMany();
    res.json(list);
  } catch {
    res.status(500).json({ error: "FAILED" });
  }
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  try {
    const { description, slug, sortOrder } = req.body;
    const cat = await categoryRepository.create(description, slug, sortOrder);
    res.status(201).json(cat);
  } catch {
    res.status(500).json({ error: "CREATE_FAILED" });
  }
}

export async function listAttributeDefs(req: Request, res: Response): Promise<void> {
  try {
    const list = await attributeRepository.findMany();
    res.json(list);
  } catch {
    res.status(500).json({ error: "FAILED" });
  }
}

export async function createAttributeDef(req: Request, res: Response): Promise<void> {
  try {
    const { key, label, type, options, sortOrder } = req.body;
    const attr = await attributeRepository.create({ key, label, type, options, sortOrder });
    res.status(201).json(attr);
  } catch {
    res.status(500).json({ error: "CREATE_FAILED" });
  }
}

export async function deleteAttributeDef(req: Request, res: Response): Promise<void> {
  try {
    await attributeRepository.delete(req.params.id);
    res.status(204).send();
  } catch {
    res.status(500).json({ error: "DELETE_FAILED" });
  }
}

export async function approveAuctionWinner(req: Request, res: Response): Promise<void> {
  try {
    const auction = await auctionService.approveWinner(req.params.id);
    res.json(auction);
  } catch {
    res.status(500).json({ error: "APPROVE_WINNER_FAILED" });
  }
}

export async function rejectAuctionWinner(req: Request, res: Response): Promise<void> {
  try {
    await auctionService.delete(req.params.id);
    res.status(204).send();
  } catch {
    res.status(500).json({ error: "REJECT_WINNER_FAILED" });
  }
}
