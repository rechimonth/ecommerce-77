import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  buildCanonicalOrder,
  OrderValidationError,
  parseCreateOrderRequest,
  type CanonicalProductForOrder,
} from "../src/services/orderValidation.ts";

function getFirebaseAdmin() {
  if (getApps().length) return getApps()[0]!;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Falta configurar Firebase Admin en las variables del servidor.");
  }
  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });
}

function respondError(res: VercelResponse, status: number, message: string) {
  return res.status(status).json({ error: message });
}

function isInvalidTokenError(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("code" in error)) return false;
  return new Set([
    "auth/argument-error",
    "auth/id-token-expired",
    "auth/invalid-id-token",
    "auth/id-token-revoked",
    "auth/invalid-user-token",
  ]).has(String((error as { code?: unknown }).code ?? ""));
}

// El servidor valida identidad/precios y descuenta inventario en la misma transacción que crea la orden.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return respondError(res, 405, "Método no permitido.");
  }

  const authorization = req.headers.authorization;
  const token = typeof authorization === "string" && authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";
  if (!token) return respondError(res, 401, "Iniciá sesión para confirmar el pedido.");

  let requestBody: unknown = req.body;
  if (typeof requestBody === "string") {
    try {
      requestBody = JSON.parse(requestBody) as unknown;
    } catch {
      return respondError(res, 400, "El pedido enviado no contiene JSON válido.");
    }
  }

  try {
    const input = parseCreateOrderRequest(requestBody);
    const app = getFirebaseAdmin();
    const auth = getAuth(app);
    let decoded: DecodedIdToken;
    try {
      decoded = await auth.verifyIdToken(token);
    } catch (error) {
      if (isInvalidTokenError(error)) {
        return respondError(res, 401, "La sesión venció. Volvé a iniciar sesión.");
      }
      throw error;
    }

    const db = getFirestore(app);
    const userRef = db.doc(`users/${decoded.uid}`);
    const productRefs = input.items.map((item) => db.collection("products").doc(item.productId));
    const orderRef = db.collection("orders").doc();

    const total = await db.runTransaction(async (transaction) => {
      // Todo se vuelve a leer en la transacción: las validaciones previas a una compra
      // concurrente no sirven para garantizar disponibilidad del último artículo.
      const userSnapshot = await transaction.get(userRef);
      const userProfile = userSnapshot.data();
      if (!userSnapshot.exists || (userProfile?.role !== "customer" && userProfile?.role !== "admin")) {
        throw new OrderValidationError("No pudimos verificar tu perfil para crear el pedido.", 403);
      }

      const productSnapshots = [];
      for (const productRef of productRefs) {
        productSnapshots.push(await transaction.get(productRef));
      }
      const canonicalProducts: CanonicalProductForOrder[] = productSnapshots
        .filter((snapshot) => snapshot.exists)
        .map((snapshot) => ({
          id: snapshot.id,
          name: snapshot.get("name"),
          image: snapshot.get("image"),
          price: snapshot.get("price"),
          stock: snapshot.get("stock"),
        }));
      const order = buildCanonicalOrder(input.items, canonicalProducts);

      // Las lecturas terminan antes de iniciar las escrituras de Firestore.
      for (const line of order.items) {
        const productSnapshot = productSnapshots.find((snapshot) => snapshot.id === line.productId);
        if (!productSnapshot?.exists) {
          throw new OrderValidationError("Uno de los productos ya no existe en el catálogo.", 409);
        }
        const stock = productSnapshot.get("stock");
        if (typeof stock !== "number" || !Number.isSafeInteger(stock) || stock < line.quantity) {
          throw new OrderValidationError(`No hay stock suficiente para «${line.name}».`, 409);
        }
        transaction.update(productSnapshot.ref, {
          stock: stock - line.quantity,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      const email = typeof decoded.email === "string"
        ? decoded.email
        : typeof userProfile.email === "string" ? userProfile.email : "";
      transaction.set(orderRef, {
        userId: decoded.uid,
        customerName: input.customerName,
        email,
        shippingAddress: input.shippingAddress,
        items: order.items,
        total: order.total,
        status: "pending",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return order.total;
    });

    return res.status(201).json({ orderId: orderRef.id, total });
  } catch (error) {
    if (error instanceof OrderValidationError) {
      return respondError(res, error.statusCode, error.message);
    }
    console.error("create_order_failed", error instanceof Error ? error.message : "unknown");
    return respondError(res, 500, "No pudimos crear el pedido. Revisá la configuración del servidor e intentá otra vez.");
  }
}
