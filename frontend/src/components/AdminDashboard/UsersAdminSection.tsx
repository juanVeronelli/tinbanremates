import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";

export default function UsersAdminSection() {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => api.admin.users(),
  });

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);

  if (isLoading) {
    return <p className="text-sm text-slate-500">Cargando usuarios...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-slate-800 text-base">Usuarios registrados</h3>
        <span className="text-xs text-slate-500 bg-slate-100 rounded-full px-2.5 py-1">
          {(users as any[]).length} usuario{(users as any[]).length !== 1 ? "s" : ""}
        </span>
      </div>

      {(users as any[]).length === 0 ? (
        <p className="text-sm text-slate-500">No hay usuarios registrados.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Teléfono</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Crédito</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(users as any[]).map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-[#0b5ed7] flex items-center justify-center text-white text-xs font-semibold shrink-0">
                        {u.name?.charAt(0)?.toUpperCase() ?? "?"}
                      </span>
                      <span className="font-medium text-slate-800 truncate max-w-[120px]">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 truncate max-w-[160px]">{u.email}</td>
                  <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{u.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">
                    {u.creditBalance > 0 ? (
                      <span className="text-green-700">{fmt(u.creditBalance)}</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${u.creditApproved ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {u.creditApproved ? "Aprobado" : "Sin crédito"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
