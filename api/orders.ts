import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  buildCanonicalOrder,
  OrderValidationError,
  parseCreateOrderRequest,
  type CanonicalProductForOrder,
} from "../src/services/orderValidation";

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

// El servidor verifica identidad y precios; el navegador no puede fijar el importe de una orden.
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
    let decoded: DecodedIdToken;
    try {
      decoded = await getAuth(app).verifyIdToken(token);
    } catch {
      return respondError(res, 401, "La sesión venció. Volvé a iniciar sesión.");
    }

    const db = getFirestore(app);
    const userSnapshot = await db.doc(`users/${decoded.uid}`).get();
    const userProfile = userSnapshot.data();
    if (!userSnapshot.exists || (userProfile?.role !== "customer" && userProfile?.role !== "admin")) {
      return respondError(res, 403, "No pudimos verificar tu perfil para crear el pedido.");
    }

    const productRefs = input.items.map((item) => db.collection("products").doc(item.productId));
    const productSnapshots = await db.getAll(...productRefs);
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
    const email = typeof decoded.email === "string"
      ? decoded.email
      : typeof userProfile.email === "string" ? userProfile.email : "";

    const orderRef = await db.collection("orders").add({
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

    return res.status(201).json({ orderId: orderRef.id, total: order.total });
  } catch (error) {
    if (error instanceof OrderValidationError) {
      return respondError(res, error.statusCode, error.message);
    }
    console.error("create_order_failed", error instanceof Error ? error.message : "unknown");
    return respondError(res, 500, "No pudimos crear el pedido. Revisá la configuración del servidor e intentá otra vez.");
  }
}
