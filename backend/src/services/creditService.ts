import { creditRequestRepository } from "../repositories/creditRequestRepository.js";
import { userRepository } from "../repositories/userRepository.js";
import { bidRepository } from "../repositories/bidRepository.js";
import type { CreditStatus } from "../types/index.js";

export const creditService = {
  async requestCredit(userId: string, amount?: number, note?: string) {
    return creditRequestRepository.create(userId, amount, note);
  },

  async listPending() {
    return creditRequestRepository.findPending();
  },

  async resolveRequest(requestId: string, status: CreditStatus, adminNote?: string) {
    const req = await creditRequestRepository.updateStatus(requestId, status, adminNote);
    if (status === "APPROVED") {
      await userRepository.setCreditApproved(req.userId, true);
    }
    return req;
  },

  async getMyRequests(userId: string) {
    return creditRequestRepository.findByUser(userId);
  },

  /**
   * Calcula el detalle de crédito de un usuario:
   * - approvedTotal: total aprobado por el admin (suma de solicitudes aprobadas)
   * - reserved: sumatoria de pujas actuales donde el usuario va ganando o es ganador pendiente de aprobación
   * - consumed: sumatoria de subastas ganadas y aprobadas por el admin
   * - available: crédito realmente disponible para nuevas pujas
   */
  async getBalanceDetails(userId: string): Promise<{
    approvedTotal: number;
    reserved: number;
    consumed: number;
    available: number;
  }> {
    const approvedTotal = await creditRequestRepository.getApprovedTotalByUser(userId);
    if (approvedTotal <= 0) {
      return { approvedTotal, reserved: 0, consumed: 0, available: 0 };
    }

    const bids = await bidRepository.findByUserWithAuction(userId);
    const byAuction = new Map<
      string,
      {
        lastAmount: number;
        currentPrice: number;
        status: string;
        winnerId: string | null;
        winnerApproved: boolean;
      }
    >();

    for (const b of bids as any[]) {
      const a = b.auction;
      const prev = byAuction.get(b.auctionId);
      const amountNum = Number(String(b.amount));
      const currentPriceNum = Number(String(a.currentPrice));
      if (!prev) {
        byAuction.set(b.auctionId, {
          lastAmount: amountNum,
          currentPrice: currentPriceNum,
          status: a.status,
          winnerId: a.winnerId ?? null,
          winnerApproved: Boolean(a.winnerApproved),
        });
      } else {
        byAuction.set(b.auctionId, {
          ...prev,
          lastAmount: amountNum,
          currentPrice: currentPriceNum,
          status: a.status,
          winnerId: a.winnerId ?? null,
          winnerApproved: Boolean(a.winnerApproved),
        });
      }
    }

    let reserved = 0;
    let consumed = 0;

    for (const [, info] of byAuction) {
      const { lastAmount, currentPrice, status, winnerId, winnerApproved } = info;
      const isLeaderOnActive =
        status === "ACTIVE" && Math.abs(currentPrice - lastAmount) < 0.0001;

      if (isLeaderOnActive) {
        reserved += lastAmount;
        continue;
      }

      const isWinner = status === "ENDED" && winnerId === userId;
      if (isWinner) {
        if (winnerApproved) {
          consumed += lastAmount;
        } else {
          reserved += lastAmount;
        }
      }
    }

    const available = Math.max(0, approvedTotal - consumed - reserved);
    return { approvedTotal, reserved, consumed, available };
  },
};
