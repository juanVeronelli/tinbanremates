import type { Request, Response, NextFunction } from "express";
import { authService } from "../services/authService.js";
import type { JwtPayload } from "../types/index.js";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "UNAUTHORIZED" });
    return;
  }
  try {
    req.user = authService.verifyToken(token) as JwtPayload;
    next();
  } catch {
    res.status(401).json({ error: "INVALID_TOKEN" });
  }
}

/** No exige token; si viene y es válido, pone req.user */
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    next();
    return;
  }
  try {
    req.user = authService.verifyToken(token) as JwtPayload;
  } catch {
    // token inválido: seguir sin usuario
  }
  next();
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "UNAUTHORIZED" });
    return;
  }
  if (req.user.role !== "ADMIN") {
    res.status(403).json({ error: "FORBIDDEN" });
    return;
  }
  next();
}
