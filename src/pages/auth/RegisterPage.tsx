import { AuthForm } from "../../components/auth/AuthForm";

// Registro de cliente; el rol inicial siempre lo asigna la aplicación como customer.
export function RegisterPage() {
  return <AuthForm mode="register" />;
}
