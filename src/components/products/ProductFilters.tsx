import { CATEGORIES } from "../../utils/categories";

type ProductFiltersProps = {
  searchText: string;
  categoryId: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
};

// Filtros controlados por ProductsProvider: este componente solo informa cambios de búsqueda/categoría.
export function ProductFilters({
  searchText,
  categoryId,
  onSearchChange,
  onCategoryChange,
}: ProductFiltersProps) {
  return <div className="flex flex-col gap-3 sm:flex-row">
    <label className="flex-1">
      <span className="sr-only">Buscar productos</span>
      <input
        aria-label="Buscar productos"
        placeholder="Buscar (mín. 2 letras)"
        value={searchText}
        onChange={(event) => onSearchChange(event.target.value)}
        className="h-11 w-full rounded-sm bg-neutral-100 px-4 text-sm outline-none focus:ring-2 focus:ring-black"
      />
    </label>
    <label>
      <span className="sr-only">Categoría</span>
      <select
        aria-label="Categoría"
        value={categoryId}
        onChange={(event) => onCategoryChange(event.target.value)}
        className="h-11 w-full rounded-sm bg-neutral-100 px-3 text-sm outline-none focus:ring-2 focus:ring-black sm:w-auto"
      >
        {CATEGORIES.map((category) => (
          <option key={category.id} value={category.id}>{category.label}</option>
        ))}
      </select>
    </label>
  </div>;
}
