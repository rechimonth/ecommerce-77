import { randomUUID } from "node:crypto";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

// La app administrativa usa credenciales solo en servidor, nunca en VITE_* ni en el navegador.
function getFirebaseAdmin() {
  if (getApps().length) return getApps()[0]!;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) throw new Error("Falta configurar Firebase Admin en las variables del servidor.");
  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId });
}

function getS3Client() {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!region || !accessKeyId || !secretAccessKey || !process.env.AWS_S3_BUCKET) {
    throw new Error("Falta configurar AWS S3 en las variables del servidor.");
  }
  return new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
}

function respondError(res: VercelResponse, status: number, message: string) {
  return res.status(status).json({ error: message });
}

// PUT: solo administradores reciben URL de subida. GET: catálogo público con objetos siempre privados.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return respondError(res, 405, "Método no permitido.");
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) as Record<string, unknown> : (req.body ?? {}) as Record<string, unknown>;
    const action = body.action;
    const bucket = process.env.AWS_S3_BUCKET!;
    const s3 = getS3Client();

    if (action === "get") {
      const key = typeof body.key === "string" ? body.key : "";
      if (!key.startsWith("products/") || key.includes("..") || key.length > 500) {
        return respondError(res, 400, "La clave de imagen no es válida.");
      }
      const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 900 });
      return res.status(200).json({ url });
    }

    if (action !== "put") return respondError(res, 400, "Acción no válida.");
    const authorization = req.headers.authorization;
    const token = typeof authorization === "string" && authorization.startsWith("Bearer ")
      ? authorization.slice(7) : "";
    if (!token) return respondError(res, 401, "Iniciá sesión para subir imágenes.");

    const app = getFirebaseAdmin();
    const decoded = await getAuth(app).verifyIdToken(token);
    const userSnapshot = await getFirestore(app).doc(`users/${decoded.uid}`).get();
    if (userSnapshot.data()?.role !== "admin") return respondError(res, 403, "Solo un administrador puede subir imágenes.");

    const contentType = typeof body.contentType === "string" ? body.contentType : "";
    const fileSize = typeof body.fileSize === "number" ? body.fileSize : 0;
    if (!Number.isFinite(fileSize) || fileSize < 1 || fileSize > 5 * 1024 * 1024) {
      return respondError(res, 413, "La imagen debe pesar entre 1 byte y 5 MB.");
    }
    if (!allowedImageTypes.has(contentType)) return respondError(res, 415, "Formato no permitido. Usá JPEG, PNG, WebP o AVIF.");
    const extension: Record<string, string> = {
      "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif",
    };
    const key = `products/${decoded.uid}/${randomUUID()}.${extension[contentType]}`;
    const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({
      Bucket: bucket, Key: key, ContentType: contentType,
    }), { expiresIn: 300 });
    return res.status(200).json({ uploadUrl, key });
  } catch (error) {
    console.error("s3_presign_error", error instanceof Error ? error.message : "unknown");
    return respondError(res, 500, "No pudimos generar el enlace seguro. Revisá las variables de entorno del servidor.");
  }
}
