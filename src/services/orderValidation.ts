export type OrderLineRequest = {
  productId: string;
  quantity: number;
};

export type CreateOrderRequest = {
  customerName: string;
  shippingAddress: string;
  items: OrderLineRequest[];
};

// Los campos del producto llegan desde Firestore y se tratan como datos no confiables
// hasta comprobar su tipo, incluso si el documento existe.
export type CanonicalProductForOrder = {
  id: string;
  name: unknown;
  image: unknown;
  price: unknown;
  stock: unknown;
};

export type OrderItemSnapshotForCreate = {
  productId: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export class OrderValidationError extends Error {
  readonly statusCode: 400 | 403 | 409;

  constructor(message: string, statusCode: 400 | 403 | 409 = 400) {
    super(message);
    this.name = "OrderValidationError";
    this.statusCode = statusCode;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Solo se aceptan datos descriptivos y referencias de producto del navegador.
// El precio, el total, el usuario y el email nunca se toman de esta petición.
export function parseCreateOrderRequest(value: unknown): CreateOrderRequest {
  if (!isRecord(value)) {
    throw new OrderValidationError("El pedido enviado no tiene un formato válido.");
  }

  const customerName =
    typeof value.customerName === "string" ? value.customerName.trim() : "";
  const shippingAddress =
    typeof value.shippingAddress === "string" ? value.shippingAddress.trim() : "";

  if (customerName.length < 2 || customerName.length > 120) {
    throw new OrderValidationError("Ingresá un nombre de entre 2 y 120 caracteres.");
  }
  if (shippingAddress.length < 8 || shippingAddress.length > 500) {
    throw new OrderValidationError("La dirección debe tener entre 8 y 500 caracteres.");
  }
  if (!Array.isArray(value.items) || value.items.length < 1 || value.items.length > 50) {
    throw new OrderValidationError("El pedido debe contener entre 1 y 50 artículos.");
  }

  const seenProductIds = new Set<string>();
  const items = value.items.map((rawItem): OrderLineRequest => {
    if (!isRecord(rawItem)) {
      throw new OrderValidationError("Uno de los artículos del pedido no es válido.");
    }
    const productId =
      typeof rawItem.productId === "string" ? rawItem.productId.trim() : "";
    const quantity = rawItem.quantity;

    if (productId.length < 1 || productId.length > 150) {
      throw new OrderValidationError("Uno de los productos no tiene un identificador válido.");
    }
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw new OrderValidationError("La cantidad de cada artículo debe ser un entero entre 1 y 99.");
    }
    if (seenProductIds.has(productId)) {
      throw new OrderValidationError("Cada producto debe aparecer una sola vez en el pedido.");
    }
    seenProductIds.add(productId);
    return { productId, quantity };
  });

  return { customerName, shippingAddress, items };
}

// Arma la orden exclusivamente con datos leídos del catálogo de Firestore.
// Todos los importes se calculan en centavos enteros para evitar errores binarios.
export function buildCanonicalOrder(
  lines: readonly OrderLineRequest[],
  products: readonly CanonicalProductForOrder[],
): { items: OrderItemSnapshotForCreate[]; total: number } {
  const productsById = new Map(products.map((product) => [product.id, product]));
  let totalCents = 0;

  const items = lines.map((line): OrderItemSnapshotForCreate => {
    const product = productsById.get(line.productId);
    if (!product) {
      throw new OrderValidationError("Uno de los productos ya no existe en el catálogo.", 409);
    }
    if (
      typeof product.name !== "string" ||
      product.name.trim().length < 2 ||
      product.name.length > 120 ||
      typeof product.image !== "string" ||
      product.image.length < 1 ||
      product.image.length > 2048
    ) {
      throw new OrderValidationError("Uno de los productos tiene datos incompletos en el catálogo.", 409);
    }
    if (typeof product.price !== "number" || !Number.isFinite(product.price) || product.price < 0) {
      throw new OrderValidationError("Uno de los productos tiene un precio no válido.", 409);
    }
    if (typeof product.stock !== "number" || !Number.isInteger(product.stock) || product.stock < 0) {
      throw new OrderValidationError("Uno de los productos tiene un stock no válido.", 409);
    }
    if (line.quantity > product.stock) {
      throw new OrderValidationError(`No hay stock suficiente para «${product.name}».`, 409);
    }

    const unitPriceCents = Math.round(product.price * 100);
    const lineTotalCents = unitPriceCents * line.quantity;
    if (!Number.isSafeInteger(unitPriceCents) || !Number.isSafeInteger(lineTotalCents)) {
      throw new OrderValidationError("El importe de uno de los productos excede el límite permitido.", 409);
    }
    totalCents += lineTotalCents;
    if (!Number.isSafeInteger(totalCents)) {
      throw new OrderValidationError("El total del pedido excede el límite permitido.", 409);
    }

    return {
      productId: product.id,
      name: product.name.trim(),
      image: product.image,
      unitPrice: unitPriceCents / 100,
      quantity: line.quantity,
      lineTotal: lineTotalCents / 100,
    };
  });

  return { items, total: totalCents / 100 };
}
