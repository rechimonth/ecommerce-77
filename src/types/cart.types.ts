import type { Product } from "./product.types";

export type CartItem = {
  product: Product;
  quantity: number;
  addedAt: Date;
};

export type CartState = {
  items: CartItem[];
  total: number;
};

// Discriminated union: "type" permite a TypeScript inferir el tipo de "payload".
export type CartAction =
  | { type: "ADD_ITEM"; payload: Product }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { productId: string; quantity: number } }
  | { type: "CLEAR_CART" };

export type CartContextValue = {
  items: CartItem[];
  total: number;
  itemCount: number;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
};
