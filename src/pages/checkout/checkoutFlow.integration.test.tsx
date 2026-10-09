import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { useCart } from "../../hooks/useCart";
import { createOrder } from "../../services/orders.service";
import type { Product } from "../../types/product.types";

vi.mock("../../services/orders.service", () => ({
  createOrder: vi.fn(async () => "order-test-123"),
}));
const product: Product = {
  id: "botas-test", name: "Botas de prueba", nameLower: "botas de prueba",
  image: "https://example.test/botas.jpg", description: "Botas para el test",
  price: 80, stock: 3, categoryId: "shoes",
};

// Componente pequeño que conecta las acciones reales del carrito con el servicio de pedidos mockeado.
function CheckoutHarness() {
  const cart = useCart();
  async function confirm() {
    await createOrder({
      userId: "customer-test", customerName: "Cliente de prueba", email: "cliente@example.test",
      shippingAddress: "Calle de prueba 123", items: cart.items, total: cart.total,
    });
    cart.clearCart();
  }
  return <div>
    <button onClick={() => cart.addItem(product)}>Agregar al carrito</button>
    <p>total: {cart.total}</p>
    <p>artículos: {cart.itemCount}</p>
    <button onClick={() => void confirm()}>Confirmar pedido</button>
  </div>;
}

describe("flujo integrado de carrito y checkout", () => {
  it("agrega una pieza, crea la orden por el servicio mockeado y vacía el carrito", async () => {
    renderWithProviders(<CheckoutHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Agregar al carrito" }));
    expect(screen.getByText("total: 80")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar pedido" }));
    await waitFor(() => expect(createOrder).toHaveBeenCalledWith(expect.objectContaining({
      userId: "customer-test", total: 80,
    })));
    await waitFor(() => expect(screen.getByText("artículos: 0")).toBeInTheDocument());
  });
});
