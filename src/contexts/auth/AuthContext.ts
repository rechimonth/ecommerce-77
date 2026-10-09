import { createContext } from "react";
import type { AuthContextValue } from "../../types/user.types";

// El contexto solo define el contrato público; la lógica vive en AuthProvider.
export const AuthContext = createContext<AuthContextValue | null>(null);
