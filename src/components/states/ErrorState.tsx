import { Button } from "../ui/Button";

type ErrorStateProps = {
  message: string;
  onRetry: () => void;
};

// Mensaje de error accesible con una acción de reintento definida por la página que lo utiliza.
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return <div role="alert" className="flex flex-col items-center gap-3 py-16 text-center">
    <h3 className="text-lg font-bold">No pudimos cargar los datos</h3>
    <p className="max-w-sm text-sm text-neutral-500">{message}</p>
    <Button variant="solid" onClick={onRetry}>Reintentar</Button>
  </div>;
}
