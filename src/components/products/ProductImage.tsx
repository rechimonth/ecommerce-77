import { useEffect, useState } from "react";
import { resolveProductImage } from "../../services/upload.service";

type ProductImageProps = { source: string; alt: string; className?: string };

// Resuelve imágenes almacenadas como claves privadas de S3 y conserva URL externas del catálogo actual.
export function ProductImage({ source, alt, className = "" }: ProductImageProps) {
  const [resolved, setResolved] = useState(source.startsWith("s3://") ? "" : source);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let current = true;
    setFailed(false);
    if (!source.startsWith("s3://")) {
      setResolved(source);
      return () => { current = false; };
    }
    setResolved("");
    resolveProductImage(source).then((url) => {
      if (current) setResolved(url);
    }).catch(() => {
      if (current) setFailed(true);
    });
    return () => { current = false; };
  }, [source]);

  if (failed) return <div role="img" aria-label={alt} className={`grid place-items-center bg-stone-100 text-xs text-stone-500 ${className}`}>Imagen no disponible</div>;
  if (!resolved) return <div aria-label={alt} className={`animate-pulse bg-stone-100 ${className}`} />;
  return <img src={resolved} alt={alt} loading="lazy" className={className} onError={() => setFailed(true)} />;
}
