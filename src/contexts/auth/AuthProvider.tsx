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
import { auth, db, googleProvider } from "../../config/firebase";
import type { AuthContextValue, UserProfile, UserRole } from "../../types/user.types";
import { AuthContext } from "./AuthContext";

// Traduce algunos errores habituales de Firebase a mensajes que una persona pueda resolver.
function authErrorMessage(error: unknown): string {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String((error as { code: unknown }).code)
    : "";
  const messages: Record<string, string> = {
    "auth/invalid-email": "El correo electrónico no tiene un formato válido.",
    "auth/user-not-found": "No encontramos una cuenta con ese correo.",
    "auth/wrong-password": "La contraseña no es correcta.",
    "auth/invalid-credential": "El correo o la contraseña son incorrectos.",
    "auth/email-already-in-use": "Ya existe una cuenta con ese correo.",
    "auth/weak-password": "Elegí una contraseña de al menos 6 caracteres.",
    "auth/popup-closed-by-user": "Se cerró la ventana de Google antes de terminar.",
    "auth/too-many-requests": "Hubo demasiados intentos. Esperá un momento y volvé a probar.",
    "auth/operation-not-allowed": "Este método de acceso todavía no está habilitado en Firebase.",
  };
  return messages[code] ?? "No pudimos completar la autenticación. Revisá tu conexión y la configuración de Firebase.";
}

// Crea un perfil de cliente solo si todavía no existe; nunca degrada a un administrador.
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
      } catch {
        if (active) {
          // Fallar cerrado: sin perfil válido no se concede acceso administrativo.
          setUser(firebaseUser);
          setProfile(null);
          setError("No pudimos leer tu perfil en Firestore. Verificá las reglas y volvé a iniciar sesión.");
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

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (cause) {
      const message = authErrorMessage(cause);
      setError(message);
      throw new Error(message);
    }
  }, []);

  const registerWithEmail = useCallback(async (name: string, email: string, password: string) => {
    setError(null);
    try {
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
      const message = authErrorMessage(cause);
      setError(message);
      throw new Error(message);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (cause) {
      const message = authErrorMessage(cause);
      setError(message);
      throw new Error(message);
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      await firebaseSignOut(auth);
    } catch (cause) {
      const message = authErrorMessage(cause);
      setError(message);
      throw new Error(message);
    }
  }, []);

  const clearAuthError = useCallback(() => setError(null), []);
  const value = useMemo<AuthContextValue>(() => ({
    user, profile, isLoading, error, signInWithEmail, registerWithEmail,
    signInWithGoogle, signOut, clearAuthError,
  }), [user, profile, isLoading, error, signInWithEmail, registerWithEmail, signInWithGoogle, signOut, clearAuthError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
