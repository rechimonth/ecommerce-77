import type { CartAction, CartItem, CartState } from "../../types/cart.types";

export const initialCartState: CartState = { items: [], total: 0 };

// El total siempre se deriva de los items; nunca se acumula sobre un total anterior.
export function calculateTotal(items: CartItem[]): number {
  const sum = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  return Math.round(sum * 100) / 100;
}

function withTotal(items: CartItem[]): CartState {
  return { items, total: calculateTotal(items) };
}

// Reducer puro: solo usa estado y acción. El mismo input siempre produce el mismo output.
export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const { product, addedAt } = action.payload;
      const exists = state.items.some((item) => item.product.id === product.id);
      if (exists) {
        return withTotal(state.items.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        ));
      }
      return withTotal([...state.items, { product, quantity: 1, addedAt }]);
    }
    case "REMOVE_ITEM":
      return withTotal(state.items.filter((item) => item.product.id !== action.payload));
    case "UPDATE_QUANTITY": {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) return withTotal(state.items.filter((item) => item.product.id !== productId));
      return withTotal(state.items.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item,
      ));
    }
    case "HYDRATE_CART":
      return withTotal(action.payload);
    case "CLEAR_CART":
      return initialCartState;
    default:
      return state;
  }
}
