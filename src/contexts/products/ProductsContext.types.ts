import type { DocumentSnapshot } from "firebase/firestore";
import type { Product } from "../../types/product.types";

export type ProductsState = {
  products: Product[];

  // Estados de la consulta:
  isLoading: boolean;
  error: string | null;

  // Paginación:
  cursor: DocumentSnapshot | null;
  hasNextPage: boolean;
  isLoadingMore: boolean;

  // Filtros:
  searchText: string;
  categoryId: string;
};

export type ProductsContextValue = ProductsState & {
  loadProducts: (options?: { reset?: boolean }) => Promise<void>;
  resetFilters: () => void;
  setSearchText: (value: string) => void;
  setCategoryId: (value: string) => void;
};
