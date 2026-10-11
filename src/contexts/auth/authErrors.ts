// Traduce los códigos del SDK de Firebase sin perder el identificador técnico.
type ErrorWithCode = {
  code?: unknown;
};

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-email": "El correo electrónico no tiene un formato válido.",
  "auth/user-not-found": "No encontramos una cuenta con ese correo.",
  "auth/wrong-password": "La contraseña no es correcta.",
  "auth/invalid-credential": "El correo o la contraseña son incorrectos.",
  "auth/email-already-in-use": "Ya existe una cuenta con ese correo.",
  "auth/weak-password": "Elegí una contraseña de al menos 6 caracteres.",
  "auth/popup-closed-by-user": "Se cerró la ventana de Google antes de terminar.",
  "auth/popup-blocked": "El navegador bloqueó la ventana de Google. Permití las ventanas emergentes e intentá otra vez.",
  "auth/unauthorized-domain": "Este dominio no está autorizado en Firebase Authentication. Agregalo en Authentication → Settings → Authorized domains.",
  "auth/api-key-not-valid": "La API key web de Firebase no es válida. Revisá VITE_FIREBASE_API_KEY en el entorno usado para compilar.",
  "auth/invalid-api-key": "La API key web de Firebase no es válida. Revisá VITE_FIREBASE_API_KEY en el entorno usado para compilar.",
  "auth/network-request-failed": "No se pudo conectar con Firebase. Revisá tu conexión, bloqueadores y la disponibilidad del servicio.",
  "auth/too-many-requests": "Hubo demasiados intentos. Esperá un momento y volvé a probar.",
  "auth/operation-not-allowed": "Este método de acceso todavía no está habilitado en Firebase.",
  "auth/configuration-not-found": "Firebase Authentication no tiene una configuración válida para este proyecto.",
  "auth/unauthorized-continue-uri": "La URL de continuación no está autorizada en la configuración de Firebase.",
  "config/missing-firebase-variables": "Falta completar la configuración pública de Firebase para esta implementación.",
  "permission-denied": "Firebase rechazó la operación por permisos. Revisá las reglas y el acceso del usuario.",
  "firestore/permission-denied": "Firebase rechazó la operación por permisos. Revisá las reglas y el acceso del usuario.",
  "unavailable": "Firebase no está disponible temporalmente. Revisá la conexión e intentá nuevamente.",
  "firestore/unavailable": "Firebase no está disponible temporalmente. Revisá la conexión e intentá nuevamente.",
};

// Conserva el código y la causa original para facilitar el diagnóstico sin mostrar
// mensajes internos completos, tokens, credenciales ni otros datos sensibles.
export class AuthOperationError extends Error {
  readonly code: string | undefined;
  readonly originalCause: unknown;

  constructor(message: string, code?: string, originalCause?: unknown) {
    super(code ? `${message} (código técnico: ${code})` : message);
    this.name = "AuthOperationError";
    this.code = code;
    this.originalCause = originalCause;
  }
}

export function getAuthErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }

  const code = (error as ErrorWithCode).code;
  return typeof code === "string" && code.trim() ? code : undefined;
}

export function toAuthOperationError(error: unknown): AuthOperationError {
  // No volver a envolver un error propio: eso ocultaría otra vez su código original.
  if (error instanceof AuthOperationError) return error;

  const code = getAuthErrorCode(error);
  const message = code
    ? AUTH_ERROR_MESSAGES[code] ?? "No pudimos completar la operación. Revisá la conexión y la configuración de Firebase."
    : "No pudimos completar la operación. Revisá la conexión y la configuración de Firebase.";

  return new AuthOperationError(message, code, error);
}
