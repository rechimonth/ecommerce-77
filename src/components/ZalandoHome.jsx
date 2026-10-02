import { useState, useEffect } from "react";
import {
  Search, Heart, ShoppingBag, User, ChevronLeft, ChevronRight,
  Menu, X, ArrowRight, Truck, RotateCcw, CreditCard, Leaf,
} from "lucide-react";

const img = (id, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const PROMOS = [
  "Envío y devoluciones gratis en todos tus pedidos",
  "10% de descuento en tu primera compra con el código BIENVENIDO10",
  "Devoluciones gratuitas durante 100 días",
];

const SECTIONS = ["Mujer", "Hombre", "Niños"];
const CATEGORIES = ["Novedades", "Ropa", "Calzado", "Deporte", "Accesorios", "Marcas", "Rebajas"];
const BRANDS = ["Nike", "Adidas", "Levi's", "Mango", "Zara", "Puma", "Tommy Hilfiger", "Vans", "The North Face", "Calvin Klein"];

const HEROES = {
  Mujer: {
    title: "Otoño en clave urbana",
    text: "Abrigos, punto y capas esenciales para la nueva temporada.",
    cta: "Descubrir",
    main: img("photo-1496747611176-843222e1e57c", 1400),
    side: img("photo-1509631179647-0177331693ae", 900),
    sideTitle: "Hasta -50%",
    sideText: "Rebajas de temporada",
  },
  Hombre: {
    title: "Capas, denim y calle",
    text: "La silueta relajada que marca la temporada, de pies a cabeza.",
    cta: "Comprar ahora",
    main: img("photo-1516257984-b1b715536ca3", 1400),
    side: img("photo-1488161628813-04466f872be2", 900),
    sideTitle: "Nuevos básicos",
    sideText: "Desde 19,99 €",
  },
  Niños: {
    title: "Vuelta al cole con estilo",
    text: "Ropa cómoda y resistente para cada día de clase.",
    cta: "Descubrir",
    main: img("photo-1503919545889-aef636e10ad4", 1400),
    side: img("photo-1519238263530-99bdd11df2ea", 900),
    sideTitle: "Mini colección",
    sideText: "Hasta -30%",
  },
};

const PRODUCTS = [
  { id: 1, brand: "NIKE", name: "Sudadera con capucha Club Fleece", price: 54.99, old: 69.99, tag: "-20%", image: img("photo-1556821840-3a63f95609a7", 700) },
  { id: 2, brand: "LEVI'S", name: "Chaqueta vaquera Trucker", price: 89.95, tag: "Exclusivo", image: img("photo-1523205771623-e0faa4d2813d", 700) },
  { id: 3, brand: "MANGO", name: "Abrigo largo de lana mezcla", price: 119.99, tag: "Sostenible", image: img("photo-1539533018447-63fcce2678e3", 700) },
  { id: 4, brand: "ADIDAS ORIGINALS", name: "Zapatillas Samba OG", price: 99.99, image: img("photo-1549298916-b41d501d3772", 700) },
  { id: 5, brand: "ZARA", name: "Camisa oversize de popelín", price: 29.95, old: 39.95, tag: "-25%", image: img("photo-1591047139829-d91aecb6caea", 700) },
  { id: 6, brand: "TOMMY HILFIGER", name: "Jersey de punto con cuello redondo", price: 79.9, tag: "Sostenible", image: img("photo-1434389677669-e08b4cac3105", 700) },
  { id: 7, brand: "THE NORTH FACE", name: "Chaqueta acolchada Nuptse", price: 249.0, tag: "Exclusivo", image: img("photo-1544441893-675973e31985", 700) },
  { id: 8, brand: "VANS", name: "Zapatillas Old Skool", price: 64.99, old: 79.99, tag: "-19%", image: img("photo-1525966222134-fcfa99b8ae77", 700) },
];

const FOOTER_COLS = [
  { title: "Ayuda y contacto", links: ["Preguntas frecuentes", "Envíos", "Devoluciones", "Seguimiento de pedido", "Contacto"] },
  { title: "Ventajas Zalando", links: ["Devoluciones gratis", "Zalando Plus", "Tarjetas regalo", "Programa de fidelidad"] },
  { title: "Moda e inspiración", links: ["Tendencias", "Guía de tallas", "Looks de temporada", "Moda sostenible"] },
  { title: "Sobre nosotros", links: ["Quiénes somos", "Empleo", "Prensa", "Sostenibilidad"] },
];

const fmt = (n) => n.toFixed(2).replace(".", ",") + " €";

function Logo({ className = "" }) {
  return (
    <a href="#" className={`flex items-center gap-1.5 font-black tracking-tight text-black ${className}`} aria-label="Inicio">
      <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-[#FF6B00] text-lg leading-none text-white">z</span>
      <span className="text-2xl lowercase">zalando</span>
    </a>
  );
}

function TopBar({ section, setSection }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % PROMOS.length), 3500);
    return () => clearInterval(t);
  }, []);
  return (
    <div>
      <div className="flex h-9 items-center justify-center bg-black px-4 text-center text-xs font-normal text-white">
        <button aria-label="Mensaje anterior" onClick={() => setI((i + PROMOS.length - 1) % PROMOS.length)} className="mr-3 hidden opacity-70 transition-opacity hover:opacity-100 sm:block"><ChevronLeft size={14} /></button>
        <span key={i}>{PROMOS[i]}</span>
        <button aria-label="Mensaje siguiente" onClick={() => setI((i + 1) % PROMOS.length)} className="ml-3 hidden opacity-70 transition-opacity hover:opacity-100 sm:block"><ChevronRight size={14} /></button>
      </div>
      <div className="border-b border-[#E0E0E0] bg-white">
        <div className="mx-auto flex max-w-7xl">
          {SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={`border-b-2 px-5 py-2.5 text-sm transition-colors ${
                section === s ? "border-black font-bold text-black" : "border-transparent font-normal text-[#666666] hover:bg-[#F5F5F5] hover:text-black"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Navbar({ favCount, cartCount, onMenu }) {
  return (
    <div className="border-b border-[#E0E0E0] bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:gap-8">
        <button className="p-1 md:hidden" onClick={onMenu} aria-label="Abrir menú"><Menu size={24} /></button>
        <Logo />
        <div className="relative hidden flex-1 md:block">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666666]" />
          <input
            type="search"
            placeholder="Buscar artículos, marcas..."
            className="h-11 w-full rounded-sm bg-[#F0F0F0] pl-11 pr-4 text-sm text-black placeholder-[#666666] outline-none transition-colors hover:bg-[#E8E8E8] focus:bg-white focus:ring-2 focus:ring-black"
          />
        </div>
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <button className="rounded-sm p-2.5 transition-colors hover:bg-[#F5F5F5] md:hidden" aria-label="Buscar"><Search size={22} /></button>
          <button className="rounded-sm p-2.5 transition-colors hover:bg-[#F5F5F5]" aria-label="Cuenta"><User size={22} /></button>
          <button className="relative rounded-sm p-2.5 transition-colors hover:bg-[#F5F5F5]" aria-label="Favoritos">
            <Heart size={22} />
            {favCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF6B00] px-1 text-[10px] font-bold text-white">{favCount}</span>
            )}
          </button>
          <button className="relative rounded-sm p-2.5 transition-colors hover:bg-[#F5F5F5]" aria-label="Cesta">
            <ShoppingBag size={22} />
            {cartCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[10px] font-bold text-white">{cartCount}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function SubNav() {
  return (
    <nav className="hidden border-b border-[#E0E0E0] bg-white md:block" aria-label="Categorías">
      <ul className="mx-auto flex max-w-7xl gap-1 px-4">
        {CATEGORIES.map((c) => (
          <li key={c}>
            <a
              href="#"
              className={`block border-b-2 border-transparent px-3 py-3 text-sm transition-colors hover:border-black ${
                c === "Rebajas" ? "font-bold text-[#E4002B]" : "font-medium text-black"
              }`}
            >
              {c}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function MobileMenu({ open, onClose, section, setSection }) {
  return (
    <div className={`fixed inset-0 z-50 md:hidden ${open ? "" : "pointer-events-none"}`}>
      <div onClick={onClose} className={`absolute inset-0 bg-black/50 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} />
      <aside className={`absolute left-0 top-0 h-full w-72 bg-white transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-[#E0E0E0] p-4">
          <Logo />
          <button onClick={onClose} aria-label="Cerrar menú"><X size={22} /></button>
        </div>
        <div className="flex border-b border-[#E0E0E0]">
          {SECTIONS.map((s) => (
            <button key={s} onClick={() => setSection(s)} className={`flex-1 border-b-2 py-3 text-sm ${section === s ? "border-black font-bold" : "border-transparent text-[#666666]"}`}>{s}</button>
          ))}
        </div>
        <ul>
          {CATEGORIES.map((c) => (
            <li key={c}>
              <a href="#" className={`flex items-center justify-between border-b border-[#F0F0F0] px-4 py-4 text-sm transition-colors hover:bg-[#F5F5F5] ${c === "Rebajas" ? "font-bold text-[#E4002B]" : "font-medium"}`}>
                {c}<ChevronRight size={16} className="text-[#666666]" />
              </a>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

function Hero({ section }) {
  const h = HEROES[section];
  return (
    <section className="mx-auto grid max-w-7xl gap-2 px-0 md:grid-cols-3 md:px-4 md:pt-4">
      <a href="#" className="group relative block aspect-[4/5] overflow-hidden bg-[#F5F5F5] md:col-span-2 md:aspect-auto md:min-h-[560px] md:rounded-sm">
        <img key={h.main} src={h.main} alt={h.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 text-white md:p-10">
          <h1 className="max-w-md text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">{h.title}</h1>
          <p className="mt-3 max-w-sm text-sm md:text-base">{h.text}</p>
          <span className="mt-5 inline-flex items-center gap-2 rounded-sm bg-white px-6 py-3 text-sm font-bold text-black transition-colors group-hover:bg-black group-hover:text-white">
            {h.cta} <ArrowRight size={16} />
          </span>
        </div>
      </a>
      <a href="#" className="group relative hidden overflow-hidden bg-[#F5F5F5] md:block md:rounded-sm">
        <img key={h.side} src={h.side} alt={h.sideTitle} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 text-white">
          <span className="rounded-sm bg-[#FF6B00] px-2 py-1 text-xs font-bold">Oferta</span>
          <h2 className="mt-3 text-3xl font-black leading-tight">{h.sideTitle}</h2>
          <p className="mt-1 text-sm">{h.sideText}</p>
          <span className="mt-4 inline-block rounded-sm bg-black px-5 py-2.5 text-sm font-bold text-white transition-colors group-hover:bg-white group-hover:text-black">Comprar ahora</span>
        </div>
      </a>
    </section>
  );
}

function Brands() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <h2 className="mb-4 text-xl font-bold md:text-2xl">Tus marcas favoritas</h2>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2" style={{ scrollbarWidth: "none" }}>
        {BRANDS.map((b) => (
          <a key={b} href="#" className="flex h-20 min-w-[150px] items-center justify-center rounded-sm border border-[#E0E0E0] bg-white px-4 text-center text-sm font-black uppercase tracking-wide text-black transition-colors hover:border-black hover:bg-[#F5F5F5]">
            {b}
          </a>
        ))}
      </div>
    </section>
  );
}

function ProductCard({ p, faved, onFav }) {
  return (
    <article className="group">
      <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-[#F5F5F5]">
        <img src={p.image} alt={`${p.brand} ${p.name}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <button
          onClick={() => onFav(p.id)}
          aria-pressed={faved}
          aria-label={faved ? "Quitar de favoritos" : "Añadir a favoritos"}
          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 transition hover:scale-110 hover:bg-white"
        >
          <Heart size={18} className={faved ? "fill-[#E4002B] text-[#E4002B]" : "text-black"} />
        </button>
        {p.tag && (
          <span className={`absolute left-2 top-2 rounded-sm px-2 py-1 text-[11px] font-bold ${p.tag.startsWith("-") ? "bg-[#FF6B00] text-white" : "bg-white text-black"}`}>
            {p.tag === "Sostenible" && <Leaf size={10} className="mr-1 inline -mt-0.5" />}
            {p.tag}
          </span>
        )}
      </div>
      <div className="mt-3 space-y-0.5">
        <p className="text-sm font-bold uppercase text-black">{p.brand}</p>
        <p className="truncate text-sm font-normal text-[#666666]">{p.name}</p>
        <p className="pt-1 text-sm">
          <span className={`font-bold ${p.old ? "text-[#E4002B]" : "text-black"}`}>{fmt(p.price)}</span>
          {p.old && <span className="ml-2 text-xs text-[#E4002B] line-through">{fmt(p.old)}</span>}
        </p>
      </div>
    </article>
  );
}

function ProductGrid({ favs, toggleFav }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-12">
      <div className="mb-5 flex items-end justify-between">
        <h2 className="text-xl font-bold md:text-2xl">Novedades y tendencias</h2>
        <a href="#" className="flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline">Ver todo <ArrowRight size={14} /></a>
      </div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-8 min-[480px]:grid-cols-2 lg:grid-cols-4">
        {PRODUCTS.map((p) => (
          <ProductCard key={p.id} p={p} faved={favs.includes(p.id)} onFav={toggleFav} />
        ))}
      </div>
    </section>
  );
}

function Mosaic() {
  const Tile = ({ src, title, text, cta, className, dark }) => (
    <a href="#" className={`group relative block overflow-hidden rounded-sm bg-[#F5F5F5] ${className}`}>
      <img src={src} alt={title} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className={`absolute inset-0 ${dark ? "bg-black/30" : "bg-gradient-to-t from-black/55 to-transparent"}`} />
      <div className="absolute bottom-0 left-0 p-6 text-white md:p-8">
        <h3 className="text-2xl font-black leading-tight md:text-4xl">{title}</h3>
        <p className="mt-2 max-w-xs text-sm">{text}</p>
        <span className="mt-4 inline-block rounded-sm bg-white px-5 py-2.5 text-sm font-bold text-black transition-colors group-hover:bg-black group-hover:text-white">{cta}</span>
      </div>
    </a>
  );
  return (
    <section className="mx-auto max-w-7xl px-4 pb-14">
      <h2 className="mb-5 text-xl font-bold md:text-2xl">Inspírate</h2>
      <div className="grid gap-3 md:grid-cols-5">
        <Tile src={img("photo-1445205170230-053b83016050", 1100)} title="El armario cápsula" text="Diez prendas, cien looks. Guía de básicos para esta temporada." cta="Descubrir" className="min-h-[420px] md:col-span-3 md:min-h-[520px]" />
        <div className="grid gap-3 md:col-span-2">
          <Tile src={img("photo-1529139574466-a303027c1d8b", 900)} title="Street style" text="Siluetas amplias y colores tierra." cta="Comprar ahora" className="min-h-[250px]" dark />
          <Tile src={img("photo-1483985988355-763728e1935b", 900)} title="Rebajas" text="Hasta -70% en marcas seleccionadas." cta="Ver ofertas" className="min-h-[250px]" />
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <footer className="bg-white">
      <div className="bg-black px-4 py-12 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-black md:text-3xl">Consigue un 10% de descuento</h2>
            <p className="mt-1 text-sm text-[#E0E0E0]">Suscríbete a la newsletter y recibe novedades y ofertas exclusivas.</p>
          </div>
          {sent ? (
            <p className="text-sm font-bold">¡Gracias! Revisa tu correo para canjear el descuento.</p>
          ) : (
            <div className="flex w-full max-w-md">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Tu correo electrónico"
                aria-label="Correo electrónico"
                className="h-12 flex-1 rounded-l-sm bg-white px-4 text-sm text-black outline-none focus:ring-2 focus:ring-[#FF6B00]"
              />
              <button onClick={() => email.includes("@") && setSent(true)} className="h-12 rounded-r-sm bg-[#FF6B00] px-6 text-sm font-bold text-white transition-colors hover:bg-[#E55F00]">Suscribirme</button>
            </div>
          )}
        </div>
      </div>

      <div className="border-b border-[#E0E0E0]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-3">
          {[
            [Truck, "Envío gratis", "En pedidos desde 24,90 €"],
            [RotateCcw, "Devoluciones gratuitas", "Hasta 100 días para decidir"],
            [CreditCard, "Pago seguro", "Tarjeta, PayPal, Bizum y más"],
          ].map(([Icon, t, d]) => (
            <div key={t} className="flex items-center gap-4">
              <Icon size={28} strokeWidth={1.5} />
              <div><p className="text-sm font-bold">{t}</p><p className="text-sm text-[#666666]">{d}</p></div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {FOOTER_COLS.map((c) => (
          <div key={c.title}>
            <h3 className="mb-3 text-sm font-bold">{c.title}</h3>
            <ul className="space-y-2">
              {c.links.map((l) => (
                <li key={l}><a href="#" className="text-sm text-[#666666] transition-colors hover:text-black hover:underline">{l}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-8">
        <p className="mb-2 text-xs font-bold">Métodos de pago</p>
        <div className="flex flex-wrap gap-2">
          {["VISA", "Mastercard", "PayPal", "Bizum", "Klarna", "Transferencia"].map((m) => (
            <span key={m} className="rounded-sm border border-[#E0E0E0] px-3 py-1.5 text-xs font-bold text-[#666666]">{m}</span>
          ))}
        </div>
      </div>

      <div className="border-t border-[#E0E0E0] bg-[#F5F5F5] px-4 py-5">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 text-xs text-[#666666] md:flex-row md:justify-between">
          <p>© 2026 Réplica visual con fines educativos. Proyecto de práctica, no afiliado a la marca original.</p>
          <div className="flex gap-4">
            {["Aviso legal", "Privacidad", "Cookies", "Condiciones"].map((l) => (
              <a key={l} href="#" className="hover:text-black hover:underline">{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function ZalandoHome() {
  const [section, setSection] = useState("Mujer");
  const [favs, setFavs] = useState([]);
  const [menu, setMenu] = useState(false);
  const toggleFav = (id) => setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  return (
    <div className="min-h-screen bg-white font-sans text-black antialiased" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      <header className="sticky top-0 z-40 bg-white">
        <TopBar section={section} setSection={setSection} />
        <Navbar favCount={favs.length} cartCount={0} onMenu={() => setMenu(true)} />
        <SubNav />
      </header>
      <MobileMenu open={menu} onClose={() => setMenu(false)} section={section} setSection={setSection} />
      <main>
        <Hero section={section} />
        <Brands />
        <ProductGrid favs={favs} toggleFav={toggleFav} />
        <Mosaic />
      </main>
      <Footer />
    </div>
  );
}
