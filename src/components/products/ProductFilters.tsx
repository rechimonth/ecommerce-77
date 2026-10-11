import { CATEGORIES } from "../../utils/categories";

type ProductFiltersProps = {
  searchText: string;
  categoryId: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
};

// Filtros accesibles y visibles, sin desplazar la navegación dentro de un menú oculto.
export function ProductFilters({
  searchText,
  categoryId,
  onSearchChange,
  onCategoryChange,
}: ProductFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Filtrar por categoría" className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {CATEGORIES.map((category) => {
            const selected = categoryId === category.id;
            return (
              <button
                key={category.id || "all"}
                type="button"
                aria-pressed={selected}
                onClick={() => onCategoryChange(category.id)}
                className={`border-b-2 pb-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#5e6046] ${selected ? "border-neutral-900 text-neutral-900" : "border-transparent text-neutral-500 hover:text-neutral-900"}`}
              >
                {category.id === "" ? "Todo" : category.label}
              </button>
            );
          })}
        </nav>

        <label className="relative block w-full sm:max-w-[320px]">
          <span className="sr-only">Buscar productos</span>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500">
            <circle cx="10.8" cy="10.8" r="6.3" stroke="currentColor" strokeWidth="1.5" />
            <path d="m15.5 15.5 4.2 4.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            aria-label="Buscar productos"
            placeholder="Buscar por nombre…"
            value={searchText}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-11 w-full border border-neutral-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
          />
        </label>
      </div>

      {searchText.trim() && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-600">
          <span>Buscando: <strong className="font-semibold text-neutral-900">{searchText.trim()}</strong></span>
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="font-semibold underline underline-offset-4 hover:text-neutral-950"
          >
            Borrar búsqueda
          </button>
        </div>
      )}
    </div>
  );
}
