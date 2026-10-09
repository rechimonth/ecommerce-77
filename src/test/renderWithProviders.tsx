import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import type { User } from "firebase/auth";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../contexts/auth/AuthContext";
import { CartProvider } from "../contexts/cart";
import type { AuthContextValue } from "../types/user.types";

type WrapperProps = { children: ReactNode };

// Identidad simulada para probar páginas autenticadas sin conectar con Firebase.
const testUser = {
  uid: "customer-test",
  email: "cliente@example.test",
  displayName: "Cliente de prueba",
} as User;

// Providers por defecto; las pruebas pueden reemplazar la sesión con authValue.
export const defaultTestAuthValue: AuthContextValue = {
  user: testUser,
  profile: {
    uid: testUser.uid,
    email: testUser.email ?? "",
    displayName: testUser.displayName ?? "",
    role: "customer",
  },
  isLoading: false,
  error: null,
  signInWithEmail: async () => undefined,
  registerWithEmail: async () => undefined,
  signInWithGoogle: async () => undefined,
  signOut: async () => undefined,
  clearAuthError: () => undefined,
};

// Wrapper reutilizable para componentes que dependen de router, sesión y carrito.
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & {
    route?: string;
    authValue?: AuthContextValue;
  },
) {
  const { route = "/", authValue = defaultTestAuthValue, ...renderOptions } = options ?? {};
  function Wrapper({ children }: WrapperProps) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <AuthContext.Provider value={authValue}>
          <CartProvider>{children}</CartProvider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
  }
  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
