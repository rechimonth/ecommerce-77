import type { Product } from "./product.types";

export type CartItem = { product: Product; quantity: number; addedAt: Date };
export type CartState = { items: CartItem[]; total: number };

// El timestamp forma parte de la acción para que el reducer no consulte el reloj.
export type CartAction =
  | { type: "ADD_ITEM"; payload: { product: Product; addedAt: Date } }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { productId: string; quantity: number } }
  | { type: "HYDRATE_CART"; payload: CartItem[] }
  | { type: "CLEAR_CART" };

export type CartContextValue = {
  items: CartItem[];
  total: number;
  itemCount: number;
  syncError: string | null;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
};
