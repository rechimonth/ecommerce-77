import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Product } from "../../types/product.types";
import { getProductById } from "../../services/products.service";
import { ProductDetailPage } from "./ProductDetailPage";

vi.mock("../../services/products.service", () => ({ getProductById: vi.fn() }));
vi.mock("../../components/products/ProductImage", () => ({
  ProductImage: ({ source, alt, className }: { source: string; alt: string; className?: string }) => (
    <img src={source} alt={alt} className={className} />
  ),
}));
vi.mock("../../components/cart/AddToCartButton", () => ({
  AddToCartButton: ({ product }: { product: Product }) => <button type="button">Agregar {product.name}</button>,
}));
vi.mock("../../components/products/ProductReviews", () => ({
  ProductReviews: ({ productId }: { productId: string }) => <div data-testid="reviews">Reviews: {productId}</div>,
}));
vi.mock("../../components/states/LoadingState", () => ({
  LoadingState: ({ message }: { message: string }) => <p role="status">{message}</p>,
}));
vi.mock("../../components/states/ErrorState", () => ({
  ErrorState: ({ message }: { message: string }) => <p role="alert">{message}</p>,
}));

const product: Product = {
  id: "boots-1",
  name: "Botas Sierra",
  nameLower: "botas sierra",
  image: "https://example.test/boots.jpg",
  description: "Botas de cuero\\npara campo",
  price: 120,
  stock: 2,
  categoryId: "shoes",
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/products/boots-1"]}>
      <Routes><Route path="/products/:productId" element={<ProductDetailPage />} /></Routes>
    </MemoryRouter>,
  );
}

describe("ProductDetailPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("muestra detalles, disponibilidad baja, navegación y opiniones para un producto", async () => {
    vi.mocked(getProductById).mockResolvedValue(product);
    renderPage();

    expect(await screen.findByRole("heading", { name: "Botas Sierra" })).toBeInTheDocument();
    expect(screen.getByText(/últimas unidades · 2 disponibles/i)).toBeInTheDocument();
    expect(screen.getByText("Descripción del producto")).toBeInTheDocument();
    expect(screen.getByText("Referencia").nextElementSibling).toHaveTextContent("boots-1");
    expect(screen.getByTestId("reviews")).toHaveTextContent("Reviews: boots-1");
    expect(screen.getByRole("link", { name: "Colección" })).toHaveAttribute("href", "/products");
    expect(getProductById).toHaveBeenCalledWith("boots-1");
  });

  it("presenta disponibilidad estándar y categoría de ropa cuando hay stock suficiente", async () => {
    vi.mocked(getProductById).mockResolvedValue({ ...product, stock: 8, categoryId: "clothing" });
    renderPage();

    expect(await screen.findByText("Disponible · 8 unidades")).toBeInTheDocument();
    expect(screen.getAllByText("Ropa").length).toBeGreaterThan(0);
  });

  it("presenta agotado cuando el stock es cero", async () => {
    vi.mocked(getProductById).mockResolvedValue({ ...product, stock: 0, categoryId: "accessories" });
    renderPage();

    expect(await screen.findByText("Actualmente sin stock")).toBeInTheDocument();
    expect(screen.getByText("Agotado")).toBeInTheDocument();
    expect(screen.getAllByText("Accesorios").length).toBeGreaterThan(0);
  });

  it("informa cuando el ID no corresponde a un producto", async () => {
    vi.mocked(getProductById).mockResolvedValue(null);
    renderPage();

    expect(await screen.findByRole("heading", { name: "Producto no encontrado" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver al catálogo" })).toHaveAttribute("href", "/products");
  });

  it("muestra el estado de error cuando falla la consulta", async () => {
    vi.mocked(getProductById).mockRejectedValue(new Error("network"));
    renderPage();
    expect(await screen.findByRole("alert")).toHaveTextContent(/no pudimos cargar este producto/i);
  });

  it("mantiene el estado de carga mientras la consulta no termina", () => {
    vi.mocked(getProductById).mockReturnValue(new Promise(() => undefined));
    renderPage();
    expect(screen.getByRole("status")).toHaveTextContent(/cargando producto/i);
  });
});
