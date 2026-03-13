import { bidRepository } from "../repositories/bidRepository.js";
import { auctionRepository } from "../repositories/auctionRepository.js";
import { userRepository } from "../repositories/userRepository.js";
import { creditService } from "./creditService.js";
import type { PlaceBidInput } from "../types/index.js";

export const bidService = {
  async placeBid(input: PlaceBidInput) {
    const { auctionId, userId, amount } = input;
    const auction = await auctionRepository.findById(auctionId);
    if (!auction) throw new Error("AUCTION_NOT_FOUND");
    if (auction.status !== "ACTIVE") throw new Error("AUCTION_NOT_ACTIVE");
    const endsAt = auction.endsAt ? new Date(auction.endsAt) : null;
    if (endsAt && endsAt.getTime() <= Date.now()) {
      // Marcar la subasta como finalizada y asignar ganador (último pujador) si corresponde
      const lastBid = await bidRepository.findLastByAuction(auctionId);
      await auctionRepository.update(auctionId, {
        status: "ENDED",
        closedAt: new Date(),
        winnerId: lastBid ? (lastBid as any).userId : null,
      } as any);
      throw new Error("AUCTION_ENDED");
    }

    const user = await userRepository.findById(userId);
    if (!user) throw new Error("USER_NOT_FOUND");

    const isAdmin = user.role === "ADMIN";
    if (!isAdmin) {
      const balance = await creditService.getBalanceDetails(userId);
      if (!balance.approvedTotal || balance.approvedTotal <= 0) {
        throw new Error("CREDIT_NOT_APPROVED");
      }
      if (amount > balance.available) {
        throw new Error("CREDIT_LIMIT_EXCEEDED");
      }
    }

    const currentPrice = Number(auction.currentPrice);
    const minIncrement = Number(auction.minIncrement);
    const minValidBid = currentPrice + minIncrement;
    if (amount < minValidBid) throw new Error("BID_TOO_LOW");

    const bid = await bidRepository.create(auctionId, userId, amount);
    await auctionRepository.updateCurrentPrice(auctionId, amount, userId);
    const updated = await auctionRepository.findById(auctionId);
    return { bid, auction: updated };
  },

  async getHistory(auctionId: string, limit = 50) {
    return bidRepository.findManyByAuction(auctionId, limit);
  },
};
