import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";

export default function AttributeConfigSection() {
  const queryClient = useQueryClient();
  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");

  const { data: attributes, isLoading } = useQuery({
    queryKey: ["admin", "attributes"],
    queryFn: () => api.admin.attributes(),
  });

  const createAttr = useMutation({
    mutationFn: () => api.admin.createAttribute({ key: key.trim(), label: label.trim() }),
    onSuccess: () => {
      setKey("");
      setLabel("");
      queryClient.invalidateQueries({ queryKey: ["admin", "attributes"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !label.trim()) return;
    createAttr.mutate();
  };

  if (isLoading) return <p className="text-slate-500">Cargando atributos...</p>;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-slate-800">Atributos dinámicos</h3>
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Clave (ej: calidad)"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Etiqueta (ej: Calidad)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={createAttr.isPending || !key.trim() || !label.trim()}
          className="px-3 py-2 text-white text-sm rounded-lg bg-[#0b5ed7] hover:bg-[#0952c2] disabled:opacity-50"
        >
          Añadir
        </button>
      </form>
      <ul className="text-sm text-slate-600">
        {(attributes as any[])?.map((a: any) => (
          <li key={a.id}>
            <strong>{a.key}</strong> — {a.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
