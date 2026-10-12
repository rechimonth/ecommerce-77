import { describe, expect, it } from "vitest";
import {
  buildCanonicalOrder,
  OrderValidationError,
  parseCreateOrderRequest,
  type CanonicalProductForOrder,
} from "./orderValidation";

const validRequest = {
  customerName: "Cliente de prueba",
  shippingAddress: "Avenida Ejemplo 123, Buenos Aires",
  items: [{ productId: "boots", quantity: 1 }],
};
const canonicalProduct: CanonicalProductForOrder = {
  id: "boots",
  name: "Botas Sierra",
  image: "https://example.test/boots.jpg",
  price: 80,
  stock: 4,
};
const line = { productId: "boots", quantity: 1 };

describe("orderValidation: límites y datos no confiables", () => {
  it.each([null, [], "invalid", 42])("rechaza solicitudes que no son objetos (%s)", (value) => {
    expect(() => parseCreateOrderRequest(value)).toThrow(OrderValidationError);
  });

  it("rechaza campos descriptivos fuera de rango y listas de artículos ausentes o excesivas", () => {
    expect(() => parseCreateOrderRequest({ ...validRequest, customerName: 1 })).toThrow(/nombre/i);
    expect(() => parseCreateOrderRequest({ ...validRequest, customerName: "A".repeat(121) })).toThrow(/nombre/i);
    expect(() => parseCreateOrderRequest({ ...validRequest, shippingAddress: "A".repeat(501) })).toThrow(/dirección/i);
    expect(() => parseCreateOrderRequest({ ...validRequest, items: undefined })).toThrow(/entre 1 y 50/i);
    expect(() => parseCreateOrderRequest({ ...validRequest, items: Array.from({ length: 51 }, () => line) })).toThrow(/entre 1 y 50/i);
  });

  it("rechaza líneas que no son objetos, IDs vacíos/largos y cantidades que no son enteros seguros del rango", () => {
    expect(() => parseCreateOrderRequest({ ...validRequest, items: [null] })).toThrow(/artículo.*no es válido/i);
    expect(() => parseCreateOrderRequest({ ...validRequest, items: [{ productId: " ", quantity: 1 }] })).toThrow(/identificador/i);
    expect(() => parseCreateOrderRequest({ ...validRequest, items: [{ productId: "x".repeat(151), quantity: 1 }] })).toThrow(/identificador/i);

    for (const quantity of ["2", undefined, NaN, Infinity, 0, -1, 1.5, 100]) {
      expect(() => parseCreateOrderRequest({
        ...validRequest,
        items: [{ productId: "boots", quantity }],
      })).toThrow(/entero entre 1 y 99/i);
    }
  });

  it("rechaza productos inexistentes con conflicto HTTP 409", () => {
    try {
      buildCanonicalOrder([line], []);
      throw new Error("Se esperaba una excepción de validación");
    } catch (error) {
      expect(error).toBeInstanceOf(OrderValidationError);
      expect((error as OrderValidationError).statusCode).toBe(409);
    }
  });

  it("rechaza nombre o imagen incompletos en el catálogo", () => {
    const invalidProducts: CanonicalProductForOrder[] = [
      { ...canonicalProduct, name: "A" },
      { ...canonicalProduct, name: "A".repeat(121) },
      { ...canonicalProduct, name: null },
      { ...canonicalProduct, image: "" },
      { ...canonicalProduct, image: "x".repeat(2049) },
      { ...canonicalProduct, image: null },
    ];

    for (const invalidProduct of invalidProducts) {
      expect(() => buildCanonicalOrder([line], [invalidProduct])).toThrow(/datos incompletos/i);
    }
  });

  it("rechaza precios que no sean finitos o sean negativos", () => {
    for (const price of [null, "80", -1, Infinity, NaN]) {
      expect(() => buildCanonicalOrder([line], [{ ...canonicalProduct, price }])).toThrow(/precio no válido/i);
    }
  });

  it("rechaza stocks no enteros, negativos y cantidades superiores al stock", () => {
    for (const stock of [null, "4", -1, 1.5, NaN]) {
      expect(() => buildCanonicalOrder([line], [{ ...canonicalProduct, stock }])).toThrow(/stock no válido/i);
    }
    expect(() => buildCanonicalOrder(
      [{ productId: "boots", quantity: 5 }],
      [{ ...canonicalProduct, stock: 4 }],
    )).toThrow(/stock suficiente/i);
  });

  it("rechaza importes o totales que exceden el límite de enteros seguros", () => {
    expect(() => buildCanonicalOrder(
      [{ productId: "boots", quantity: 2 }],
      [{ ...canonicalProduct, price: 46_000_000_000_000, stock: 4 }],
    )).toThrow(/importe.*excede/i);

    const secondProduct = { ...canonicalProduct, id: "coat", name: "Abrigo", price: 46_000_000_000_000 };
    expect(() => buildCanonicalOrder(
      [{ productId: "boots", quantity: 1 }, { productId: "coat", quantity: 1 }],
      [{ ...canonicalProduct, price: 46_000_000_000_000 }, secondProduct],
    )).toThrow(/total.*excede/i);
  });

  it("redondea a centavos antes de multiplicar unidades y sumar el pedido", () => {
    const result = buildCanonicalOrder(
      [{ productId: "boots", quantity: 3 }],
      [{ ...canonicalProduct, price: 19.995 }],
    );
    expect(result.items[0].unitPrice).toBe(20);
    expect(result.items[0].lineTotal).toBe(60);
    expect(result.total).toBe(60);
  });
});
