import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { userRepository } from "../repositories/userRepository.js";
import { creditRequestRepository } from "../repositories/creditRequestRepository.js";
import type { JwtPayload, AuthUser } from "../types/index.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";
const SALT_ROUNDS = 10;

export const authService = {
  async register(email: string, password: string, name: string, phone?: string) {
    const existing = await userRepository.findByEmail(email);
    if (existing) throw new Error("EMAIL_IN_USE");
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await userRepository.create({ email, passwordHash, name, phone });
    const token = this.generateToken(user.id, user.email, user.role);
    return { user: this.toAuthUser(user), token };
  },

  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new Error("INVALID_CREDENTIALS");
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new Error("INVALID_CREDENTIALS");
    const token = this.generateToken(user.id, user.email, user.role);
    return {
      user: this.toAuthUser({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        creditApproved: user.creditApproved,
      }),
      token,
    };
  },

  generateToken(userId: string, email: string, role: string): string {
    return jwt.sign(
      { userId, email, role } as JwtPayload,
      JWT_SECRET,
      { expiresIn: "7d" }
    );
  },

  verifyToken(token: string): JwtPayload {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  },

  async getProfile(userId: string): Promise<(AuthUser & { creditBalance: number }) | null> {
    const u = await userRepository.findById(userId);
    if (!u) return null;
    const creditBalance = await creditRequestRepository.getApprovedTotalByUser(userId);
    return { ...this.toAuthUser(u), creditBalance };
  },

  toAuthUser(u: { id: string; email: string; name: string; role: string; creditApproved: boolean }): AuthUser {
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role as AuthUser["role"],
      creditApproved: u.creditApproved,
    };
  },
};
