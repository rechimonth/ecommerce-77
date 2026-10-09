const usdWhole = new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", maximumFractionDigits: 0,
});
const usdWithCents = new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2,
});

// Los precios se expresan siempre en dólares estadounidenses, sin conversión implícita.
export function formatPrice(value: number): string {
  return Number.isInteger(value) ? usdWhole.format(value) : usdWithCents.format(value);
}
