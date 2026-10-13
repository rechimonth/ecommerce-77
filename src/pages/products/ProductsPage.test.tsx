import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Product } from "../../types/product.types";
import { ProductsPage } from "./ProductsPage";
import { useProducts } from "../../contexts/products";

vi.mock("../../contexts/products", () => ({ useProducts: vi.fn() }));
vi.mock("../../components/products/ProductFilters", () => ({
  ProductFilters: ({ onCategoryChange, onSearchChange }: {
    onCategoryChange: (value: string) => void;
    onSearchChange: (value: string) => void;
  }) => (
    <div>
      <button type="button" onClick={() => onCategoryChange("shoes")}>Filtrar calzado</button>
      <input aria-label="Filtro de prueba" onChange={(event) => onSearchChange(event.target.value)} />
    </div>
  ),
}));
vi.mock("../../components/products/ProductGrid", () => ({
  ProductGrid: ({ products }: { products: Product[] }) => (
    <div data-testid="product-grid">{products.map((product) => product.name).join(", ")}</div>
  ),
}));
vi.mock("../../components/states/LoadingState", () => ({
  LoadingState: ({ message }: { message: string }) => <p role="status">{message}</p>,
}));
vi.mock("../../components/states/ErrorState", () => ({
  ErrorState: ({ message, onRetry }: { message: string; onRetry: () => void }) => (
    <div role="alert"><p>{message}</p><button type="button" onClick={onRetry}>Reintentar</button></div>
  ),
}));
vi.mock("../../components/states/EmptyState", () => ({
  EmptyState: ({ title, description, action }: {
    title: string;
    description: string;
    action?: { label: string; onClick: () => void };
  }) => (
    <div><h2>{title}</h2><p>{description}</p>{action && <button type="button" onClick={action.onClick}>{action.label}</button>}</div>
  ),
}));

const product: Product = {
  id: "p1",
  name: "Botas Sierra",
  nameLower: "botas sierra",
  image: "https://example.test/boots.jpg",
  description: "Botas de prueba",
  price: 80,
  stock: 4,
  categoryId: "shoes",
};
const loadProducts = vi.fn();
const setSearchText = vi.fn();
const setCategoryId = vi.fn();
const resetFilters = vi.fn();

function state(overrides: Record<string, unknown> = {}) {
  return {
    products: [] as Product[],
    isLoading: false,
    isLoadingMore: false,
    error: null as string | null,
    cursor: null,
    hasNextPage: false,
    searchText: "",
    categoryId: "",
    loadProducts,
    setSearchText,
    setCategoryId,
    resetFilters,
    ...overrides,
  } as ReturnType<typeof useProducts>;
}
function renderPage(entry = "/products") {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes><Route path="/products" element={<ProductsPage />} /></Routes>
    </MemoryRouter>,
  );
}

describe("ProductsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useProducts).mockReturnValue(state());
  });

  it("muestra el estado de carga sin montar la grilla", () => {
    vi.mocked(useProducts).mockReturnValue(state({ isLoading: true }));
    renderPage();
    expect(screen.getByRole("status")).toHaveTextContent(/cargando productos de la colección/i);
    expect(screen.queryByTestId("product-grid")).not.toBeInTheDocument();
  });

  it("muestra el error y permite reintentar desde la primera página", () => {
    vi.mocked(useProducts).mockReturnValue(state({ error: "Firestore no disponible" }));
    renderPage();

    expect(screen.getByRole("alert")).toHaveTextContent("Firestore no disponible");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(loadProducts).toHaveBeenCalledWith({ reset: true });
  });

  it("distingue una colección vacía sin filtros y permite limpiar filtros aplicados", () => {
    vi.mocked(useProducts).mockReturnValue(state());
    renderPage();
    expect(screen.getByRole("heading", { name: "La colección todavía está vacía" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Limpiar filtros" })).not.toBeInTheDocument();
  });

  it("permite limpiar los filtros cuando la búsqueda no tiene coincidencias", () => {
    vi.mocked(useProducts).mockReturnValue(state({ searchText: "inexistente", categoryId: "shoes" }));
    renderPage();
    expect(screen.getByRole("heading", { name: "No encontramos esa pieza" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(resetFilters).toHaveBeenCalledTimes(1);
  });

  it("aplica la categoría de la URL, muestra resultados y permite cargar la página siguiente", async () => {
    vi.mocked(useProducts).mockReturnValue(state({ products: [product], hasNextPage: true }));
    renderPage("/products?category=shoes");

    await waitFor(() => expect(setCategoryId).toHaveBeenCalledWith("shoes"));
    expect(screen.getByTestId("product-grid")).toHaveTextContent("Botas Sierra");
    expect(screen.getByText("Hay más productos para descubrir.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cargar más productos" }));
    expect(loadProducts).toHaveBeenCalledWith();
  });
});
