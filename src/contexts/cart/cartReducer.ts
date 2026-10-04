import type { CartAction, CartState } from "./cart.types";

export const initialCartState: CartState = { items: [] };

// Función pura: (state, action) → newState. Nunca muta el estado anterior.
export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const { product, quantity = 1 } = action.payload;
      const existing = state.items.find((item) => item.productId === product.id);

      if (existing) {
        return {
          items: state.items.map((item) =>
            item.productId === product.id
              ? { ...item, quantity: Math.min(item.quantity + quantity, item.stock) }
              : item,
          ),
        };
      }

      if (product.stock <= 0) return state;

      return {
        items: [
          ...state.items,
          {
            productId: product.id,
            name: product.name,
            image: product.image,
            price: product.price,
            stock: product.stock,
            quantity: Math.min(quantity, product.stock),
          },
        ],
      };
    }

    case "REMOVE_ITEM":
      return {
        items: state.items.filter(
          (item) => item.productId !== action.payload.productId,
        ),
      };

    case "UPDATE_QUANTITY": {
      const { productId, quantity } = action.payload;

      // Cantidad 0 (o menor) equivale a quitar el producto.
      if (quantity <= 0) {
        return { items: state.items.filter((item) => item.productId !== productId) };
      }

      return {
        items: state.items.map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.min(quantity, item.stock) }
            : item,
        ),
      };
    }

    case "CLEAR_CART":
      return initialCartState;

    default:
      return state;
  }
}
