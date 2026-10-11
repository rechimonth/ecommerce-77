import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { auth, db, googleProvider, missingFirebaseVariables } from "../../config/firebase";
import type { AuthContextValue, UserProfile, UserRole } from "../../types/user.types";
import { AuthContext } from "./AuthContext";
import {
  AuthOperationError,
  getAuthErrorCode,
  toAuthOperationError,
} from "./authErrors";

// Evita llamadas remotas confusas cuando el build se generó sin la configuración web mínima.
function assertFirebaseClientConfigured(): void {
  if (missingFirebaseVariables.length > 0) {
    throw new AuthOperationError(
      `Falta configuración de Firebase: ${missingFirebaseVariables.join(", ")}.`,
      "config/missing-firebase-variables",
    );
  }
}

// Crea un perfil de cliente solo si todavía no existe; nunca degrada a un administrador.
// Lee el perfil de Firestore; si falta, crea un perfil customer sin asignar privilegios administrativos.
async function ensureProfile(firebaseUser: import("firebase/auth").User): Promise<UserProfile> {
  const userRef = doc(db, "users", firebaseUser.uid);
  const snapshot = await getDoc(userRef);
  if (!snapshot.exists()) {
    const profile: UserProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email ?? "",
      displayName: firebaseUser.displayName ?? "",
      role: "customer",
    };
    await setDoc(userRef, { ...profile, createdAt: serverTimestamp() });
    return profile;
  }
  const data = snapshot.data();
  const role: UserRole = data.role === "admin" ? "admin" : "customer";
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email ?? data.email ?? "",
    displayName: firebaseUser.displayName ?? data.displayName ?? "",
    role,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<import("firebase/auth").User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Firebase comunica los cambios de sesión; hasta que el perfil se resuelve,
  // las rutas protegidas muestran carga en vez de redirigir por error.
  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!active) return;
      setIsLoading(true);
      try {
        if (!firebaseUser) {
          setUser(null);
          setProfile(null);
          setError(null);
          return;
        }
        const nextProfile = await ensureProfile(firebaseUser);
        if (active) {
          setUser(firebaseUser);
          setProfile(nextProfile);
          setError(null);
        }
      } catch (cause) {
        if (active) {
          // Fallar cerrado: sin perfil válido no se concede acceso administrativo.
          // Se muestra solo el código, no el mensaje interno completo del SDK.
          const code = getAuthErrorCode(cause);
          setUser(firebaseUser);
          setProfile(null);
          setError(
            `No pudimos leer tu perfil en Firestore. Verificá las reglas y volvé a iniciar sesión.${code ? ` (código técnico: ${code})` : ""}`,
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Inicia sesión con correo; conserva el código Firebase en los errores retornados al formulario.
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      assertFirebaseClientConfigured();
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (cause) {
      const actionError = toAuthOperationError(cause);
      setError(actionError.message);
      throw actionError;
    }
  }, []);

  // Registra solo clientes; el rol admin se concede manualmente desde un entorno confiable.
  const registerWithEmail = useCallback(async (name: string, email: string, password: string) => {
    setError(null);
    try {
      assertFirebaseClientConfigured();
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(credential.user, { displayName: name.trim() });
      const profile: UserProfile = {
        uid: credential.user.uid,
        email: credential.user.email ?? email.trim(),
        displayName: name.trim(),
        role: "customer",
      };
      await setDoc(doc(db, "users", credential.user.uid), {
        ...profile,
        createdAt: serverTimestamp(),
      });
      setProfile(profile);
    } catch (cause) {
      const actionError = toAuthOperationError(cause);
      setError(actionError.message);
      throw actionError;
    }
  }, []);

  // Abre el flujo oficial de Firebase/Google y deja que onAuthStateChanged sincronice el perfil.
  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      assertFirebaseClientConfigured();
      await signInWithPopup(auth, googleProvider);
    } catch (cause) {
      const actionError = toAuthOperationError(cause);
      setError(actionError.message);
      throw actionError;
    }
  }, []);

  // Cierra la sesión Firebase; el listener limpia el usuario y el perfil del Context.
  const signOut = useCallback(async () => {
    setError(null);
    try {
      await firebaseSignOut(auth);
    } catch (cause) {
      const actionError = toAuthOperationError(cause);
      setError(actionError.message);
      throw actionError;
    }
  }, []);

  const clearAuthError = useCallback(() => setError(null), []);
  const value = useMemo<AuthContextValue>(() => ({
    user, profile, isLoading, error, signInWithEmail, registerWithEmail,
    signInWithGoogle, signOut, clearAuthError,
  }), [user, profile, isLoading, error, signInWithEmail, registerWithEmail, signInWithGoogle, signOut, clearAuthError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
