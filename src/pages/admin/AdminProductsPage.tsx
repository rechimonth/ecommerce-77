import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../../hooks/useAuth";
import { createProduct, deleteProduct, listProducts, updateProduct, type ProductInput } from "../../services/products.service";
import { uploadProductImage } from "../../services/upload.service";
import { CATEGORIES } from "../../utils/categories";
import { formatPrice } from "../../utils/formatPrice";
import type { CategoryId, Product } from "../../types/product.types";
import { ProductImage } from "../../components/products/ProductImage";
import { LoadingState } from "../../components/states/LoadingState";

type ProductForm = { name: string; description: string; categoryId: CategoryId; price: string; stock: string; image: string };
const emptyForm: ProductForm = { name: "", description: "", categoryId: "clothing", price: "", stock: "", image: "" };

// CRUD de productos: las reglas de Firestore y la función S3 verifican de nuevo el rol admin.
export function AdminProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try { const result = await listProducts({ pageSize: 100 }); setProducts(result.items); setError(null); }
    catch { setError("No pudimos cargar el catálogo. Revisá tu rol admin y las reglas de Firestore."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  function startNew() {
    setEditing(null); setForm(emptyForm); setFile(null); setNotice(null); setError(null);
  }
  function startEdit(product: Product) {
    setEditing(product);
    setForm({ name: product.name, description: product.description, categoryId: product.categoryId,
      price: String(product.price), stock: String(product.stock), image: product.image });
    setFile(null); setNotice(null); setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) { setError("Tu sesión expiró. Volvé a ingresar."); return; }
    const price = Number(form.price);
    const stock = Number(form.stock);
    if (!Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
      setError("El precio debe ser válido y el stock debe ser un entero igual o mayor que cero."); return;
    }
    setSaving(true); setError(null); setNotice(null);
    try {
      let image = form.image.trim();
      if (file) image = await uploadProductImage(file, await user.getIdToken());
      if (!image) throw new Error("Ingresá una URL de imagen o subí un archivo.");
      const input: ProductInput = { name: form.name.trim(), nameLower: form.name.trim().toLocaleLowerCase("es"),
        description: form.description.trim(), categoryId: form.categoryId, price, stock, image };
      const wasEditing = Boolean(editing);
      if (editing) await updateProduct(editing.id, input); else await createProduct(input);
      startNew();
      setNotice(wasEditing ? "Producto actualizado correctamente." : "Producto creado correctamente.");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar el producto.");
    } finally { setSaving(false); }
  }
  async function handleDelete(product: Product) {
    if (!window.confirm("¿Querés eliminar “" + product.name + "”? Esta acción no se puede deshacer.")) return;
    setError(null);
    try {
      await deleteProduct(product.id);
      if (editing?.id === product.id) startNew();
      setNotice("Producto eliminado.");
      await refresh();
    } catch { setError("No se pudo eliminar el producto. Verificá los permisos de Firestore."); }
  }

  return <section>
    <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-800">Catálogo</p>
    <h1 className="mt-2 text-3xl font-black">Productos</h1>
    <p className="mt-2 text-sm text-neutral-600">Los precios se muestran en dólares estadounidenses (USD).</p>
    {error && <p role="alert" className="mt-4 rounded bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {notice && <p role="status" className="mt-4 rounded bg-green-50 p-3 text-sm text-green-900">{notice}</p>}
    <form onSubmit={handleSubmit} className="mt-6 grid gap-4 border border-neutral-200 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3"><h2 className="text-lg font-black">{editing ? "Editar producto" : "Agregar producto"}</h2>{editing && <button type="button" onClick={startNew} className="text-xs font-bold underline">Cancelar edición</button>}</div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold">Nombre<input required minLength={2} maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="h-11 rounded border border-neutral-300 px-3 font-normal" /></label>
        <label className="grid gap-1 text-sm font-semibold">Categoría<select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value as CategoryId })} className="h-11 rounded border border-neutral-300 px-3 font-normal">{CATEGORIES.filter((item) => item.id).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label className="grid gap-1 text-sm font-semibold">Precio (USD)<input required type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className="h-11 rounded border border-neutral-300 px-3 font-normal" /></label>
        <label className="grid gap-1 text-sm font-semibold">Stock<input required type="number" min="0" step="1" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} className="h-11 rounded border border-neutral-300 px-3 font-normal" /></label>
      </div>
      <label className="grid gap-1 text-sm font-semibold">Descripción<textarea required minLength={5} maxLength={1000} rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="rounded border border-neutral-300 px-3 py-2 font-normal" /></label>
      <label className="grid gap-1 text-sm font-semibold">URL de imagen existente<input type="url" value={form.image.startsWith("s3://") ? "" : form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} placeholder="https://…" className="h-11 rounded border border-neutral-300 px-3 font-normal" /><span className="text-xs font-normal text-neutral-500">Podés usar una imagen ya alojada o subir un archivo privado a S3.</span></label>
      <label className="grid gap-1 text-sm font-semibold">Subir imagen a S3<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="block w-full text-sm font-normal file:mr-3 file:rounded file:border-0 file:bg-stone-100 file:px-3 file:py-2" /><span className="text-xs font-normal text-neutral-500">{file ? file.name + " · " + (file.size / 1024 / 1024).toFixed(2) + " MB" : "Máximo 5 MB. Se sube con una URL prefirmada; no se exponen claves de AWS."}</span></label>
      <div className="flex flex-wrap gap-3"><button type="submit" disabled={saving} className="rounded bg-black px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear producto"}</button>{!editing && <button type="button" onClick={startNew} className="rounded border border-neutral-300 px-5 py-3 text-sm font-bold">Limpiar</button>}</div>
    </form>
    <div className="mt-9 flex items-center justify-between gap-4"><h2 className="text-xl font-black">Catálogo actual</h2><span className="text-xs text-neutral-500">{products.length} productos cargados</span></div>
    {loading ? <LoadingState message="Cargando productos…" /> : products.length === 0 ? <p className="mt-4 border border-dashed p-6 text-sm text-neutral-500">No hay productos para mostrar.</p> : <div className="mt-4 divide-y divide-neutral-200 border-y border-neutral-200">
      {products.map((product) => <article key={product.id} className="flex gap-3 py-4">
        <ProductImage source={product.image} alt={product.name} className="h-24 w-20 shrink-0 bg-stone-100 object-cover" />
        <div className="min-w-0 flex-1"><p className="font-bold">{product.name}</p><p className="mt-1 text-sm text-neutral-600">{formatPrice(product.price)} · stock {product.stock}</p><p className="mt-1 line-clamp-2 text-xs text-neutral-500">{product.description}</p><div className="mt-2 flex gap-4"><button type="button" onClick={() => startEdit(product)} className="text-xs font-bold underline">Editar</button><button type="button" onClick={() => void handleDelete(product)} className="text-xs font-bold text-red-700 underline">Eliminar</button></div></div>
      </article>)}
    </div>}
  </section>;
}
