export interface Auction {
  id: string;
  title: string;
  description: string | null;
  lotNumber: string | null;
  minimumPrice: string;
  minIncrement: string;
  currentPrice: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ENDED" | "CANCELLED";
  startsAt: string | null;
  endsAt: string | null;
  categoryId: string | null;
  winnerId: string | null;
  closedAt: string | null;
  /** Solo presente cuando la petición es de un admin (datos de contacto del ganador) */
  winner?: { id: string; name: string; email: string; phone: string | null } | null;
  category?: { id: string; description: string; slug: string } | null;
  photos: { id: string; url: string; sortOrder: number }[];
  attributes?: { value: string; attribute: { key: string; label: string } }[];
  _count?: { bids: number };
  bids?: Bid[];
}

export interface Bid {
  id: string;
  amount: string;
  createdAt: string;
  user?: { name: string };
}

export interface Category {
  id: string;
  description: string;
  slug: string;
  _count?: { auctions: number };
}

export interface DynamicAttributeDef {
  id: string;
  key: string;
  label: string;
  type: string;
  options: string | null;
  sortOrder: number;
}

export interface CreditRequest {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  amount: string | null;
  note: string | null;
  adminNote: string | null;
  createdAt: string;
  user?: { id: string; name: string; email: string };
}
