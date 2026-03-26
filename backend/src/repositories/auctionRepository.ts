import { PrismaClient } from "@prisma/client";
import type { AuctionStatus } from "../types/index.js";

const prisma = new PrismaClient();

export const auctionRepository = {
  findMany(filters?: { status?: AuctionStatus; statusIn?: AuctionStatus[]; categoryId?: string; catalogId?: string }) {
    const where: any = {};
    if (filters?.statusIn?.length) {
      where.status = { in: filters.statusIn };
    } else if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.catalogId) where.catalogId = filters.catalogId;
    return prisma.auction.findMany({
      where,
      include: {
        category: true,
        catalog: true,
        photos: { orderBy: { sortOrder: "asc" } },
        attributes: { include: { attribute: true } },
        _count: { select: { bids: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  findById(id: string) {
    return prisma.auction.findUnique({
      where: { id },
      include: {
        category: true,
        catalog: true,
        photos: { orderBy: { sortOrder: "asc" } },
        attributes: { include: { attribute: true } },
        bids: { orderBy: { createdAt: "desc" }, take: 10, include: { user: { select: { name: true } } } },
      },
    });
  },

  findByIdWithWinner(id: string) {
    return prisma.auction.findUnique({
      where: { id },
      include: {
        category: true,
        catalog: true,
        photos: { orderBy: { sortOrder: "asc" } },
        attributes: { include: { attribute: true } },
        bids: { orderBy: { createdAt: "desc" }, take: 10, include: { user: { select: { name: true } } } },
        winner: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
  },

  findActiveById(id: string) {
    return prisma.auction.findFirst({
      where: { id, status: "ACTIVE" },
      include: {
        photos: { orderBy: { sortOrder: "asc" } },
        attributes: { include: { attribute: true } },
      },
    });
  },

  create(data: any) {
    return prisma.auction.create({
      data,
      include: { category: true, photos: true, attributes: { include: { attribute: true } } },
    });
  },

  update(id: string, data: any) {
    return prisma.auction.update({
      where: { id },
      data,
      include: { category: true, photos: true, attributes: { include: { attribute: true } } },
    });
  },

  updateCurrentPrice(id: string, currentPrice: number, winnerId?: string) {
    return prisma.auction.update({
      where: { id },
      data: { currentPrice },
    });
  },

  setStatus(id: string, status: AuctionStatus) {
    return prisma.auction.update({
      where: { id },
      data: { status, ...(status === "ENDED" ? { closedAt: new Date() } : {}) },
    });
  },

  bulkSetStatus(catalogId: string, status: AuctionStatus) {
    return prisma.auction.updateMany({ where: { catalogId }, data: { status } });
  },

  delete(id: string) {
    return prisma.auction.delete({ where: { id } });
  },
};
