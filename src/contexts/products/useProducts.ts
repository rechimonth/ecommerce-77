import { useContext } from "react";
import { ProductsContext } from "./ProductsContext";

// Hook público del catálogo; da un error comprensible si falta el Provider en el árbol de React.
export function useProducts() {
  const context = useContext(ProductsContext);
  if (!context) throw new Error("useProducts debe usarse dentro de <ProductsProvider>");
  return context;
}
