export type Role = "USER" | "ADMIN";
export type CreditStatus = "PENDING" | "APPROVED" | "REJECTED";
export type AuctionStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "ENDED" | "CANCELLED";

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  creditApproved: boolean;
  creditBalance?: number;
}

export interface CreateAuctionInput {
  title: string;
  description?: string;
  lotNumber?: string;
  minimumPrice: number;
  minIncrement: number;
  startsAt?: Date;
  endsAt?: Date;
  categoryId?: string;
  attributes?: Record<string, string>;
  photoUrls?: string[];
}

export interface PlaceBidInput {
  auctionId: string;
  amount: number;
  userId: string;
}

