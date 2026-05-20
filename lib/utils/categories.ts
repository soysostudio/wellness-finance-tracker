export interface CategoryConfig {
  slug: string;
  name: string;
  icon: string;
  color: string;
  isIncome: boolean;
  sortOrder: number;
  merchants?: string[];
}

// ── New brand-aligned palette ──────────────────────────────
// sage #D4E8A0 · lavender #C8CAD8 · orange #E8673C · teal #4A7C6F · gold #F5C540

export const SYSTEM_CATEGORIES: CategoryConfig[] = [
  {
    slug: 'comida',
    name: 'Comida y Restaurantes',
    icon: '🍔',
    color: '#E8673C',   // warm orange
    isIncome: false,
    sortOrder: 1,
    merchants: ['rappi', 'domicilios', "mcdonald's", 'crepes', 'el corral', 'subway', 'burger king'],
  },
  {
    slug: 'mercado',
    name: 'Mercado y Supermercado',
    icon: '🛒',
    color: '#F5C540',   // gold
    isIncome: false,
    sortOrder: 2,
    merchants: ['éxito', 'exito', 'jumbo', 'd1', 'ara', 'carulla', 'olímpica', 'olimpica'],
  },
  {
    slug: 'transporte',
    name: 'Transporte',
    icon: '🚗',
    color: '#4A7C6F',   // teal
    isIncome: false,
    sortOrder: 3,
    merchants: ['uber', 'indriver', 'didi', 'sitp', 'transmilenio', 'cabify', 'picap'],
  },
  {
    slug: 'hogar',
    name: 'Hogar y Arriendo',
    icon: '🏠',
    color: '#C8CAD8',   // lavender
    isIncome: false,
    sortOrder: 4,
    merchants: ['arriendo', 'administración', 'administracion'],
  },
  {
    slug: 'servicios',
    name: 'Servicios Públicos',
    icon: '💡',
    color: '#D4E8A0',   // sage
    isIncome: false,
    sortOrder: 5,
    merchants: ['epm', 'etb', 'claro', 'movistar', 'tigo', 'gas natural', 'codensa'],
  },
  {
    slug: 'entretenimiento',
    name: 'Entretenimiento',
    icon: '🎬',
    color: '#E8673C',   // warm orange
    isIncome: false,
    sortOrder: 6,
    merchants: ['netflix', 'spotify', 'cinépolis', 'cinepolis', 'cine colombia', 'steam', 'disney'],
  },
  {
    slug: 'salud',
    name: 'Salud y Bienestar',
    icon: '🏥',
    color: '#D4E8A0',   // sage
    isIncome: false,
    sortOrder: 7,
    merchants: ['farmacia', 'droguería', 'drogueria', 'gym', 'smart fit'],
  },
  {
    slug: 'educacion',
    name: 'Educación',
    icon: '📚',
    color: '#4A7C6F',   // teal
    isIncome: false,
    sortOrder: 8,
    merchants: ['udemy', 'coursera', 'platzi'],
  },
  {
    slug: 'compras',
    name: 'Compras y Ropa',
    icon: '🛍️',
    color: '#C8CAD8',   // lavender
    isIncome: false,
    sortOrder: 9,
    merchants: ['falabella', 'zara', 'h&m', 'mercado libre', 'amazon'],
  },
  {
    slug: 'ingreso',
    name: 'Ingresos',
    icon: '💰',
    color: '#F5C540',   // gold
    isIncome: true,
    sortOrder: 10,
    merchants: ['nómina', 'nomina', 'salario', 'freelance'],
  },
  {
    slug: 'otros',
    name: 'Otros',
    icon: '📦',
    color: '#C8CAD8',   // lavender
    isIncome: false,
    sortOrder: 11,
  },
];

export function getCategoryBySlug(slug: string): CategoryConfig | undefined {
  return SYSTEM_CATEGORIES.find((c) => c.slug === slug);
}

export function getCategoryColor(slug: string): string {
  return getCategoryBySlug(slug)?.color ?? '#BDC3C7';
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
