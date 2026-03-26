import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/services/api";
import AuctionCard from "@/components/AuctionCard";
import type { Catalog } from "@/types";

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
      <h3 className="text-xl font-semibold text-slate-800 text-center">No hay subastas disponibles</h3>
      <p className="text-slate-500 mt-2 text-center max-w-2xl">
        {user ? "No hay lotes en este catálogo todavía." : "Registrate para que te avisemos cuando haya nuevas subastas."}
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

function CatalogCard({ catalog, onShowLots }: { catalog: Catalog; onShowLots: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {catalog.photoUrl ? (
        <div className="aspect-video bg-slate-100 overflow-hidden">
          <img
            src={catalog.photoUrl}
            alt={catalog.name}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      ) : (
        <div className="aspect-video bg-slate-100 flex items-center justify-center text-slate-300">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
      )}
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900">{catalog.name}</h2>
            {catalog.description && (
              <p className="text-sm text-slate-500 mt-1">{catalog.description}</p>
            )}
          </div>
          <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
            {catalog._count?.auctions ?? 0} lote{(catalog._count?.auctions ?? 0) !== 1 ? "s" : ""}
          </span>
        </div>
        <button
          type="button"
          onClick={onShowLots}
          className="mt-auto w-full px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0b5ed7] hover:bg-[#0952c2] transition-colors"
        >
          VER LOTES
        </button>
      </div>
    </div>
  );
}

function sortAuctions(list: any[], sort: string): any[] {
  return [...list].sort((a, b) => {
    if (sort === "lot") {
      const na = parseInt(a.lotNumber ?? "", 10);
      const nb = parseInt(b.lotNumber ?? "", 10);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      if (!isNaN(na)) return -1;
      if (!isNaN(nb)) return 1;
      return (a.lotNumber ?? "").localeCompare(b.lotNumber ?? "");
    }
    if (sort === "price_asc") {
      return parseFloat(a.currentPrice) - parseFloat(b.currentPrice);
    }
    if (sort === "price_desc") {
      return parseFloat(b.currentPrice) - parseFloat(a.currentPrice);
    }
    return 0;
  });
}

export default function Subastas() {
  const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [viewMode, setViewMode] = useState<"catalogs" | "all">("catalogs");
  const [sort, setSort] = useState<string>("lot");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const { data: catalogs, isLoading: loadingCatalogs } = useQuery({
    queryKey: ["catalogs"],
    queryFn: () => api.auctions.catalogs(),
  });

  const { data: auctions, isLoading: loadingAuctions } = useQuery({
    queryKey: ["auctions", status, selectedCatalogId],
    queryFn: () => api.auctions.list({
      status: status || undefined,
      catalogId: selectedCatalogId || undefined,
    }),
    enabled: viewMode === "all" || selectedCatalogId !== null,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.auctions.categories(),
    enabled: viewMode === "all" || selectedCatalogId !== null,
  });

  const catalogList = (catalogs as Catalog[]) ?? [];
  const rawList = (auctions as any[]) ?? [];
  const categoryList = (categories as any[]) ?? [];
  const selectedCatalog = catalogList.find((c) => c.id === selectedCatalogId);

  const filteredList = rawList.filter((a) => {
    if (categoryFilter && a.category?.id !== categoryFilter) return false;
    return true;
  });
  const list = sortAuctions(filteredList, sort);

  const handleShowLots = (catalogId: string) => {
    setSelectedCatalogId(catalogId);
    setViewMode("all");
    setSort("lot");
    setCategoryFilter("");
    setStatus("");
  };

  const handleBackToCatalogs = () => {
    setSelectedCatalogId(null);
    setViewMode("catalogs");
    setStatus("");
    setSort("lot");
    setCategoryFilter("");
  };

  // ─── Vista de catálogos ───────────────────────────────────────────────
  if (viewMode === "catalogs") {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Catálogos</h1>
            <p className="text-slate-600 mt-1">Seleccioná un catálogo para ver sus lotes disponibles.</p>
          </div>
          <button
            type="button"
            onClick={() => { setViewMode("all"); setSelectedCatalogId(null); }}
            className="shrink-0 px-4 py-2 rounded-lg text-sm text-slate-600 border border-slate-300 hover:bg-slate-50"
          >
            Ver todos los lotes
          </button>
        </div>

        {loadingCatalogs ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 animate-pulse h-64" />
            ))}
          </div>
        ) : catalogList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="font-medium">No hay catálogos disponibles aún.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {catalogList.map((catalog) => (
              <CatalogCard
                key={catalog.id}
                catalog={catalog}
                onShowLots={() => handleShowLots(catalog.id)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── Vista de lotes ──────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <button
          type="button"
          onClick={handleBackToCatalogs}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a catálogos
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          {selectedCatalog ? selectedCatalog.name : "Todos los lotes"}
        </h1>
        {selectedCatalog?.description && (
          <p className="text-slate-600 mt-1">{selectedCatalog.description}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-[#0b5ed7] focus:border-[#0b5ed7] outline-none transition-shadow"
        >
          <option value="lot">Nº de lote</option>
          <option value="price_asc">Precio: menor a mayor</option>
          <option value="price_desc">Precio: mayor a menor</option>
        </select>

        {categoryList.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-[#0b5ed7] focus:border-[#0b5ed7] outline-none transition-shadow"
          >
            <option value="">Todas las categorías</option>
            {categoryList.map((cat: any) => (
              <option key={cat.id} value={cat.id}>{cat.description}</option>
            ))}
          </select>
        )}

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-[#0b5ed7] focus:border-[#0b5ed7] outline-none transition-shadow"
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVE">En curso</option>
          <option value="PAUSED">Inactivo</option>
          <option value="ENDED">Finalizadas</option>
        </select>
      </div>

      <div className="min-h-[65vh] flex flex-col">
        {loadingAuctions ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : list.length > 0 ? (
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
