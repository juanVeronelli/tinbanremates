import { PrismaClient } from "@prisma/client";
import type { CreditStatus } from "@prisma/client";

const prisma = new PrismaClient();

export const creditRequestRepository = {
  create(userId: string, amount?: number, note?: string) {
    return prisma.creditRequest.create({
      data: { userId, amount, note, status: "PENDING" },
      include: { user: { select: { name: true, email: true } } },
    });
  },

  findPending() {
    return prisma.creditRequest.findMany({
      where: { status: "PENDING" },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  updateStatus(id: string, status: CreditStatus, adminNote?: string) {
    return prisma.creditRequest.update({
      where: { id },
      data: { status, adminNote },
      include: { user: true },
    });
  },

  findByUser(userId: string) {
    return prisma.creditRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  async getApprovedTotalByUser(userId: string): Promise<number> {
    const agg = await prisma.creditRequest.aggregate({
      _sum: { amount: true },
      where: { userId, status: "APPROVED" },
    });
    const sum = agg._sum?.amount;
    if (sum == null) return 0;
    return Number(String(sum));
  },
};
