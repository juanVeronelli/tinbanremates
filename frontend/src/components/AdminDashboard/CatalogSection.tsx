import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { Catalog } from "@/types";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function CatalogSection() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const { data: catalogs = [], isLoading } = useQuery({
    queryKey: ["admin", "catalogs"],
    queryFn: () => api.admin.catalogs(),
  });

  const createCatalog = useMutation({
    mutationFn: () =>
      api.admin.createCatalog({ name: name.trim(), description: description.trim() || undefined, slug: slugify(name.trim()) }),
    onSuccess: () => {
      setName("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["admin", "catalogs"] });
      queryClient.invalidateQueries({ queryKey: ["catalogs"] });
    },
  });

  const updateCatalog = useMutation({
    mutationFn: (id: string) =>
      api.admin.updateCatalog(id, { name: editName.trim(), description: editDescription.trim() || undefined, slug: slugify(editName.trim()) }),
    onSuccess: () => {
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "catalogs"] });
      queryClient.invalidateQueries({ queryKey: ["catalogs"] });
    },
  });

  const deleteCatalog = useMutation({
    mutationFn: (id: string) => api.admin.deleteCatalog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "catalogs"] });
      queryClient.invalidateQueries({ queryKey: ["catalogs"] });
    },
  });

  const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0b5ed7]/30";

  return (
    <div className="space-y-5">
      <h3 className="font-semibold text-slate-800 text-base">Gestión de catálogos</h3>
      <p className="text-sm text-slate-500">
        Los catálogos agrupan lotes de una misma subasta (ej: "Subasta Local Hamburguesería"). Al crear un lote, podés asignarlo a un catálogo.
      </p>

      {/* Formulario de creación */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
        <h4 className="text-sm font-semibold text-slate-700">Nuevo catálogo</h4>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del catálogo (ej: Subasta Cafetería)"
          className={inputClass}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción opcional"
          rows={2}
          className={inputClass}
        />
        <button
          type="button"
          onClick={() => createCatalog.mutate()}
          disabled={!name.trim() || createCatalog.isPending}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#0b5ed7] hover:bg-[#0952c2] disabled:opacity-50"
        >
          {createCatalog.isPending ? "Creando..." : "Crear catálogo"}
        </button>
        {createCatalog.isError && (
          <p className="text-xs text-red-600">No se pudo crear. El slug ya existe o hay un error.</p>
        )}
      </div>

      {/* Lista */}
      {isLoading ? (
        <p className="text-sm text-slate-500">Cargando...</p>
      ) : (catalogs as Catalog[]).length === 0 ? (
        <p className="text-sm text-slate-500">No hay catálogos creados todavía.</p>
      ) : (
        <ul className="space-y-2">
          {(catalogs as Catalog[]).map((cat) => (
            <li key={cat.id} className="bg-white rounded-xl border border-slate-200 p-4">
              {editingId === cat.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={inputClass}
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={2}
                    className={inputClass}
                    placeholder="Descripción (opcional)"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => updateCatalog.mutate(cat.id)}
                      disabled={!editName.trim() || updateCatalog.isPending}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-[#0b5ed7] hover:bg-[#0952c2] disabled:opacity-50"
                    >
                      {updateCatalog.isPending ? "Guardando..." : "Guardar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 rounded-lg text-sm border border-slate-300 text-slate-600 hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm">{cat.name}</p>
                    {cat.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{cat.description}</p>}
                    <p className="text-xs text-slate-400 mt-0.5">{cat._count?.auctions ?? 0} lote(s)</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => { setEditingId(cat.id); setEditName(cat.name); setEditDescription(cat.description ?? ""); }}
                      className="px-3 py-1.5 rounded-lg text-xs border border-slate-300 text-slate-600 hover:bg-slate-50"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => { if (!window.confirm(`¿Eliminar el catálogo "${cat.name}"? Los lotes asociados quedarán sin catálogo.`)) return; deleteCatalog.mutate(cat.id); }}
                      disabled={deleteCatalog.isPending}
                      className="px-3 py-1.5 rounded-lg text-xs border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
