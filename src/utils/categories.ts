import type { CategoryId } from "../types/product.types";

// Lo ideal sería tener una Colección de Categorías en Firestore.
export const CATEGORIES: { id: "" | CategoryId; label: string }[] = [
  { id: "", label: "Todas" },
  { id: "clothing", label: "Ropa" },
  { id: "shoes", label: "Calzado" },
  { id: "accessories", label: "Accesorios" },
];
