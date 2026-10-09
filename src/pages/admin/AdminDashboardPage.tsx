import { Link } from "react-router-dom";

// Punto de entrada pequeño y claro para las dos tareas del administrador.
export function AdminDashboardPage() {
  return <section>
    <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-800">Administración</p>
    <h1 className="mt-2 text-3xl font-black">Panel de control</h1>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">Gestioná el catálogo de moda rural y acompañá el estado de cada pedido. Los permisos también se validan con las reglas de Firestore, no solo con estas pantallas.</p>
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      <Link to="/admin/products" className="border border-neutral-200 p-5 transition hover:border-black"><p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Catálogo</p><h2 className="mt-2 text-xl font-black">Administrar productos →</h2><p className="mt-2 text-sm text-neutral-600">Crear, editar, eliminar y subir imágenes.</p></Link>
      <Link to="/admin/orders" className="border border-neutral-200 p-5 transition hover:border-black"><p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Operaciones</p><h2 className="mt-2 text-xl font-black">Gestionar pedidos →</h2><p className="mt-2 text-sm text-neutral-600">Filtrar pedidos y actualizar sus estados.</p></Link>
    </div>
  </section>;
}
