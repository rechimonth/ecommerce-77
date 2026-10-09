export type UserRole = "customer" | "admin";

// El perfil de Firestore complementa la identidad que Firebase Authentication valida.
export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt?: Date;
};

export type AuthContextValue = {
  user: import("firebase/auth").User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
};
