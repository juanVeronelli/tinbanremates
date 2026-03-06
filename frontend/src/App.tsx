import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import { api } from "./services/api";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Subastas from "./pages/Subastas";
import AuctionDetail from "./pages/AuctionDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import Reglamento from "./pages/Reglamento";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/ingresar" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/ingresar" replace />;
  if (user?.role !== "ADMIN") return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AuthSync() {
  const token = useAuthStore((s) => s.token);
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (!token) return;
    api.auth
      .profile()
      .then((profile: any) => {
        setUser({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role as "USER" | "ADMIN",
          creditApproved: profile.creditApproved,
          creditBalance: profile.creditBalance,
        });
      })
      .catch(() => {
        // Token inválido o expirado: limpiar sesión
        useAuthStore.getState().logout();
      });
  }, [token, setUser]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthSync />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="subastas" element={<Subastas />} />
          <Route path="subasta/:id" element={<AuctionDetail />} />
          <Route path="ingresar" element={<Login />} />
          <Route path="registrarse" element={<Register />} />
          <Route path="perfil" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="admin/*" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="reglamento" element={<Reglamento />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
