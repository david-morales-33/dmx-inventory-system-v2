/**
 * Formats an amount to Colombian Pesos (COP).
 * e.g., 150000 -> "$ 150.000 COP"
 */
export function formatCOP(amount: number, showCurrencyCode: boolean = true): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return showCurrencyCode ? "$ 0 COP" : "$ 0";
  }
  
  const formatted = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  // Intl in es-CO formats as "$ 150.000" or "COP 150.000" depending on env
  const clean = formatted.replace(/\s?COP/i, "").trim();
  return showCurrencyCode ? `${clean} COP` : clean;
}

/**
 * Formats a date string or timestamp in Bogota timezone.
 */
export function formatDate(dateString: string | Date, options?: Intl.DateTimeFormatOptions): string {
  if (!dateString) return "-";
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return "-";

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  };

  return new Intl.DateTimeFormat("es-CO", defaultOptions).format(date);
}

/**
 * Formats date and time in Bogota timezone.
 */
export function formatDateTime(dateString: string | Date): string {
  return formatDate(dateString, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
