import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ProductFilters } from "../../components/products/ProductFilters";
import { ProductGrid } from "../../components/products/ProductGrid";
import { EmptyState } from "../../components/states/EmptyState";
import { ErrorState } from "../../components/states/ErrorState";
import { LoadingState } from "../../components/states/LoadingState";
import { Button } from "../../components/ui/Button";
import { useProducts } from "../../contexts/products";

// Catálogo editorial con filtro por categoría, búsqueda con debounce y paginación.
export function ProductsPage() {
  const {
    products, isLoading, isLoadingMore, error, hasNextPage, searchText, categoryId,
    loadProducts, setSearchText, setCategoryId, resetFilters,
  } = useProducts();
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get("category");

  // Permite que las categorías de la navegación también funcionen al abrir un enlace directo.
  useEffect(() => {
    if (categoryFromUrl === "clothing" || categoryFromUrl === "shoes" || categoryFromUrl === "accessories") {
      setCategoryId(categoryFromUrl);
    }
  }, [categoryFromUrl, setCategoryId]);

  const hasFilters = Boolean(searchText.trim() || categoryId);
  return <section className="flex flex-col gap-7 sm:gap-9">
    <div className="relative isolate min-h-[280px] overflow-hidden bg-[#343329] text-white sm:min-h-[390px] lg:min-h-[450px]" style={{ backgroundImage: "linear-gradient(90deg,rgba(24,23,18,.87) 0%,rgba(24,23,18,.52) 52%,rgba(24,23,18,.1) 100%),url('https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1800&q=85')", backgroundPosition: "center 35%", backgroundSize: "cover" }}>
      <div className="flex min-h-[280px] max-w-2xl flex-col items-start justify-center px-6 py-8 sm:min-h-[390px] sm:px-10 lg:min-h-[450px] lg:px-14">
        <p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#e0c89e] sm:text-xs">The countryside, reimagined</p>
        <h1 className="mt-4 max-w-xl text-4xl font-black leading-[.98] tracking-[-.055em] sm:text-6xl lg:text-7xl">Tradición que marca el presente.</h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-stone-100 sm:text-base">Piezas atemporales, texturas nobles y una actitud libre. Descubrí nuestra selección de moda rural.</p>
        <a href="#catalogo" className="mt-6 inline-flex min-h-11 items-center bg-white px-5 text-xs font-black uppercase tracking-[.12em] text-black transition hover:bg-[#e0c89e]">Explorar colección</a>
      </div>
      <div className="absolute bottom-4 right-4 hidden text-right text-[9px] font-semibold uppercase tracking-[.18em] text-white/80 sm:block">Field notes · No. 01</div>
    </div>

    <div className="grid gap-4 border-b border-neutral-200 pb-7 sm:grid-cols-3">
      <div className="border-l-2 border-[#877253] pl-3"><p className="text-xs font-black uppercase tracking-[.12em]">Materiales nobles</p><p className="mt-1 text-xs text-neutral-500">Lana, algodón encerado y cuero.</p></div>
      <div className="border-l-2 border-[#877253] pl-3"><p className="text-xs font-black uppercase tracking-[.12em]">Inspiración ecuestre</p><p className="mt-1 text-xs text-neutral-500">Clásicos reinterpretados sin temporada.</p></div>
      <div className="border-l-2 border-[#877253] pl-3"><p className="text-xs font-black uppercase tracking-[.12em]">Selección curada</p><p className="mt-1 text-xs text-neutral-500">Diseño para campo y ciudad.</p></div>
    </div>

    <div id="catalogo" className="scroll-mt-44">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[.2em] text-amber-800">Shop the edit</p><h2 className="mt-2 text-3xl font-black tracking-tight">La colección</h2></div>
        <p className="text-xs text-neutral-500">Precios en USD · {products.length} productos en esta página</p>
      </div>
      <div className="mt-5"><ProductFilters searchText={searchText} categoryId={categoryId} onSearchChange={setSearchText} onCategoryChange={setCategoryId} /></div>
      {isLoading && <LoadingState message="Buscando piezas de la colección…" />}
      {!isLoading && error && <ErrorState message={error} onRetry={() => void loadProducts({ reset: true })} />}
      {!isLoading && !error && products.length === 0 && <EmptyState title={hasFilters ? "No encontramos esa pieza" : "La colección todavía está vacía"} description={hasFilters ? "Probá con otro término o categoría." : "Volvé más tarde para descubrir nuevas piezas."} action={hasFilters ? { label: "Limpiar filtros", onClick: resetFilters } : undefined} />}
      {!isLoading && !error && products.length > 0 && <>
        <div className="mt-6"><ProductGrid products={products} /></div>
        <div className="mt-9 flex justify-center"><Button variant="solid" loading={isLoadingMore} disabled={!hasNextPage} onClick={() => void loadProducts()}>{hasNextPage ? "Cargar más productos" : "Llegaste al final de la colección"}</Button></div>
      </>}
    </div>
  </section>;
}
