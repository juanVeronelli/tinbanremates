import { useEffect } from "react";

interface ToastProps {
  message: string;
  type?: "error" | "success" | "info";
  onClose: () => void;
}

export default function Toast({ message, type = "info", onClose }: ToastProps) {
  useEffect(() => {
    const id = setTimeout(onClose, 4000);
    return () => clearTimeout(id);
  }, [onClose]);

  const base =
    "fixed inset-x-0 top-4 z-50 flex justify-center px-4 pointer-events-none";
  const inner =
    "pointer-events-auto max-w-md w-full rounded-lg shadow-lg px-4 py-3 text-sm flex items-start gap-2";

  const styles =
    type === "error"
      ? "bg-red-50 border border-red-200 text-red-800"
      : type === "success"
        ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
        : "bg-slate-900/90 border border-slate-700 text-slate-50";

  return (
    <div className={base}>
      <div className={`${inner} ${styles}`}>
        <span className="mt-0.5">
          {type === "error" ? "⚠️" : type === "success" ? "✅" : "ℹ️"}
        </span>
        <p className="flex-1">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="ml-2 text-xs font-medium opacity-70 hover:opacity-100"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

