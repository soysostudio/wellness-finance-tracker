export interface CategoryConfig {
  slug: string;
  name: string;
  icon: string;
  color: string;
  isIncome: boolean;
  sortOrder: number;
  merchants?: string[];
}

// ── Category hues — distinct, medium-muted ─────────────────
// Each category owns a unique hue (no duplicates) at medium saturation,
// so the full color reads on icons/bars while a soft tint of it makes
// calm, pastel cards. See getCategoryTint().

export const SYSTEM_CATEGORIES: CategoryConfig[] = [
  {
    slug: 'comida',
    name: 'Comida y Restaurantes',
    icon: '🍔',
    color: '#E0785C',   // coral
    isIncome: false,
    sortOrder: 1,
    merchants: ['rappi', 'domicilios', "mcdonald's", 'crepes', 'el corral', 'subway', 'burger king'],
  },
  {
    slug: 'mercado',
    name: 'Mercado y Supermercado',
    icon: '🛒',
    color: '#E3A93A',   // amber
    isIncome: false,
    sortOrder: 2,
    merchants: ['éxito', 'exito', 'jumbo', 'd1', 'ara', 'carulla', 'olímpica', 'olimpica'],
  },
  {
    slug: 'transporte',
    name: 'Transporte',
    icon: '🚗',
    color: '#3F8C7C',   // teal
    isIncome: false,
    sortOrder: 3,
    merchants: ['uber', 'indriver', 'didi', 'sitp', 'transmilenio', 'cabify', 'picap'],
  },
  {
    slug: 'hogar',
    name: 'Hogar y Arriendo',
    icon: '🏠',
    color: '#8487C7',   // periwinkle
    isIncome: false,
    sortOrder: 4,
    merchants: ['arriendo', 'administración', 'administracion'],
  },
  {
    slug: 'servicios',
    name: 'Servicios Públicos',
    icon: '💡',
    color: '#94B24D',   // olive
    isIncome: false,
    sortOrder: 5,
    merchants: ['epm', 'etb', 'claro', 'movistar', 'tigo', 'gas natural', 'codensa'],
  },
  {
    slug: 'entretenimiento',
    name: 'Entretenimiento',
    icon: '🎬',
    color: '#B069A6',   // plum
    isIncome: false,
    sortOrder: 6,
    merchants: ['netflix', 'spotify', 'cinépolis', 'cinepolis', 'cine colombia', 'steam', 'disney'],
  },
  {
    slug: 'salud',
    name: 'Salud y Bienestar',
    icon: '🏥',
    color: '#DD7B96',   // rose
    isIncome: false,
    sortOrder: 7,
    merchants: ['farmacia', 'droguería', 'drogueria', 'gym', 'smart fit'],
  },
  {
    slug: 'educacion',
    name: 'Educación',
    icon: '📚',
    color: '#5689C2',   // sky blue
    isIncome: false,
    sortOrder: 8,
    merchants: ['udemy', 'coursera', 'platzi'],
  },
  {
    slug: 'compras',
    name: 'Compras y Ropa',
    icon: '🛍️',
    color: '#C58A60',   // clay
    isIncome: false,
    sortOrder: 9,
    merchants: ['falabella', 'zara', 'h&m', 'mercado libre', 'amazon'],
  },
  {
    slug: 'ingreso',
    name: 'Ingresos',
    icon: '💰',
    color: '#3FA079',   // green (income)
    isIncome: true,
    sortOrder: 10,
    merchants: ['nómina', 'nomina', 'salario', 'freelance'],
  },
  {
    slug: 'otros',
    name: 'Otros',
    icon: '📦',
    color: '#98A0A8',   // slate grey
    isIncome: false,
    sortOrder: 11,
  },
];

export function getCategoryBySlug(slug: string): CategoryConfig | undefined {
  return SYSTEM_CATEGORIES.find((c) => c.slug === slug);
}

/** Mismos 11 tonos de las categorías del sistema, para que los swatches de
 * categorías personalizadas se vean coherentes con las tarjetas actuales. */
export const CUSTOM_CATEGORY_COLORS: string[] = SYSTEM_CATEGORIES.map((c) => c.color);

interface KeywordIconGroup {
  id: string;
  keywords: string[];
  emoji: string;
}

// Grupos de palabras clave para categorías personalizadas — el ícono (Lucide,
// ver components/ui/category-icon.tsx) y el emoji se adivinan a partir del
// nombre que el usuario escribe, sin tener que elegirlo a mano.
export const KEYWORD_ICON_GROUPS: KeywordIconGroup[] = [
  { id: 'mascotas',      keywords: ['mascota', 'perro', 'gato', 'veterinaria', 'vet'], emoji: '🐾' },
  { id: 'viajes',        keywords: ['viaje', 'vacacion', 'turismo', 'hotel', 'vuelo', 'tiquete'], emoji: '✈️' },
  { id: 'regalos',       keywords: ['regalo', 'cumpleaños', 'cumple'], emoji: '🎁' },
  { id: 'tecnologia',    keywords: ['tecnolog', 'gadget', 'computador', 'celular', 'laptop', 'electronic'], emoji: '💻' },
  { id: 'deporte',       keywords: ['deporte', 'gimnasio', 'gym', 'ejercicio', 'futbol'], emoji: '⚽' },
  { id: 'ninos',         keywords: ['niño', 'nino', 'bebe', 'bebé', 'hijo', 'hija'], emoji: '🧸' },
  { id: 'belleza',       keywords: ['belleza', 'spa', 'peluqueria', 'peluquería', 'manicure', 'salon', 'salón'], emoji: '💅' },
  { id: 'seguros',       keywords: ['seguro', 'poliza', 'póliza'], emoji: '🛡️' },
  { id: 'ahorro',        keywords: ['ahorro', 'inversion', 'inversión', 'cdt'], emoji: '🐷' },
  { id: 'suscripciones', keywords: ['suscripcion', 'suscripción', 'membresia', 'membresía'], emoji: '🔁' },
  { id: 'carro',         keywords: ['carro', 'auto', 'moto', 'taller'], emoji: '🚙' },
  { id: 'deuda',         keywords: ['deuda', 'prestamo', 'préstamo', 'credito', 'crédito', 'tarjeta'], emoji: '💳' },
  { id: 'familia',       keywords: ['familia', 'familiar'], emoji: '👨‍👩‍👧' },
  { id: 'licores',       keywords: ['licor', 'alcohol', 'cerveza', 'trago', 'bar'], emoji: '🍷' },
  { id: 'impuestos',     keywords: ['impuesto', 'dian', 'declaracion', 'declaración'], emoji: '🧾' },
  { id: 'mejoras-hogar', keywords: ['adecuacion', 'adecuación', 'remodelacion', 'remodelación', 'reforma'], emoji: '🔨' },
];

function normalizeForMatch(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Busca el primer grupo de palabras clave cuyo término aparece en el nombre. */
export function matchKeywordGroup(name: string): KeywordIconGroup | null {
  const normalized = normalizeForMatch(name);
  for (const group of KEYWORD_ICON_GROUPS) {
    if (group.keywords.some((k) => normalized.includes(normalizeForMatch(k)))) return group;
  }
  return null;
}

/** Emoji sugerido a partir del nombre de una categoría personalizada. */
export function guessCategoryEmoji(name: string): string {
  return matchKeywordGroup(name)?.emoji ?? '📦';
}

export function getCategoryColor(slug: string): string {
  return getCategoryBySlug(slug)?.color ?? '#98A0A8';
}

/**
 * Soft pastel tint of a category color, for calm card backgrounds.
 * `pct` is how much of the full hue to keep (rest is paper white).
 * Works with any hex; falls back to the neutral grey for unknown slugs.
 */
export function tintFromColor(color: string, pct = 16): string {
  // --tint-base is white in light mode and a dark surface in dark mode,
  // so the pastel adapts to the theme (see globals.css).
  return `color-mix(in srgb, ${color} ${pct}%, var(--tint-base))`;
}

export function getCategoryTint(slug: string, pct = 16): string {
  return tintFromColor(getCategoryColor(slug), pct);
}

/** Texto legible (oscuro/claro) sobre un color de fondo sólido, según su luminancia. */
export function readableTextOn(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return '#1A1D1C';
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  // luminancia relativa aproximada
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#1A1D1C' : '#FFFFFF';
}

export function getCategoryIcon(slug: string): string {
  return getCategoryBySlug(slug)?.icon ?? '📦';
}

export function guessCategoryFromMerchant(merchant: string): string {
  const lower = merchant.toLowerCase();
  for (const cat of SYSTEM_CATEGORIES) {
    if (cat.merchants?.some((m) => lower.includes(m))) {
      return cat.slug;
    }
  }
  return 'otros';
}
