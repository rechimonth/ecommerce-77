import {
  collection,
  endAt,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  startAt,
  Timestamp,
  where,
  type DocumentSnapshot,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { Product } from "../types/product.types";

export type ListProductsParams = {
  categoryId?: string | null;
  searchPrefix?: string; // ya en lowercase
  pageSize?: number;
  cursor?: DocumentSnapshot | null;
};

export type ListProductsResult = {
  items: Product[];
  lastDoc: DocumentSnapshot | null;
};

// Firestore usa Timestamp; el Front trabaja con Date.
function toDate(value: unknown): Date | undefined {
  return value instanceof Timestamp ? value.toDate() : undefined;
}

function toProduct(snap: QueryDocumentSnapshot): Product {
  const data = snap.data();
  return {
    id: snap.id,
    name: data.name,
    nameLower: data.nameLower,
    image: data.image,
    description: data.description,
    price: data.price,
    stock: data.stock,
    categoryId: data.categoryId,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export async function listProducts(
  params: ListProductsParams = {},
): Promise<ListProductsResult> {
  const { categoryId, searchPrefix, pageSize = 20, cursor } = params;
  const constraints: QueryConstraint[] = [];

  if (categoryId) constraints.push(where("categoryId", "==", categoryId));
  constraints.push(orderBy("nameLower"));

  // Búsqueda por prefijo sobre "nameLower" (\uf8ff = límite superior).
  if (searchPrefix && searchPrefix.length >= 2) {
    constraints.push(startAt(searchPrefix));
    constraints.push(endAt(searchPrefix + "\uf8ff"));
  }

  if (cursor) constraints.push(startAfter(cursor));
  constraints.push(limit(pageSize));

  const snap = await getDocs(query(collection(db, "products"), ...constraints));
  const items = snap.docs.map(toProduct);
  const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;

  return { items, lastDoc };
}
