import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import type { User } from "firebase/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext } from "../auth/AuthContext";
import type { AuthContextValue } from "../../types/user.types";
import type { Product } from "../../types/product.types";

const services = vi.hoisted(() => ({
  getUserCart: vi.fn(),
  saveUserCart: vi.fn(),
}));
vi.mock("../../services/cart.service", () => services);

import { CartProvider } from "./CartProvider";
import { useCart } from "../../hooks/useCart";

const product: Product = {
  id: "cart-product",
  name: "Producto de carrito",
  nameLower: "producto de carrito",
  image: "",
  description: "Prueba",
  price: 25,
  stock: 5,
  categoryId: "clothing",
};

function authFor(uid: string): AuthContextValue {
  const user = { uid, email: uid + "@example.test", displayName: "Cliente" } as User;
  return {
    user,
    profile: { uid, email: user.email ?? "", displayName: "Cliente", role: "customer" },
    isLoading: false,
    error: null,
    signInWithEmail: async () => undefined,
    registerWithEmail: async () => undefined,
    signInWithGoogle: async () => undefined,
    signOut: async () => undefined,
    clearAuthError: () => undefined,
  };
}

function wrapperFor(value: AuthContextValue | null) {
  return ({ children }: PropsWithChildren) => (
    <AuthContext.Provider value={value}>
      <CartProvider>{children}</CartProvider>
    </AuthContext.Provider>
  );
}

describe("CartProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    services.getUserCart.mockResolvedValue(null);
    services.saveUserCart.mockResolvedValue(undefined);
  });

  it("sin sesión mantiene el carrito local y no llama a Firestore", () => {
    const { result } = renderHook(() => useCart(), { wrapper: wrapperFor(null) });

    act(() => result.current.addItem(product));

    expect(result.current.itemCount).toBe(1);
    expect(result.current.total).toBe(25);
    expect(services.getUserCart).not.toHaveBeenCalled();
    expect(services.saveUserCart).not.toHaveBeenCalled();
  });

  it("hidrata el carrito remoto y sincroniza los cambios del usuario autenticado", async () => {
    services.getUserCart.mockResolvedValue({
      items: [{ product, quantity: 2, addedAt: new Date("2026-01-01T00:00:00.000Z") }],
      total: 50,
    });
    const { result } = renderHook(() => useCart(), { wrapper: wrapperFor(authFor("customer-a")) });

    await waitFor(() => expect(result.current.itemCount).toBe(2));
    expect(services.getUserCart).toHaveBeenCalledWith("customer-a");
    expect(result.current.total).toBe(50);

    act(() => result.current.addItem(product));
    await waitFor(() => expect(result.current.itemCount).toBe(3));
    await waitFor(() => expect(services.saveUserCart).toHaveBeenCalledWith(
      "customer-a",
      expect.objectContaining({ total: 75 }),
    ));
  });

  it("expone un error recuperable cuando no puede cargar el carrito de la nube", async () => {
    services.getUserCart.mockRejectedValue(new Error("permission-denied"));
    const { result } = renderHook(() => useCart(), { wrapper: wrapperFor(authFor("customer-a")) });

    await waitFor(() => expect(result.current.syncError).toMatch(/no pudimos sincronizar/i));
    expect(result.current.items).toEqual([]);
  });

  it("informa cuando el guardado remoto falla después de hidratar", async () => {
    services.getUserCart.mockResolvedValue(null);
    services.saveUserCart
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("network"));
    const { result } = renderHook(() => useCart(), { wrapper: wrapperFor(authFor("customer-a")) });

    await waitFor(() => expect(result.current.syncError).toMatch(/no pudimos guardar/i));
  });
});
