import { Link } from "react-router-dom";
import type { Auction } from "@/types";

interface AuctionCardProps {
  auction: Auction;
}

function formatPrice(value: string | number): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);
}

function statusLabel(status: Auction["status"]): string {
  const map: Record<Auction["status"], string> = {
    DRAFT: "Borrador",
    ACTIVE: "En curso",
    PAUSED: "Pausada",
    ENDED: "Finalizada",
    CANCELLED: "Cancelada",
  };
  return map[status] ?? status;
}

export default function AuctionCard({ auction }: AuctionCardProps) {
  const imageUrl = auction.photos?.[0]?.url || "/placeholder-auction.jpg";
  const badgeByStatus: Record<
    Auction["status"],
    { className: string }
  > = {
    ACTIVE: {
      className: "bg-[#0b5ed7] text-white",
    },
    PAUSED: {
      className: "bg-amber-500 text-white",
    },
    ENDED: {
      className: "bg-slate-500 text-white",
    },
    CANCELLED: {
      className: "bg-red-500 text-white",
    },
    DRAFT: {
      className: "bg-slate-200 text-slate-700",
    },
  };

  const badge = badgeByStatus[auction.status];

  return (
    <Link
      to={`/subasta/${auction.id}`}
      className="block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-[#99c2f5] transition-all duration-200"
    >
      <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
        <img
          src={imageUrl}
          alt={auction.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://placehold.co/400x300/e2e8f0/64748b?text=Sin+imagen";
          }}
        />
        {badge && (
          <span
            className={`absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded-full ${badge.className}`}
          >
            {statusLabel(auction.status)}
          </span>
        )}
        {auction.lotNumber && (
          <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
            Lote {auction.lotNumber}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 line-clamp-2 min-h-[2.5rem]">
          {auction.title}
        </h3>
        {auction.category && (
          <p className="text-xs text-slate-500 mt-0.5">{auction.category.description}</p>
        )}
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-lg font-bold text-[#0746ad]">
            {formatPrice(auction.currentPrice)}
          </span>
          <span className="text-xs text-slate-500">{statusLabel(auction.status)}</span>
        </div>
        {auction._count && auction._count.bids > 10 && (
          <p className="text-xs text-slate-400 mt-1">{auction._count.bids} puja(s)</p>
        )}
      </div>
    </Link>
  );
}
