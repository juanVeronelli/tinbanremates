import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { Auction } from "@/types";

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    DRAFT: "Borrador", ACTIVE: "Activo", PAUSED: "Inactivo",
    ENDED: "Finalizado", CANCELLED: "Cancelado",
  };
  return map[s] ?? s;
}

function statusColor(s: string): string {
  const map: Record<string, string> = {
    ACTIVE: "bg-emerald-100 text-emerald-800",
    PAUSED: "bg-slate-100 text-slate-600",
    ENDED: "bg-purple-100 text-purple-700",
    DRAFT: "bg-yellow-100 text-yellow-700",
    CANCELLED: "bg-red-100 text-red-700",
  };
  return map[s] ?? "bg-slate-100 text-slate-600";
}

function formatPrice(v: string | number) {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function CatalogLotDetail() {
  const { catalogId } = useParams<{ catalogId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [sortBy, setSortBy] = useState<"lot" | "price_asc" | "price_desc">("lot");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingCatalog, setEditingCatalog] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPhotoUrl, setEditPhotoUrl] = useState("");
  const [uploadingCatalogPhoto, setUploadingCatalogPhoto] = useState(false);
  const catalogPhotoRef = useRef<HTMLInputElement | null>(null);

  const { data: catalog, isLoading } = useQuery({
    queryKey: ["admin", "catalog", catalogId],
    queryFn: () => api.admin.getCatalogDetail(catalogId!),
    enabled: !!catalogId,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["auctions", "categories"],
    queryFn: () => api.auctions.categories(),
  });

  useEffect(() => {
    if (!catalog) return;
    setEditName(catalog.name);
    setEditDescription(catalog.description ?? "");
    setEditPhotoUrl(catalog.photoUrl ?? "");
  }, [catalog]);

  // Restore scroll position when coming back from lot detail
  useEffect(() => {
    const saved = sessionStorage.getItem(`catalog-scroll-${catalogId}`);
    if (saved) {
      setTimeout(() => window.scrollTo({ top: parseInt(saved), behavior: "instant" as any }), 50);
      sessionStorage.removeItem(`catalog-scroll-${catalogId}`);
    }
  }, [catalogId]);

  const updateCatalog = useMutation({
    mutationFn: () => api.admin.updateCatalog(catalogId!, {
      name: editName.trim(), description: editDescription.trim() || undefined,
      slug: slugify(editName.trim()), photoUrl: editPhotoUrl || undefined,
    }),
    onSuccess: () => {
      setEditingCatalog(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "catalog", catalogId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "catalogs"] });
    },
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.admin.setAuctionStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "catalog", catalogId] }),
  });

  const bulkStatus = useMutation({
    mutationFn: (status: string) => api.admin.bulkSetCatalogStatus(catalogId!, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "catalog", catalogId] }),
  });

  const deleteAuction = useMutation({
    mutationFn: (id: string) => api.admin.deleteAuction(id),
    onSuccess: () => {
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "catalog", catalogId] });
    },
  });

  const handleCatalogPhotoChange = async (files: File[]) => {
    if (!files.length) return;
    setUploadingCatalogPhoto(true);
    try {
      const res = await api.admin.uploadAuctionPhotos(files);
      setEditPhotoUrl(res.urls[0] ?? "");
    } catch (e) {
      console.error("Error subiendo foto de catálogo", e);
    } finally {
      setUploadingCatalogPhoto(false);
    }
  };

  const handleCatalogPhotoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (files.length) handleCatalogPhotoChange(files);
  };

  if (isLoading || !catalog) {
    return <div className="py-12 text-center text-slate-500">{isLoading ? "Cargando..." : "Catálogo no encontrado."}</div>;
  }

  const auctions = (catalog.auctions ?? []) as Auction[];

  // Apply filters
  let filtered = auctions.filter((a) => {
    if (filterStatus !== "ALL" && a.status !== filterStatus) return false;
    if (filterCategory && a.categoryId !== filterCategory) return false;
    return true;
  });

  // Apply sort
  if (sortBy === "price_asc") {
    filtered = [...filtered].sort((a, b) => parseFloat(a.minimumPrice) - parseFloat(b.minimumPrice));
  } else if (sortBy === "price_desc") {
    filtered = [...filtered].sort((a, b) => parseFloat(b.minimumPrice) - parseFloat(a.minimumPrice));
  }
  // "lot" keeps the server-side lotNumber sort already applied

  const activeCount = auctions.filter((a) => a.status === "ACTIVE").length;
  const inactiveCount = auctions.filter((a) => a.status === "PAUSED" || a.status === "DRAFT").length;

  const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0b5ed7]/30";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/admin/catalogs")}
          className="text-slate-500 hover:text-slate-800 text-sm flex items-center gap-1 min-h-[36px]"
        >
          ← Catálogos
        </button>
      </div>

      {/* Catalog info card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        {editingCatalog ? (
          <div className="space-y-3">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className={inputClass}
              placeholder="Nombre del catálogo"
            />
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={2}
              className={inputClass}
              placeholder="Descripción (opcional)"
            />
            {/* Catalog photo upload */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                uploadingCatalogPhoto ? "border-blue-300 bg-blue-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100"
              }`}
              onDrop={handleCatalogPhotoDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => catalogPhotoRef.current?.click()}
            >
              <input
                ref={catalogPhotoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length) handleCatalogPhotoChange(files);
                }}
              />
              {editPhotoUrl ? (
                <div className="flex items-center gap-3">
                  <img src={editPhotoUrl} alt="Foto catálogo" className="w-16 h-16 object-cover rounded-lg" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-slate-700">Foto del catálogo</p>
                    <p className="text-xs text-slate-500">Arrastrá o hacé clic para cambiarla</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  {uploadingCatalogPhoto ? "Subiendo..." : "Arrastrá una foto o hacé clic para elegir"}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => updateCatalog.mutate()}
                disabled={!editName.trim() || updateCatalog.isPending}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-[#0b5ed7] hover:bg-[#0952c2] disabled:opacity-50"
              >
                {updateCatalog.isPending ? "Guardando..." : "Guardar"}
              </button>
              <button
                type="button"
                onClick={() => setEditingCatalog(false)}
                className="px-3 py-1.5 rounded-lg text-sm border border-slate-300 text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            {catalog.photoUrl && (
              <img
                src={catalog.photoUrl}
                alt={catalog.name}
                className="w-16 h-16 object-cover rounded-lg shrink-0 border border-slate-200"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-900">{catalog.name}</h2>
              {catalog.description && <p className="text-sm text-slate-500 mt-0.5">{catalog.description}</p>}
              <p className="text-xs text-slate-400 mt-1">
                {auctions.length} lote(s) · {activeCount} activo(s) · {inactiveCount} inactivo(s)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditingCatalog(true)}
              className="px-3 py-1.5 rounded-lg text-xs border border-slate-300 text-slate-600 hover:bg-slate-50 shrink-0"
            >
              Editar catálogo
            </button>
          </div>
        )}
      </div>

      {/* Actions bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => { if (window.confirm("¿Activar todos los lotes de este catálogo?")) bulkStatus.mutate("ACTIVE"); }}
            disabled={bulkStatus.isPending}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
          >
            Activar todos
          </button>
          <button
            type="button"
            onClick={() => { if (window.confirm("¿Desactivar todos los lotes de este catálogo?")) bulkStatus.mutate("PAUSED"); }}
            disabled={bulkStatus.isPending}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Desactivar todos
          </button>
        </div>
        <Link
          to={`/admin/auctions/new?catalog=${catalogId}`}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-[#0b5ed7] text-white hover:bg-[#0952c2]"
        >
          + Nuevo lote
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-sm rounded-lg border border-slate-300 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0b5ed7]/30"
        >
          <option value="ALL">Todos los estados</option>
          <option value="ACTIVE">Activo</option>
          <option value="PAUSED">Inactivo</option>
          <option value="ENDED">Finalizado</option>
          <option value="DRAFT">Borrador</option>
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="text-sm rounded-lg border border-slate-300 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0b5ed7]/30"
        >
          <option value="">Todas las categorías</option>
          {(categories as any[]).map((c: any) => (
            <option key={c.id} value={c.id}>{c.description}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="text-sm rounded-lg border border-slate-300 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0b5ed7]/30"
        >
          <option value="lot">Ordenar por Nro. de lote</option>
          <option value="price_asc">Precio: menor a mayor</option>
          <option value="price_desc">Precio: mayor a menor</option>
        </select>
        {(filterStatus !== "ALL" || filterCategory || sortBy !== "lot") && (
          <button
            type="button"
            onClick={() => { setFilterStatus("ALL"); setFilterCategory(""); setSortBy("lot"); }}
            className="text-xs text-slate-500 hover:text-slate-800 underline"
          >
            Limpiar filtros
          </button>
        )}
        <span className="text-xs text-slate-400 self-center ml-auto">{filtered.length} lote(s)</span>
      </div>

      {/* Lots list */}
      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500 py-4 text-center">
          {auctions.length === 0
            ? "Este catálogo no tiene lotes todavía."
            : "No hay lotes que coincidan con los filtros."}
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((a) => {
            const thumb = a.photos?.[0]?.url;
            return (
              <li key={a.id} className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-center gap-3">
                {/* Thumbnail */}
                {thumb ? (
                  <img
                    src={thumb}
                    alt={a.title}
                    className="w-14 h-14 object-cover rounded-lg shrink-0 border border-slate-200"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg shrink-0 bg-slate-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {a.lotNumber && (
                      <span className="text-xs font-bold bg-slate-800 text-white px-2 py-0.5 rounded-full shrink-0">
                        Lote {a.lotNumber}
                      </span>
                    )}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(a.status)}`}>
                      {statusLabel(a.status)}
                    </span>
                    {a.category && (
                      <span className="text-xs text-slate-400">{a.category.description}</span>
                    )}
                  </div>
                  <p className="font-medium text-slate-800 text-sm mt-0.5 truncate">{a.title}</p>
                  <p className="text-xs text-slate-500">{formatPrice(a.minimumPrice)} base · {a._count?.bids ?? 0} puja(s)</p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-1.5 shrink-0">
                  <Link
                    to={`/subasta/${a.id}`}
                    onClick={() => sessionStorage.setItem(`catalog-scroll-${catalogId}`, String(window.scrollY))}
                    className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Ver
                  </Link>
                  <Link
                    to={`/admin/auctions/${a.id}/edit`}
                    className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Editar
                  </Link>
                  {(a.status === "ACTIVE" || a.status === "PAUSED" || a.status === "DRAFT") && (
                    <button
                      type="button"
                      onClick={() => setStatus.mutate({ id: a.id, status: a.status === "ACTIVE" ? "PAUSED" : "ACTIVE" })}
                      disabled={setStatus.isPending}
                      className={`text-xs px-2 py-1 rounded border disabled:opacity-50 ${
                        a.status === "ACTIVE"
                          ? "border-amber-300 text-amber-700 hover:bg-amber-50"
                          : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      {a.status === "ACTIVE" ? "Desactivar" : "Activar"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (!window.confirm(`¿Eliminar el lote "${a.title}"? Esta acción no se puede deshacer.`)) return;
                      setDeletingId(a.id);
                      deleteAuction.mutate(a.id);
                    }}
                    disabled={deletingId === a.id || deleteAuction.isPending}
                    className="text-xs px-2 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId === a.id ? "..." : "Eliminar"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
