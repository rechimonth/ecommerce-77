import { Link } from "react-router-dom";

// Portada editorial preservada de la identidad visual Rural Edition.
export function HomePage() {
  return (
    <section className="flex flex-col gap-8 sm:gap-10">
      <header
        className="relative isolate min-h-[390px] overflow-hidden bg-[#182c28] text-white sm:min-h-[430px] lg:min-h-[450px]"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(15,30,27,.88) 0%, rgba(15,30,27,.62) 43%, rgba(15,30,27,.08) 100%), url('https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1800&q=85')",
          backgroundPosition: "center 35%",
          backgroundSize: "cover",
        }}
      >
        <div className="flex min-h-[390px] max-w-2xl flex-col items-start justify-center px-6 py-10 sm:min-h-[430px] sm:px-10 lg:min-h-[450px] lg:px-14">
          <p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#e0c89e] sm:text-xs">
            The countryside, reimagined
          </p>
          <h1 className="mt-5 max-w-[490px] text-5xl font-black leading-[.98] tracking-[-.055em] sm:text-6xl lg:text-7xl">
            Tradición que marca el presente.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-white sm:text-base">
            Piezas atemporales, texturas nobles y una actitud libre. Descubrí nuestra selección de moda rural.
          </p>
          <Link
            to="/products"
            className="mt-7 inline-flex min-h-11 items-center justify-center bg-white px-5 py-3 text-[11px] font-black uppercase tracking-[.12em] text-black transition-colors hover:bg-[#e0c89e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Explorar colección
          </Link>
        </div>
        <div className="absolute bottom-4 right-4 hidden text-right text-[9px] font-semibold uppercase tracking-[.18em] text-white/90 sm:block">
          Field notes · No. 01
        </div>
      </header>

      <section aria-label="Nuestra propuesta" className="grid gap-5 border-b border-neutral-200 pb-8 sm:grid-cols-3 sm:gap-7">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[.12em]">Materiales nobles</h2>
          <p className="mt-2 text-xs leading-5 text-neutral-600">Lana, algodón encerado y cuero, elegidos por su carácter y durabilidad.</p>
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[.12em]">Inspiración ecuestre</h2>
          <p className="mt-2 text-xs leading-5 text-neutral-600">Clásicos reinterpretados con una mirada contemporánea y sin temporada.</p>
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[.12em]">Campo y ciudad</h2>
          <p className="mt-2 text-xs leading-5 text-neutral-600">Una selección pensada para acompañarte en cada parte del camino.</p>
        </div>
      </section>

      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Encontrá tu próxima pieza.</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-600">Explorá la colección de indumentaria, calzado y accesorios de Rural Edition.</p>
        </div>
        <Link to="/products" className="inline-flex min-h-11 shrink-0 items-center justify-center border border-neutral-900 px-5 py-3 text-xs font-bold uppercase tracking-[.1em] transition-colors hover:bg-neutral-900 hover:text-white">
          Ver catálogo
        </Link>
      </section>
    </section>
  );
}
