import { createContext } from "react";
import type { CartContextValue } from "../../types/cart.types";

export const CartContext = createContext<CartContextValue | null>(null);
