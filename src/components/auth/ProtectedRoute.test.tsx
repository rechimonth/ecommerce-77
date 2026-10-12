import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../../hooks/useAuth";
import type { AuthContextValue } from "../../types/user.types";
import { ProtectedRoute } from "./ProtectedRoute";

vi.mock("../../hooks/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("../states/LoadingState", () => ({
  LoadingState: ({ message }: { message: string }) => <p role="status">{message}</p>,
}));

function LocationText() {
  const location = useLocation();
  return <p data-testid="location">{location.pathname}</p>;
}
function authValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: { uid: "customer-1" } as AuthContextValue["user"],
    profile: { uid: "customer-1", email: "customer@example.test", displayName: "Cliente", role: "customer" },
    isLoading: false,
    error: null,
    signInWithEmail: async () => undefined,
    registerWithEmail: async () => undefined,
    signInWithGoogle: async () => undefined,
    signOut: async () => undefined,
    clearAuthError: () => undefined,
    ...overrides,
  };
}
function renderProtected(value: AuthContextValue, requireAdmin = false) {
  vi.mocked(useAuth).mockReturnValue(value);
  return render(
    <MemoryRouter initialEntries={["/protected"]}>
      <Routes>
        <Route path="/login" element={<><h1>Login</h1><LocationText /></>} />
        <Route path="/products" element={<h1>Catálogo</h1>} />
        <Route path="/protected" element={<ProtectedRoute requireAdmin={requireAdmin}><h1>Contenido protegido</h1></ProtectedRoute>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => vi.clearAllMocks());

  it("muestra carga mientras se determina el estado de sesión", () => {
    renderProtected(authValue({ isLoading: true, user: null, profile: null }));
    expect(screen.getByRole("status")).toHaveTextContent("Verificando tu sesión…");
    expect(screen.queryByRole("heading", { name: "Contenido protegido" })).not.toBeInTheDocument();
  });

  it("redirige a login a un visitante sin sesión", () => {
    renderProtected(authValue({ user: null, profile: null }));
    expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/login");
  });

  it("falla cerrado si hay usuario pero no se puede verificar su perfil", () => {
    renderProtected(authValue({ profile: null }));
    expect(screen.getByRole("alert")).toHaveTextContent(/no pudimos verificar tu perfil/i);
    expect(screen.queryByRole("heading", { name: "Contenido protegido" })).not.toBeInTheDocument();
  });

  it("permite al cliente entrar en rutas que solo requieren sesión", () => {
    renderProtected(authValue(), false);
    expect(screen.getByRole("heading", { name: "Contenido protegido" })).toBeInTheDocument();
  });

  it("redirige a productos al cliente que intenta abrir una ruta admin", () => {
    renderProtected(authValue(), true);
    expect(screen.getByRole("heading", { name: "Catálogo" })).toBeInTheDocument();
  });

  it("permite al administrador abrir rutas admin", () => {
    renderProtected(authValue({
      profile: { uid: "admin-1", email: "admin@example.test", displayName: "Admin", role: "admin" },
    }), true);
    expect(screen.getByRole("heading", { name: "Contenido protegido" })).toBeInTheDocument();
  });
});
