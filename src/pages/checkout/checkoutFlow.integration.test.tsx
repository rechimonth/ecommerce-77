import { fireEvent, screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CART_STORAGE_KEY } from "../../contexts/cart/cartStorage";
import type { Product } from "../../types/product.types";
import { renderWithProviders } from "../../test/renderWithProviders";
import { createOrder } from "../../services/orders.service";
import { CheckoutPage } from "./CheckoutPage";

vi.mock("../../services/orders.service", () => ({
  createOrder: vi.fn(async () => "order-test-123"),
}));
vi.mock("../../services/cart.service", () => ({
  getUserCart: vi.fn(async () => null),
  saveUserCart: vi.fn(async () => undefined),
}));

const product: Product = {
  id: "botas-test",
  name: "Botas de prueba",
  nameLower: "botas de prueba",
  image: "https://example.test/botas.jpg",
  description: "Botas para probar el checkout",
  price: 80,
  stock: 3,
  categoryId: "shoes",
};

// Simula la estructura que produce el almacenamiento real del carrito.
function seedCartForTest() {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({
    items: [{ product, quantity: 1, addedAt: "2026-01-01T00:00:00.000Z" }],
    total: 999, // Se ignora: el provider recalcula el importe desde los artículos.
  }));
}

describe("integración real de checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedCartForTest();
  });

  it("confirma el pedido, usa el servicio mockeado, navega al detalle y vacía el carrito", async () => {
    renderWithProviders(
      <Routes>
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders/:orderId" element={<p>Pedido creado correctamente</p>} />
      </Routes>,
      { route: "/checkout" },
    );

    fireEvent.change(screen.getByLabelText("Nombre completo"), {
      target: { value: "Cliente de prueba" },
    });
    fireEvent.change(screen.getByLabelText("Dirección de entrega"), {
      target: { value: "Av. Ejemplo 123, Buenos Aires" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Confirmar pedido/ }));

    await waitFor(() => {
      expect(createOrder).toHaveBeenCalledWith(expect.objectContaining({
        userId: "customer-test",
        customerName: "Cliente de prueba",
        shippingAddress: "Av. Ejemplo 123, Buenos Aires",
        total: 80,
        items: [expect.objectContaining({
          product: expect.objectContaining({ id: "botas-test" }),
          quantity: 1,
        })],
      }));
    });
    expect(await screen.findByText("Pedido creado correctamente")).toBeInTheDocument();
    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) ?? "{}").items).toEqual([]);
    });
  });
});
