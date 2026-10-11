import { describe, expect, it } from "vitest";
import {
  AuthOperationError,
  getAuthErrorCode,
  toAuthOperationError,
} from "./authErrors";

describe("diagnóstico de errores Firebase", () => {
  it("identifica un dominio no autorizado y conserva su código", () => {
    const original = { code: "auth/unauthorized-domain", message: "internal sdk text" };
    const result = toAuthOperationError(original);

    expect(result).toBeInstanceOf(AuthOperationError);
    expect(result.code).toBe("auth/unauthorized-domain");
    expect(result.message).toContain("dominio");
    expect(result.message).toContain("auth/unauthorized-domain");
    expect(result.message).not.toContain("internal sdk text");
    expect(result.originalCause).toBe(original);
  });

  it("distingue API key inválida de un error de red", () => {
    const invalidKey = toAuthOperationError({ code: "auth/api-key-not-valid" });
    const network = toAuthOperationError({ code: "auth/network-request-failed" });

    expect(invalidKey.message).toContain("API key");
    expect(invalidKey.code).toBe("auth/api-key-not-valid");
    expect(network.message).toContain("conectar");
    expect(network.code).toBe("auth/network-request-failed");
  });

  it("conserva el código de permisos de Firestore", () => {
    const error = toAuthOperationError({ code: "permission-denied" });

    expect(error.message).toContain("permisos");
    expect(error.message).toContain("permission-denied");
  });

  it("tolera causas desconocidas sin inventar un código", () => {
    const error = toAuthOperationError(new Error("detalle interno"));

    expect(error.code).toBeUndefined();
    expect(error.message).toContain("configuración de Firebase");
    expect(error.message).not.toContain("detalle interno");
    expect(getAuthErrorCode(null)).toBeUndefined();
  });

  it("no envuelve de nuevo un error diagnóstico ya creado", () => {
    const original = new AuthOperationError("Error de prueba", "auth/unauthorized-domain");

    expect(toAuthOperationError(original)).toBe(original);
  });
});
