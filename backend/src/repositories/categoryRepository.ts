import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const categoryRepository = {
  findMany() {
    return prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { auctions: true } } },
    });
  },

  findById(id: string) {
    return prisma.category.findUnique({ where: { id } });
  },

  create(description: string, slug: string, sortOrder?: number) {
    return prisma.category.create({
      data: { description, slug, sortOrder: sortOrder ?? 0 },
    });
  },
};
