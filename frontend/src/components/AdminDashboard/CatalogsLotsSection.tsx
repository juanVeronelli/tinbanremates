import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import type { Catalog } from "@/types";

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function CatalogsLotsSection() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoRef = useRef<HTMLInputElement | null>(null);

  const { data: catalogs = [], isLoading } = useQuery({
    queryKey: ["admin", "catalogs"],
    queryFn: () => api.admin.catalogs(),
  });

  const createCatalog = useMutation({
    mutationFn: () =>
      api.admin.createCatalog({
        name: name.trim(),
        description: description.trim() || undefined,
        slug: slugify(name.trim()),
        photoUrl: photoUrl || undefined,
      }),
    onSuccess: () => {
      setName(""); setDescription(""); setPhotoUrl("");
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

  const handlePhotoDrop = async (files: File[]) => {
    if (!files.length) return;
    setUploadingPhoto(true);
    try {
      const res = await api.admin.uploadAuctionPhotos(files);
      setPhotoUrl(res.urls[0] ?? "");
    } catch (e) {
      console.error("Error subiendo foto", e);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0b5ed7]/30";

  return (
    <div className="space-y-5">
      <h3 className="font-semibold text-slate-800 text-base">Catálogos / Lotes</h3>
      <p className="text-sm text-slate-500">
        Cada catálogo agrupa lotes de una misma subasta. Hacé clic en un catálogo para ver y gestionar sus lotes.
      </p>

      {/* Create form */}
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
        {/* Photo drop zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
            uploadingPhoto ? "border-blue-300 bg-blue-50" : "border-slate-300 bg-white hover:bg-slate-50"
          }`}
          onDrop={(e) => { e.preventDefault(); const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/")); handlePhotoDrop(files); }}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => photoRef.current?.click()}
        >
          <input
            ref={photoRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const files = Array.from(e.target.files ?? []); if (files.length) handlePhotoDrop(files); }}
          />
          {photoUrl ? (
            <div className="flex items-center gap-3 text-left">
              <img src={photoUrl} alt="Foto catálogo" className="w-14 h-14 object-cover rounded-lg" />
              <div>
                <p className="text-sm font-medium text-slate-700">Foto cargada</p>
                <p className="text-xs text-slate-400">Arrastrá o hacé clic para cambiarla</p>
              </div>
              <button type="button" onClick={(e) => { e.stopPropagation(); setPhotoUrl(""); }} className="ml-auto text-xs text-red-500 hover:underline">Quitar</button>
            </div>
          ) : (
            <p className="text-sm text-slate-400">{uploadingPhoto ? "Subiendo..." : "Arrastrá una foto o hacé clic para agregar imagen al catálogo"}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => createCatalog.mutate()}
          disabled={!name.trim() || createCatalog.isPending}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#0b5ed7] hover:bg-[#0952c2] disabled:opacity-50"
        >
          {createCatalog.isPending ? "Creando..." : "Crear catálogo"}
        </button>
        {createCatalog.isError && (
          <p className="text-xs text-red-600">No se pudo crear. El nombre/slug ya existe o hay un error.</p>
        )}
      </div>

      {/* Catalogs list */}
      {isLoading ? (
        <p className="text-sm text-slate-500">Cargando...</p>
      ) : (catalogs as Catalog[]).length === 0 ? (
        <p className="text-sm text-slate-500">No hay catálogos todavía. Creá uno arriba.</p>
      ) : (
        <ul className="space-y-2">
          {(catalogs as Catalog[]).map((cat) => (
            <li
              key={cat.id}
              className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 cursor-pointer hover:border-[#0b5ed7]/40 hover:shadow-sm transition-all"
              onClick={() => navigate(`/admin/catalogs/${cat.id}`)}
            >
              {/* Photo or placeholder */}
              {cat.photoUrl ? (
                <img
                  src={cat.photoUrl}
                  alt={cat.name}
                  className="w-14 h-14 object-cover rounded-lg shrink-0 border border-slate-200"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div className="w-14 h-14 rounded-lg shrink-0 bg-slate-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800">{cat.name}</p>
                {cat.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{cat.description}</p>}
                <p className="text-xs text-slate-400 mt-0.5">{cat._count?.auctions ?? 0} lote(s)</p>
              </div>

              <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => navigate(`/admin/catalogs/${cat.id}`)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[#0b5ed7] text-[#0b5ed7] hover:bg-[#0b5ed7]/5"
                >
                  Ver lotes →
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm(`¿Eliminar el catálogo "${cat.name}"? Los lotes asociados quedarán sin catálogo.`)) return;
                    deleteCatalog.mutate(cat.id);
                  }}
                  disabled={deleteCatalog.isPending}
                  className="px-3 py-1.5 rounded-lg text-xs border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
