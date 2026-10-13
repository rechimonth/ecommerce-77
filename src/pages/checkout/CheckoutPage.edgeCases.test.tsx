import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CART_STORAGE_KEY } from "../../contexts/cart/cartStorage";
import { renderWithProviders, defaultTestAuthValue } from "../../test/renderWithProviders";
import type { Product } from "../../types/product.types";
import { CheckoutPage } from "./CheckoutPage";
import { createOrder } from "../../services/orders.service";

vi.mock("../../services/orders.service", () => ({ createOrder: vi.fn() }));
vi.mock("../../services/cart.service", () => ({
  getUserCart: vi.fn(),
  saveUserCart: vi.fn(),
}));

import { getUserCart, saveUserCart } from "../../services/cart.service";

const product: Product = {
  id: "checkout-test-product",
  name: "Botas de prueba",
  nameLower: "botas de prueba",
  image: "https://example.test/boots.jpg",
  description: "Botas para el checkout",
  price: 80,
  stock: 5,
  categoryId: "shoes",
};

function seedCart() {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({
    items: [{ product, quantity: 1, addedAt: "2026-01-01T00:00:00.000Z" }],
    total: 9999,
  }));
}

function completeDeliveryForm() {
  fireEvent.change(screen.getByLabelText("Nombre completo"), {
    target: { value: "Cliente de prueba" },
  });
  fireEvent.change(screen.getByLabelText("Dirección de entrega"), {
    target: { value: "Av. Ejemplo 123, Buenos Aires" },
  });
}

describe("CheckoutPage edge cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUserCart).mockResolvedValue(null);
    vi.mocked(saveUserCart).mockResolvedValue(undefined);
    vi.mocked(createOrder).mockResolvedValue("order-edge-case");
    window.localStorage.removeItem(CART_STORAGE_KEY);
  });

  it("presenta el estado vacío cuando el carrito no contiene artículos", () => {
    renderWithProviders(<CheckoutPage />, { route: "/checkout" });

    expect(screen.getByRole("heading", { name: "Tu carrito está vacío" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver al catálogo" })).toHaveAttribute("href", "/products");
    expect(screen.queryByRole("button", { name: /Confirmar pedido/ })).not.toBeInTheDocument();
  });

  it("mantiene el carrito y muestra el error de API si la creación del pedido falla", async () => {
    seedCart();
    vi.mocked(createOrder).mockRejectedValue(new Error("Servicio temporalmente no disponible"));
    renderWithProviders(<CheckoutPage />, { route: "/checkout" });

    completeDeliveryForm();
    fireEvent.click(screen.getByRole("button", { name: /Confirmar pedido/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Servicio temporalmente no disponible");
    expect(screen.getByText("Botas de prueba")).toBeInTheDocument();
    expect(createOrder).toHaveBeenCalledTimes(1);
  });

  it("usa un mensaje alternativo si la API rechaza sin mensaje explicativo", async () => {
    seedCart();
    vi.mocked(createOrder).mockRejectedValue(new Error("  "));
    renderWithProviders(<CheckoutPage />, { route: "/checkout" });

    completeDeliveryForm();
    fireEvent.click(screen.getByRole("button", { name: /Confirmar pedido/ }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/no pudimos crear el pedido/i);
    });
  });

  it("no intenta crear una orden si el contexto no tiene usuario", async () => {
    seedCart();
    renderWithProviders(<CheckoutPage />, {
      route: "/checkout",
      authValue: { ...defaultTestAuthValue, user: null, profile: null },
    });

    completeDeliveryForm();
    fireEvent.click(screen.getByRole("button", { name: /Confirmar pedido/ }));
    await waitFor(() => expect(createOrder).not.toHaveBeenCalled());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("muestra un aviso cuando falla la sincronización del carrito en la nube", async () => {
    seedCart();
    vi.mocked(getUserCart).mockRejectedValue(new Error("permission-denied"));
    renderWithProviders(<CheckoutPage />, { route: "/checkout" });

    expect(await screen.findByText(/no pudimos sincronizar el carrito/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Confirmar pedido/ })).toBeInTheDocument();
  });
});
