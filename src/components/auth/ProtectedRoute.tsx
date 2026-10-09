import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { LoadingState } from "../states/LoadingState";

// Protege tanto rutas que requieren iniciar sesión como las exclusivas de administración.
export function ProtectedRoute({ children, requireAdmin = false }: {
  children: ReactNode;
  requireAdmin?: boolean;
}) {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingState message="Verificando tu sesión…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!profile) {
    return <p role="alert" className="rounded border border-red-200 p-4 text-sm text-red-800">
      No pudimos verificar tu perfil. Cerrá sesión y volvé a ingresar.
    </p>;
  }
  if (requireAdmin && profile.role !== "admin") {
    return <Navigate to="/products" replace />;
  }
  return children;
}
