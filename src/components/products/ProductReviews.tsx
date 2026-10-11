import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  getMyProductReview,
  getProductReviewSummary,
  listProductReviews,
  saveProductReview,
  type ProductReview,
  type ProductReviewSummary,
} from "../../services/reviews.service";

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating.toFixed(1)} de 5 estrellas`} className="whitespace-nowrap tracking-[.08em] text-[#8a6c35]">
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} aria-hidden="true">{index < Math.round(rating) ? "★" : "☆"}</span>
      ))}
    </span>
  );
}

function ReviewDate({ value }: { value: Date | null }) {
  if (!value) return null;
  return <time dateTime={value.toISOString()}>{new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(value)}</time>;
}

// Reseñas públicas por producto y una calificación por usuario autenticado.
export function ProductReviews({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [summary, setSummary] = useState<ProductReviewSummary>({ averageRating: 0, reviewCount: 0 });
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextSummary, nextReviews, ownReview] = await Promise.all([
        getProductReviewSummary(productId),
        listProductReviews(productId),
        user ? getMyProductReview(productId) : Promise.resolve(null),
      ]);
      setSummary(nextSummary);
      setReviews(nextReviews);
      if (ownReview) {
        setRating(ownReview.rating);
        setComment(ownReview.comment);
      } else {
        setRating(0);
        setComment("");
      }
    } catch {
      setError("No pudimos cargar las opiniones. Podés volver a intentarlo.");
    } finally {
      setLoading(false);
    }
  }, [productId, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (!user) {
      setError("Iniciá sesión para publicar una opinión.");
      return;
    }
    if (rating < 1 || rating > 5) {
      setError("Elegí una puntuación de una a cinco estrellas.");
      return;
    }
    if (comment.trim().length < 3 || comment.trim().length > 500) {
      setError("El comentario debe tener entre 3 y 500 caracteres.");
      return;
    }

    setSaving(true);
    try {
      await saveProductReview(productId, rating, comment);
      setNotice("Tu opinión quedó guardada.");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar la opinión.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="opiniones" aria-labelledby="reviews-title" className="scroll-mt-8 border-t border-neutral-200 pt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="reviews-title" className="text-2xl font-semibold tracking-tight">Opiniones de clientes</h2>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <Stars rating={summary.averageRating} />
            <span className="font-semibold tabular-nums">{summary.reviewCount ? summary.averageRating.toFixed(1) : "—"}</span>
            <span className="text-neutral-500">({summary.reviewCount} {summary.reviewCount === 1 ? "opinión" : "opiniones"})</span>
          </div>
        </div>
        {user && <p className="text-xs text-neutral-500">Tu opinión se vincula a tu cuenta y podés actualizarla.</p>}
      </div>

      {error && <p role="alert" className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="mt-4 border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}

      <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,.7fr)]">
        <div>
          {loading ? (
            <p className="py-6 text-sm text-neutral-500">Cargando opiniones…</p>
          ) : reviews.length === 0 ? (
            <p className="border-y border-neutral-200 py-6 text-sm text-neutral-600">Todavía no hay opiniones. Sé la primera persona en compartir su experiencia.</p>
          ) : (
            <div className="divide-y divide-neutral-200">
              {reviews.map((review) => (
                <article key={review.id} className="py-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Stars rating={review.rating} />
                    <p className="text-[11px] text-neutral-500"><ReviewDate value={review.createdAt} /></p>
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-neutral-700">{review.comment}</p>
                  {user?.uid === review.userId && <p className="mt-2 text-[10px] font-semibold uppercase tracking-[.12em] text-neutral-500">Tu opinión</p>}
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="bg-[#f7f6f2] p-5 sm:p-6">
          {user ? (
            <form onSubmit={(event) => void handleSubmit(event)}>
              <h3 className="text-base font-semibold">{rating ? "Actualizar tu opinión" : "Calificar este producto"}</h3>
              <fieldset className="mt-4">
                <legend className="text-xs font-medium text-neutral-600">Tu puntuación</legend>
                <div className="mt-2 flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, index) => {
                    const value = index + 1;
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-label={`${value} ${value === 1 ? "estrella" : "estrellas"}`}
                        aria-pressed={rating === value}
                        onClick={() => setRating(value)}
                        className={`p-1 text-2xl leading-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5e6046] ${value <= rating ? "text-[#8a6c35]" : "text-neutral-300"}`}
                      >
                        ★
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <label className="mt-4 block text-xs font-medium text-neutral-700">
                Comentario
                <textarea
                  required
                  minLength={3}
                  maxLength={500}
                  rows={4}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="¿Qué te pareció este producto?"
                  className="mt-2 w-full resize-y border border-neutral-300 bg-white p-3 text-sm outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                />
                <span className="mt-1 block text-right text-[10px] text-neutral-500">{comment.length}/500</span>
              </label>
              <button
                type="submit"
                disabled={saving || rating === 0 || comment.trim().length < 3 || comment.trim().length > 500}
                className="mt-4 min-h-11 w-full bg-neutral-900 px-4 py-3 text-xs font-semibold text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                {saving ? "Guardando opinión…" : rating ? "Guardar opinión" : "Seleccioná una puntuación"}
              </button>
            </form>
          ) : (
            <div>
              <h3 className="text-base font-semibold">Compartí tu experiencia</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-600">Ingresá con tu cuenta para calificar el producto y dejar un comentario.</p>
              <Link to="/login" className="mt-4 inline-flex min-h-11 items-center bg-neutral-900 px-4 py-3 text-xs font-semibold text-white hover:bg-neutral-700">
                Iniciar sesión
              </Link>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
