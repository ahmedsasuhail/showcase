/** Formats a price for Australian customers. The currency code comes from the API. */
export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(amount);
}

export function Price({ amount, currency }: { amount: number; currency: string }) {
  return <span className="price">{formatPrice(amount, currency)}</span>;
}
