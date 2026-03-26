import { useRef, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { Category, Catalog, DynamicAttributeDef, Auction } from "@/types";

const N8N_WEBHOOK_URL = "https://n8n.veronellico.com/webhook/tinban/nueva-subasta";

function datetimeLocalToISO(val: string): string | undefined {
  if (!val) return undefined;
  return new Date(val).toISOString();
}

function formatARS(val: string): string {
  const num = parseFloat(val.replace(",", "."));
  if (!val.trim() || isNaN(num) || num <= 0) return "";
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(num);
}

const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#0b5ed7]/30";
const labelClass = "block text-sm font-medium text-slate-700 mb-1";

export default function NewAuctionForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preCatalogId = searchParams.get("catalog") ?? "";
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [minimumPrice, setMinimumPrice] = useState("");
  const [minIncrement, setMinIncrement] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [catalogId, setCatalogId] = useState(preCatalogId);
  const [initialStatus, setInitialStatus] = useState<"PAUSED" | "ACTIVE">("PAUSED");
  const [startDatetime, setStartDatetime] = useState("");
  const [endDatetime, setEndDatetime] = useState("");
  const [selectedAttrKeys, setSelectedAttrKeys] = useState<string[]>([]);
  const [attrValues, setAttrValues] = useState<Record<string, string>>({});
  const [addAttrKey, setAddAttrKey] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [createdAuction, setCreatedAuction] = useState<Auction | null>(null);
  const [isNotifying, setIsNotifying] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["auctions", "categories"],
    queryFn: () => api.auctions.categories(),
  });
  const { data: catalogs = [] } = useQuery({
    queryKey: ["auctions", "catalogs"],
    queryFn: () => api.auctions.catalogs(),
  });
  const { data: attributes = [] } = useQuery({
    queryKey: ["admin", "attributes"],
    queryFn: () => api.admin.attributes(),
  });

  // Auto-suggest next lot number when catalog changes
  const { data: nextLotData } = useQuery({
    queryKey: ["admin", "nextLot", catalogId],
    queryFn: () => api.admin.getNextLotNumber(catalogId),
    enabled: !!catalogId,
  });

  useEffect(() => {
    if (nextLotData?.nextLotNumber && !lotNumber) {
      setLotNumber(nextLotData.nextLotNumber);
    }
  }, [nextLotData]);

  // When catalog changes (user switches), update suggested lot number
  useEffect(() => {
    if (catalogId && nextLotData?.nextLotNumber) {
      setLotNumber(nextLotData.nextLotNumber);
    }
  }, [catalogId]);

  const backPath = preCatalogId ? `/admin/catalogs/${preCatalogId}` : "/admin/catalogs";

  const createAuction = useMutation({
    mutationFn: async (body: {
      title: string; description?: string; lotNumber: string;
      minimumPrice: number; minIncrement: number; categoryId?: string;
      catalogId?: string; status: string; startsAt?: string; endsAt?: string;
      attributes?: Record<string, string>; photoFiles?: File[]; coverIndex?: number;
    }) => {
      let photoUrls: string[] | undefined;
      if (body.photoFiles?.length) {
        const ordered = [...body.photoFiles];
        const ci = body.coverIndex ?? 0;
        if (ci > 0) { const [cover] = ordered.splice(ci, 1); ordered.unshift(cover); }
        const res = await api.admin.uploadAuctionPhotos(ordered);
        photoUrls = res.urls;
      }
      const { photoFiles: _pf, coverIndex: _ci, ...rest } = body;
      return api.admin.createAuction({ ...rest, photoUrls });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "auctions"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "catalog", preCatalogId] });
      setCreatedAuction(data);
      setShowNotifyModal(true);
    },
  });

  const handleNotifyUsers = async () => {
    setIsNotifying(true);
    try { await fetch(N8N_WEBHOOK_URL, { method: "GET" }); }
    catch (err) { console.error("[TINBAN] webhook error:", err); }
    finally { setIsNotifying(false); setShowNotifyModal(false); navigate(backPath); }
  };

  const handleSkipNotify = () => { setShowNotifyModal(false); navigate(backPath); };

  const attrs = (attributes as DynamicAttributeDef[]).sort((a, b) => a.sortOrder - b.sortOrder);
  const availableToAdd = attrs.filter((a) => !selectedAttrKeys.includes(a.key));
  const selectedCategory = (categories as Category[]).find((c) => c.id === categoryId) ?? null;

  const addAttribute = () => {
    if (addAttrKey && !selectedAttrKeys.includes(addAttrKey)) {
      setSelectedAttrKeys((prev) => [...prev, addAttrKey]);
      setAddAttrKey("");
    }
  };

  const removeAttribute = (key: string) => {
    setSelectedAttrKeys((prev) => prev.filter((k) => k !== key));
    setAttrValues((prev) => { const next = { ...prev }; delete next[key]; return next; });
  };

  const setAttr = (key: string, value: string) => {
    setAttrValues((prev) => (value.trim() ? { ...prev, [key]: value.trim() } : { ...prev, [key]: "" }));
  };

  const addFiles = (files: File[]) => {
    const remaining = 10 - photoFiles.length;
    const toAdd = files.filter(f => f.type.startsWith("image/")).slice(0, remaining);
    if (!toAdd.length) return;
    const newPreviews = toAdd.map((f) => URL.createObjectURL(f));
    setPhotoFiles((prev) => [...prev, ...toAdd]);
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
    if (coverIndex === index) setCoverIndex(0);
    else if (coverIndex > index) setCoverIndex((c) => c - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lotNumber.trim()) return;
    const minPrice = parseFloat(minimumPrice.replace(",", "."));
    const minInc = parseFloat(minIncrement.replace(",", "."));
    if (!title.trim() || isNaN(minPrice) || minPrice <= 0 || isNaN(minInc) || minInc <= 0) return;
    const attributesPayload: Record<string, string> = {};
    selectedAttrKeys.forEach((k) => { const v = attrValues[k]; if (v) attributesPayload[k] = v; });
    createAuction.mutate({
      title: title.trim(), description: description.trim() || undefined,
      lotNumber: lotNumber.trim(), minimumPrice: minPrice, minIncrement: minInc,
      categoryId: categoryId || undefined, catalogId: catalogId || undefined,
      status: initialStatus,
      startsAt: datetimeLocalToISO(startDatetime), endsAt: datetimeLocalToISO(endDatetime),
      attributes: Object.keys(attributesPayload).length ? attributesPayload : undefined,
      photoFiles, coverIndex,
    });
  };

  const mainPreviewPhoto = photoPreviews[coverIndex] || photoPreviews[0] || "https://placehold.co/800x500/e2e8f0/64748b?text=Sin+imagen";

  return (
    <section className="bg-slate-50 rounded-xl border border-slate-200 p-5 md:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <button type="button" onClick={() => navigate(backPath)} className="text-slate-600 hover:text-slate-900 text-sm min-h-[44px] flex items-center">
          ← Volver
        </button>
        <span className="text-xs uppercase tracking-wide text-slate-500 bg-white/60 border border-slate-200 rounded-full px-3 py-1">
          Panel de administrador
        </span>
      </div>
      <h3 className="font-semibold text-slate-900 text-xl mb-1">Nuevo lote</h3>
      <p className="text-sm text-slate-500 mb-5">Completá los datos del lote y visualizá cómo se verá publicado.</p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.3fr)] items-start">
        <form id="new-auction-form" onSubmit={handleSubmit} className="space-y-5">

          {/* Información básica */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-sm">
            <h4 className="text-sm font-semibold text-slate-900">Información básica</h4>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Título *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} placeholder="Ej: Mesa de madera maciza" />
              </div>
              <div>
                <label className={labelClass}>Descripción</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={`${inputClass} min-h-[80px]`} placeholder="Descripción opcional del lote" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Número de lote *</label>
                  <input
                    type="text"
                    value={lotNumber}
                    onChange={(e) => setLotNumber(e.target.value)}
                    required
                    className={`${inputClass} ${!lotNumber.trim() ? "border-red-300 focus:ring-red-300/30" : ""}`}
                    placeholder="Ej: 1"
                  />
                  {!lotNumber.trim() && <p className="mt-1 text-xs text-red-500">El número de lote es obligatorio.</p>}
                </div>
                <div>
                  <label className={labelClass}>Categoría</label>
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
                    <option value="">Sin categoría</option>
                    {(categories as Category[]).map((c) => (
                      <option key={c.id} value={c.id}>{c.description}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Catálogo</label>
                  <select value={catalogId} onChange={(e) => { setCatalogId(e.target.value); setLotNumber(""); }} className={inputClass}>
                    <option value="">Sin catálogo</option>
                    {(catalogs as Catalog[]).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Estado inicial</label>
                  <select value={initialStatus} onChange={(e) => setInitialStatus(e.target.value as "PAUSED" | "ACTIVE")} className={inputClass}>
                    <option value="PAUSED">Inactivo</option>
                    <option value="ACTIVE">Activo</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Precios */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-sm">
            <h4 className="text-sm font-semibold text-slate-900">Precios y reglas</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Precio mínimo *</label>
                <input type="text" inputMode="decimal" value={minimumPrice} onChange={(e) => setMinimumPrice(e.target.value)} required className={inputClass} placeholder="Ej: 1500000" />
                {formatARS(minimumPrice) && (
                  <p className="mt-1.5 text-base font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 tabular-nums">{formatARS(minimumPrice)}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>Incremento mínimo *</label>
                <input type="text" inputMode="decimal" value={minIncrement} onChange={(e) => setMinIncrement(e.target.value)} required className={inputClass} placeholder="Ej: 50000" />
                {formatARS(minIncrement) && (
                  <p className="mt-1.5 text-base font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 tabular-nums">{formatARS(minIncrement)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Fechas */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-sm">
            <h4 className="text-sm font-semibold text-slate-900">Fechas (opcional)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Inicio</label>
                <input type="datetime-local" value={startDatetime} onChange={(e) => setStartDatetime(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Fin</label>
                <input type="datetime-local" value={endDatetime} onChange={(e) => setEndDatetime(e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Atributos */}
          {attrs.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-sm">
              <h4 className="text-sm font-semibold text-slate-900">Atributos del lote</h4>
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <select value={addAttrKey} onChange={(e) => setAddAttrKey(e.target.value)} className={inputClass}>
                  <option value="">Elegir atributo...</option>
                  {availableToAdd.map((a) => <option key={a.id} value={a.key}>{a.label}</option>)}
                </select>
                <button type="button" onClick={addAttribute} disabled={!addAttrKey} className="shrink-0 px-4 py-2.5 min-h-[44px] text-sm font-medium rounded-lg border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:opacity-50">
                  Agregar
                </button>
              </div>
              {selectedAttrKeys.map((key) => {
                const attr = attrs.find((a) => a.key === key);
                if (!attr) return null;
                return (
                  <div key={attr.id} className="flex flex-col gap-1 p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-700">{attr.label}</span>
                      <button type="button" onClick={() => removeAttribute(attr.key)} className="text-slate-500 hover:text-red-600 text-sm shrink-0">Quitar</button>
                    </div>
                    {attr.type === "select" && attr.options ? (
                      <select value={attrValues[attr.key] ?? ""} onChange={(e) => setAttr(attr.key, e.target.value)} className={inputClass}>
                        <option value="">—</option>
                        {(JSON.parse(attr.options) as string[]).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input type={attr.type === "number" ? "number" : "text"} value={attrValues[attr.key] ?? ""} onChange={(e) => setAttr(attr.key, e.target.value)} className={inputClass} placeholder={`Valor para ${attr.label}`} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </form>

        <aside className="flex flex-col gap-4">
          {/* Preview */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="aspect-video bg-slate-100 relative">
              <img src={mainPreviewPhoto} alt={title || "Vista previa"} className="w-full h-full object-contain" />
              <div className="absolute top-3 left-3 flex gap-2">
                {lotNumber && <span className="px-2 py-1 rounded-full text-xs font-medium bg-black/70 text-white">Lote {lotNumber}</span>}
                {minimumPrice && <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500 text-white">{formatARS(minimumPrice) || `Min ${minimumPrice}`}</span>}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${initialStatus === "ACTIVE" ? "bg-emerald-600 text-white" : "bg-slate-500 text-white"}`}>
                  {initialStatus === "ACTIVE" ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
            <div className="p-4 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Previsualización</p>
              <h4 className="text-lg font-semibold text-slate-900 line-clamp-2">{title || "Título del lote"}</h4>
              {selectedCategory && <p className="text-xs text-slate-500">{selectedCategory.description}</p>}
              {description && <p className="text-sm text-slate-600 line-clamp-3">{description}</p>}
            </div>
          </div>

          {/* Photos — drag & drop */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-slate-900">Fotos del lote</h4>
              <span className="text-xs text-slate-500">{photoPreviews.length ? `${photoPreviews.length}/10` : "Sin fotos"}</span>
            </div>

            {photoFiles.length < 10 && (
              <div
                className={`flex flex-col items-center justify-center gap-2 w-full px-4 py-5 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                  isDraggingOver ? "border-[#0b5ed7] bg-[#0b5ed7]/5" : "border-slate-300 bg-slate-50 hover:bg-slate-100"
                }`}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
                onDragLeave={() => setIsDraggingOver(false)}
                onClick={() => fileInputRef.current?.click()}
              >
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-slate-500 text-center">
                  {isDraggingOver ? "Soltá las fotos acá" : "Arrastrá fotos o hacé clic para elegir"}
                </p>
                <p className="text-xs text-slate-400">{10 - photoFiles.length} disponibles</p>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
              </div>
            )}

            {photoPreviews.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {photoPreviews.map((src, index) => (
                  <div key={index} className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 ${coverIndex === index ? "border-[#0b5ed7]" : "border-slate-200"} bg-slate-100`}>
                    <img src={src} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                    {coverIndex === index && <span className="absolute bottom-0 left-0 right-0 bg-[#0b5ed7] text-white text-[9px] font-bold text-center py-0.5">PORTADA</span>}
                    <button type="button" onClick={() => handleRemovePhoto(index)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] hover:bg-red-600" aria-label="Quitar">×</button>
                    {coverIndex !== index && (
                      <button type="button" onClick={() => setCoverIndex(index)} className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[9px] font-semibold text-center py-0.5 hover:bg-[#0b5ed7]/80">Portada</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      <div className="mt-4 flex flex-col-reverse sm:flex-row gap-2">
        <button type="button" onClick={() => navigate(backPath)} className="px-4 py-2.5 min-h-[44px] text-slate-600 text-sm rounded-lg border border-slate-300 hover:bg-slate-50">
          Cancelar
        </button>
        <button
          type="submit"
          form="new-auction-form"
          disabled={createAuction.isPending || !title.trim() || !lotNumber.trim()}
          className="px-4 py-2.5 min-h-[44px] text-white text-sm rounded-lg bg-[#0b5ed7] hover:bg-[#0952c2] disabled:opacity-50"
        >
          {createAuction.isPending ? "Creando..." : "Crear lote"}
        </button>
      </div>
      {createAuction.isError && (
        <p className="mt-2 text-sm text-red-600">No se pudo crear el lote. Revisá los datos e intentá de nuevo.</p>
      )}

      {showNotifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-[#0b5ed7]/10 flex items-center justify-center">
                <svg className="w-7 h-7 text-[#0b5ed7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">¿Notificar a los usuarios?</h3>
                <p className="text-sm text-slate-500 mt-1">
                  El lote{" "}
                  <span className="font-medium text-slate-700">
                    {createdAuction?.lotNumber ? `#${createdAuction.lotNumber} — ` : ""}
                    {createdAuction?.title}
                  </span>{" "}
                  fue creado exitosamente.
                </p>
              </div>
            </div>
            <div className="border-t border-slate-100" />
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button type="button" onClick={handleSkipNotify} disabled={isNotifying} className="flex-1 px-4 py-2.5 min-h-[44px] text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                No, omitir
              </button>
              <button type="button" onClick={handleNotifyUsers} disabled={isNotifying} className="flex-1 px-4 py-2.5 min-h-[44px] text-sm font-medium rounded-lg bg-[#0b5ed7] text-white hover:bg-[#0952c2] disabled:opacity-50 flex items-center justify-center gap-2">
                {isNotifying ? "Enviando..." : "Sí, notificar usuarios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
