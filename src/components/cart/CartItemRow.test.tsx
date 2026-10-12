import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CartItem } from "../../types/cart.types";
import { CartItemRow } from "./CartItemRow";

vi.mock("../products/ProductImage", () => ({
  ProductImage: ({ source, alt, className }: { source: string; alt: string; className?: string }) => (
    <img src={source} alt={alt} className={className} />
  ),
}));

const item: CartItem = {
  product: {
    id: "boots",
    name: "Botas Sierra",
    nameLower: "botas sierra",
    image: "https://example.test/boots.jpg",
    description: "Botas para prueba",
    price: 80,
    stock: 4,
    categoryId: "shoes",
  },
  quantity: 2,
  addedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("CartItemRow", () => {
  it("muestra nombre, cantidad, precio unitario y subtotal", () => {
    render(<CartItemRow item={item} onChangeQuantity={vi.fn()} onRemove={vi.fn()} />);

    expect(screen.getByText("Botas Sierra")).toBeInTheDocument();
    expect(screen.getByText("$80 × 2")).toBeInTheDocument();
    expect(screen.getByText("$160")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Botas Sierra" })).toHaveAttribute("src", item.product.image);
  });

  it("notifica cambios al quitar o agregar una unidad", () => {
    const onChangeQuantity = vi.fn();
    render(<CartItemRow item={item} onChangeQuantity={onChangeQuantity} onRemove={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Quitar una unidad de Botas Sierra" }));
    fireEvent.click(screen.getByRole("button", { name: "Agregar una unidad de Botas Sierra" }));

    expect(onChangeQuantity).toHaveBeenNthCalledWith(1, "boots", 1);
    expect(onChangeQuantity).toHaveBeenNthCalledWith(2, "boots", 3);
  });

  it("deshabilita el incremento cuando ya se alcanzó el stock y permite eliminar la línea", () => {
    const onRemove = vi.fn();
    const onChangeQuantity = vi.fn();
    render(<CartItemRow item={{ ...item, quantity: 4 }} onChangeQuantity={onChangeQuantity} onRemove={onRemove} />);

    expect(screen.getByRole("button", { name: "Agregar una unidad de Botas Sierra" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(onRemove).toHaveBeenCalledWith("boots");
    expect(onChangeQuantity).not.toHaveBeenCalled();
  });
});
