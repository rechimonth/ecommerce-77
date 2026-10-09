import type { ReactNode } from "react";
import { AuthProvider } from "./auth/AuthProvider";
import { CartProvider } from "./cart";
import { ProductsProvider } from "./products";

// Centraliza providers en un orden explícito y evita anidarlos en main.tsx.
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ProductsProvider>
        <CartProvider>{children}</CartProvider>
      </ProductsProvider>
    </AuthProvider>
  );
}
