import { auctionRepository } from "../repositories/auctionRepository.js";
import { attributeRepository } from "../repositories/attributeRepository.js";
import { bidRepository } from "../repositories/bidRepository.js";
import type { CreateAuctionInput, AuctionStatus } from "../types/index.js";

async function finalizeAuctionIfExpired(auction: any) {
  if (!auction || auction.status !== "ACTIVE" || !auction.endsAt) return auction;
  const endsAt = new Date(auction.endsAt);
  if (isNaN(endsAt.getTime()) || endsAt.getTime() > Date.now()) return auction;

  const lastBid = await bidRepository.findLastByAuction(auction.id);
  await auctionRepository.update(auction.id, {
    status: "ENDED",
    closedAt: new Date(),
    winnerId: lastBid ? (lastBid as any).userId : null,
  } as any);
  return auctionRepository.findById(auction.id);
}

export const auctionService = {
  async list(filters?: { status?: AuctionStatus; statusIn?: AuctionStatus[]; categoryId?: string }) {
    const auctions = await auctionRepository.findMany(filters);
    return Promise.all(auctions.map((a: any) => finalizeAuctionIfExpired(a)));
  },

  async getById(id: string) {
    const auction = await auctionRepository.findById(id);
    if (!auction) throw new Error("AUCTION_NOT_FOUND");
    return finalizeAuctionIfExpired(auction);
  },

  async getByIdWithWinner(id: string) {
    const auction = await auctionRepository.findByIdWithWinner(id);
    if (!auction) throw new Error("AUCTION_NOT_FOUND");
    return finalizeAuctionIfExpired(auction);
  },

  async getActive(id: string) {
    const auction = await auctionRepository.findActiveById(id);
    if (!auction) throw new Error("AUCTION_NOT_FOUND_OR_NOT_ACTIVE");
    const updated = await finalizeAuctionIfExpired(auction);
    if (!updated || updated.status !== "ACTIVE") {
      throw new Error("AUCTION_NOT_FOUND_OR_NOT_ACTIVE");
    }
    return updated;
  },

  async create(input: CreateAuctionInput) {
    const { attributes, photoUrls, ...data } = input;
    const attrDefs = await attributeRepository.findMany();
    const attributeCreates =
      attributes && Object.keys(attributes).length > 0
        ? (attrDefs as any[])
            .filter((def) => attributes[(def as any).key])
            .map((def) => ({ attributeId: (def as any).id, value: attributes[(def as any).key]! }))
        : undefined;
    const auction = await auctionRepository.create({
      ...data,
      currentPrice: data.minimumPrice,
      status: "ACTIVE",
      photos: photoUrls?.length
        ? { create: photoUrls.map((url, i) => ({ url, sortOrder: i })) }
        : undefined,
      attributes: attributeCreates?.length ? { create: attributeCreates } : undefined,
    });
    return auctionRepository.findById(auction.id);
  },

  async update(id: string, input: Partial<CreateAuctionInput>) {
    const { attributes: attrInput, photoUrls, ...data } = input;
    const updatePayload: Record<string, unknown> = { ...data };
    if (attrInput !== undefined) {
      const attrDefs = (await attributeRepository.findMany()) as any[];
      const attributeCreates =
        Object.keys(attrInput).length > 0
          ? attrDefs
              .filter((def) => (attrInput as any)[(def as any).key])
              .map((def) => ({ attributeId: (def as any).id, value: (attrInput as any)[(def as any).key]! }))
          : [];
      updatePayload.attributes = { deleteMany: {}, create: attributeCreates };
    }
    if (updatePayload.startsAt != null && typeof updatePayload.startsAt === "string") {
      updatePayload.startsAt = new Date(updatePayload.startsAt as string);
    }
    if (updatePayload.endsAt != null && typeof updatePayload.endsAt === "string") {
      updatePayload.endsAt = new Date(updatePayload.endsAt as string);
    }
    await auctionRepository.update(id, updatePayload as any);
    const auction = await auctionRepository.findById(id);
    return finalizeAuctionIfExpired(auction);
  },

  async setStatus(id: string, status: AuctionStatus) {
    if (status === "ENDED") {
      const current = await auctionRepository.findById(id);
      if (!current) throw new Error("AUCTION_NOT_FOUND");
      const lastBid = await bidRepository.findLastByAuction(id);
      await auctionRepository.update(id, {
        status: "ENDED",
        closedAt: new Date(),
        winnerId: lastBid ? (lastBid as any).userId : null,
        winnerApproved: false,
      } as any);
      const updated = await auctionRepository.findById(id);
      return finalizeAuctionIfExpired(updated);
    }
    await auctionRepository.setStatus(id, status);
    const auction = await auctionRepository.findById(id);
    return finalizeAuctionIfExpired(auction);
  },

  async delete(id: string) {
    await auctionRepository.delete(id);
  },

  async approveWinner(id: string) {
    const auction = await auctionRepository.update(id, { winnerApproved: true } as any);
    return auction;
  },

  async getCategories() {
    return (await import("../repositories/categoryRepository.js")).categoryRepository.findMany();
  },

  async getAttributeDefs() {
    return attributeRepository.findMany();
  },
};
