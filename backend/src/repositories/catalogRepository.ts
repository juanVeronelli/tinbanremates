import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const catalogRepository = {
  findMany() {
    return prisma.catalog.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { auctions: true } } },
    });
  },

  findById(id: string) {
    return prisma.catalog.findUnique({ where: { id } });
  },

  create(data: { name: string; description?: string; slug: string; sortOrder?: number }) {
    return prisma.catalog.create({
      data: { ...data, sortOrder: data.sortOrder ?? 0 },
    });
  },

  update(id: string, data: { name?: string; description?: string; slug?: string; sortOrder?: number }) {
    return prisma.catalog.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.catalog.delete({ where: { id } });
  },
};
