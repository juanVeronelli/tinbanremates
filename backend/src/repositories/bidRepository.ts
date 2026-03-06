import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const bidRepository = {
  create(auctionId: string, userId: string, amount: number) {
    return prisma.bid.create({
      data: { auctionId, userId, amount },
      include: { user: { select: { name: true } } },
    });
  },

  findLastByAuction(auctionId: string) {
    return prisma.bid.findFirst({
      where: { auctionId },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    });
  },

  findManyByAuction(auctionId: string, limit = 50) {
    return prisma.bid.findMany({
      where: { auctionId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { user: { select: { name: true } } },
    });
  },

  countByAuction(auctionId: string) {
    return prisma.bid.count({ where: { auctionId } });
  },
};
