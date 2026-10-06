import type { CartAction, CartItem, CartState } from "../../types/cart.types";

export const initialCartState: CartState = { items: [], total: 0 };

// El total siempre se DERIVA de los items (fuente de verdad), nunca se acumula.
// Se redondea a 2 decimales: 10.1 + 20.2 en JS da 30.299999999999997.
export function calculateTotal(items: CartItem[]): number {
  const sum = items.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0,
  );
  return Math.round(sum * 100) / 100;
}

function withTotal(items: CartItem[]): CartState {
  return { items, total: calculateTotal(items) };
}

// Función pura: mismo estado + misma acción => mismo resultado. Nunca muta "state".
// La validación de stock vive en la UI (AddToCartButton / CartItemRow),
// no se repite acá: la regla debe tener una sola fuente de verdad.
export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const product = action.payload;
      const exists = state.items.some((item) => item.product.id === product.id);

      if (exists) {
        return withTotal(
          state.items.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        );
      }

      return withTotal([
        ...state.items,
        { product, quantity: 1, addedAt: new Date() },
      ]);
    }

    case "REMOVE_ITEM":
      return withTotal(
        state.items.filter((item) => item.product.id !== action.payload),
      );

    case "UPDATE_QUANTITY": {
      const { productId, quantity } = action.payload;

      // Cantidad 0 (o negativa) equivale a quitar el item.
      if (quantity <= 0) {
        return withTotal(
          state.items.filter((item) => item.product.id !== productId),
        );
      }

      return withTotal(
        state.items.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item,
        ),
      );
    }

    case "CLEAR_CART":
      return initialCartState;

    default:
      return state;
  }
}
