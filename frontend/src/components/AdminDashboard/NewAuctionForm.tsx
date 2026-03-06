import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { Category } from "@/types";
import type { DynamicAttributeDef } from "@/types";

// Convierte date + time locales a ISO para el backend
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
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedAttrKeys, setSelectedAttrKeys] = useState<string[]>([]);
  const [attrValues, setAttrValues] = useState<Record<string, string>>({});
  const [addAttrKey, setAddAttrKey] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ["auctions", "categories"],
    queryFn: () => api.auctions.categories(),
  });

  const { data: attributes = [] } = useQuery({
    queryKey: ["admin", "attributes"],
    queryFn: () => api.admin.attributes(),
  });

  const createAuction = useMutation({
    mutationFn: (body: {
      title: string;
      description?: string;
      lotNumber?: string;
      minimumPrice: number;
      minIncrement: number;
      categoryId?: string;
      startsAt?: string;
      endsAt?: string;
      attributes?: Record<string, string>;
    }) => api.admin.createAuction(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "auctions"] });
      navigate("/admin/auctions");
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
    setAttrValues((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const setAttr = (key: string, value: string) => {
    setAttrValues((prev) => (value.trim() ? { ...prev, [key]: value.trim() } : { ...prev, [key]: "" }));
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
      startsAt: toISO(startDate, startTime),
      endsAt: toISO(endDate, endTime),
      attributes: Object.keys(attributesPayload).length ? attributesPayload : undefined,
    });
  };

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => navigate("/admin/auctions")}
          className="text-slate-600 hover:text-slate-900 text-sm min-h-[44px] flex items-center"
        >
          ← Volver a subastas
        </button>
      </div>
      <h3 className="font-semibold text-slate-800 mb-4">Nueva subasta</h3>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <div>
          <label className={labelClass}>Título *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={inputClass}
            placeholder="Ej: Lote 1 - Muebles"
          />
        </div>
        <div>
          <label className={labelClass}>Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={`${inputClass} min-h-[80px]`}
            placeholder="Descripción opcional del lote"
          />
        </div>
        <div>
          <label className={labelClass}>Número de lote</label>
          <input
            type="text"
            value={lotNumber}
            onChange={(e) => setLotNumber(e.target.value)}
            className={inputClass}
            placeholder="Ej: L-001"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Precio mínimo *</label>
            <input
              type="text"
              inputMode="decimal"
              value={minimumPrice}
              onChange={(e) => setMinimumPrice(e.target.value)}
              required
              className={inputClass}
              placeholder="0"
            />
          </div>
          <div>
            <label className={labelClass}>Incremento mínimo *</label>
            <input
              type="text"
              inputMode="decimal"
              value={minIncrement}
              onChange={(e) => setMinIncrement(e.target.value)}
              required
              className={inputClass}
              placeholder="0"
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Categoría</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={inputClass}
          >
            <option value="">Sin categoría</option>
            {(categories as Category[]).map((c) => (
              <option key={c.id} value={c.id}>
                {c.description}
              </option>
            ))}
          </select>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Fechas (opcional)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Inicio</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`${inputClass} flex-1`}
                />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={`${inputClass} sm:min-w-[120px]`}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Fin</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`${inputClass} flex-1`}
                />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={`${inputClass} sm:min-w-[120px]`}
                />
              </div>
            </div>
          </div>
        </div>

        {attrs.length > 0 && (
          <div className="border-t border-slate-200 pt-4">
            <p className="text-sm font-medium text-slate-700 mb-2">Atributos (opcionales)</p>
            <p className="text-xs text-slate-500 mb-3">
              Elegí qué atributos querés usar para este lote; después cargá el valor.
            </p>
            {availableToAdd.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <select
                  value={addAttrKey}
                  onChange={(e) => setAddAttrKey(e.target.value)}
                  className={inputClass}
                  aria-label="Agregar atributo"
                >
                  <option value="">Elegir atributo...</option>
                  {availableToAdd.map((a) => (
                    <option key={a.id} value={a.key}>
                      {a.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addAttribute}
                  disabled={!addAttrKey}
                  className="shrink-0 px-4 py-2.5 min-h-[44px] text-sm font-medium rounded-lg border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  Agregar
                </button>
              </div>
            )}
            {selectedAttrKeys.length > 0 && (
              <div className="space-y-3">
                {selectedAttrKeys.map((key) => {
                  const attr = attrs.find((a) => a.key === key);
                  if (!attr) return null;
                  return (
                    <div key={attr.id} className="flex flex-col gap-1 p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-slate-700">{attr.label}</span>
                        <button
                          type="button"
                          onClick={() => removeAttribute(attr.key)}
                          className="text-slate-500 hover:text-red-600 text-sm shrink-0 min-h-[44px] flex items-center"
                          aria-label={`Quitar ${attr.label}`}
                        >
                          Quitar
                        </button>
                      </div>
                      {attr.type === "select" && attr.options ? (
                        <select
                          value={attrValues[attr.key] ?? ""}
                          onChange={(e) => setAttr(attr.key, e.target.value)}
                          className={inputClass}
                        >
                          <option value="">—</option>
                          {(JSON.parse(attr.options) as string[]).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={attr.type === "number" ? "number" : "text"}
                          inputMode={attr.type === "number" ? "numeric" : "text"}
                          value={attrValues[attr.key] ?? ""}
                          onChange={(e) => setAttr(attr.key, e.target.value)}
                          className={inputClass}
                          placeholder={`Valor para ${attr.label}`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          <button
            type="button"
            onClick={() => navigate("/admin/auctions")}
            className="px-4 py-2.5 min-h-[44px] text-slate-600 text-sm rounded-lg border border-slate-300 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createAuction.isPending || !title.trim()}
            className="px-4 py-2.5 min-h-[44px] text-white text-sm rounded-lg bg-[#0b5ed7] hover:bg-[#0952c2] disabled:opacity-50"
          >
            {createAuction.isPending ? "Creando..." : "Crear subasta"}
          </button>
        </div>
        {createAuction.isError && (
          <p className="text-sm text-red-600">
            No se pudo crear la subasta. Revisá los datos e intentá de nuevo.
          </p>
        )}
      </form>
    </section>
  );
}
