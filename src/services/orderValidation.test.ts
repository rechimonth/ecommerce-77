import { describe, expect, it } from "vitest";
import {
  buildCanonicalOrder,
  OrderValidationError,
  parseCreateOrderRequest,
  type CanonicalProductForOrder,
} from "./orderValidation";

const product: CanonicalProductForOrder = {
  id: "boots",
  name: "Botas de prueba",
  image: "https://example.test/boots.jpg",
  price: 79.995,
  stock: 3,
};

describe("validación de creación de órdenes", () => {
  it("solo conserva los campos permitidos del cliente e ignora precio, total, UID y email enviados", () => {
    const parsed = parseCreateOrderRequest({
      customerName: " Cliente de prueba ",
      shippingAddress: " Av. Ejemplo 123, Buenos Aires ",
      items: [{ productId: "boots", quantity: 2, price: 0.01 }],
      userId: "otro-usuario",
      email: "falso@example.test",
      total: 0.02,
    });

    expect(parsed).toEqual({
      customerName: "Cliente de prueba",
      shippingAddress: "Av. Ejemplo 123, Buenos Aires",
      items: [{ productId: "boots", quantity: 2 }],
    });
    expect(parsed).not.toHaveProperty("total");
    expect(parsed).not.toHaveProperty("userId");
  });

  it("rechaza nombres/direcciones fuera de rango y una lista vacía", () => {
    expect(() => parseCreateOrderRequest({
      customerName: "A",
      shippingAddress: "Corta",
      items: [],
    })).toThrow(OrderValidationError);
  });

  it("rechaza cantidades fraccionarias, negativas o mayores al límite", () => {
    for (const quantity of [0, -1, 1.5, 100]) {
      expect(() => parseCreateOrderRequest({
        customerName: "Cliente",
        shippingAddress: "Avenida de prueba 123",
        items: [{ productId: "boots", quantity }],
      })).toThrow(OrderValidationError);
    }
  });

  it("rechaza identificadores de producto duplicados", () => {
    expect(() => parseCreateOrderRequest({
      customerName: "Cliente",
      shippingAddress: "Avenida de prueba 123",
      items: [
        { productId: "boots", quantity: 1 },
        { productId: "boots", quantity: 1 },
      ],
    })).toThrow(/una sola vez/);
  });

  it("calcula los importes a partir del precio canónico de Firestore y redondea a centavos", () => {
    const parsed = parseCreateOrderRequest({
      customerName: "Cliente",
      shippingAddress: "Avenida de prueba 123",
      items: [{ productId: "boots", quantity: 2 }],
      total: 0,
    });
    const order = buildCanonicalOrder(parsed.items, [product]);

    expect(order.items).toEqual([{
      productId: "boots",
      name: "Botas de prueba",
      image: "https://example.test/boots.jpg",
      unitPrice: 80,
      quantity: 2,
      lineTotal: 160,
    }]);
    expect(order.total).toBe(160);
  });

  it("rechaza productos inexistentes", () => {
    expect(() => buildCanonicalOrder([{ productId: "missing", quantity: 1 }], []))
      .toThrow(/ya no existe/);
  });

  it("rechaza compras por encima del stock disponible", () => {
    expect(() => buildCanonicalOrder([{ productId: "boots", quantity: 4 }], [product]))
      .toThrow(/stock suficiente/);
  });

  it("rechaza datos de producto mal formados", () => {
    expect(() => buildCanonicalOrder([{ productId: "boots", quantity: 1 }], [{
      ...product, price: Number.NaN,
    }])).toThrow(/precio no válido/);
  });
});
