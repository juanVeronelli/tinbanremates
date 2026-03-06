import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";

export default function CreditRequestsSection() {
  const queryClient = useQueryClient();
  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin", "credit-requests"],
    queryFn: () => api.admin.creditRequests(),
  });

  const resolve = useMutation({
    mutationFn: ({ id, status, adminNote }: { id: string; status: "APPROVED" | "REJECTED"; adminNote?: string }) =>
      api.admin.resolveCredit(id, status, adminNote),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "credit-requests"] }),
  });

  if (isLoading) return <p className="text-slate-500">Cargando solicitudes...</p>;
  if (!requests?.length) return <p className="text-slate-500">No hay solicitudes pendientes.</p>;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-slate-800">Solicitudes de crédito</h3>
      <ul className="divide-y divide-slate-200">
        {requests.map((r: any) => (
          <li key={r.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium">{r.user?.name ?? "—"}</p>
              <p className="text-sm text-slate-500">{r.user?.email}</p>
              {r.note && <p className="text-sm text-slate-600 mt-1">{r.note}</p>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => resolve.mutate({ id: r.id, status: "APPROVED" })}
                disabled={resolve.isPending}
                className="px-3 py-1.5 text-white text-sm rounded-lg bg-[#0b5ed7] hover:bg-[#0952c2] disabled:opacity-50"
              >
                Aprobar
              </button>
              <button
                onClick={() => resolve.mutate({ id: r.id, status: "REJECTED" })}
                disabled={resolve.isPending}
                className="px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 disabled:opacity-50"
              >
                Rechazar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
