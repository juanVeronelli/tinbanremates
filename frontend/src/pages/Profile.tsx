import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useAuthStore } from "@/stores/authStore";
import Toast from "@/components/Toast";

export default function Profile() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" | "info" } | null>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.auth.profile(),
    staleTime: 0,
  });

  const { data: requests } = useQuery({
    queryKey: ["my-credit-requests"],
    queryFn: () => api.auth.myCreditRequests(),
  });

  const requestCredit = useMutation({
    mutationFn: () =>
      api.auth.requestCredit({
        note: note || undefined,
        amount: amount ? Number(amount) : undefined,
      }),
    onSuccess: () => {
      setNote("");
      setAmount("");
      queryClient.invalidateQueries({ queryKey: ["my-credit-requests"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setToast({ message: "Solicitud de crédito enviada correctamente.", type: "success" });
    },
    onError: (err: any) => {
      const msg = (err as Error).message || "No se pudo enviar la solicitud de crédito.";
      setToast({ message: msg, type: "error" });
    },
  });

  const display = profile ?? user;
  const totalApproved =
    ((requests as any[]) || []).reduce((sum: number, r: any) => {
      if (r.status === "APPROVED" && r.amount != null) {
        const n = Number(r.amount);
        if (!Number.isNaN(n)) return sum + n;
      }
      return sum;
    }, 0) ?? 0;
  const creditBalance = (profile as any)?.creditBalance ?? (user as any)?.creditBalance ?? totalApproved;
  const hasCredit = (display?.creditApproved || creditBalance > 0 || totalApproved > 0);

  // Mantener el store actualizado con el perfil (para que BidSystem vea creditBalance)
  useEffect(() => {
    if (profile && (profile as any).creditBalance !== undefined) {
      useAuthStore.getState().setUser({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role as "USER" | "ADMIN",
        creditApproved: profile.creditApproved,
        creditBalance: (profile as any).creditBalance,
      });
    }
  }, [profile]);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <h1 className="text-2xl font-bold text-slate-900">Mi perfil</h1>
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <p className="text-slate-600"><strong>Nombre:</strong> {display?.name}</p>
        <p className="text-slate-600 mt-1"><strong>Email:</strong> {display?.email}</p>
        <p className="mt-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-sm font-medium bg-slate-100 text-slate-700">
            {hasCredit ? "Crédito aprobado — Podés pujar" : "Crédito pendiente — Solicitá aprobación"}
          </span>
        </p>
        {(creditBalance > 0 || totalApproved > 0) && (
          <p className="mt-2 text-sm text-slate-700">
            <strong>Crédito disponible:</strong>{" "}
            {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(creditBalance > 0 ? creditBalance : totalApproved)}
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-800 mb-2">Solicitar crédito</h2>
        <p className="text-sm text-slate-600 mb-3">
          {hasCredit
            ? "Podés solicitar más crédito cuando lo necesites. El administrador revisará tu solicitud."
            : "Para poder pujar, un administrador debe aprobar tu crédito. Enviá una solicitud y te notificaremos."}
        </p>
        <div className="flex flex-col gap-2 mb-3">
          <label className="text-sm font-medium text-slate-700">
            Monto de crédito solicitado
            <input
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ej: 100000"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Mensaje opcional para el administrador"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mb-2"
          rows={2}
        />
        <button
          onClick={() => requestCredit.mutate()}
          disabled={requestCredit.isPending}
          className="px-4 py-2 text-white text-sm font-medium rounded-lg bg-[#0b5ed7] hover:bg-[#0952c2] disabled:opacity-50"
        >
          {requestCredit.isPending ? "Enviando..." : "Enviar solicitud"}
        </button>
        {requestCredit.isError && (
          <p className="mt-2 text-sm text-red-600">{(requestCredit.error as Error).message}</p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-800 mb-2">Mis solicitudes de crédito</h2>
        {!(requests as any[])?.length ? (
          <p className="text-sm text-slate-500">No tenés solicitudes.</p>
        ) : (
          <ul className="space-y-2">
            {(requests as any[]).map((r: any) => (
              <li key={r.id} className="text-sm">
                <span className="text-slate-600">{new Date(r.createdAt).toLocaleDateString("es-AR")}</span>
                {" — "}
                <span className={r.status === "APPROVED" ? "text-green-600" : r.status === "REJECTED" ? "text-red-600" : "text-amber-600"}>
                  {r.status === "PENDING" ? "Pendiente" : r.status === "APPROVED" ? "Aprobada" : "Rechazada"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
