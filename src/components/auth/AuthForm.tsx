import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/Button";

type AuthFormProps = { mode: "login" | "register" };

// Formulario compartido: mantener una sola validación para login y registro.
export function AuthForm({ mode }: AuthFormProps) {
  const isRegister = mode === "register";
  const { signInWithEmail, registerWithEmail, signInWithGoogle, error, clearAuthError } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/products";

  // Valida los campos y llama al método correspondiente según sea registro o inicio de sesión.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearAuthError();
    setLocalError(null);
    if (isRegister && name.trim().length < 2) { setLocalError("Ingresá tu nombre (al menos 2 caracteres)."); return; }
    if (password.length < 6) { setLocalError("La contraseña debe tener al menos 6 caracteres."); return; }
    setIsSubmitting(true);
    try {
      if (isRegister) await registerWithEmail(name, email, password);
      else await signInWithEmail(email, password);
      navigate(destination, { replace: true });
    } catch (cause) {
      setLocalError(cause instanceof Error ? cause.message : "No pudimos completar la operación.");
    } finally { setIsSubmitting(false); }
  }

  // Delegamos el acceso con Google al proveedor; Firebase se encarga del popup y la sesión.
  async function handleGoogle() {
    setLocalError(null);
    setIsSubmitting(true);
    try { await signInWithGoogle(); navigate(destination, { replace: true }); }
    catch (cause) { setLocalError(cause instanceof Error ? cause.message : "No pudimos entrar con Google."); }
    finally { setIsSubmitting(false); }
  }

  return <section className="mx-auto grid w-full max-w-md gap-6 py-8 sm:py-14">
    <div><p className="text-xs font-bold uppercase tracking-[.22em] text-amber-800">Rural Edition · Member access</p>
      <h1 className="mt-3 text-3xl font-black tracking-tight">{isRegister ? "Crear cuenta" : "Bienvenido de nuevo"}</h1>
      <p className="mt-2 text-sm text-neutral-600">{isRegister ? "Creá tu cuenta para guardar tus compras y seguir tus pedidos." : "Ingresá para continuar con tu selección."}</p></div>
    <form onSubmit={handleSubmit} className="grid gap-4">
      {isRegister && <label className="grid gap-1 text-sm font-semibold">Nombre y apellido
        <input required minLength={2} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="h-12 rounded border border-neutral-300 px-3 font-normal outline-none focus:border-black" /></label>}
      <label className="grid gap-1 text-sm font-semibold">Correo electrónico
        <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 rounded border border-neutral-300 px-3 font-normal outline-none focus:border-black" /></label>
      <label className="grid gap-1 text-sm font-semibold">Contraseña
        <input required type="password" minLength={6} autoComplete={isRegister ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 rounded border border-neutral-300 px-3 font-normal outline-none focus:border-black" /></label>
      {(localError || error) && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-800">{localError || error}</p>}
      <Button variant="solid" type="submit" fullWidth loading={isSubmitting}>{isRegister ? "Crear cuenta" : "Ingresar"}</Button>
    </form>
    <div className="flex items-center gap-3 text-xs text-neutral-400"><span className="h-px flex-1 bg-neutral-200" /> O CONTINUÁ CON <span className="h-px flex-1 bg-neutral-200" /></div>
    <Button variant="solid" fullWidth disabled={isSubmitting} onClick={() => void handleGoogle()}>Continuar con Google</Button>
    <p className="text-center text-sm text-neutral-600">{isRegister ? "¿Ya tenés cuenta?" : "¿Todavía no tenés cuenta?"}{" "}
      <Link className="font-bold text-black underline underline-offset-4" to={isRegister ? "/login" : "/register"}>{isRegister ? "Ingresar" : "Registrarme"}</Link></p>
  </section>;
}
