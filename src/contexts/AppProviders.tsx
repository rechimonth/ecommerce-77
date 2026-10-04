import type { ReactNode } from "react";
import { CartProvider } from "./cart";
import { ProductsProvider } from "./products";

// Centraliza todos los Providers para no anidarlos en main.tsx.
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ProductsProvider>
      <CartProvider>{children}</CartProvider>
    </ProductsProvider>
  );
}
