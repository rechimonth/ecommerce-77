import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CartProvider } from "../contexts/cart";

type WrapperProps = { children: ReactNode };

// Wrapper compartido para pruebas de interfaz: router simulado y Context del carrito real.
export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, "wrapper"> & { route?: string }) {
  const { route = "/", ...renderOptions } = options ?? {};
  function Wrapper({ children }: WrapperProps) {
    return <MemoryRouter initialEntries={[route]}><CartProvider>{children}</CartProvider></MemoryRouter>;
  }
  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
