import { useCallback, useMemo, useReducer, type ReactNode } from "react";
import type { Product } from "../../types/product.types";
import { CartContext } from "./CartContext";
import { cartReducer, initialCartState } from "./cartReducer";

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);

  // Funciones de alto nivel: construyen la Action y hacen dispatch.
  const addItem = useCallback((product: Product, quantity?: number) => {
    dispatch({ type: "ADD_ITEM", payload: { product, quantity } });
  }, []);

  const removeItem = useCallback((productId: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: { productId } });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { productId, quantity } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR_CART" });
  }, []);

  const value = useMemo(() => {
    const totalItems = state.items.reduce((acc, item) => acc + item.quantity, 0);
    const totalPrice = state.items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    );
    return {
      items: state.items,
      totalItems,
      totalPrice,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    };
  }, [state.items, addItem, removeItem, updateQuantity, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
