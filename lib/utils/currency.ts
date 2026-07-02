export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCOPColoquial(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 1_000_000) {
    const millones = abs / 1_000_000;
    const str = millones % 1 === 0 ? millones.toString() : millones.toFixed(1);
    return `${sign}${str} ${str === '1' ? 'millón' : 'millones'}`;
  }

  if (abs >= 1_000) {
    const miles = Math.round(abs / 1_000);
    // 999.999 redondea a 1000 mil → decilo como "1 millón"
    if (miles >= 1_000) return `${sign}1 millón`;
    return `${sign}${miles} mil pesos`;
  }

  return `${sign}${abs} pesos`;
}

export function formatCurrency(amount: number, currency: string = 'COP'): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format a raw input string into a comma-separated display value (e.g. "300,000"). */
export function formatAmountInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return parseInt(digits, 10).toLocaleString("en-US");
}

/** Strip commas and parse back to a number for submission. */
export function parseAmountInput(formatted: string): number {
  return parseFloat(formatted.replace(/,/g, "")) || 0;
}

export function parseCOPInput(input: string): number | null {
  const cleaned = input
    .replace(/\$/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '.')
    .trim();

  const millones = cleaned.match(/^([\d.]+)\s*mill?ones?$/i);
  if (millones) return parseFloat(millones[1]) * 1_000_000;

  const miles = cleaned.match(/^([\d.]+)\s*mil$/i);
  if (miles) return parseFloat(miles[1]) * 1_000;

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}
