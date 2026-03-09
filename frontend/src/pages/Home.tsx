import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/services/api";
import AuctionCard from "@/components/AuctionCard";

const steps = [
  {
    title: "Registrate",
    description:
      "Completá el formulario con tus datos en el botón Registrarse para crear tu cuenta.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
        />
      </svg>
    ),
  },
  {
    title: "Solicitá crédito",
    description:
      "Enviá un WhatsApp para realizar una transferencia bancaria y obtener crédito para pujar.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
        />
      </svg>
    ),
  },
  {
    title: "Explorá el catálogo",
    description:
      "Una semana antes de cada subasta publicamos fotos y videos de los lotes. 30 min antes podés interactuar con el martillero.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    title: "Pujá en vivo",
    description:
      "Participá de la subasta online en tiempo real. El valor final es tu mejor postura más el 10% de comisión.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
];

const benefits = [
  "Remates 100% online, desde tu casa o celular.",
  "Catálogo con fotos y videos una semana antes.",
  "Interacción con el martillero 30 minutos antes de cada subasta.",
  "Crédito seguro: si no adquirís ningún lote, se devuelve la seña o queda para otra subasta.",
];

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm animate-pulse">
      <div className="aspect-[4/3] bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="h-6 bg-slate-200 rounded w-1/3" />
      </div>
    </div>
  );
}

function EmptyStateSubastas() {
  const user = useAuthStore((s) => s.user);
  return (
    <div className="text-center py-12 px-6 rounded-2xl bg-slate-50 border border-slate-200 border-dashed">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-slate-400 mb-4">
        <svg
          className="w-7 h-7"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-800">
        Próximamente más subastas
      </h3>
      <p className="text-slate-500 mt-1 max-w-sm mx-auto">
        {user
          ? "Estamos preparando nuevas subastas. Te avisaremos cuando haya lotes disponibles."
          : "Estamos preparando nuevas subastas. Registrate ahora y te avisamos cuando haya lotes disponibles."}
      </p>
      {!user && (
        <Link
          to="/registrarse"
          className="inline-flex items-center justify-center mt-6 px-6 py-3 rounded-full text-sm font-semibold text-white bg-[#0b5ed7] hover:bg-[#0952c2] shadow-lg shadow-[#0b5ed7]/20 transition-all duration-200"
        >
          Quiero registrarme
        </Link>
      )}
    </div>
  );
}

export default function Home() {
  const user = useAuthStore((s) => s.user);
  const { data: auctions, isLoading } = useQuery({
    queryKey: ["auctions", "ACTIVE", ""],
    queryFn: () =>
      api.auctions.list({ status: "ACTIVE", categoryId: undefined }),
  });

  const activeAuctions = (auctions as any[])?.slice(0, 3) ?? [];

  return (
    <div className="overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 -mt-6 md:-mt-8">
      {/* Hero - pegado al nav, fondo hasta los bordes */}
      <section className="relative w-full pt-6 pb-14 md:pt-10 md:pb-20 bg-gradient-to-b from-slate-50/80 via-white to-transparent">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(11,94,215,0.08),transparent)] pointer-events-none" />
        <div className="relative w-full max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 tracking-tight animate-[fadeInUp_0.6s_ease-out]">
            Remates online{" "}
            <span className="text-[#0b5ed7]">en tiempo real</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto animate-[fadeInUp_0.6s_ease-out_0.1s_both]">
            Participá de las subastas de Tinban desde tu celular o computadora.
            Registrate, solicitá crédito y pujá de forma segura.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center animate-[fadeInUp_0.6s_ease-out_0.2s_both]">
            {!user && (
              <Link
                to="/registrarse"
                className="inline-flex items-center justify-center px-8 py-4 rounded-full text-base font-semibold text-white bg-[#0b5ed7] hover:bg-[#0952c2] shadow-xl shadow-[#0b5ed7]/25 hover:shadow-[#0b5ed7]/35 hover:-translate-y-0.5 transition-all duration-200"
              >
                Registrarme para participar
              </Link>
            )}
            <Link
              to="/subastas"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full text-base font-semibold text-slate-700 bg-white border-2 border-slate-200 hover:border-[#0b5ed7] hover:text-[#0b5ed7] transition-all duration-200"
            >
              Ver catálogo de subastas
            </Link>
          </div>
        </div>
      </section>

      {/* Cómo participar - sección ancha, contenido distribuido */}
      <section className="w-full py-16 md:py-24 bg-white">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-20">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center">
            Cómo participar
          </h2>
          <p className="mt-3 text-slate-600 text-center max-w-2xl mx-auto">
            Cuatro pasos simples para sumarte a nuestras subastas online.
          </p>
          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10 xl:gap-12">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="relative text-center md:text-left"
                style={{ animation: `fadeInUp 0.5s ease-out ${i * 0.1}s both` }}
              >
                <div className="inline-flex md:flex items-center justify-center h-14 w-14 rounded-2xl bg-[#0b5ed7]/10 text-[#0b5ed7]">
                  {step.icon}
                </div>
                <div className="mt-4">
                  <span className="text-xs font-semibold text-[#0b5ed7] uppercase tracking-wider">
                    Paso {i + 1}
                  </span>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios - fondo suave de borde a borde */}
      <section className="w-full py-16 md:py-24 bg-slate-50/90">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-20">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center">
            Por qué Tinban Remates
          </h2>
          <p className="mt-3 text-slate-600 text-center max-w-2xl mx-auto">
            Transparencia, seguridad y comodidad en cada subasta.
          </p>
          <ul className="mt-12 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {benefits.map((benefit, i) => (
              <li
                key={i}
                className="flex items-start gap-3 p-5 rounded-2xl bg-white/80 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-[#0b5ed7]/20 transition-all duration-200"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0b5ed7] text-white text-xs font-bold">
                  ✓
                </span>
                <span className="text-slate-700 text-sm font-medium">
                  {benefit}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Subastas en curso - integrado al flujo */}
      <section className="w-full py-16 md:py-24 bg-white">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-20">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                Subastas en curso
              </h2>
              <p className="mt-2 text-slate-600">
                Explorá los lotes disponibles y participá en tiempo real.
              </p>
            </div>
            <Link
              to="/subastas"
              className="inline-flex items-center text-[#0b5ed7] font-semibold hover:underline shrink-0"
            >
              Ver todas
              <svg
                className="ml-1 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>

          {isLoading ? (
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : activeAuctions.length > 0 ? (
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeAuctions.map((auction: any) => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>
          ) : (
            <div className="mt-10">
              <EmptyStateSubastas />
            </div>
          )}
        </div>
      </section>

      {/* CTA final - banda full width, cercana al footer */}
      <section className="w-full pt-16 pb-20 md:pt-20 md:pb-24 bg-gradient-to-br from-[#0b5ed7] via-[#0a56c9] to-[#0746ad]">
        <div className="w-full max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            ¿Listo para formar parte?
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Creá tu cuenta en un minuto y solicitá crédito por WhatsApp. Sin
            compromiso.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            {!user && (
              <Link
                to="/registrarse"
                className="inline-flex items-center justify-center px-8 py-4 rounded-full text-base font-semibold text-[#0b5ed7] bg-white hover:bg-blue-50 shadow-xl transition-all duration-200 hover:-translate-y-0.5"
              >
                Registrarme ahora
              </Link>
            )}
            <Link
              to="/reglamento"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full text-base font-semibold text-white border-2 border-white/80 hover:bg-white/10 transition-all duration-200"
            >
              Ver reglamento
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
