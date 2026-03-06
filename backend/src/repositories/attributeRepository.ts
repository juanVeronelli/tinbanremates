import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const attributeRepository = {
  findMany() {
    return prisma.dynamicAttributeDef.findMany({
      orderBy: { sortOrder: "asc" },
    });
  },

  findByKey(key: string) {
    return prisma.dynamicAttributeDef.findUnique({ where: { key } });
  },

  create(data: { key: string; label: string; type?: string; options?: string; sortOrder?: number }) {
    return prisma.dynamicAttributeDef.create({
      data: { ...data, type: data.type ?? "text" },
    });
  },

  delete(id: string) {
    return prisma.dynamicAttributeDef.delete({ where: { id } });
  },
};
