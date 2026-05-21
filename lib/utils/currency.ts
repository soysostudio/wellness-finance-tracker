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
    return `${sign}${str} millones`;
  }

  if (abs >= 1_000) {
    return `${sign}${Math.round(abs / 1_000)} mil pesos`;
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
