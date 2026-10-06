import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { CartContextValue } from "../../types/cart.types";
import type { Product } from "../../types/product.types";
import { CartContext } from "./CartContext";
import { cartReducer } from "./cartReducer";
import { loadCartFromStorage, saveCartToStorage } from "./cartStorage";

export function CartProvider({ children }: { children: ReactNode }) {
  // Tercer argumento: inicialización lazy (lee localStorage una sola vez).
  const [state, dispatch] = useReducer(
    cartReducer,
    undefined,
    loadCartFromStorage,
  );

  // Cada cambio del estado guarda una copia serializada.
  useEffect(() => {
    saveCartToStorage(state);
  }, [state]);

  // Se exponen funciones nombradas, no "dispatch": los componentes no
  // necesitan conocer la forma de las acciones.
  const addItem = useCallback((product: Product) => {
    dispatch({ type: "ADD_ITEM", payload: product });
  }, []);

  const removeItem = useCallback((productId: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: productId });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { productId, quantity } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR_CART" });
  }, []);

  const itemCount = useMemo(
    () => state.items.reduce((sum, item) => sum + item.quantity, 0),
    [state.items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items: state.items,
      total: state.total,
      itemCount,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }),
    [state.items, state.total, itemCount, addItem, removeItem, updateQuantity, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
