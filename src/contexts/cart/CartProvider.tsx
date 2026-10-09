import { useCallback, useEffect, useMemo, useReducer, type ReactNode } from "react";
import type { CartContextValue } from "../../types/cart.types";
import type { Product } from "../../types/product.types";
import { CartContext } from "./CartContext";
import { cartReducer } from "./cartReducer";
import { loadCartFromStorage, saveCartToStorage } from "./cartStorage";

// Proveedor global del carrito; persiste cada estado y presenta acciones fáciles de usar.
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, loadCartFromStorage);
  useEffect(() => { saveCartToStorage(state); }, [state]);

  const addItem = useCallback((product: Product) => {
    dispatch({ type: "ADD_ITEM", payload: { product, addedAt: new Date() } });
  }, []);
  const removeItem = useCallback((productId: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: productId });
  }, []);
  const updateQuantity = useCallback((productId: string, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { productId, quantity } });
  }, []);
  const clearCart = useCallback(() => { dispatch({ type: "CLEAR_CART" }); }, []);

  const itemCount = useMemo(() => state.items.reduce((sum, item) => sum + item.quantity, 0), [state.items]);
  const value = useMemo<CartContextValue>(() => ({
    items: state.items, total: state.total, itemCount, addItem, removeItem, updateQuantity, clearCart,
  }), [state.items, state.total, itemCount, addItem, removeItem, updateQuantity, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
