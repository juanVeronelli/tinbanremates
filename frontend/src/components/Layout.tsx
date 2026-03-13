import { useState, useRef, useEffect } from "react";
import { Outlet, Link } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import WhatsAppButton from "./WhatsAppButton";
import Footer from "./Footer";

export default function Layout() {
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (
        accountRef.current &&
        !accountRef.current.contains(e.target as Node)
      ) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const closeMenus = () => {
    setMenuOpen(false);
    setAccountOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/80">
      <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center shrink-0"
              onClick={closeMenus}
              aria-label="Tinban Remates - Inicio"
            >
              <img
                src="/logo-sin-fondo.png"
                alt="Tinban Remates"
                className="h-16 sm:h-20 w-auto object-contain"
              />
            </Link>

            {/* Desktop: solo Subastas + Cuenta/Ingresar */}
            <nav className="hidden md:flex items-center gap-4">
              <Link
                to="/subastas"
                onClick={closeMenus}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-[#0b5ed7] transition-colors"
              >
                Subastas
              </Link>

              {user ? (
                <div className="relative" ref={accountRef}>
                  <button
                    type="button"
                    onClick={() => setAccountOpen((o) => !o)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <span className="w-8 h-8 rounded-full bg-[#0b5ed7] flex items-center justify-center text-white text-xs font-semibold">
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                    Cuenta
                  </button>
                  {accountOpen && (
                    <div className="absolute right-0 top-full mt-1 py-1 w-48 bg-white rounded-xl border border-slate-200 shadow-lg">
                      <Link
                        to="/perfil"
                        onClick={closeMenus}
                        className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Mi perfil
                      </Link>
                      <Link
                        to="/reglamento"
                        onClick={closeMenus}
                        className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Reglamento
                      </Link>
                      {user.role === "ADMIN" && (
                        <Link
                          to="/admin"
                          onClick={closeMenus}
                          className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          Panel admin
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          closeMenus();
                        }}
                        className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    to="/ingresar"
                    onClick={closeMenus}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-[#0b5ed7] transition-colors"
                  >
                    Ingresar
                  </Link>
                  <Link
                    to="/registrarse"
                    onClick={closeMenus}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#0b5ed7] hover:bg-[#0952c2] transition-colors"
                  >
                    Registrarse
                  </Link>
                </>
              )}
            </nav>

            {/* Mobile: menú hamburguesa */}
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="md:hidden flex flex-col gap-1.5 p-2 -mr-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              <span
                className={`block h-0.5 w-6 bg-current rounded-full transition-transform ${menuOpen ? "rotate-45 translate-y-2" : ""}`}
              />
              <span
                className={`block h-0.5 w-6 bg-current rounded-full transition-opacity ${menuOpen ? "opacity-0" : ""}`}
              />
              <span
                className={`block h-0.5 w-6 bg-current rounded-full transition-transform ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <nav className="px-4 py-4 flex flex-col gap-1">
              <Link
                to="/"
                onClick={closeMenus}
                className="py-3 text-slate-700 font-medium"
              >
                Inicio
              </Link>
              <Link
                to="/subastas"
                onClick={closeMenus}
                className="py-3 text-slate-700 font-medium"
              >
                Subastas
              </Link>
              <Link
                to="/reglamento"
                onClick={closeMenus}
                className="py-3 text-slate-700 font-medium"
              >
                Reglamento
              </Link>
              {user ? (
                <>
                  <Link
                    to="/perfil"
                    onClick={closeMenus}
                    className="py-3 text-slate-700 font-medium"
                  >
                    Mi perfil
                  </Link>
                  {user.role === "ADMIN" && (
                    <Link
                      to="/admin"
                      onClick={closeMenus}
                      className="py-3 text-slate-700 font-medium"
                    >
                      Panel admin
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      closeMenus();
                    }}
                    className="py-3 text-left text-red-600 font-medium"
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/ingresar"
                    onClick={closeMenus}
                    className="py-3 text-slate-700 font-medium"
                  >
                    Ingresar
                  </Link>
                  <Link
                    to="/registrarse"
                    onClick={closeMenus}
                    className="py-3 text-[#0b5ed7] font-semibold"
                  >
                    Registrarse
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 w-full min-w-0 px-4 sm:px-6 lg:px-8 pt-6 md:pt-8">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
