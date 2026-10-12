import { act, renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../../hooks/useAuth";

const mocks = vi.hoisted(() => ({
  auth: { currentUser: null as null | { getIdToken: () => Promise<string> } },
  db: { id: "test-db" },
  googleProvider: { id: "google-provider" },
  missingFirebaseVariables: [] as string[],
  profiles: new Map<string, Record<string, unknown>>(),
  authStateListener: null as null | ((user: unknown) => Promise<void>),
  sdk: {
    createUserWithEmailAndPassword: vi.fn(),
    onAuthStateChanged: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
    updateProfile: vi.fn(),
  },
  firestore: {
    doc: vi.fn((_db: unknown, ...parts: string[]) => ({ path: parts.join("/") })),
    runTransaction: vi.fn(),
    serverTimestamp: vi.fn(() => "server-timestamp"),
  },
}));

vi.mock("firebase/auth", () => mocks.sdk);
vi.mock("firebase/firestore", () => mocks.firestore);
vi.mock("../../config/firebase", () => ({
  auth: mocks.auth,
  db: mocks.db,
  googleProvider: mocks.googleProvider,
  missingFirebaseVariables: mocks.missingFirebaseVariables,
}));

import { AuthProvider } from "./AuthProvider";

const wrapper = ({ children }: PropsWithChildren) => <AuthProvider>{children}</AuthProvider>;
const user = (uid = "customer-1", email = "customer@example.test", displayName = "Customer") => ({
  uid, email, displayName,
});

function configureTransaction() {
  mocks.firestore.runTransaction.mockImplementation(async (_db, callback) => {
    const transaction = {
      get: vi.fn(async (ref: { path: string }) => {
        const found = mocks.profiles.get(ref.path);
        return { exists: () => Boolean(found), data: () => found ?? {} };
      }),
      set: vi.fn((ref: { path: string }, data: Record<string, unknown>) => {
        mocks.profiles.set(ref.path, data);
      }),
      update: vi.fn((ref: { path: string }, data: Record<string, unknown>) => {
        mocks.profiles.set(ref.path, { ...(mocks.profiles.get(ref.path) ?? {}), ...data });
      }),
    };
    return (callback as (tx: typeof transaction) => Promise<unknown>)(transaction);
  });
}

async function notifyAuthState(value: unknown) {
  const listener = mocks.authStateListener;
  if (!listener) throw new Error("El listener de autenticación no está registrado.");
  await act(async () => { await listener(value); });
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.profiles.clear();
    mocks.missingFirebaseVariables.length = 0;
    mocks.auth.currentUser = null;
    mocks.authStateListener = null;

    for (const method of Object.values(mocks.sdk)) method.mockReset();
    mocks.sdk.onAuthStateChanged.mockImplementation((_auth, callback) => {
      mocks.authStateListener = callback as (value: unknown) => Promise<void>;
      return vi.fn();
    });
    mocks.sdk.createUserWithEmailAndPassword.mockResolvedValue({ user: user() });
    mocks.sdk.signInWithEmailAndPassword.mockResolvedValue({ user: user() });
    mocks.sdk.signInWithPopup.mockResolvedValue({ user: user() });
    mocks.sdk.signOut.mockResolvedValue(undefined);
    mocks.sdk.updateProfile.mockResolvedValue(undefined);
    mocks.firestore.doc.mockImplementation((_db: unknown, ...parts: string[]) => ({ path: parts.join("/") }));
    mocks.firestore.serverTimestamp.mockReturnValue("server-timestamp");
    configureTransaction();
  });

  it("limpia usuario y perfil cuando Firebase informa que no hay sesión", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isLoading).toBe(true);
    await notifyAuthState(null);
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("crea transaccionalmente un perfil customer al recibir una cuenta sin perfil", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await notifyAuthState(user());
    expect(result.current.user?.uid).toBe("customer-1");
    expect(result.current.profile).toMatchObject({ uid: "customer-1", role: "customer" });
    expect(mocks.profiles.get("users/customer-1")).toMatchObject({
      uid: "customer-1", role: "customer", email: "customer@example.test", createdAt: "server-timestamp",
    });
    expect(mocks.firestore.runTransaction).toHaveBeenCalledTimes(1);
  });

  it("conserva el rol admin y solo sincroniza email y nombre permitidos", async () => {
    mocks.profiles.set("users/admin-1", {
      uid: "admin-1", email: "old@example.test", displayName: "Old", role: "admin", createdAt: "original",
    });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await notifyAuthState(user("admin-1", "admin@example.test", "Administrator"));

    expect(result.current.profile).toMatchObject({
      uid: "admin-1", role: "admin", email: "admin@example.test", displayName: "Administrator",
    });
    expect(mocks.profiles.get("users/admin-1")).toMatchObject({
      role: "admin", email: "admin@example.test", displayName: "Administrator", createdAt: "original",
    });
  });

  it("falla cerrado si el perfil no se puede leer", async () => {
    mocks.firestore.runTransaction.mockRejectedValue(new Error("permission denied"));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await notifyAuthState(user());

    expect(result.current.user?.uid).toBe("customer-1");
    expect(result.current.profile).toBeNull();
    expect(result.current.error).toMatch(/no pudimos leer tu perfil/i);
    expect(result.current.isLoading).toBe(false);
  });

  it("inicia sesión con email recortado y contraseña intacta", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { await result.current.signInWithEmail("  customer@example.test ", "password!"); });
    expect(mocks.sdk.signInWithEmailAndPassword).toHaveBeenCalledWith(mocks.auth, "customer@example.test", "password!");
    expect(result.current.error).toBeNull();
  });

  it("conserva diagnóstico seguro cuando falla el login por email", async () => {
    mocks.sdk.signInWithEmailAndPassword.mockRejectedValue({
      code: "auth/unauthorized-domain", message: "internal provider details",
    });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await expect(result.current.signInWithEmail("customer@example.test", "wrong"))
        .rejects.toMatchObject({ code: "auth/unauthorized-domain" });
    });
    expect(result.current.error).toMatch(/dominio/i);
    expect(result.current.error).not.toContain("internal provider details");
  });

  it("no llama a Firebase cuando faltan variables de configuración", async () => {
    mocks.missingFirebaseVariables.push("VITE_FIREBASE_API_KEY");
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await expect(result.current.signInWithEmail("customer@example.test", "password"))
        .rejects.toThrow(/VITE_FIREBASE_API_KEY/);
    });
    expect(mocks.sdk.signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it("registra la cuenta, actualiza el nombre y crea un perfil customer", async () => {
    const firebaseUser = user("new-user", "new@example.test", "");
    mocks.sdk.createUserWithEmailAndPassword.mockResolvedValue({ user: firebaseUser });
    mocks.sdk.updateProfile.mockImplementation(async (target, changes) => {
      Object.assign(target, changes);
    });
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.registerWithEmail("  New Customer  ", " new@example.test ", "password!");
    });

    expect(mocks.sdk.createUserWithEmailAndPassword).toHaveBeenCalledWith(mocks.auth, "new@example.test", "password!");
    expect(mocks.sdk.updateProfile).toHaveBeenCalledWith(firebaseUser, { displayName: "New Customer" });
    expect(mocks.profiles.get("users/new-user")).toMatchObject({ role: "customer", displayName: "New Customer" });
    expect(result.current.profile).toMatchObject({ uid: "new-user", role: "customer", displayName: "New Customer" });
  });

  it("propaga un error de registro como error tipado", async () => {
    mocks.sdk.createUserWithEmailAndPassword.mockRejectedValue({ code: "auth/email-already-in-use" });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await expect(result.current.registerWithEmail("Customer", "used@example.test", "password!"))
        .rejects.toMatchObject({ code: "auth/email-already-in-use" });
    });
    expect(result.current.error).toMatch(/ya existe una cuenta/i);
  });

  it("inicia Google y traduce errores de popup", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { await result.current.signInWithGoogle(); });
    expect(mocks.sdk.signInWithPopup).toHaveBeenCalledWith(mocks.auth, mocks.googleProvider);

    mocks.sdk.signInWithPopup.mockRejectedValueOnce({ code: "auth/popup-closed-by-user" });
    await act(async () => {
      await expect(result.current.signInWithGoogle()).rejects.toMatchObject({ code: "auth/popup-closed-by-user" });
    });
    expect(result.current.error).toBeTruthy();
  });

  it("cierra sesión, conserva errores de red y permite limpiar el mensaje", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { await result.current.signOut(); });
    expect(mocks.sdk.signOut).toHaveBeenCalledWith(mocks.auth);

    mocks.sdk.signOut.mockRejectedValueOnce({ code: "auth/network-request-failed" });
    await act(async () => {
      await expect(result.current.signOut()).rejects.toMatchObject({ code: "auth/network-request-failed" });
    });
    expect(result.current.error).toBeTruthy();
    act(() => result.current.clearAuthError());
    expect(result.current.error).toBeNull();
  });
});
