import type { Product } from "../../types/product.types";

export type CartItem = {
  productId: string;
  name: string;
  image: string;
  price: number;
  stock: number;
  quantity: number;
};

export type CartState = {
  items: CartItem[];
};

export type CartAction =
  | { type: "ADD_ITEM"; payload: { product: Product; quantity?: number } }
  | { type: "REMOVE_ITEM"; payload: { productId: string } }
  | { type: "UPDATE_QUANTITY"; payload: { productId: string; quantity: number } }
  | { type: "CLEAR_CART" };

export type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
};
