const formatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function formatPrice(value: number): string {
  return formatter.format(value);
}
