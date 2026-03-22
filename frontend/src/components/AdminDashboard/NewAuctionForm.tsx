import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { Category, Catalog } from "@/types";
import type { DynamicAttributeDef } from "@/types";

function toISO(dateStr: string, timeStr: string): string | undefined {
  if (!dateStr) return undefined;
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  const date = new Date(year, month - 1, day);
  if (timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    date.setHours(h ?? 0, m ?? 0, 0, 0);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  return date.toISOString();
}

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#0b5ed7]/30";
const labelClass = "block text-sm font-medium text-slate-700 mb-1";

export default function NewAuctionForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [minimumPrice, setMinimumPrice] = useState("");
  const [minIncrement, setMinIncrement] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [catalogId, setCatalogId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedAttrKeys, setSelectedAttrKeys] = useState<string[]>([]);
  const [attrValues, setAttrValues] = useState<Record<string, string>>({});
  const [addAttrKey, setAddAttrKey] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const createAuction = useMutation({
    mutationFn: async (body: {
      title: string;
      description?: string;
      lotNumber?: string;
      minimumPrice: number;
      minIncrement: number;
      categoryId?: string;
      catalogId?: string;
      startsAt?: string;
      endsAt?: string;
      attributes?: Record<string, string>;
      photoFiles?: File[];
      coverIndex?: number;
    }) => {
      let photoUrls: string[] | undefined;
      if (body.photoFiles && body.photoFiles.length) {
        // Reordenar para que la portada vaya primero
        const ordered = [...body.photoFiles];
        const ci = body.coverIndex ?? 0;
        if (ci > 0) {
          const [cover] = ordered.splice(ci, 1);
          ordered.unshift(cover);
        }
        const res = await api.admin.uploadAuctionPhotos(ordered);
        photoUrls = res.urls;
      }
      const { photoFiles, coverIndex: _ci, ...rest } = body;
      return api.admin.createAuction({ ...rest, photoUrls });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "auctions"] });
      navigate("/admin/auctions");
    },
  });

  const attrs = (attributes as DynamicAttributeDef[]).sort((a, b) => a.sortOrder - b.sortOrder);
  const availableToAdd = attrs.filter((a) => !selectedAttrKeys.includes(a.key));
  const selectedCategory = (categories as Category[]).find((c) => c.id === categoryId) || null;

  const addAttribute = () => {
    if (addAttrKey && !selectedAttrKeys.includes(addAttrKey)) {
      setSelectedAttrKeys((prev) => [...prev, addAttrKey]);
      setAddAttrKey("");
    }
  };

  const removeAttribute = (key: string) => {
    setSelectedAttrKeys((prev) => prev.filter((k) => k !== key));
    setAttrValues((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const setAttr = (key: string, value: string) => {
    setAttrValues((prev) => (value.trim() ? { ...prev, [key]: value.trim() } : { ...prev, [key]: "" }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const remaining = 10 - photoFiles.length;
    const toAdd = files.slice(0, remaining);
    const newPreviews = toAdd.map((f) => URL.createObjectURL(f));
    setPhotoFiles((prev) => [...prev, ...toAdd]);
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
    if (coverIndex === index) setCoverIndex(0);
    else if (coverIndex > index) setCoverIndex((c) => c - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const minPrice = parseFloat(minimumPrice.replace(",", "."));
    const minInc = parseFloat(minIncrement.replace(",", "."));
    if (!title.trim() || isNaN(minPrice) || minPrice <= 0 || isNaN(minInc) || minInc <= 0) return;
    const attributesPayload: Record<string, string> = {};
    selectedAttrKeys.forEach((k) => {
      const v = attrValues[k];
      if (v) attributesPayload[k] = v;
    });
    createAuction.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      lotNumber: lotNumber.trim() || undefined,
      minimumPrice: minPrice,
      minIncrement: minInc,
      categoryId: categoryId || undefined,
      catalogId: catalogId || undefined,
      startsAt: toISO(startDate, startTime),
      endsAt: toISO(endDate, endTime),
      attributes: Object.keys(attributesPayload).length ? attributesPayload : undefined,
      photoFiles,
      coverIndex,
    });
  };

  const mainPreviewPhoto =
    photoPreviews[coverIndex] || photoPreviews[0] || "https://placehold.co/800x500/e2e8f0/64748b?text=Sin+imagen";

  return (
    <section className="bg-slate-50 rounded-xl border border-slate-200 p-5 md:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <button
          type="button"
          onClick={() => navigate("/admin/auctions")}
          className="text-slate-600 hover:text-slate-900 text-sm min-h-[44px] flex items-center"
        >
          ← Volver a subastas
        </button>
        <span className="text-xs uppercase tracking-wide text-slate-500 bg-white/60 border border-slate-200 rounded-full px-3 py-1">
          Panel de administrador
        </span>
      </div>
      <h3 className="font-semibold text-slate-900 text-xl mb-1">Nueva subasta</h3>
      <p className="text-sm text-slate-500 mb-5">
        Completá los datos del lote y visualizá cómo se verá publicado en tiempo real.
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.3fr)] items-start">
        <form id="new-auction-form" onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-sm">
            <h4 className="text-sm font-semibold text-slate-900">Información básica</h4>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Título *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} placeholder="Ej: Lote 1 - Muebles" />
              </div>
              <div>
                <label className={labelClass}>Descripción</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={`${inputClass} min-h-[80px]`} placeholder="Descripción opcional del lote" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Número de lote</label>
                  <input type="text" value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} className={inputClass} placeholder="Ej: L-001" />
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
              <div>
                <label className={labelClass}>Catálogo</label>
                <select value={catalogId} onChange={(e) => setCatalogId(e.target.value)} className={inputClass}>
                  <option value="">Sin catálogo</option>
                  {(catalogs as Catalog[]).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-sm">
            <h4 className="text-sm font-semibold text-slate-900">Precios y reglas</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Precio mínimo *</label>
                <input type="text" inputMode="decimal" value={minimumPrice} onChange={(e) => setMinimumPrice(e.target.value)} required className={inputClass} placeholder="0" />
              </div>
              <div>
                <label className={labelClass}>Incremento mínimo *</label>
                <input type="text" inputMode="decimal" value={minIncrement} onChange={(e) => setMinIncrement(e.target.value)} required className={inputClass} placeholder="0" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-sm">
            <h4 className="text-sm font-semibold text-slate-900">Fechas de la subasta</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Inicio</label>
                <div className="space-y-2">
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Fin</label>
                <div className="space-y-2">
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-sm">
            <h4 className="text-sm font-semibold text-slate-900">Atributos del lote</h4>
            {attrs.length === 0 && (
              <p className="text-xs text-slate-500">No tenés atributos dinámicos configurados todavía.</p>
            )}
            {attrs.length > 0 && (
              <>
                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                  <select value={addAttrKey} onChange={(e) => setAddAttrKey(e.target.value)} className={inputClass} aria-label="Agregar atributo">
                    <option value="">Elegir atributo...</option>
                    {availableToAdd.map((a) => (
                      <option key={a.id} value={a.key}>{a.label}</option>
                    ))}
                  </select>
                  <button type="button" onClick={addAttribute} disabled={!addAttrKey} className="shrink-0 px-4 py-2.5 min-h-[44px] text-sm font-medium rounded-lg border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:opacity-50">
                    Agregar atributo
                  </button>
                </div>
                {selectedAttrKeys.length > 0 && (
                  <div className="space-y-3">
                    {selectedAttrKeys.map((key) => {
                      const attr = attrs.find((a) => a.key === key);
                      if (!attr) return null;
                      return (
                        <div key={attr.id} className="flex flex-col gap-1 p-3 rounded-lg bg-slate-50 border border-slate-200">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-slate-700">{attr.label}</span>
                            <button type="button" onClick={() => removeAttribute(attr.key)} className="text-slate-500 hover:text-red-600 text-sm shrink-0 min-h-[32px] flex items-center" aria-label={`Quitar ${attr.label}`}>Quitar</button>
                          </div>
                          {attr.type === "select" && attr.options ? (
                            <select value={attrValues[attr.key] ?? ""} onChange={(e) => setAttr(attr.key, e.target.value)} className={inputClass}>
                              <option value="">—</option>
                              {(JSON.parse(attr.options) as string[]).map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input type={attr.type === "number" ? "number" : "text"} inputMode={attr.type === "number" ? "numeric" : "text"} value={attrValues[attr.key] ?? ""} onChange={(e) => setAttr(attr.key, e.target.value)} className={inputClass} placeholder={`Valor para ${attr.label}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {selectedAttrKeys.length === 0 && (
                  <p className="text-xs text-slate-500">No hay atributos agregados.</p>
                )}
              </>
            )}
          </div>
        </form>

        <aside className="flex flex-col gap-4">
          <div className="order-1 lg:order-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="aspect-video bg-slate-100 relative">
              <img src={mainPreviewPhoto} alt={title || "Vista previa del lote"} className="w-full h-full object-contain" />
              <div className="absolute top-3 left-3 flex gap-2">
                {lotNumber && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-black/70 text-white">Lote {lotNumber}</span>
                )}
                {minimumPrice && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500 text-white">Min {minimumPrice}</span>
                )}
              </div>
            </div>
            <div className="p-4 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Previsualización</p>
              <h4 className="text-lg font-semibold text-slate-900 line-clamp-2">{title || "Título de la subasta"}</h4>
              {selectedCategory && <p className="text-xs text-slate-500">{selectedCategory.description}</p>}
              {description && <p className="text-sm text-slate-600 line-clamp-3 whitespace-pre-wrap">{description}</p>}
              <div className="mt-3 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs text-slate-500">Precio mínimo</p>
                  <p className="font-semibold text-slate-900">{minimumPrice || "—"}</p>
                </div>
                <div className="space-y-0.5 text-right">
                  <p className="text-xs text-slate-500">Incremento mínimo</p>
                  <p className="font-semibold text-slate-900">{minIncrement || "—"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Fotos */}
          <div className="order-2 lg:order-2 bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-slate-900">Fotos del lote</h4>
              <span className="text-xs text-slate-500">
                {photoPreviews.length ? `${photoPreviews.length}/10` : "Sin fotos"}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Podés seleccionar hasta 10 fotos a la vez. La primera es la portada automáticamente, o podés elegirla haciendo clic en "Portada".
            </p>

            {/* Input múltiple */}
            {photoFiles.length < 10 && (
              <label className="flex items-center justify-center gap-2 w-full px-4 py-3 min-h-[44px] text-sm font-medium rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Seleccionar fotos ({10 - photoFiles.length} disponibles)
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            )}

            {photoPreviews.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {photoPreviews.map((src, index) => (
                  <div
                    key={index}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 ${coverIndex === index ? "border-[#0b5ed7]" : "border-slate-200"} bg-slate-100`}
                  >
                    <img src={src} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                    {coverIndex === index && (
                      <span className="absolute bottom-0 left-0 right-0 bg-[#0b5ed7] text-white text-[9px] font-bold text-center py-0.5">
                        PORTADA
                      </span>
                    )}
                    <div className="absolute top-1 right-1 flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        className="bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] hover:bg-red-600"
                        aria-label={`Quitar foto ${index + 1}`}
                      >
                        ×
                      </button>
                    </div>
                    {coverIndex !== index && (
                      <button
                        type="button"
                        onClick={() => setCoverIndex(index)}
                        className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[9px] font-semibold text-center py-0.5 hover:bg-[#0b5ed7]/80"
                      >
                        Portada
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      <div className="mt-4 flex flex-col-reverse sm:flex-row gap-2">
        <button type="button" onClick={() => navigate("/admin/auctions")} className="px-4 py-2.5 min-h-[44px] text-slate-600 text-sm rounded-lg border border-slate-300 hover:bg-slate-50">
          Cancelar
        </button>
        <button type="submit" form="new-auction-form" disabled={createAuction.isPending || !title.trim()} className="px-4 py-2.5 min-h-[44px] text-white text-sm rounded-lg bg-[#0b5ed7] hover:bg-[#0952c2] disabled:opacity-50">
          {createAuction.isPending ? "Creando..." : "Crear subasta"}
        </button>
      </div>
      {createAuction.isError && (
        <p className="mt-2 text-sm text-red-600">No se pudo crear la subasta. Revisá los datos e intentá de nuevo.</p>
      )}
    </section>
  );
}
