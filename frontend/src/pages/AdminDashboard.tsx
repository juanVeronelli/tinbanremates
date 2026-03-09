import { Routes, Route, NavLink } from "react-router-dom";
import CreditRequestsSection from "@/components/AdminDashboard/CreditRequestsSection";
import AuctionsAdminSection from "@/components/AdminDashboard/AuctionsAdminSection";
import AttributeConfigSection from "@/components/AdminDashboard/AttributeConfigSection";
import CategoryConfigSection from "@/components/AdminDashboard/CategoryConfigSection";
import NewAuctionForm from "@/components/AdminDashboard/NewAuctionForm";
import EditAuctionForm from "@/components/AdminDashboard/EditAuctionForm";

const nav = [
  { to: "/admin", end: true, label: "Inicio" },
  { to: "/admin/credits", end: false, label: "Créditos" },
  { to: "/admin/auctions", end: false, label: "Subastas" },
  { to: "/admin/categories", end: false, label: "Categorías" },
  { to: "/admin/attributes", end: false, label: "Atributos" },
];

export default function AdminDashboard() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Panel de administración</h1>
      <nav className="flex gap-2 flex-wrap border-b border-slate-200 pb-3 mb-6">
        {nav.map(({ to, end, label }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-sm font-medium ${isActive ? "bg-[#e8f2fd] text-[#042e83]" : "text-slate-600 hover:bg-slate-100"}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <Routes>
        <Route
          index
          element={
            <div className="grid gap-8 md:grid-cols-2">
              <section className="bg-white rounded-xl border border-slate-200 p-4">
                <CreditRequestsSection />
              </section>
              <section className="bg-white rounded-xl border border-slate-200 p-4">
                <AuctionsAdminSection />
              </section>
            </div>
          }
        />
        <Route path="credits" element={
          <section className="bg-white rounded-xl border border-slate-200 p-4">
            <CreditRequestsSection />
          </section>
        } />
        <Route path="auctions" element={
          <section className="bg-white rounded-xl border border-slate-200 p-4">
            <AuctionsAdminSection />
          </section>
        } />
        <Route path="auctions/new" element={<NewAuctionForm />} />
        <Route path="auctions/:id/edit" element={<EditAuctionForm />} />
        <Route
          path="categories"
          element={
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <CategoryConfigSection />
            </section>
          }
        />
        <Route
          path="attributes"
          element={
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <AttributeConfigSection />
            </section>
          }
        />
      </Routes>
    </div>
  );
}
