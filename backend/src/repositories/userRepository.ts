import { PrismaClient } from "@prisma/client";
import type { Role } from "../types/index.js";

const prisma = new PrismaClient();

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        creditApproved: true,
        createdAt: true,
      },
    });
  },

  findByIdWithPassword(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  findMany() {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        creditApproved: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  create(data: { email: string; passwordHash: string; name: string; phone?: string }) {
    return prisma.user.create({
      data: { ...data, role: "USER" as Role },
      select: { id: true, email: true, name: true, role: true, creditApproved: true },
    });
  },

  setCreditApproved(userId: string, approved: boolean) {
    return prisma.user.update({
      where: { id: userId },
      data: { creditApproved: approved },
    });
  },

  updatePassword(userId: string, passwordHash: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  },
};
