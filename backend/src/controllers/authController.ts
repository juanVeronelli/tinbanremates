import type { Request, Response } from "express";
import { authService } from "../services/authService.js";
import { creditService } from "../services/creditService.js";

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name, phone } = req.body;
    const result = await authService.register(email, password, name, phone);
    res.status(201).json(result);
  } catch (e: any) {
    if (e.message === "EMAIL_IN_USE") {
      res.status(400).json({ error: "EMAIL_IN_USE" });
      return;
    }
    res.status(500).json({ error: "REGISTRATION_FAILED" });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (e: any) {
    if (e.message === "INVALID_CREDENTIALS") {
      res.status(401).json({ error: "INVALID_CREDENTIALS" });
      return;
    }
    res.status(500).json({ error: "LOGIN_FAILED" });
  }
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const user = await authService.getProfile(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: "USER_NOT_FOUND" });
      return;
    }
    res.json(user);
  } catch {
    res.status(500).json({ error: "PROFILE_FAILED" });
  }
}

export async function requestCredit(req: Request, res: Response): Promise<void> {
  try {
    const { amount, note } = req.body;
    const request = await creditService.requestCredit(req.user!.userId, amount, note);
    res.status(201).json(request);
  } catch {
    res.status(500).json({ error: "REQUEST_CREDIT_FAILED" });
  }
}

export async function getMyCreditRequests(req: Request, res: Response): Promise<void> {
  try {
    const list = await creditService.getMyRequests(req.user!.userId);
    res.json(list);
  } catch {
    res.status(500).json({ error: "FAILED" });
  }
}
