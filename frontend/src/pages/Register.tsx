import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/services/api";

export default function Register() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { user, token } = await api.auth.register({ email, password, name, phone: phone || undefined });
      setAuth(token, user);
      navigate("/");
    } catch (e: any) {
      setError(e.message === "EMAIL_IN_USE" ? "Ese email ya está registrado." : "Error al registrarse.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto py-8">
      <Link to="/" className="flex justify-center mb-6">
        <img src="/logo-sin-fondo.png" alt="Tinban Remates" className="h-14 w-auto object-contain" />
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 text-center">Registrarse</h1>
      <p className="text-slate-600 text-center mt-1">Creá tu cuenta para participar en las subastas</p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
            Nombre
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-[#0b5ed7] focus:border-[#0b5ed7]"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-[#0b5ed7] focus:border-[#0b5ed7]"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
            Teléfono (opcional)
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-[#0b5ed7] focus:border-[#0b5ed7]"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-[#0b5ed7] focus:border-[#0b5ed7]"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 text-white font-semibold rounded-lg bg-[#0b5ed7] hover:bg-[#0952c2] disabled:opacity-50"
        >
          {loading ? "Registrando..." : "Registrarse"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        ¿Ya tenés cuenta?{" "}
        <Link to="/ingresar" className="font-medium hover:underline" style={{ color: "#0b5ed7" }}>
          Ingresar
        </Link>
      </p>
    </div>
  );
}
