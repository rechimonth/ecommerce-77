import {
  addDoc, collection, deleteDoc, doc, endAt, getDoc, getDocs, limit,
  orderBy, query, serverTimestamp, startAfter, startAt, Timestamp, updateDoc,
  where, type DocumentSnapshot, type QueryConstraint, type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { CategoryId, Product } from "../types/product.types";

export type ListProductsParams = {
  categoryId?: string | null;
  searchPrefix?: string;
  pageSize?: number;
  cursor?: DocumentSnapshot | null;
};
export type ListProductsResult = { items: Product[]; lastDoc: DocumentSnapshot | null };
export type ProductInput = Omit<Product, "id" | "createdAt" | "updatedAt">;

// Firestore guarda Timestamp; la aplicación presenta fechas JavaScript.
function toDate(value: unknown): Date | undefined {
  return value instanceof Timestamp ? value.toDate() : undefined;
}
function mapProduct(id: string, data: Record<string, unknown>): Product {
  return {
    id, name: String(data.name ?? ""), nameLower: String(data.nameLower ?? ""),
    image: String(data.image ?? ""), description: String(data.description ?? ""),
    price: Number(data.price ?? 0), stock: Number(data.stock ?? 0),
    categoryId: data.categoryId as CategoryId,
    createdAt: toDate(data.createdAt), updatedAt: toDate(data.updatedAt),
  };
}
function fromSnapshot(snapshot: QueryDocumentSnapshot): Product {
  return mapProduct(snapshot.id, snapshot.data());
}

// Único punto de lectura del catálogo: aplica filtros y paginación por cursor.
export async function listProducts(params: ListProductsParams = {}): Promise<ListProductsResult> {
  const { categoryId, searchPrefix, pageSize = 20, cursor } = params;
  const constraints: QueryConstraint[] = [];
  if (categoryId) constraints.push(where("categoryId", "==", categoryId));
  constraints.push(orderBy("nameLower"));
  if (searchPrefix && searchPrefix.length >= 2) {
    constraints.push(startAt(searchPrefix));
    constraints.push(endAt(searchPrefix + "\uf8ff"));
  }
  if (cursor) constraints.push(startAfter(cursor));
  constraints.push(limit(pageSize));
  const snapshot = await getDocs(query(collection(db, "products"), ...constraints));
  const items = snapshot.docs.map(fromSnapshot);
  return { items, lastDoc: snapshot.docs.at(-1) ?? null };
}

// Consulta un solo producto para su pantalla de detalle.
export async function getProductById(productId: string): Promise<Product | null> {
  const snapshot = await getDoc(doc(db, "products", productId));
  return snapshot.exists() ? mapProduct(snapshot.id, snapshot.data()) : null;
}

// Crea productos en Firestore; las reglas rechazan esta operación a clientes normales.
export async function createProduct(input: ProductInput): Promise<string> {
  const ref = await addDoc(collection(db, "products"), {
    ...input,
    name: input.name.trim(),
    nameLower: input.name.trim().toLocaleLowerCase("es"),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

// Actualiza solo los campos del producto; la marca temporal se genera en Firestore.
export async function updateProduct(productId: string, input: ProductInput): Promise<void> {
  await updateDoc(doc(db, "products", productId), {
    ...input,
    name: input.name.trim(),
    nameLower: input.name.trim().toLocaleLowerCase("es"),
    updatedAt: serverTimestamp(),
  });
}

// Elimina el documento; la autorización real se aplica en las reglas de Firestore.
export async function deleteProduct(productId: string): Promise<void> {
  await deleteDoc(doc(db, "products", productId));
}
