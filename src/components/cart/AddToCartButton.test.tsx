import { fireEvent, render, screen, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CartContextValue } from "../../types/cart.types";
import type { Product } from "../../types/product.types";
import { useCart } from "../../hooks/useCart";
import { AddToCartButton } from "./AddToCartButton";

vi.mock("../../hooks/useCart", () => ({ useCart: vi.fn() }));

const product: Product = {
  id: "p1",
  name: "Botas Sierra",
  nameLower: "botas sierra",
  image: "https://example.test/boots.jpg",
  description: "Botas de prueba",
  price: 80,
  stock: 3,
  categoryId: "shoes",
};
const addItem = vi.fn();
function cart(overrides: Partial<CartContextValue> = {}): CartContextValue {
  return {
    items: [],
    total: 0,
    itemCount: 0,
    syncError: null,
    addItem,
    removeItem: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
    ...overrides,
  };
}

describe("AddToCartButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCart).mockReturnValue(cart());
  });
  afterEach(() => vi.useRealTimers());

  it("agrega una unidad y muestra confirmación temporal", () => {
    vi.useFakeTimers();
    render(<AddToCartButton product={product} />);

    fireEvent.click(screen.getByRole("button", { name: "Agregar al carrito" }));
    expect(addItem).toHaveBeenCalledWith(product);
    expect(screen.getByRole("button", { name: "✓ Agregado" })).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(1500); });
    expect(screen.getByRole("button", { name: "Agregar al carrito" })).toBeInTheDocument();
  });

  it("cambia la etiqueta cuando ya hay unidades en el carrito", () => {
    vi.mocked(useCart).mockReturnValue(cart({
      items: [{ product, quantity: 1, addedAt: new Date() }],
    }));
    render(<AddToCartButton product={product} />);

    expect(screen.getByRole("button", { name: "Agregar otro" })).toBeInTheDocument();
  });

  it("deshabilita el botón cuando se alcanzó el stock máximo", () => {
    vi.mocked(useCart).mockReturnValue(cart({
      items: [{ product, quantity: product.stock, addedAt: new Date() }],
    }));
    render(<AddToCartButton product={product} />);

    expect(screen.getByRole("button", { name: "Máximo disponible" })).toBeDisabled();
    expect(addItem).not.toHaveBeenCalled();
  });

  it("deshabilita un producto agotado", () => {
    render(<AddToCartButton product={{ ...product, stock: 0 }} />);

    expect(screen.getByRole("button", { name: "Sin stock" })).toBeDisabled();
    expect(addItem).not.toHaveBeenCalled();
  });
});
