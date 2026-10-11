import {
  average,
  collection,
  count,
  doc,
  getAggregateFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";

export type ProductReview = {
  id: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date | null;
};

export type ProductReviewSummary = {
  averageRating: number;
  reviewCount: number;
};

function toDate(value: unknown): Date | null {
  return value instanceof Timestamp ? value.toDate() : null;
}

function reviewFromData(id: string, data: Record<string, unknown>): ProductReview {
  return {
    id,
    userId: String(data.userId ?? ""),
    rating: Number(data.rating ?? 0),
    comment: String(data.comment ?? ""),
    createdAt: toDate(data.createdAt),
  };
}

function reviewsCollection(productId: string) {
  return collection(db, "products", productId, "reviews");
}

export async function getProductReviewSummary(productId: string): Promise<ProductReviewSummary> {
  const result = await getAggregateFromServer(reviewsCollection(productId), {
    averageRating: average("rating"),
    reviewCount: count(),
  });
  const values = result.data();
  return {
    averageRating: Number(values.averageRating ?? 0),
    reviewCount: Number(values.reviewCount ?? 0),
  };
}

export async function listProductReviews(productId: string, pageSize = 8): Promise<ProductReview[]> {
  const snapshot = await getDocs(query(reviewsCollection(productId), orderBy("createdAt", "desc"), limit(pageSize)));
  return snapshot.docs.map((item) => reviewFromData(item.id, item.data()));
}

export async function getMyProductReview(productId: string): Promise<ProductReview | null> {
  const user = auth.currentUser;
  if (!user) return null;
  const snapshot = await getDoc(doc(db, "products", productId, "reviews", user.uid));
  return snapshot.exists() ? reviewFromData(snapshot.id, snapshot.data()) : null;
}

// El documento usa el UID como ID: evita que una cuenta publique varias opiniones por producto.
export async function saveProductReview(productId: string, rating: number, comment: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Iniciá sesión para publicar una opinión.");
  const trimmedComment = comment.trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("La puntuación debe ser un entero entre una y cinco estrellas.");
  }
  if (trimmedComment.length < 3 || trimmedComment.length > 500) {
    throw new Error("El comentario debe tener entre 3 y 500 caracteres.");
  }

  const reviewRef = doc(db, "products", productId, "reviews", user.uid);
  const existing = await getDoc(reviewRef);
  if (existing.exists()) {
    await updateDoc(reviewRef, {
      rating,
      comment: trimmedComment,
      updatedAt: serverTimestamp(),
    });
    return;
  }

  await setDoc(reviewRef, {
    userId: user.uid,
    rating,
    comment: trimmedComment,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
