import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useAuthStore } from "@/stores/authStore";
import Countdown from "./Countdown";
import Toast from "./Toast";
import type { Auction } from "@/types";

interface BidSystemProps {
  auction: Auction;
  onBidPlaced?: (newPrice: number) => void;
  serverTimeOffset?: number;
}

function formatPrice(value: string | number): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);
}

export default function BidSystem({ auction, onBidPlaced }: BidSystemProps) {
  const { user, token } = useAuthStore();
  const queryClient = useQueryClient();
  const [amountInput, setAmountInput] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" | "info" } | null>(null);
  const [myLastBid, setMyLastBid] = useState<number | null>(null);
  const [hammerAnimating, setHammerAnimating] = useState(false);
  const [wasOutbid, setWasOutbid] = useState(false);
  const minIncrement = parseFloat(auction.minIncrement);
  const currentPrice = parseFloat(auction.currentPrice);
  const nextMinBid = currentPrice + minIncrement;
  const isEnded = auction.status === "ENDED" || (auction.endsAt && new Date(auction.endsAt).getTime() <= Date.now());
  const isNotActive = auction.status === "DRAFT" || auction.status === "PAUSED" || auction.status === "CANCELLED";

  const placeBid = useMutation({
    mutationFn: () => api.bids.place(auction.id, parseFloat(amountInput)),
    onSuccess: (data) => {
      setAmountInput("");
      const newCurrent = parseFloat(data.auction.currentPrice);
      const myAmount = parseFloat(data.bid.amount as any);
      setMyLastBid(myAmount);
      onBidPlaced?.(newCurrent);
      queryClient.invalidateQueries({ queryKey: ["auction", auction.id] });
      setToast({ message: "Puja realizada correctamente.", type: "success" });
      setHammerAnimating(true);
      setTimeout(() => setHammerAnimating(false), 350);
    },
    onError: (err: any) => {
      const raw = (err as Error).message || "No se pudo realizar la puja.";
      let friendly = raw;
      if (raw === "CREDIT_LIMIT_EXCEEDED") {
        friendly = "Tu crédito disponible no alcanza para esta puja.";
      } else if (raw === "CREDIT_NOT_APPROVED") {
        friendly = "Tu crédito aún no fue aprobado. Solicitá crédito desde tu perfil.";
      } else if (raw === "BID_TOO_LOW") {
        friendly = "La puja debe ser al menos el mínimo permitido.";
      } else if (raw === "AUCTION_NOT_ACTIVE" || raw === "AUCTION_ENDED") {
        friendly = "La subasta ya no está activa.";
      }
      setToast({ message: friendly, type: "error" });
    },
  });

  const handleQuickBid = (multiplier: number) => {
    const value = (currentPrice + minIncrement * multiplier).toFixed(2);
    setAmountInput(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(amountInput);
    if (Number.isNaN(value) || value < nextMinBid) return;
    placeBid.mutate();
  };

  const numericCurrentPrice = currentPrice;
  const isLeading = myLastBid != null && Math.abs(myLastBid - numericCurrentPrice) < 0.0001;
  const isOutbid = myLastBid != null && numericCurrentPrice - myLastBid > 0.0001;

  useEffect(() => {
    if (isOutbid && !wasOutbid) {
      setWasOutbid(true);
      setToast({ message: "Otro usuario superó tu puja.", type: "info" });
    }
    if (!isOutbid && wasOutbid) {
      setWasOutbid(false);
    }
  }, [isOutbid, wasOutbid]);

  if (isEnded) {
    return (
      <div className="bg-slate-100 rounded-xl p-4 text-center">
        <p className="text-slate-600 font-medium">Subasta finalizada</p>
        <p className="text-2xl font-bold text-[#0746ad] mt-1">{formatPrice(auction.currentPrice)}</p>
        {auction.winnerId && <p className="text-sm text-slate-500 mt-1">Hay ganador</p>}
      </div>
    );
  }

  if (isNotActive) {
    const msg =
      auction.status === "DRAFT"
        ? "Esta subasta está en borrador. Cuando se active podrás pujar."
        : auction.status === "PAUSED"
          ? "Esta subasta está pausada."
          : "Esta subasta no está disponible.";
    return (
      <div className="bg-slate-100 rounded-xl p-4 text-center">
        <p className="text-slate-600 font-medium">{msg}</p>
        <p className="text-2xl font-bold text-[#0746ad] mt-1">{formatPrice(auction.currentPrice)}</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
        <p className="text-amber-800 font-medium">Iniciá sesión para pujar</p>
        <p className="text-sm text-amber-700 mt-1">Puja mínima: {formatPrice(nextMinBid)}</p>
        <Link
          to="/ingresar"
          className="mt-3 inline-block px-4 py-2 text-sm font-medium rounded-lg bg-[#0b5ed7] text-white hover:bg-[#0952c2]"
        >
          Ingresar
        </Link>
      </div>
    );
  }

  const creditBalance = (user as any)?.creditBalance ?? 0;
  const canBid =
    user?.role === "ADMIN" ||
    user?.creditApproved === true ||
    creditBalance > 0;
  if (!canBid) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
        <p className="text-amber-800 font-medium">Crédito no aprobado</p>
        <p className="text-sm text-amber-700 mt-1">
          Solicitá crédito en tu perfil y esperá la aprobación del administrador para pujar.
        </p>
        <Link
          to="/perfil"
          className="mt-3 inline-block px-4 py-2 text-sm font-medium rounded-lg bg-[#0b5ed7] text-white hover:bg-[#0952c2]"
        >
          Ir a mi perfil
        </Link>
      </div>
    );
  }

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <p className="text-sm text-slate-500">Puja actual</p>
          <p className="text-2xl font-bold text-[#0746ad]">{formatPrice(auction.currentPrice)}</p>
          {isLeading && (
            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-100">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Vas ganando esta subasta
            </p>
          )}
          {isOutbid && (
            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 border border-red-100">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Fuiste superado
            </p>
          )}
        </div>
        {auction.endsAt && (
          <div className="text-right">
            <p className="text-sm text-slate-500">Cierra en</p>
            <Countdown endsAt={auction.endsAt} className="text-xl" />
          </div>
        )}
      </div>
      <p className="text-sm text-slate-600 mb-3">Incremento mínimo: {formatPrice(auction.minIncrement)}</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <input
            type="number"
            step="0.01"
            min={nextMinBid}
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder={nextMinBid.toFixed(2)}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-lg focus:ring-2 focus:ring-[#0b5ed7] focus:border-[#0b5ed7]"
          />
          <button
            type="submit"
            disabled={placeBid.isPending || !amountInput || parseFloat(amountInput) < nextMinBid}
            className="px-4 py-2 text-white font-semibold rounded-lg bg-[#0b5ed7] hover:bg-[#0952c2] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center gap-2">
              <span>{placeBid.isPending ? "..." : "Pujar"}</span>
              <span
                className={`inline-flex h-5 w-5 items-center justify-center ${
                  hammerAnimating ? "animate-[bid-hammer_0.35s_ease-out]" : ""
                }`}
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="currentColor"
                >
                  <path d="M3 21h10v-2H3v2zm17.707-13.293-4.414-4.414a1 1 0 0 0-1.414 0l-3.172 3.172a1 1 0 0 0 0 1.414l.793.793-6.293 6.293 1.414 1.414 6.293-6.293.793.793a1 1 0 0 0 1.414 0l3.172-3.172a1 1 0 0 0 0-1.414z" />
                </svg>
              </span>
            </span>
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleQuickBid(n)}
              className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              +{n} incr.
            </button>
          ))}
        </div>
      </form>
    </div>
    </>
  );
}
