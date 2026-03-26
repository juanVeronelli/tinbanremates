import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { Category, Catalog, DynamicAttributeDef } from "@/types";

function isoToDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatARS(val: string): string {
  const num = parseFloat(val.replace(",", "."));
  if (!val.trim() || isNaN(num) || num <= 0) return "";
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(num);
}

const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#0b5ed7]/30";
const labelClass = "block text-sm font-medium text-slate-700 mb-1";

export default function EditAuctionForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [minimumPrice, setMinimumPrice] = useState("");
  const [minIncrement, setMinIncrement] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [catalogId, setCatalogId] = useState("");
  const [startDatetime, setStartDatetime] = useState("");
  const [endDatetime, setEndDatetime] = useState("");
  const [selectedAttrKeys, setSelectedAttrKeys] = useState<string[]>([]);
  const [attrValues, setAttrValues] = useState<Record<string, string>>({});
  const [addAttrKey, setAddAttrKey] = useState("");
  const [existingPhotos, setExistingPhotos] = useState<{ id: string; url: string; sortOrder: number }[]>([]);
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);

  const { data: auction, isLoading: loadingAuction } = useQuery({
    queryKey: ["auction", id],
    queryFn: () => api.auctions.get(id!),
    enabled: !!id,
  });
  const { data: categories = [] } = useQuery({ queryKey: ["auctions", "categories"], queryFn: () => api.auctions.categories() });
  const { data: catalogs = [] } = useQuery({ queryKey: ["auctions", "catalogs"], queryFn: () => api.auctions.catalogs() });
  const { data: attributes = [] } = useQuery({ queryKey: ["admin", "attributes"], queryFn: () => api.admin.attributes() });

  useEffect(() => {
    if (!auction) return;
    const a = auction as any;
    setTitle(a.title ?? "");
    setDescription(a.description ?? "");
    setLotNumber(a.lotNumber ?? "");
    setMinimumPrice(String(a.minimumPrice ?? ""));
    setMinIncrement(String(a.minIncrement ?? ""));
    setCategoryId(a.categoryId ?? "");
    setCatalogId(a.catalogId ?? "");
    setStartDatetime(isoToDatetimeLocal(a.startsAt));
    setEndDatetime(isoToDatetimeLocal(a.endsAt));
    if (a.attributes?.length) {
      const keys: string[] = [];
      const values: Record<string, string> = {};
      a.attributes.forEach((x: any) => {
        const key = x.attribute?.key ?? x.attributeId;
        if (key) { keys.push(key); values[key] = x.value ?? ""; }
      });
      setSelectedAttrKeys(keys);
      setAttrValues(values);
    }
    if (a.photos?.length) {
      setExistingPhotos([...a.photos].sort((x: any, y: any) => x.sortOrder - y.sortOrder));
    }
  }, [auction]);

  const totalPhotoCount = existingPhotos.length + newPhotoFiles.length;

  const backPath = (auction as any)?.catalogId
    ? `/admin/catalogs/${(auction as any).catalogId}`
    : "/admin/catalogs";

  const updateAuction = useMutation({
    mutationFn: async (body: {
      title: string; description?: string; lotNumber?: string;
      minimumPrice: number; minIncrement: number; categoryId?: string;
      catalogId?: string; startsAt?: string; endsAt?: string;
      attributes?: Record<string, string>; coverIndex: number;
    }) => {
      let newUrls: string[] = [];
      if (newPhotoFiles.length) {
        const res = await api.admin.uploadAuctionPhotos(newPhotoFiles);
        newUrls = res.urls;
      }
      const allUrls = [...existingPhotos.map((p) => p.url), ...newUrls];
      const ci = body.coverIndex;
      if (ci > 0 && ci < allUrls.length) { const [cover] = allUrls.splice(ci, 1); allUrls.unshift(cover); }
      const { coverIndex: _ci, ...rest } = body;
      return api.admin.updateAuction(id!, { ...rest, photoUrls: allUrls.length > 0 ? allUrls : undefined });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "auctions"] });
      queryClient.invalidateQueries({ queryKey: ["auction", id] });
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
      if ((auction as any)?.catalogId) {
        queryClient.invalidateQueries({ queryKey: ["admin", "catalog", (auction as any).catalogId] });
      }
      navigate(backPath);
    },
  });

  const setStatus = useMutation({
    mutationFn: (status: string) => api.admin.setAuctionStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "auctions"] });
      queryClient.invalidateQueries({ queryKey: ["auction", id] });
      if ((auction as any)?.catalogId) {
        queryClient.invalidateQueries({ queryKey: ["admin", "catalog", (auction as any).catalogId] });
      }
      navigate(backPath);
    },
  });

  const attrs = (attributes as DynamicAttributeDef[]).sort((a, b) => a.sortOrder - b.sortOrder);
  const availableToAdd = attrs.filter((a) => !selectedAttrKeys.includes(a.key));

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
    const remaining = 10 - totalPhotoCount;
    const toAdd = files.filter(f => f.type.startsWith("image/")).slice(0, remaining);
    if (!toAdd.length) return;
    const newPreviews = toAdd.map((f) => URL.createObjectURL(f));
    setNewPhotoFiles((prev) => [...prev, ...toAdd]);
    setNewPhotoPreviews((prev) => [...prev, ...newPreviews]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => addFiles(Array.from(e.target.files ?? []));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const removeExistingPhoto = (index: number) => {
    setExistingPhotos((prev) => prev.filter((_, i) => i !== index));
    if (coverIndex === index) setCoverIndex(0);
    else if (coverIndex > index) setCoverIndex((c) => c - 1);
  };
  const removeNewPhoto = (index: number) => {
    const absIndex = existingPhotos.length + index;
    setNewPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
    if (coverIndex === absIndex) setCoverIndex(0);
    else if (coverIndex > absIndex) setCoverIndex((c) => c - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const minPrice = parseFloat(minimumPrice.replace(",", "."));
    const minInc = parseFloat(minIncrement.replace(",", "."));
    if (!title.trim() || isNaN(minPrice) || minPrice <= 0 || isNaN(minInc) || minInc <= 0) return;
    const attributesPayload: Record<string, string> = {};
    selectedAttrKeys.forEach((k) => { const v = attrValues[k]; if (v) attributesPayload[k] = v; });
    updateAuction.mutate({
      title: title.trim(), description: description.trim() || undefined,
      lotNumber: lotNumber.trim() || undefined, minimumPrice: minPrice, minIncrement: minInc,
      categoryId: categoryId || undefined, catalogId: catalogId || undefined,
      startsAt: startDatetime ? new Date(startDatetime).toISOString() : undefined,
      endsAt: endDatetime ? new Date(endDatetime).toISOString() : undefined,
      attributes: Object.keys(attributesPayload).length ? attributesPayload : undefined,
      coverIndex,
    });
  };

  if (!id || loadingAuction || !auction) {
    return <section className="bg-white rounded-xl border border-slate-200 p-4"><p className="text-slate-500">Cargando...</p></section>;
  }

  const auctionData = auction as any;
  const isEnded = auctionData?.status === "ENDED";
  const allPreviews: { src: string; isNew: boolean; origIndex: number }[] = [
    ...existingPhotos.map((p, i) => ({ src: p.url, isNew: false, origIndex: i })),
    ...newPhotoPreviews.map((src, i) => ({ src, isNew: true, origIndex: i })),
  ];

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <button type="button" onClick={() => navigate(backPath)} className="text-slate-600 hover:text-slate-900 text-sm min-h-[44px] flex items-center">
          ← Volver
        </button>
        {!isEnded && (
          <button
            type="button"
            onClick={() => { if (!window.confirm("¿Finalizar esta subasta? No se podrán hacer más pujas.")) return; setStatus.mutate("ENDED"); }}
            disabled={setStatus.isPending}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {setStatus.isPending ? "Finalizando..." : "Finalizar subasta"}
          </button>
        )}
      </div>
      <h3 className="font-semibold text-slate-800 mb-4">Editar lote</h3>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <div>
          <label className={labelClass}>Título *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Descripción</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={`${inputClass} min-h-[80px]`} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Número de lote *</label>
            <input
              type="text"
              value={lotNumber}
              onChange={(e) => setLotNumber(e.target.value)}
              required
              className={`${inputClass} ${!lotNumber.trim() ? "border-red-300" : ""}`}
              placeholder="Ej: 1"
            />
          </div>
          <div>
            <label className={labelClass}>Categoría</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
              <option value="">Sin categoría</option>
              {(categories as Category[]).map((c) => <option key={c.id} value={c.id}>{c.description}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Precio mínimo *</label>
            <input type="text" inputMode="decimal" value={minimumPrice} onChange={(e) => setMinimumPrice(e.target.value)} required className={inputClass} />
            {formatARS(minimumPrice) && <p className="mt-1 text-sm font-semibold text-emerald-700">{formatARS(minimumPrice)}</p>}
          </div>
          <div>
            <label className={labelClass}>Incremento mínimo *</label>
            <input type="text" inputMode="decimal" value={minIncrement} onChange={(e) => setMinIncrement(e.target.value)} required className={inputClass} />
            {formatARS(minIncrement) && <p className="mt-1 text-sm font-semibold text-slate-600">{formatARS(minIncrement)}</p>}
          </div>
        </div>
        <div>
          <label className={labelClass}>Catálogo</label>
          <select value={catalogId} onChange={(e) => setCatalogId(e.target.value)} className={inputClass}>
            <option value="">Sin catálogo</option>
            {(catalogs as Catalog[]).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Estado */}
        {!isEnded && (
          <div className="border-t border-slate-200 pt-4">
            <p className="text-sm font-medium text-slate-700 mb-2">Estado</p>
            <div className="flex gap-2">
              {(auctionData.status === "ACTIVE" || auctionData.status === "PAUSED" || auctionData.status === "DRAFT") && (
                <button
                  type="button"
                  onClick={() => setStatus.mutate(auctionData.status === "ACTIVE" ? "PAUSED" : "ACTIVE")}
                  disabled={setStatus.isPending}
                  className={`px-3 py-1.5 text-sm rounded-lg border disabled:opacity-50 ${
                    auctionData.status === "ACTIVE"
                      ? "border-amber-300 text-amber-700 hover:bg-amber-50"
                      : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  {auctionData.status === "ACTIVE" ? "Desactivar lote" : "Activar lote"}
                </button>
              )}
              <span className={`px-3 py-1.5 text-sm rounded-lg font-medium ${
                auctionData.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
              }`}>
                Ahora: {auctionData.status === "ACTIVE" ? "Activo" : auctionData.status === "PAUSED" ? "Inactivo" : auctionData.status}
              </span>
            </div>
          </div>
        )}

        {/* Fechas */}
        <div className="border-t border-slate-200 pt-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Fechas (opcional)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Inicio</label>
              <input type="datetime-local" value={startDatetime} onChange={(e) => setStartDatetime(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Fin</label>
              <input type="datetime-local" value={endDatetime} onChange={(e) => setEndDatetime(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Atributos */}
        {attrs.length > 0 && (
          <div className="border-t border-slate-200 pt-4">
            <p className="text-sm font-medium text-slate-700 mb-2">Atributos</p>
            {availableToAdd.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <select value={addAttrKey} onChange={(e) => setAddAttrKey(e.target.value)} className={inputClass}>
                  <option value="">Elegir atributo...</option>
                  {availableToAdd.map((a) => <option key={a.id} value={a.key}>{a.label}</option>)}
                </select>
                <button type="button" onClick={addAttribute} disabled={!addAttrKey} className="shrink-0 px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 disabled:opacity-50">Agregar</button>
              </div>
            )}
            {selectedAttrKeys.map((key) => {
              const attr = attrs.find((a) => a.key === key);
              if (!attr) return null;
              return (
                <div key={attr.id} className="flex flex-col gap-1 p-3 rounded-lg bg-slate-50 border border-slate-200 mb-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-700">{attr.label}</span>
                    <button type="button" onClick={() => removeAttribute(attr.key)} className="text-slate-500 hover:text-red-600 text-sm">Quitar</button>
                  </div>
                  {attr.type === "select" && attr.options ? (
                    <select value={attrValues[attr.key] ?? ""} onChange={(e) => setAttr(attr.key, e.target.value)} className={inputClass}>
                      <option value="">—</option>
                      {(JSON.parse(attr.options) as string[]).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input type={attr.type === "number" ? "number" : "text"} value={attrValues[attr.key] ?? ""} onChange={(e) => setAttr(attr.key, e.target.value)} className={inputClass} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Photos — drag & drop */}
        <div className="border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-sm font-medium text-slate-700">Fotos del lote</p>
            <span className="text-xs text-slate-500">{totalPhotoCount}/10</span>
          </div>

          {allPreviews.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {allPreviews.map((item, absIdx) => (
                <div key={absIdx} className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 ${coverIndex === absIdx ? "border-[#0b5ed7]" : "border-slate-200"} bg-slate-100`}>
                  <img src={item.src} alt={`Foto ${absIdx + 1}`} className="w-full h-full object-cover" />
                  {item.isNew && <span className="absolute top-0 left-0 bg-green-500 text-white text-[8px] font-bold px-1">NUEVA</span>}
                  {coverIndex === absIdx && <span className="absolute bottom-0 left-0 right-0 bg-[#0b5ed7] text-white text-[9px] font-bold text-center py-0.5">PORTADA</span>}
                  <button type="button" onClick={() => item.isNew ? removeNewPhoto(item.origIndex) : removeExistingPhoto(item.origIndex)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] hover:bg-red-600" aria-label="Quitar">×</button>
                  {coverIndex !== absIdx && <button type="button" onClick={() => setCoverIndex(absIdx)} className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[9px] font-semibold text-center py-0.5 hover:bg-[#0b5ed7]/80">Portada</button>}
                </div>
              ))}
            </div>
          )}

          {totalPhotoCount < 10 && (
            <div
              className={`flex flex-col items-center justify-center gap-2 w-full px-4 py-5 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                isDraggingOver ? "border-[#0b5ed7] bg-[#0b5ed7]/5" : "border-slate-300 bg-slate-50 hover:bg-slate-100"
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
              onDragLeave={() => setIsDraggingOver(false)}
              onClick={() => fileInputRef.current?.click()}
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-slate-500">{isDraggingOver ? "Soltá las fotos acá" : "Arrastrá fotos o hacé clic"}</p>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          <button type="button" onClick={() => navigate(backPath)} className="px-4 py-2.5 min-h-[44px] text-slate-600 text-sm rounded-lg border border-slate-300 hover:bg-slate-50">
            Cancelar
          </button>
          <button type="submit" disabled={updateAuction.isPending || !title.trim()} className="px-4 py-2.5 min-h-[44px] text-white text-sm rounded-lg bg-[#0b5ed7] hover:bg-[#0952c2] disabled:opacity-50">
            {updateAuction.isPending ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
        {updateAuction.isError && <p className="text-sm text-red-600">No se pudo guardar.</p>}
      </form>
    </section>
  );
}
