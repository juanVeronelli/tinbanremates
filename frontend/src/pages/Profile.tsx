import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useAuthStore } from "@/stores/authStore";

export default function Profile() {
  const { user } = useAuthStore();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.auth.profile(),
    staleTime: 0,
  });

  const display = profile ?? user;

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
      <h1 className="text-2xl font-bold text-slate-900">Mi perfil</h1>
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Nombre</p>
          <p className="text-slate-800 font-medium">{display?.name}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Email</p>
          <p className="text-slate-800">{display?.email}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Rol</p>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-sm font-medium bg-slate-100 text-slate-700">
            {display?.role === "ADMIN" ? "Administrador" : "Usuario"}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <h2 className="font-semibold text-slate-800">Acciones rápidas</h2>
        <Link
          to="/creditos"
          className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <span className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-medium text-slate-800">Mis créditos</p>
            <p className="text-xs text-slate-500">Ver saldo y solicitar crédito</p>
          </div>
          <svg className="w-4 h-4 text-slate-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <Link
          to="/cambiar-contrasena"
          className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <span className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-medium text-slate-800">Cambiar contraseña</p>
            <p className="text-xs text-slate-500">Actualizar tu contraseña actual</p>
          </div>
          <svg className="w-4 h-4 text-slate-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
