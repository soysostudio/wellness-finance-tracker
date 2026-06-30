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

export function getCategoryColor(slug: string): string {
  return getCategoryBySlug(slug)?.color ?? '#98A0A8';
}

/**
 * Soft pastel tint of a category color, for calm card backgrounds.
 * `pct` is how much of the full hue to keep (rest is paper white).
 * Works with any hex; falls back to the neutral grey for unknown slugs.
 */
export function tintFromColor(color: string, pct = 16): string {
  return `color-mix(in srgb, ${color} ${pct}%, #FFFFFF)`;
}

export function getCategoryTint(slug: string, pct = 16): string {
  return tintFromColor(getCategoryColor(slug), pct);
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
