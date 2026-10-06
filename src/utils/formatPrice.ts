const whole = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const withCents = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Sin decimales si el precio es entero (489 €), con 2 si no (30,30 €).
export function formatPrice(value: number): string {
  return Number.isInteger(value) ? whole.format(value) : withCents.format(value);
}
