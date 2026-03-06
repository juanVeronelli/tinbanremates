import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/services/api";

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    DRAFT: "Borrador",
    ACTIVE: "En curso",
    PAUSED: "Pausada",
    ENDED: "Finalizada",
    CANCELLED: "Cancelada",
  };
  return map[s] ?? s;
}

export default function AuctionsAdminSection() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: auctions, isLoading } = useQuery({
    queryKey: ["admin", "auctions"],
    queryFn: () => api.auctions.list({}),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.admin.setAuctionStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "auctions"] });
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
    },
  });

  const deleteAuction = useMutation({
    mutationFn: (id: string) => api.admin.deleteAuction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "auctions"] });
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
      setDeletingId(null);
    },
  });

  const list = (auctions as any[]) ?? [];

  const handleDelete = (id: string, title: string) => {
    if (!window.confirm(`¿Eliminar la subasta "${title}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(id);
    deleteAuction.mutate(id);
  };

  if (isLoading) return <p className="text-slate-500">Cargando subastas...</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Subastas</h3>
        <Link to="/admin/auctions/new" className="text-sm hover:underline text-[#0b5ed7]">
          + Nueva subasta
        </Link>
      </div>
      <ul className="divide-y divide-slate-200">
        {list.length === 0 ? (
          <li className="py-4 text-sm text-slate-500">No hay subastas. Creá una desde el enlace de arriba.</li>
        ) : (
          list.map((a: any) => (
            <li key={a.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <Link to={`/subasta/${a.id}`} className="hover:underline truncate block text-[#0b5ed7] font-medium">
                  {a.title}
                </Link>
                <span className="text-sm text-slate-500">{statusLabel(a.status)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to={`/subasta/${a.id}`}
                  className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Ver
                </Link>
                {a.status !== "ENDED" && (
                  <Link
                    to={`/admin/auctions/${a.id}/edit`}
                    className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Editar
                  </Link>
                )}
                {(a.status === "ACTIVE" || a.status === "PAUSED") && (
                  <button
                    type="button"
                    onClick={() =>
                      setStatus.mutate({
                        id: a.id,
                        status: a.status === "ACTIVE" ? "PAUSED" : "ACTIVE",
                      })
                    }
                    disabled={setStatus.isPending}
                    className="text-xs px-2 py-1 rounded border border-amber-300 text-amber-800 hover:bg-amber-50 disabled:opacity-50"
                  >
                    {a.status === "ACTIVE" ? "Pausar" : "Reanudar"}
                  </button>
                )}
                {a.status !== "ENDED" && (
                  <button
                    type="button"
                    onClick={() => handleDelete(a.id, a.title)}
                    disabled={deletingId === a.id || deleteAuction.isPending}
                    className="text-xs px-2 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId === a.id ? "..." : "Eliminar"}
                  </button>
                )}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
