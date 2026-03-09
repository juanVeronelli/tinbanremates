import type { Auction, Bid, Category, CreditRequest } from "@/types";

const BASE = (import.meta.env.VITE_API_URL || "") + "/api";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("tinban-auth")
    ? (JSON.parse(localStorage.getItem("tinban-auth")!).state?.token as string | undefined)
    : undefined;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...getAuthHeaders(), ...options.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || res.statusText);
  return data as T;
}

export const api = {
  auth: {
    register: (body: { email: string; password: string; name: string; phone?: string }) =>
      request<{ user: any; token: string }>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
    login: (email: string, password: string) =>
      request<{ user: any; token: string }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
    profile: () => request<{ id: string; email: string; name: string; role: string; creditApproved: boolean }>("/auth/profile"),
    requestCredit: (body?: { amount?: number; note?: string }) =>
      request("/auth/credit-request", { method: "POST", body: JSON.stringify(body || {}) }),
    myCreditRequests: () => request("/auth/credit-requests"),
  },
  auctions: {
    list: (params?: { status?: string; categoryId?: string }) => {
      const p: Record<string, string> = {};
      if (params?.status) p.status = params.status;
      if (params?.categoryId) p.categoryId = params.categoryId;
      const q = new URLSearchParams(p).toString();
      return request<Auction[]>(`/auctions${q ? `?${q}` : ""}`);
    },
    get: (id: string) => request<Auction>(`/auctions/${id}`),
    getActive: (id: string) => request<Auction>(`/auctions/${id}/active`),
    categories: () => request<Category[]>("/auctions/categories"),
    attributes: () => request("/auctions/attributes"),
  },
  bids: {
    place: (auctionId: string, amount: number) =>
      request<{ bid: Bid; auction: Auction }>(`/auctions/${auctionId}/bid`, {
        method: "POST",
        body: JSON.stringify({ amount }),
      }),
    history: (auctionId: string, limit?: number) =>
      request<Bid[]>(`/auctions/${auctionId}/bids${limit != null ? `?limit=${limit}` : ""}`),
  },
  admin: {
    creditRequests: () => request<CreditRequest[]>("/admin/credit-requests"),
    resolveCredit: (id: string, status: "APPROVED" | "REJECTED", adminNote?: string) =>
      request(`/admin/credit-requests/${id}/resolve`, {
        method: "POST",
        body: JSON.stringify({ status, adminNote }),
      }),
    categories: () => request("/admin/categories"),
    createCategory: (body: { description: string; slug: string; sortOrder?: number }) =>
      request("/admin/categories", { method: "POST", body: JSON.stringify(body) }),
    attributes: () => request("/admin/attributes"),
    createAttribute: (body: { key: string; label: string; type?: string; options?: string; sortOrder?: number }) =>
      request("/admin/attributes", { method: "POST", body: JSON.stringify(body) }),
    deleteAttribute: (id: string) => request(`/admin/attributes/${id}`, { method: "DELETE" }),
    createAuction: (body: any) =>
      request<Auction>("/auctions", { method: "POST", body: JSON.stringify(body) }),
    updateAuction: (id: string, body: any) =>
      request<Auction>(`/auctions/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    setAuctionStatus: (id: string, status: string) =>
      request<Auction>(`/auctions/${id}/status`, { method: "POST", body: JSON.stringify({ status }) }),
    deleteAuction: (id: string) =>
      request(`/auctions/${id}`, { method: "DELETE" }),
    uploadAuctionPhotos: async (files: FileList | File[]) => {
      const form = new FormData();
      const arr = Array.from(files as any);
      arr.forEach((file) => {
        form.append("photos", file);
      });
      const token = localStorage.getItem("tinban-auth")
        ? (JSON.parse(localStorage.getItem("tinban-auth")!).state?.token as string | undefined)
        : undefined;
      const res = await fetch(`${BASE}/auctions/photos/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error || res.statusText);
      return data as { urls: string[] };
    },
  },
};
