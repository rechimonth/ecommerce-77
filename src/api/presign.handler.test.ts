import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const mocks = vi.hoisted(() => {
  const app = { name: "fake-admin-app" };
  class FakeS3Client {
    constructor(readonly config: unknown) {}
  }
  class FakeGetObjectCommand {
    constructor(readonly input: Record<string, unknown>) {}
  }
  class FakePutObjectCommand {
    constructor(readonly input: Record<string, unknown>) {}
  }
  const adminAuth = { verifyIdToken: vi.fn() };
  const db = {
    doc: vi.fn(),
  };
  return {
    app,
    adminAuth,
    db,
    FakeS3Client,
    FakeGetObjectCommand,
    FakePutObjectCommand,
    appSdk: {
      cert: vi.fn((value: unknown) => ({ credential: value })),
      getApps: vi.fn(() => [app]),
      initializeApp: vi.fn(() => app),
    },
    authSdk: { getAuth: vi.fn(() => adminAuth) },
    firestoreSdk: { getFirestore: vi.fn(() => db) },
    awsSdk: {
      S3Client: FakeS3Client,
      GetObjectCommand: FakeGetObjectCommand,
      PutObjectCommand: FakePutObjectCommand,
    },
    signedUrl: { getSignedUrl: vi.fn() },
    userRole: "admin" as string | null,
  };
});

vi.mock("@aws-sdk/client-s3", () => mocks.awsSdk);
vi.mock("@aws-sdk/s3-request-presigner", () => mocks.signedUrl);
vi.mock("firebase-admin/app", () => mocks.appSdk);
vi.mock("firebase-admin/auth", () => mocks.authSdk);
vi.mock("firebase-admin/firestore", () => mocks.firestoreSdk);

import handler from "../../api/s3/presign";

type ResponseRecorder = VercelResponse & {
  statusCode: number;
  payload: unknown;
  headers: Record<string, string>;
};
function request(body: unknown, method = "POST", authorization: string | null = "Bearer valid-token") {
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
function signedRequest(action: string, fields: Record<string, unknown> = {}) {
  return { action, ...fields };
}

describe("api/s3/presign handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("AWS_REGION", "us-east-1");
    vi.stubEnv("AWS_ACCESS_KEY_ID", "test-access-key");
    vi.stubEnv("AWS_SECRET_ACCESS_KEY", "test-secret-key");
    vi.stubEnv("AWS_S3_BUCKET", "test-private-bucket");
    vi.stubEnv("FIREBASE_PROJECT_ID", "test-project");
    vi.stubEnv("FIREBASE_CLIENT_EMAIL", "firebase@test-project.iam.gserviceaccount.com");
    vi.stubEnv("FIREBASE_PRIVATE_KEY", "-----BEGIN PRIVATE KEY-----\\ntest\\n-----END PRIVATE KEY-----\\n");
    mocks.appSdk.getApps.mockReturnValue([mocks.app]);
    mocks.authSdk.getAuth.mockReturnValue(mocks.adminAuth);
    mocks.firestoreSdk.getFirestore.mockReturnValue(mocks.db);
    mocks.adminAuth.verifyIdToken.mockResolvedValue({ uid: "admin-1", email: "admin@example.test" });
    mocks.userRole = "admin";
    mocks.db.doc.mockImplementation((path: string) => ({
      path,
      get: vi.fn(async () => ({ data: () => ({ role: mocks.userRole }) })),
    }));
    mocks.signedUrl.getSignedUrl.mockResolvedValue("https://s3.example.test/signed-url");
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("rechaza métodos distintos de POST", async () => {
    const res = responseRecorder();
    await handler(request(signedRequest("get", { key: "products/p1.jpg" }), "GET"), res);
    expect(res.statusCode).toBe(405);
    expect(res.headers.Allow).toBe("POST");
  });

  it("rechaza cuerpos JSON inválidos, arreglos y acciones desconocidas", async () => {
    const invalidJson = responseRecorder();
    await handler(request("{mal json"), invalidJson);
    expect(invalidJson.statusCode).toBe(400);

    const arrayBody = responseRecorder();
    await handler(request([]), arrayBody);
    expect(arrayBody.statusCode).toBe(400);

    const invalidAction = responseRecorder();
    await handler(request({ action: "delete" }), invalidAction);
    expect(invalidAction.statusCode).toBe(400);
  });

  it("rechaza claves de lectura fuera del prefijo products/ y traversal", async () => {
    for (const key of ["", "../secrets.txt", "users/admin/avatar.jpg", "products/../private.jpg", "products/" + "a".repeat(501)]) {
      const res = responseRecorder();
      await handler(request(signedRequest("get", { key }), "POST", null), res);
      expect(res.statusCode).toBe(400);
      expect(res.payload).toEqual({ error: "La clave de imagen no es válida." });
    }
    expect(mocks.signedUrl.getSignedUrl).not.toHaveBeenCalled();
  });

  it("genera una URL de solo lectura sin exigir un token de usuario", async () => {
    const res = responseRecorder();
    await handler(request(signedRequest("get", { key: "products/admin-1/boots.jpg" }), "POST", null), res);

    expect(res.statusCode).toBe(200);
    expect(res.payload).toEqual({ url: "https://s3.example.test/signed-url" });
    expect(mocks.signedUrl.getSignedUrl).toHaveBeenCalledWith(
      expect.any(mocks.FakeS3Client),
      expect.any(mocks.FakeGetObjectCommand),
      { expiresIn: 900 },
    );
    expect((mocks.signedUrl.getSignedUrl.mock.calls[0]?.[1] as InstanceType<typeof mocks.FakeGetObjectCommand>).input)
      .toMatchObject({ Bucket: "test-private-bucket", Key: "products/admin-1/boots.jpg" });
  });

  it("rechaza la subida sin token o con token expirado", async () => {
    const missing = responseRecorder();
    await handler(request(signedRequest("put", { contentType: "image/png", fileSize: 10 }), "POST", null), missing);
    expect(missing.statusCode).toBe(401);

    mocks.adminAuth.verifyIdToken.mockRejectedValue({ code: "auth/id-token-expired" });
    const expired = responseRecorder();
    await handler(request(signedRequest("put", { contentType: "image/png", fileSize: 10 })), expired);
    expect(expired.statusCode).toBe(401);
    expect(mocks.signedUrl.getSignedUrl).not.toHaveBeenCalled();
  });

  it("rechaza a cualquier rol que no sea admin", async () => {
    mocks.userRole = "customer";
    const res = responseRecorder();
    await handler(request(signedRequest("put", { contentType: "image/png", fileSize: 10 })), res);

    expect(res.statusCode).toBe(403);
    expect(res.payload).toEqual({ error: "Solo un administrador puede subir imágenes." });
  });

  it("valida el tamaño de archivo y el MIME en el servidor", async () => {
    for (const fileSize of [0, -1, 1.5, 5 * 1024 * 1024 + 1]) {
      const res = responseRecorder();
      await handler(request(signedRequest("put", { contentType: "image/png", fileSize })), res);
      expect(res.statusCode).toBe(413);
    }

    const invalidType = responseRecorder();
    await handler(request(signedRequest("put", { contentType: "image/gif", fileSize: 12 })), invalidType);
    expect(invalidType.statusCode).toBe(415);
    expect(mocks.signedUrl.getSignedUrl).not.toHaveBeenCalled();
  });

  it("firma el tamaño y tipo exactos con URL de corta duración", async () => {
    const res = responseRecorder();
    await handler(request(signedRequest("put", {
      fileName: "boots.png",
      contentType: "image/png",
      fileSize: 512,
    })), res);

    expect(res.statusCode).toBe(200);
    expect(res.payload).toMatchObject({
      uploadUrl: "https://s3.example.test/signed-url",
      key: expect.stringMatching(/^products\/admin-1\/[0-9a-f-]+\.png$/),
      maxBytes: 5 * 1024 * 1024,
    });
    const command = mocks.signedUrl.getSignedUrl.mock.calls[0]?.[1] as InstanceType<typeof mocks.FakePutObjectCommand>;
    expect(command).toBeInstanceOf(mocks.FakePutObjectCommand);
    expect(command.input).toMatchObject({
      Bucket: "test-private-bucket",
      ContentType: "image/png",
      ContentLength: 512,
    });
    expect(mocks.signedUrl.getSignedUrl.mock.calls[0]?.[2]).toEqual({
      expiresIn: 300,
      signableHeaders: new Set(["content-length", "content-type"]),
    });
  });

  it("responde con error de servidor cuando falla el firmador", async () => {
    mocks.signedUrl.getSignedUrl.mockRejectedValue(new Error("AWS offline"));
    const res = responseRecorder();
    await handler(request(signedRequest("put", { contentType: "image/png", fileSize: 512 })), res);
    expect(res.statusCode).toBe(500);
    expect(res.payload).toEqual({ error: "No pudimos generar el enlace seguro. Revisá la configuración del servidor." });
  });
});
