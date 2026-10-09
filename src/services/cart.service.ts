import { doc, getDoc, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import type { CartItem, CartState } from "../types/cart.types";
import type { CategoryId, Product } from "../types/product.types";
import { calculateTotal } from "../contexts/cart/cartReducer";

const validCategories = new Set<CategoryId>(["clothing", "shoes", "accessories"]);

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

// Firestore transforma Date en Timestamp; esta función también tolera documentos antiguos.
function readDate(value: unknown): Date | undefined {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date && Number.isFinite(value.getTime())) return value;
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (Number.isFinite(parsed.getTime())) return parsed;
  }
  return undefined;
}

function readProduct(value: unknown): Product | null {
  const data = record(value);
  if (!data) return null;
  if (typeof data.id !== "string" || typeof data.name !== "string" ||
      typeof data.nameLower !== "string" || typeof data.image !== "string" ||
      typeof data.description !== "string" || typeof data.categoryId !== "string") return null;

  const price = Number(data.price);
  const stock = Number(data.stock);
  if (!Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) return null;
  if (!validCategories.has(data.categoryId as CategoryId)) return null;

  return {
    id: data.id,
    name: data.name,
    nameLower: data.nameLower,
    image: data.image,
    description: data.description,
    price,
    stock,
    categoryId: data.categoryId as CategoryId,
    createdAt: readDate(data.createdAt),
    updatedAt: readDate(data.updatedAt),
  };
}

function readItem(value: unknown): CartItem | null {
  const data = record(value);
  if (!data) return null;
  const product = readProduct(data.product);
  const quantity = Number(data.quantity);
  if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) return null;
  return { product, quantity, addedAt: readDate(data.addedAt) ?? new Date(0) };
}

// Devuelve null cuando el usuario todavía no tiene un carrito guardado en la nube.
export async function getUserCart(userId: string): Promise<CartState | null> {
  const snapshot = await getDoc(doc(db, "carts", userId));
  if (!snapshot.exists()) return null;

  const rawItems: unknown = snapshot.data().items;
  const items = (Array.isArray(rawItems) ? rawItems : [])
    .map(readItem)
    .filter((item): item is CartItem => item !== null);
  return { items, total: calculateTotal(items) };
}

// Guarda el carrito en carts/{uid}. El total se recalcula y no se considera autoritativo.
export async function saveUserCart(userId: string, cart: CartState): Promise<void> {
  const items = cart.items.map(({ product, quantity, addedAt }) => ({
    product: {
      id: product.id,
      name: product.name,
      nameLower: product.nameLower,
      image: product.image,
      description: product.description,
      price: product.price,
      stock: product.stock,
      categoryId: product.categoryId,
      createdAt: product.createdAt ?? null,
      updatedAt: product.updatedAt ?? null,
    },
    quantity,
    addedAt,
  }));

  await setDoc(doc(db, "carts", userId), {
    items,
    updatedAt: serverTimestamp(),
  });
}
