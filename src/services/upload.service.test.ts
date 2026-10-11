import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveProductImage, uploadProductImage } from "./upload.service";

function response(payload: unknown, ok = true): Response {
  return {
    ok,
    json: async () => payload,
  } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("servicio de imágenes S3", () => {
  it("rechaza archivos mayores a 5 MB antes de pedir una URL al servidor", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const oversizedFile = {
      name: "large.png",
      type: "image/png",
      size: 5 * 1024 * 1024 + 1,
    } as File;

    await expect(uploadProductImage(oversizedFile, "test-id-token"))
      .rejects.toThrow(/5 MB o menos/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rechaza formatos que S3 no admite antes de pedir una URL", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const unsupportedFile = new File(["image-bytes"], "animated.gif", { type: "image/gif" });

    await expect(uploadProductImage(unsupportedFile, "test-id-token"))
      .rejects.toThrow(/Formato no permitido/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rechaza imágenes vacías antes de pedir una URL", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const emptyFile = new File([], "empty.png", { type: "image/png" });

    await expect(uploadProductImage(emptyFile, "test-id-token"))
      .rejects.toThrow(/no estar vacía/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("solicita una URL con el token Firebase y sube el archivo por PUT", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({
        uploadUrl: "https://s3.example.test/signed-upload",
        key: "products/admin/image.png",
      }))
      .mockResolvedValueOnce(response({}));
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["image-bytes"], "product.png", { type: "image/png" });

    await expect(uploadProductImage(file, "test-id-token"))
      .resolves.toBe("s3://products/admin/image.png");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstCall = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(firstCall[0]).toBe("/api/s3/presign");
    expect(firstCall[1].method).toBe("POST");
    expect((firstCall[1].headers as Record<string, string>).Authorization).toBe("Bearer test-id-token");
    expect(JSON.parse(String(firstCall[1].body))).toMatchObject({
      action: "put",
      contentType: "image/png",
      fileSize: file.size,
    });

    const secondCall = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    expect(secondCall[0]).toBe("https://s3.example.test/signed-upload");
    expect(secondCall[1].method).toBe("PUT");
    expect((secondCall[1].headers as Record<string, string>)["Content-Type"]).toBe("image/png");
    expect(secondCall[1].body).toBe(file);
  });

  it("no intenta subir si el servidor rechaza la URL prefirmada", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(response({ error: "Solo admin" }, false));
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["image-bytes"], "product.png", { type: "image/png" });

    await expect(uploadProductImage(file, "test-id-token")).rejects.toThrow("Solo admin");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("devuelve las URL externas sin llamar al endpoint de S3", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(resolveProductImage("https://images.example.test/product.jpg"))
      .resolves.toBe("https://images.example.test/product.jpg");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("resuelve una clave S3 a una URL temporal de lectura", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(response({
      url: "https://s3.example.test/signed-read",
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(resolveProductImage("s3://products/admin/image.png"))
      .resolves.toBe("https://s3.example.test/signed-read");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/s3/presign");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      action: "get",
      key: "products/admin/image.png",
    });
  });
});
