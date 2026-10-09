import { useContext } from "react";
import { AuthContext } from "../contexts/auth/AuthContext";
import type { AuthContextValue } from "../types/user.types";

// Hook único para leer sesión y ejecutar acciones; evita importar Firebase en cada página.
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth debe utilizarse dentro de AuthProvider");
  return value;
}
