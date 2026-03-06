import { creditRequestRepository } from "../repositories/creditRequestRepository.js";
import { userRepository } from "../repositories/userRepository.js";
import type { CreditStatus } from "@prisma/client";

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
};
