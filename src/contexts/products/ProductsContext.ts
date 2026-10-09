import { createContext } from "react";
import type { ProductsContextValue } from "./ProductsContext.types";

// Contrato tipado que comparte los filtros, resultados, estado de carga y acciones del catálogo.
export const ProductsContext = createContext<ProductsContextValue | null>(null);
