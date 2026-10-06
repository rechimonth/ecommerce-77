import type { CartItem, CartState } from "../../types/cart.types";
import type { Product } from "../../types/product.types";
import { calculateTotal, initialCartState } from "./cartReducer";

export const CART_STORAGE_KEY = "cart";

// Forma del item cuando viene de localStorage: JSON convierte los Date en string.
type StoredItem = {
  product: Omit<Product, "createdAt" | "updatedAt"> & {
    createdAt?: string;
    updatedAt?: string;
  };
  quantity: number;
  addedAt: string;
};

// No se confía ciegamente en localStorage: puede tener datos viejos o corruptos.
function isStoredItem(value: unknown): value is StoredItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Partial<StoredItem>;
  return (
    typeof item.quantity === "number" &&
    item.quantity > 0 &&
    typeof item.product === "object" &&
    item.product !== null &&
    typeof item.product.id === "string" &&
    typeof item.product.price === "number"
  );
}

function reviveDate(value: string | undefined): Date | undefined {
  return value ? new Date(value) : undefined;
}

// Se usa como inicializador "lazy" de useReducer: se ejecuta una sola vez al montar.
export function loadCartFromStorage(): CartState {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) return initialCartState;

    const parsed: unknown = JSON.parse(stored);
    const rawItems =
      typeof parsed === "object" &&
      parsed !== null &&
      Array.isArray((parsed as { items?: unknown }).items)
        ? (parsed as { items: unknown[] }).items
        : [];

    const items: CartItem[] = rawItems.filter(isStoredItem).map((item) => ({
      product: {
        ...item.product,
        createdAt: reviveDate(item.product.createdAt),
        updatedAt: reviveDate(item.product.updatedAt),
      },
      quantity: item.quantity,
      addedAt: new Date(item.addedAt), // string -> Date
    }));

    // El total guardado no se usa: se recalcula desde los items.
    return { items, total: calculateTotal(items) };
  } catch {
    return initialCartState;
  }
}

export function saveCartToStorage(state: CartState): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Almacenamiento lleno o bloqueado (modo privado): el carrito sigue
    // funcionando en memoria, solo que no se persiste.
  }
}
