import type { CartItem, CartState } from "../../types/cart.types";
import { calculateTotal } from "./cartReducer";

// Une el carrito invitado y el de Firestore sin volver a sumar una copia antigua del mismo artículo.
export function mergeCartStates(local: CartState, cloud: CartState | null): CartState {
  if (!cloud) return { items: local.items, total: calculateTotal(local.items) };

  const merged = new Map<string, CartItem>();
  for (const item of cloud.items) merged.set(item.product.id, item);

  for (const item of local.items) {
    const saved = merged.get(item.product.id);
    if (!saved) {
      merged.set(item.product.id, item);
    } else if (item.quantity > saved.quantity) {
      merged.set(item.product.id, item);
    }
  }

  const items = Array.from(merged.values());
  return { items, total: calculateTotal(items) };
}
