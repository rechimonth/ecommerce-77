import { useContext } from "react";
import { CartContext } from "../contexts/cart/CartContext";
import type { CartContextValue } from "../types/cart.types";

// API pública del carrito: los componentes usan este hook, nunca CartContext.
export function useCart(): CartContextValue {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart debe usarse dentro de CartProvider");
  }

  return context;
}
