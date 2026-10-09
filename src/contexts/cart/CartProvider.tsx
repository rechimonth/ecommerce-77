import { useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import type { CartContextValue, CartState } from "../../types/cart.types";
import type { Product } from "../../types/product.types";
import { AuthContext } from "../auth/AuthContext";
import { getUserCart, saveUserCart } from "../../services/cart.service";
import { CartContext } from "./CartContext";
import { mergeCartStates } from "./cartMerge";
import { cartReducer, initialCartState } from "./cartReducer";
import { loadCartFromStorage, saveCartToStorage } from "./cartStorage";

// Invitados usan almacenamiento local; los clientes autenticados sincronizan carts/{uid} en Firestore.
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, loadCartFromStorage);
  const auth = useContext(AuthContext);
  const userId = auth?.user?.uid ?? null;
  const authLoading = auth?.isLoading ?? false;
  const [remoteCartReadyFor, setRemoteCartReadyFor] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const activeUserIdRef = useRef<string | null>(null);
  const stateRef = useRef<CartState>(state);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const skipGuestSaveRef = useRef(false);
  stateRef.current = state;

  // Al iniciar/cambiar sesión, aislamos cuentas y cargamos primero el carrito remoto.
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    const previousUserId = activeUserIdRef.current;

    if (!userId) {
      if (previousUserId) {
        // Nunca copiamos el carrito privado de una sesión a la bolsa de un usuario invitado.
        skipGuestSaveRef.current = true;
        dispatch({ type: "CLEAR_CART" });
        saveCartToStorage(initialCartState);
      }
      activeUserIdRef.current = null;
      setRemoteCartReadyFor(null);
      setSyncError(null);
      return () => { cancelled = true; };
    }

    const switchedAccounts = previousUserId !== null && previousUserId !== userId;
    if (switchedAccounts) {
      dispatch({ type: "CLEAR_CART" });
      saveCartToStorage(initialCartState);
    }
    activeUserIdRef.current = userId;
    setRemoteCartReadyFor(null);
    setSyncError(null);

    void (async () => {
      try {
        const cloudCart = await getUserCart(userId);
        if (cancelled || activeUserIdRef.current !== userId) return;
        const localCart = switchedAccounts ? initialCartState : stateRef.current;
        const merged = mergeCartStates(localCart, cloudCart);
        await saveUserCart(userId, merged);
        if (cancelled || activeUserIdRef.current !== userId) return;

        dispatch({ type: "HYDRATE_CART", payload: merged.items });
        saveCartToStorage(initialCartState);
        setRemoteCartReadyFor(userId);
      } catch {
        if (!cancelled && activeUserIdRef.current === userId) {
          setSyncError("No pudimos sincronizar el carrito con Firestore. Los cambios de esta sesión siguen en pantalla, pero todavía no están guardados en la nube.");
        }
      }
    })();

    return () => { cancelled = true; };
  }, [authLoading, userId]);

  // Sin sesión, persistimos en localStorage. Con sesión, solo escribimos después de hidratar la nube.
  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      if (skipGuestSaveRef.current) {
        skipGuestSaveRef.current = false;
        return;
      }
      saveCartToStorage(state);
      return;
    }
    if (remoteCartReadyFor !== userId) return;

    const snapshot: CartState = { items: state.items, total: state.total };
    const queued = saveQueueRef.current.catch(() => undefined).then(() => saveUserCart(userId, snapshot));
    saveQueueRef.current = queued.then(() => undefined).catch(() => {
      if (activeUserIdRef.current === userId) {
        setSyncError("No pudimos guardar los últimos cambios del carrito en Firestore. Están visibles en esta sesión, pero no se confirmó su persistencia.");
      }
    });
    void saveQueueRef.current;
  }, [state, authLoading, userId, remoteCartReadyFor]);

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
    items: state.items,
    total: state.total,
    itemCount,
    syncError,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  }), [state.items, state.total, itemCount, syncError, addItem, removeItem, updateQuantity, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
