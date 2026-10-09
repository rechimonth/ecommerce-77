import { useEffect, useRef, useState } from "react";
import { useCart } from "../../hooks/useCart";
import type { Product } from "../../types/product.types";
import { Button } from "../ui/Button";

const LABELS = {
  add: "Agregar al carrito",
  addAnother: "Agregar otro",
  added: "✓ Agregado",
  maxReached: "Máximo disponible",
  outOfStock: "Sin stock",
} as const;

type ButtonState = keyof typeof LABELS;

// Estado GLOBAL (carrito): viene del context.
// Estado LOCAL (feedback "✓ Agregado" por 1500 ms): vive solo en este componente.
export function AddToCartButton({ product }: { product: Product }) {
  const { items, addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);

  // Limpieza: si el componente se desmonta, se cancela el temporizador.
  useEffect(() => () => window.clearTimeout(timeoutRef.current), []);

  const quantityInCart =
    items.find((item) => item.product.id === product.id)?.quantity ?? 0;
  const isOutOfStock = product.stock <= 0;
  const reachedLimit = !isOutOfStock && quantityInCart >= product.stock;

  let state: ButtonState = "add";
  if (isOutOfStock) state = "outOfStock";
  else if (justAdded) state = "added";
  else if (reachedLimit) state = "maxReached";
  else if (quantityInCart > 0) state = "addAnother";

  // Agrega una unidad al Context y muestra una confirmación breve accesible por su etiqueta.
  const handleClick = () => {
    addItem(product);
    setJustAdded(true);
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <Button
      variant="solid"
      fullWidth
      size="sm"
      disabled={isOutOfStock || reachedLimit}
      onClick={handleClick}
    >
      {LABELS[state]}
    </Button>
  );
}
