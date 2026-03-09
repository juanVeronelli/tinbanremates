import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import BidSystem from "@/components/BidSystem";
import Countdown from "@/components/Countdown";
import { useSocket } from "@/hooks/useSocket";
import { useAuthStore } from "@/stores/authStore";
import type { Auction } from "@/types";

function formatPrice(value: string | number): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);
}

export default function AuctionDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [currentAuction, setCurrentAuction] = useState<Auction | null>(null);
  const { joinAuction, leaveAuction, onNewBid } = useSocket();
  const [photoIndex, setPhotoIndex] = useState(0);

  const { data: auction, isLoading } = useQuery({
    queryKey: ["auction", id],
    queryFn: () => api.auctions.get(id!),
    enabled: !!id,
  });

  useEffect(() => {
    setCurrentAuction(auction ?? null);
    setPhotoIndex(0);
  }, [auction]);

  useEffect(() => {
    if (!id) return;
    joinAuction(id);
    const unsub = onNewBid((data) => {
      setCurrentAuction((prev) => (prev ? { ...prev, ...data.auction, currentPrice: data.auction.currentPrice } : null));
      queryClient.setQueryData(["auction", id], (old: any) => (old ? { ...old, ...data.auction } : old));
    });
    return () => {
      leaveAuction(id);
      unsub?.();
    };
  }, [id, joinAuction, leaveAuction, onNewBid, queryClient]);

  const display = currentAuction ?? auction;

  if (!id || isLoading || !display) {
    return (
      <div className="py-12 text-center text-slate-500">
        {isLoading ? "Cargando..." : "Subasta no encontrada."}
      </div>
    );
  }

  const photos = display.photos ?? [];
  const safeIndex = photos.length ? Math.min(photoIndex, photos.length - 1) : 0;
  const mainPhoto = photos[safeIndex]?.url || "https://placehold.co/800x500/e2e8f0/64748b?text=Sin+imagen";

  const goPrev = () => {
    if (!photos.length) return;
    setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const goNext = () => {
    if (!photos.length) return;
    setPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="aspect-video bg-slate-100 relative">
          <img
            src={mainPhoto}
            alt={display.title}
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://placehold.co/800x500/e2e8f0/64748b?text=Sin+imagen";
            }}
          />
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70"
                aria-label="Imagen anterior"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70"
                aria-label="Imagen siguiente"
              >
                ›
              </button>
              <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
                {photos.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPhotoIndex(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === safeIndex ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
                    }`}
                    aria-label={`Ver imagen ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
          {display.status === "ACTIVE" && display.endsAt && (
            <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1.5 rounded-lg">
              Cierra en <Countdown endsAt={display.endsAt} />
            </div>
          )}
        </div>
        <div className="p-4 md:p-6">
          {display.lotNumber && (
            <p className="text-sm text-slate-500">Lote {display.lotNumber}</p>
          )}
          <h1 className="text-2xl font-bold text-slate-900 mt-1">{display.title}</h1>
          {display.category && (
            <p className="text-slate-600 mt-1">{display.category.description}</p>
          )}
          {display.description && (
            <p className="text-slate-600 mt-4 whitespace-pre-wrap">{display.description}</p>
          )}
          {display.attributes && display.attributes.length > 0 && (
            <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {display.attributes.map((a: any) => (
                <div key={a.attribute?.key ?? a.value}>
                  <dt className="text-sm text-slate-500">{a.attribute?.label ?? "—"}</dt>
                  <dd className="font-medium">{a.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 md:static">
        <BidSystem
          auction={display}
          onBidPlaced={(newPrice) =>
            setCurrentAuction((prev) => (prev ? { ...prev, currentPrice: String(newPrice) } : null))
          }
        />
      </div>

      {display.bids && display.bids.length > 10 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-800 mb-3">Últimas pujas</h3>
          <ul className="space-y-2">
            {display.bids.slice(0, 10).map((b: any) => (
              <li key={b.id} className="flex justify-between text-sm">
                <span>{b.user?.name ?? "—"}</span>
                <span className="font-medium">{formatPrice(b.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {user?.role === "ADMIN" && display.winner && display.status === "ENDED" && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-800 mb-3">Ganador</h3>
          <ul className="space-y-1 text-sm text-slate-700">
            <li><span className="text-slate-500">Nombre:</span> {display.winner.name}</li>
            <li><span className="text-slate-500">Email:</span>{" "}
              <a href={`mailto:${display.winner.email}`} className="text-[#0b5ed7] hover:underline">{display.winner.email}</a>
            </li>
            {display.winner.phone && (
              <li><span className="text-slate-500">Teléfono:</span>{" "}
                <a href={`tel:${display.winner.phone}`} className="text-[#0b5ed7] hover:underline">{display.winner.phone}</a>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
