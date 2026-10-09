import type { PropsWithChildren } from "react";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthContext } from "../contexts/auth/AuthContext";
import type { AuthContextValue } from "../types/user.types";
import { useAuth } from "./useAuth";

const fakeAuth: AuthContextValue = {
  user: null, profile: null, isLoading: false, error: null,
  signInWithEmail: vi.fn(async () => undefined),
  registerWithEmail: vi.fn(async () => undefined),
  signInWithGoogle: vi.fn(async () => undefined),
  signOut: vi.fn(async () => undefined),
  clearAuthError: vi.fn(),
};
function wrapper({ children }: PropsWithChildren) {
  return <AuthContext.Provider value={fakeAuth}>{children}</AuthContext.Provider>;
}

describe("useAuth", () => {
  it("expone el estado y las acciones de sesión a través de Context", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(typeof result.current.signInWithGoogle).toBe("function");
  });
  it("falla con un mensaje claro si no está dentro de AuthProvider", () => {
    expect(() => renderHook(() => useAuth())).toThrow("useAuth debe utilizarse dentro de AuthProvider");
  });
});
