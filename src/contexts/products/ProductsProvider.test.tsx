import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Product } from "../../types/product.types";

const services = vi.hoisted(() => ({ listProducts: vi.fn() }));
vi.mock("../../services/products.service", () => ({ listProducts: services.listProducts }));
vi.mock("../../hooks/useDebounce", () => ({ useDebounce: (value: string) => value }));

import { ProductsProvider } from "./ProductsProvider";
import { useProducts } from "./useProducts";

const product = (index: number): Product => ({
  id: "p" + index,
  name: "Producto " + index,
  nameLower: ("producto " + index).toLowerCase(),
  image: "https://example.test/product.jpg",
  description: "Descripción de prueba",
  price: 10 + index,
  stock: 5,
  categoryId: index % 2 ? "shoes" : "clothing",
});
const wrapper = ({ children }: PropsWithChildren) => <ProductsProvider>{children}</ProductsProvider>;

describe("ProductsProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("carga el primer lote y calcula si existe una página siguiente", async () => {
    const items = Array.from({ length: 20 }, (_, index) => product(index));
    const cursor = { id: "cursor-20" };
    services.listProducts.mockResolvedValue({ items, lastDoc: cursor });

    const { result } = renderHook(() => useProducts(), { wrapper });

    await waitFor(() => expect(result.current.products).toHaveLength(20));
    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(services.listProducts).toHaveBeenCalledWith({
      categoryId: null,
      searchPrefix: undefined,
      pageSize: 20,
      cursor: null,
    });
  });

  it("agrega el siguiente lote usando el cursor anterior sin borrar los productos ya cargados", async () => {
    const firstPage = Array.from({ length: 20 }, (_, index) => product(index));
    const firstCursor = { id: "cursor-20" };
    const secondCursor = { id: "cursor-23" };
    services.listProducts
      .mockResolvedValueOnce({ items: firstPage, lastDoc: firstCursor })
      .mockResolvedValueOnce({ items: [product(20), product(21), product(22)], lastDoc: secondCursor });

    const { result } = renderHook(() => useProducts(), { wrapper });
    await waitFor(() => expect(result.current.products).toHaveLength(20));

    await act(async () => { await result.current.loadProducts(); });

    expect(result.current.products).toHaveLength(23);
    expect(result.current.products[20].id).toBe("p20");
    expect(result.current.cursor).toBe(secondCursor);
    expect(result.current.hasNextPage).toBe(false);
    expect(services.listProducts).toHaveBeenLastCalledWith(expect.objectContaining({ cursor: firstCursor }));
  });

  it("reinicia la consulta cuando cambia la categoría y normaliza el texto de búsqueda", async () => {
    services.listProducts.mockResolvedValue({ items: [product(1)], lastDoc: null });
    const { result } = renderHook(() => useProducts(), { wrapper });
    await waitFor(() => expect(services.listProducts).toHaveBeenCalledTimes(1));

    act(() => result.current.setCategoryId("shoes"));
    await waitFor(() => expect(services.listProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({ categoryId: "shoes" }),
    ));

    act(() => result.current.setSearchText("  BOOTs "));
    await waitFor(() => expect(services.listProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({ categoryId: "shoes", searchPrefix: "boots", cursor: null }),
    ));
    expect(result.current.searchText).toBe("  BOOTs ");
  });

  it("permite reiniciar la primera página y restablecer filtros", async () => {
    services.listProducts.mockResolvedValue({ items: [product(1)], lastDoc: null });
    const { result } = renderHook(() => useProducts(), { wrapper });
    await waitFor(() => expect(services.listProducts).toHaveBeenCalledTimes(1));
    act(() => result.current.setCategoryId("shoes"));
    await waitFor(() => expect(services.listProducts).toHaveBeenCalledTimes(2));

    act(() => result.current.resetFilters());
    await waitFor(() => expect(result.current.categoryId).toBe(""));
    await waitFor(() => expect(services.listProducts).toHaveBeenCalledTimes(3));
    expect(result.current.searchText).toBe("");
  });

  it("expone el mensaje de error y restablece los indicadores de carga", async () => {
    services.listProducts.mockRejectedValue(new Error("Firestore no disponible"));
    const { result } = renderHook(() => useProducts(), { wrapper });

    await waitFor(() => expect(result.current.error).toBe("Firestore no disponible"));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isLoadingMore).toBe(false);
  });

  it("ignora una respuesta antigua cuando el usuario cambia el filtro durante una consulta", async () => {
    let resolveFirst!: (value: { items: Product[]; lastDoc: null }) => void;
    const slowFirstPage = new Promise<{ items: Product[]; lastDoc: null }>((resolve) => { resolveFirst = resolve; });
    services.listProducts
      .mockReturnValueOnce(slowFirstPage)
      .mockResolvedValueOnce({ items: [product(99)], lastDoc: null });

    const { result } = renderHook(() => useProducts(), { wrapper });
    await waitFor(() => expect(services.listProducts).toHaveBeenCalledTimes(1));

    act(() => result.current.setCategoryId("shoes"));
    await waitFor(() => expect(result.current.products.map((item) => item.id)).toEqual(["p99"]));

    await act(async () => { resolveFirst({ items: [product(1)], lastDoc: null }); });
    expect(result.current.products.map((item) => item.id)).toEqual(["p99"]);
  });
});
