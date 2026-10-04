import { createContext } from "react";
import type { CartContextValue } from "./cart.types";

export const CartContext = createContext<CartContextValue | null>(null);
