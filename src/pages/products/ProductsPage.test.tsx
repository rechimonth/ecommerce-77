import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductsPage } from "./ProductsPage";
import { useProducts } from "../../contexts/products";

vi.mock("../../contexts/products", () => ({ useProducts: vi.fn() }));
vi.mock("../../components/products/ProductFilters", () => ({
  ProductFilters: () => <div>Filtros de productos</div>,
}));
vi.mock("../../components/products/ProductGrid", () => ({
  ProductGrid: () => <div>Grilla de productos</div>,
}));
vi.mock("../../components/states/LoadingState", () => ({
  LoadingState: ({ message }: { message: string }) => <p role="status">{message}</p>,
}));

describe("ProductsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useProducts).mockReturnValue({
      products: [],
      isLoading: true,
      isLoadingMore: false,
      error: null,
      cursor: null,
      hasNextPage: false,
      searchText: "",
      categoryId: "",
      loadProducts: vi.fn(),
      setSearchText: vi.fn(),
      setCategoryId: vi.fn(),
      resetFilters: vi.fn(),
    });
  });

  it("renderiza el encabezado y el estado de carga del catálogo", () => {
    render(<MemoryRouter><ProductsPage /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Ropa de hombre" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Cargando productos de la colección");
  });
});
