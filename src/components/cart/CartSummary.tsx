import { formatPrice } from "../../utils/formatPrice";
import { Button } from "../ui/Button";

type CartSummaryProps = {
  itemCount: number;
  total: number;
  onClear: () => void;
  onContinue: () => void;
};

export function CartSummary({ itemCount, total, onClear, onContinue }: CartSummaryProps) {
  return (
    <aside className="flex h-fit flex-col gap-4 rounded-sm bg-neutral-100 p-5">
      <h2 className="text-lg font-bold">Resumen</h2>
      <div className="flex justify-between text-sm text-neutral-500">
        <span>Artículos</span>
        <span>{itemCount}</span>
      </div>
      <div className="flex items-center justify-between border-t border-neutral-300 pt-4">
        <span className="text-sm font-bold">Total</span>
        <span className="text-xl font-black">{formatPrice(total)}</span>
      </div>
      <Button variant="solid" fullWidth onClick={onContinue}>
        Seguir comprando
      </Button>
      <button
        onClick={onClear}
        className="text-xs text-neutral-500 underline underline-offset-4 hover:text-black"
      >
        Vaciar carrito
      </button>
    </aside>
  );
}
