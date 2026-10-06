import { Link } from "react-router-dom";

type HeaderProps = {
  cartCount: number;
};

export function Header({ cartCount }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/products" className="text-xl font-black tracking-tight">
          ecommerce-77
        </Link>
        <Link
          to="/cart"
          aria-label={`Carrito, ${cartCount} artículos`}
          className="rounded-sm px-3 py-2 text-sm font-bold transition-colors hover:bg-neutral-100"
        >
          Carrito
          {cartCount > 0 && (
            <span className="ml-2 rounded-full bg-black px-2 py-0.5 text-xs text-white">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
