import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { Product } from "../../types/product.types";
import { ProductCard } from "./ProductCard";
import { ProductFilters } from "./ProductFilters";
import { ProductGrid } from "./ProductGrid";

vi.mock("../cart/AddToCartButton", () => ({
  AddToCartButton: ({ product }: { product: Product }) => <button type="button">Agregar {product.name}</button>,
}));
vi.mock("./ProductImage", () => ({
  ProductImage: ({ source, alt, className }: { source: string; alt: string; className?: string }) => (
    <img src={source} alt={alt} className={className} />
  ),
}));

const product = (overrides: Partial<Product> = {}): Product => ({
  id: "boots",
  name: "Botas Sierra",
  nameLower: "botas sierra",
  image: "https://example.test/boots.jpg",
  description: "Botas de cuero para campo y ciudad",
  price: 120,
  stock: 8,
  categoryId: "shoes",
  ...overrides,
});

describe("ProductFilters", () => {
  it("cambia categoría y marca el filtro seleccionado", () => {
    const onCategoryChange = vi.fn();
    render(
      <ProductFilters
        searchText=""
        categoryId="shoes"
        onSearchChange={vi.fn()}
        onCategoryChange={onCategoryChange}
      />,
    );

    expect(screen.getByRole("button", { name: "Calzado" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Todo" })).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(screen.getByRole("button", { name: "Todo" }));
    fireEvent.click(screen.getByRole("button", { name: "Ropa" }));
    expect(onCategoryChange).toHaveBeenNthCalledWith(1, "");
    expect(onCategoryChange).toHaveBeenNthCalledWith(2, "clothing");
  });

  it("emite la búsqueda y permite borrar el término actual", () => {
    const onSearchChange = vi.fn();
    const { rerender } = render(
      <ProductFilters searchText="" categoryId="" onSearchChange={onSearchChange} onCategoryChange={vi.fn()} />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Buscar productos" }), { target: { value: "Botas" } });
    expect(onSearchChange).toHaveBeenCalledWith("Botas");

    rerender(
      <ProductFilters searchText="  Botas  " categoryId="" onSearchChange={onSearchChange} onCategoryChange={vi.fn()} />,
    );
    expect(screen.getByText("Buscando:")).toBeInTheDocument();
    expect(screen.getByText("Botas")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Borrar búsqueda" }));
    expect(onSearchChange).toHaveBeenLastCalledWith("");
  });
});

describe("ProductCard", () => {
  it("muestra categoría, descripción, precio y disponibilidad para un producto con stock", () => {
    render(<MemoryRouter><ProductCard product={product({ stock: 3 })} /></MemoryRouter>);

    expect(screen.getByRole("article")).toBeInTheDocument();
    expect(screen.getByText("Calzado")).toBeInTheDocument();
    expect(screen.getByText("Botas de cuero para campo y ciudad")).toBeInTheDocument();
    expect(screen.getByText("$120")).toBeInTheDocument();
    expect(screen.getByText("Últimas unidades")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver detalle de Botas Sierra" })).toHaveAttribute("href", "/products/boots");
    expect(screen.getByRole("button", { name: "Agregar Botas Sierra" })).toBeInTheDocument();
  });

  it("muestra sin stock, admite descripción vacía y cae a la etiqueta Colección si la categoría es desconocida", () => {
    render(
      <MemoryRouter>
        <ProductCard product={product({ stock: 0, description: "   ", categoryId: "other" as Product["categoryId"] })} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Colección")).toBeInTheDocument();
    expect(screen.getByText("Sin stock")).toBeInTheDocument();
    expect(screen.getByText("No disponible")).toBeInTheDocument();
    expect(screen.queryByText("Últimas unidades")).not.toBeInTheDocument();
  });

  it("muestra disponible cuando hay más de tres unidades", () => {
    render(<MemoryRouter><ProductCard product={product({ stock: 7 })} /></MemoryRouter>);
    expect(screen.getByText("Disponible")).toBeInTheDocument();
  });
});

describe("ProductGrid", () => {
  it("conserva el orden recibido y crea una tarjeta por producto", () => {
    render(<MemoryRouter><ProductGrid products={[product(), product({ id: "coat", name: "Abrigo", stock: 1 })]} /></MemoryRouter>);

    const articles = screen.getAllByRole("article");
    expect(articles).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Ver detalle de Botas Sierra" })).toHaveAttribute("href", "/products/boots");
    expect(screen.getByRole("link", { name: "Ver detalle de Abrigo" })).toHaveAttribute("href", "/products/coat");
  });
});
