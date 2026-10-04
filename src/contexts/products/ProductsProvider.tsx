import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useDebounce } from "../../hooks/useDebounce";
import { listProducts } from "../../services/products.service";
import { ProductsContext } from "./ProductsContext";
import type { ProductsState } from "./ProductsContext.types";

const PAGE_SIZE = 20;

const initialState: ProductsState = {
  products: [],

  // Estados de la consulta:
  isLoading: false,
  error: null,

  // Paginación:
  cursor: null,
  hasNextPage: true,
  isLoadingMore: false,

  // Filtros:
  searchText: "",
  categoryId: "",
};

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProductsState>(initialState);

  // Identifica la última consulta: si el usuario cambia de filtro mientras
  // hay una consulta en curso, la respuesta vieja se descarta.
  const lastRequestId = useRef(0);

  const debouncedSearch = useDebounce(state.searchText, 400);
  const searchPrefix =
    debouncedSearch.trim().length >= 2
      ? debouncedSearch.trim().toLowerCase()
      : undefined;

  const loadProducts = useCallback(
    async ({ reset = false }: { reset?: boolean } = {}) => {
      const isFirstPage = reset || state.cursor === null;

      // "Cargar más" no debe duplicar consultas ni pedir más allá del final.
      if (
        !isFirstPage &&
        (state.isLoading || state.isLoadingMore || !state.hasNextPage)
      ) {
        return;
      }

      const requestId = ++lastRequestId.current;
      const cursor = isFirstPage ? null : state.cursor;

      setState((prev) => ({
        ...prev,
        ...(isFirstPage
          ? { products: [], cursor: null, hasNextPage: true, isLoading: true }
          : { isLoadingMore: true }),
        error: null,
      }));

      try {
        const { items, lastDoc } = await listProducts({
          categoryId: state.categoryId || null,
          searchPrefix,
          pageSize: PAGE_SIZE,
          cursor,
        });
        if (requestId !== lastRequestId.current) return;

        setState((prev) => ({
          ...prev,
          products: isFirstPage ? items : [...prev.products, ...items],
          cursor: lastDoc,
          hasNextPage: items.length === PAGE_SIZE,
          isLoading: false,
          isLoadingMore: false,
        }));
      } catch (error) {
        if (requestId !== lastRequestId.current) return;

        setState((prev) => ({
          ...prev,
          isLoading: false,
          isLoadingMore: false,
          error: error instanceof Error ? error.message : "Error desconocido",
        }));
      }
    },
    [
      searchPrefix,
      state.categoryId,
      state.cursor,
      state.hasNextPage,
      state.isLoading,
      state.isLoadingMore,
    ],
  );

  // Carga inicial y cada cambio de filtro.
  // (loadProducts no va en las dependencias: cambia con el estado y provocaría un bucle).
  useEffect(() => {
    void loadProducts({ reset: true });
  }, [searchPrefix, state.categoryId]); // eslint-disable-line react-hooks/exhaustive-deps

  const setSearchText = useCallback((value: string) => {
    setState((prev) => ({ ...prev, searchText: value }));
  }, []);

  const setCategoryId = useCallback((value: string) => {
    setState((prev) => ({ ...prev, categoryId: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setState((prev) => ({ ...prev, searchText: "", categoryId: "" }));
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      loadProducts,
      resetFilters,
      setSearchText,
      setCategoryId,
    }),
    [state, loadProducts, resetFilters, setSearchText, setCategoryId],
  );

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
}
