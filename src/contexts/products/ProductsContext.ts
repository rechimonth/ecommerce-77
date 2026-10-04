import { createContext } from "react";
import type { ProductsContextValue } from "./ProductsContext.types";

export const ProductsContext = createContext<ProductsContextValue | null>(null);
