import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { Category } from "@/types";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[40px] focus:outline-none focus:ring-2 focus:ring-[#0b5ed7]/30";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export default function CategoryConfigSection() {
  const queryClient = useQueryClient();
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [sortOrder, setSortOrder] = useState("");

  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => api.admin.categories() as Promise<Category[]>,
  });

  const createCategory = useMutation({
    mutationFn: () =>
      api.admin.createCategory({
        description: description.trim(),
        slug: slug.trim() || slugify(description),
        sortOrder: sortOrder.trim() ? Number(sortOrder) : undefined,
      }),
    onSuccess: () => {
      setDescription("");
      setSlug("");
      setSortOrder("");
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    createCategory.mutate();
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDescription(value);
    if (!slug.trim()) {
      setSlug(slugify(value));
    }
  };

  if (isLoading) return <p className="text-slate-500 text-sm">Cargando categorías...</p>;

  const list = (categories as Category[]) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-800">Categorías</h3>
        <span className="text-xs text-slate-500">
          {list.length ? `${list.length} categoría(s)` : "Sin categorías aún"}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,0.8fr)] gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nombre de la categoría *</label>
            <input
              type="text"
              value={description}
              onChange={handleDescriptionChange}
              className={inputClass}
              placeholder="Ej: Herramientas, Muebles, Vehículos"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className={inputClass}
              placeholder="herramientas"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Orden</label>
            <input
              type="number"
              inputMode="numeric"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className={inputClass}
              placeholder="0"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={createCategory.isPending || !description.trim()}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-[#0b5ed7] hover:bg-[#0952c2] disabled:opacity-50 min-h-[40px]"
          >
            {createCategory.isPending ? "Creando..." : "Crear categoría"}
          </button>
        </div>
      </form>

      {list.length > 0 && (
        <div className="border-t border-slate-200 pt-3">
          <ul className="divide-y divide-slate-200 text-sm">
            {list
              .slice()
              .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
              .map((cat) => (
                <li key={cat.id} className="py-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 truncate">{cat.description}</p>
                    <p className="text-xs text-slate-500">
                      slug: <span className="font-mono">{cat.slug}</span>
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">orden {cat.sortOrder ?? 0}</span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

