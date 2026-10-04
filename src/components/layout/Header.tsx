type HeaderProps = {
  cartCount: number;
  onOpenCart: () => void;
};

export function Header({ cartCount, onOpenCart }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <a href="/" className="text-xl font-black tracking-tight">
          ecommerce-77
        </a>
        <button
          onClick={onOpenCart}
          aria-label="Abrir carrito"
          className="relative rounded-sm px-3 py-2 text-sm font-bold transition-colors hover:bg-neutral-100"
        >
          Carrito
          {cartCount > 0 && (
            <span className="ml-2 rounded-full bg-black px-2 py-0.5 text-xs text-white">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
