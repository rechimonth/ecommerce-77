import { useEffect, type ReactNode } from "react";
import { Button } from "./Button";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

// Modal controla el overlay y el cierre; quien lo llama decide el contenido mediante children.
export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // Escape cierra el diálogo; el listener se elimina para evitar eventos después del cierre.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return <div
    className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
    onClick={onClose}
  >
    {/* Evita que un clic dentro del diálogo se propague al overlay y lo cierre accidentalmente. */}
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title ?? "Ventana de diálogo"}
      className="flex max-h-[90vh] w-full flex-col gap-4 overflow-hidden rounded-t-md bg-white p-5 sm:max-w-lg sm:rounded-sm"
      onClick={(event) => event.stopPropagation()}
    >
      {title && <h2 className="text-lg font-bold">{title}</h2>}
      <div className="overflow-y-auto">{children}</div>
      <Button variant="solid" onClick={onClose}>Cerrar</Button>
    </div>
  </div>;
}
