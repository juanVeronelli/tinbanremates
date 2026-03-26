import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function sortByLotNumber(auctions: any[]) {
  return auctions.sort((a, b) => {
    const na = parseInt(a.lotNumber ?? "", 10);
    const nb = parseInt(b.lotNumber ?? "", 10);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    if (!isNaN(na)) return -1;
    if (!isNaN(nb)) return 1;
    return (a.lotNumber ?? "").localeCompare(b.lotNumber ?? "");
  });
}

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

  async findByIdWithAuctions(id: string) {
    const catalog = await prisma.catalog.findUnique({
      where: { id },
      include: {
        _count: { select: { auctions: true } },
        auctions: {
          include: {
            category: true,
            catalog: true,
            photos: { orderBy: { sortOrder: "asc" }, take: 1 },
            _count: { select: { bids: true } },
          },
        },
      },
    });
    if (catalog?.auctions) {
      (catalog as any).auctions = sortByLotNumber(catalog.auctions);
    }
    return catalog;
  },

  async countByCatalog(catalogId: string) {
    return prisma.auction.count({ where: { catalogId } });
  },

  create(data: { name: string; description?: string; slug: string; photoUrl?: string; sortOrder?: number }) {
    return prisma.catalog.create({
      data: { ...data, sortOrder: data.sortOrder ?? 0 },
    });
  },

  update(id: string, data: { name?: string; description?: string; slug?: string; photoUrl?: string; sortOrder?: number }) {
    return prisma.catalog.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.catalog.delete({ where: { id } });
  },
};
