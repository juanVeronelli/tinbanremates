import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/services/api";
import AuctionCard from "@/components/AuctionCard";

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm animate-pulse">
      <div className="aspect-[4/3] bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="h-6 bg-slate-200 rounded w-1/3 mt-2" />
      </div>
    </div>
  );
}

function EmptyState() {
  const user = useAuthStore((s) => s.user);
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 md:px-12 w-full max-w-4xl rounded-2xl bg-slate-50">
      <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-slate-200 text-slate-400 mb-6">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-slate-800 text-center">No hay subastas con estos filtros</h3>
      <p className="text-slate-500 mt-2 text-center max-w-2xl">
        {user ? "Probá cambiar el estado o la categoría." : "Probá cambiar el estado o la categoría. Si no hay subastas activas, registrate para que te avisemos cuando haya nuevas."}
      </p>
      {!user && (
        <Link
          to="/registrarse"
          className="mt-6 inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-semibold text-white bg-[#0b5ed7] hover:bg-[#0952c2] shadow-lg shadow-[#0b5ed7]/20 transition-all duration-200"
        >
          Registrarme
        </Link>
      )}
    </div>
  );
}

export default function Subastas() {
  const [categoryId, setCategoryId] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const { data: auctions, isLoading } = useQuery({
    queryKey: ["auctions", status, categoryId],
    queryFn: () => api.auctions.list({ status: status || undefined, categoryId: categoryId || undefined }),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.auctions.categories(),
  });

  const list = (auctions as any[]) ?? [];
  const hasResults = list.length > 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Catálogo de subastas</h1>
        <p className="text-slate-600 mt-1">Filtrá y explorá los lotes disponibles. Entrá a cada uno para pujar en vivo.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-[#0b5ed7] focus:border-[#0b5ed7] outline-none transition-shadow"
        >
          <option value="">Todas</option>
          <option value="DRAFT">Borrador</option>
          <option value="ACTIVE">En curso</option>
          <option value="PAUSED">Pausadas</option>
          <option value="ENDED">Finalizadas</option>
        </select>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-[#0b5ed7] focus:border-[#0b5ed7] outline-none transition-shadow"
        >
          <option value="">Todas las categorías</option>
          {(categories as any[])?.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.description} {c._count?.auctions != null ? `(${c._count.auctions})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="min-h-[65vh] flex flex-col">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : hasResults ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map((auction: any) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-start justify-center pt-6">
            <EmptyState />
          </div>
        )}
      </div>
    </div>
  );
}
