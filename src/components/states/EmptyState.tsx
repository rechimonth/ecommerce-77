import { Button } from "../ui/Button";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
};

// Estado vacío reutilizable para explicar qué falta y ofrecer una próxima acción opcional.
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return <div className="flex flex-col items-center gap-3 py-16 text-center">
    <h3 className="text-lg font-bold">{title}</h3>
    {description && <p className="max-w-sm text-sm text-neutral-500">{description}</p>}
    {/* El botón se muestra solo si la pantalla provee una acción válida para continuar. */}
    {action && <Button variant="solid" onClick={action.onClick}>{action.label}</Button>}
  </div>;
}
