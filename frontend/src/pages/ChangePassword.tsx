import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import Toast from "@/components/Toast";

export default function ChangePassword() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" | "info" } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setToast({ message: "Las contraseñas nuevas no coinciden.", type: "error" });
      return;
    }
    if (newPassword.length < 6) {
      setToast({ message: "La nueva contraseña debe tener al menos 6 caracteres.", type: "error" });
      return;
    }
    setLoading(true);
    try {
      await api.auth.changePassword({ currentPassword, newPassword });
      setToast({ message: "Contraseña actualizada correctamente.", type: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => navigate("/perfil"), 1500);
    } catch (err: any) {
      const msg = err.message === "INVALID_CURRENT_PASSWORD"
        ? "La contraseña actual es incorrecta."
        : "No se pudo cambiar la contraseña. Intentá de nuevo.";
      setToast({ message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0b5ed7]/30";

  return (
    <div className="max-w-md mx-auto space-y-6">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/perfil")}
          className="text-slate-500 hover:text-slate-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Cambiar contraseña</h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Contraseña actual
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
              className={inputClass}
              placeholder="Tu contraseña actual"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nueva contraseña
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className={inputClass}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Confirmar nueva contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className={inputClass}
              placeholder="Repetí la nueva contraseña"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => navigate("/perfil")}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-[#0b5ed7] text-white text-sm font-medium hover:bg-[#0952c2] disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
