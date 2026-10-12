import { beforeEach, describe, expect, it, vi } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const mocks = vi.hoisted(() => {
  const app = { name: "fake-admin-app" };
  const transaction = {
    get: vi.fn(),
    update: vi.fn(),
    set: vi.fn(),
  };
  const db = {
    doc: vi.fn(),
    collection: vi.fn(),
    runTransaction: vi.fn(),
  };
  const adminAuth = { verifyIdToken: vi.fn() };
  return {
    app,
    transaction,
    db,
    adminAuth,
    appSdk: {
      cert: vi.fn((value: unknown) => ({ credential: value })),
      getApps: vi.fn(() => [app]),
      initializeApp: vi.fn(() => app),
    },
    authSdk: { getAuth: vi.fn(() => adminAuth) },
    firestoreSdk: {
      FieldValue: { serverTimestamp: vi.fn(() => "server-timestamp") },
      getFirestore: vi.fn(() => db),
    },
  };
});

vi.mock("firebase-admin/app", () => mocks.appSdk);
vi.mock("firebase-admin/auth", () => mocks.authSdk);
vi.mock("firebase-admin/firestore", () => mocks.firestoreSdk);

import handler from "../../api/orders";

type ResponseRecorder = VercelResponse & {
  statusCode: number;
  payload: unknown;
  headers: Record<string, string>;
};

function request(method = "POST", body: unknown = {}, authorization = "Bearer valid-token") {
  return {
    method,
    headers: authorization ? { authorization } : {},
    body,
  } as unknown as VercelRequest;
}
function responseRecorder(): ResponseRecorder {
  const recorder = {
    statusCode: 200,
    payload: undefined as unknown,
    headers: {} as Record<string, string>,
    setHeader(name: string, value: string) { this.headers[name] = value; return this; },
    status(code: number) { this.statusCode = code; return this; },
    json(value: unknown) { this.payload = value; return this; },
  };
  return recorder as unknown as ResponseRecorder;
}
function documentSnapshot(
  path: string,
  data: Record<string, unknown> = {},
  exists = true,
) {
  return {
    path,
    id: path.split("/").at(-1),
    ref: { path },
    exists,
    data: () => data,
    get: (field: string) => data[field],
  };
}
const validBody = {
  customerName: "Cliente de prueba",
  shippingAddress: "Avenida Ejemplo 123, Buenos Aires",
  items: [{ productId: "boots", quantity: 2 }],
};
const product = {
  name: "Botas Sierra",
  image: "https://example.test/boots.jpg",
  price: 79.995,
  stock: 4,
};

function setupDatabase(options: {
  user?: Record<string, unknown> | null;
  products?: Record<string, Record<string, unknown> | null>;
} = {}) {
  const documents = new Map<string, ReturnType<typeof documentSnapshot>>();
  if (options.user !== null) {
    documents.set("users/user-1", documentSnapshot("users/user-1", options.user ?? {
      uid: "user-1",
      email: "profile@example.test",
      role: "customer",
    }));
  }
  for (const [id, data] of Object.entries(options.products ?? { boots: product })) {
    if (data) documents.set("products/" + id, documentSnapshot("products/" + id, data));
  }

  mocks.db.doc.mockImplementation((path: string) => ({ path }));
  mocks.db.collection.mockImplementation((name: string) => ({
    doc: (id?: string) => ({ path: id ? name + "/" + id : name + "/order-1", id: id ?? "order-1" }),
  }));
  mocks.db.runTransaction.mockImplementation(async (callback: (transaction: typeof mocks.transaction) => unknown) => {
    mocks.transaction.get.mockImplementation(async (ref: { path: string }) => {
      return documents.get(ref.path) ?? documentSnapshot(ref.path, {}, false);
    });
    return await callback(mocks.transaction);
  });
  return documents;
}

describe("api/orders handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.appSdk.getApps.mockReturnValue([mocks.app]);
    mocks.authSdk.getAuth.mockReturnValue(mocks.adminAuth);
    mocks.firestoreSdk.getFirestore.mockReturnValue(mocks.db);
    mocks.adminAuth.verifyIdToken.mockResolvedValue({ uid: "user-1", email: "verified@example.test" });
    mocks.transaction.get.mockReset();
    mocks.transaction.update.mockReset();
    mocks.transaction.set.mockReset();
    mocks.db.doc.mockReset();
    mocks.db.collection.mockReset();
    mocks.db.runTransaction.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("rechaza métodos distintos de POST y declara Allow", async () => {
    const res = responseRecorder();
    await handler(request("GET"), res);
    expect(res.statusCode).toBe(405);
    expect(res.headers.Allow).toBe("POST");
    expect(res.payload).toEqual({ error: "Método no permitido." });
  });

  it("rechaza solicitudes sin token antes de consultar Firebase", async () => {
    const res = responseRecorder();
    await handler(request("POST", validBody, ""), res);
    expect(res.statusCode).toBe(401);
    expect(mocks.adminAuth.verifyIdToken).not.toHaveBeenCalled();
  });

  it("rechaza un cuerpo JSON malformado", async () => {
    const res = responseRecorder();
    await handler(request("POST", "{mal json"), res);
    expect(res.statusCode).toBe(400);
    expect(res.payload).toEqual({ error: "El pedido enviado no contiene JSON válido." });
  });

  it("rechaza una lista de artículos vacía antes de verificar el token", async () => {
    const res = responseRecorder();
    await handler(request("POST", { ...validBody, items: [] }), res);
    expect(res.statusCode).toBe(400);
    expect(mocks.adminAuth.verifyIdToken).not.toHaveBeenCalled();
  });

  it("convierte un token expirado en HTTP 401", async () => {
    mocks.adminAuth.verifyIdToken.mockRejectedValue({ code: "auth/id-token-expired" });
    const res = responseRecorder();
    await handler(request("POST", validBody), res);
    expect(res.statusCode).toBe(401);
    expect(res.payload).toEqual({ error: "La sesión venció. Volvé a iniciar sesión." });
  });

  it("falla cerrado si no existe un perfil válido", async () => {
    setupDatabase({ user: null, products: { boots: product } });
    const res = responseRecorder();
    await handler(request("POST", validBody), res);
    expect(res.statusCode).toBe(403);
    expect(res.payload).toEqual({ error: "No pudimos verificar tu perfil para crear el pedido." });
    expect(mocks.transaction.set).not.toHaveBeenCalled();
  });

  it("rechaza una compra si el producto ya no existe", async () => {
    setupDatabase({ products: { boots: null } });
    const res = responseRecorder();
    await handler(request("POST", validBody), res);
    expect(res.statusCode).toBe(409);
    expect(res.payload).toEqual({ error: "Uno de los productos ya no existe en el catálogo." });
    expect(mocks.transaction.set).not.toHaveBeenCalled();
  });

  it("rechaza el stock insuficiente y no escribe una orden", async () => {
    setupDatabase({ products: { boots: { ...product, stock: 1 } } });
    const res = responseRecorder();
    await handler(request("POST", validBody), res);
    expect(res.statusCode).toBe(409);
    expect(res.payload).toMatchObject({ error: expect.stringMatching(/stock suficiente/i) });
    expect(mocks.transaction.update).not.toHaveBeenCalled();
    expect(mocks.transaction.set).not.toHaveBeenCalled();
  });

  it("crea la orden y descuenta stock en la misma transacción, usando el email verificado", async () => {
    const documents = setupDatabase();
    const res = responseRecorder();
    await handler(request("POST", validBody), res);

    expect(res.statusCode).toBe(201);
    expect(res.payload).toEqual({ orderId: "order-1", total: 160 });
    expect(mocks.transaction.update).toHaveBeenCalledWith(
      expect.objectContaining({ path: "products/boots" }),
      { stock: 2, updatedAt: "server-timestamp" },
    );
    expect(mocks.transaction.set).toHaveBeenCalledWith(
      expect.objectContaining({ path: "orders/order-1" }),
      expect.objectContaining({
        userId: "user-1",
        email: "verified@example.test",
        status: "pending",
        total: 160,
        items: [expect.objectContaining({ productId: "boots", quantity: 2, unitPrice: 80, lineTotal: 160 })],
      }),
    );
    expect(documents.get("products/boots")?.data()).toMatchObject({ stock: 4 });
    expect(mocks.transaction.get).toHaveBeenCalledTimes(2);
  });

  it("usa el email del perfil si el token no contiene email", async () => {
    mocks.adminAuth.verifyIdToken.mockResolvedValue({ uid: "user-1" });
    setupDatabase();
    const res = responseRecorder();
    await handler(request("POST", validBody), res);
    expect(res.statusCode).toBe(201);
    expect(mocks.transaction.set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ email: "profile@example.test" }),
    );
  });
});
