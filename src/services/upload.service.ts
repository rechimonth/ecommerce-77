export type SignedUpload = { uploadUrl: string; key: string };

// Pide una URL temporal al backend; nunca se importan credenciales de AWS en el navegador.
export async function uploadProductImage(file: File, idToken: string): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Elegí un archivo de imagen.");
  if (file.size > 5 * 1024 * 1024) throw new Error("La imagen debe pesar 5 MB o menos.");
  const response = await fetch("/api/s3/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ action: "put", fileName: file.name, contentType: file.type, fileSize: file.size }),
  });
  const payload = await response.json() as { uploadUrl?: string; key?: string; error?: string };
  if (!response.ok || !payload.uploadUrl || !payload.key) {
    throw new Error(payload.error ?? "No pudimos preparar la subida de la imagen.");
  }
  const upload = await fetch(payload.uploadUrl, {
    method: "PUT", headers: { "Content-Type": file.type }, body: file,
  });
  if (!upload.ok) throw new Error("AWS S3 rechazó la imagen. Revisá el CORS del bucket.");
  return `s3://${payload.key}`;
}

// Las imágenes de S3 quedan privadas: esta llamada obtiene una URL temporal de solo lectura.
export async function resolveProductImage(source: string): Promise<string> {
  if (!source.startsWith("s3://")) return source;
  const key = source.slice("s3://".length);
  const response = await fetch("/api/s3/presign", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "get", key }),
  });
  const payload = await response.json() as { url?: string; error?: string };
  if (!response.ok || !payload.url) throw new Error(payload.error ?? "No pudimos cargar la imagen.");
  return payload.url;
}
