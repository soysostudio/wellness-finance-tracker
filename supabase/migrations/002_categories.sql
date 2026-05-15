-- ============================================================
-- 002: categories table
-- user_id = NULL → system/default categories (visible to all)
-- user_id = <uuid> → user custom categories
-- ============================================================

CREATE TABLE public.categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  icon        TEXT,
  color       TEXT,
  is_income   BOOLEAN NOT NULL DEFAULT false,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_categories_user_slug
  ON public.categories(COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::UUID), slug);

-- RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read system categories"
  ON public.categories FOR SELECT
  USING (user_id IS NULL);

CREATE POLICY "users can read own categories"
  ON public.categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users can insert own categories"
  ON public.categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update own categories"
  ON public.categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "users can delete own categories"
  ON public.categories FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Seed: system categories for Colombia
-- ============================================================
INSERT INTO public.categories (user_id, name, slug, icon, color, is_income, sort_order) VALUES
  (NULL, 'Comida y Restaurantes',  'comida',          '🍔', '#F4A261', false,  1),
  (NULL, 'Mercado y Supermercado', 'mercado',          '🛒', '#E9C46A', false,  2),
  (NULL, 'Transporte',             'transporte',       '🚗', '#457B9D', false,  3),
  (NULL, 'Hogar y Arriendo',       'hogar',            '🏠', '#6D6875', false,  4),
  (NULL, 'Servicios Públicos',     'servicios',        '💡', '#A8DADC', false,  5),
  (NULL, 'Entretenimiento',        'entretenimiento',  '🎬', '#E76F51', false,  6),
  (NULL, 'Salud y Bienestar',      'salud',            '🏥', '#81B29A', false,  7),
  (NULL, 'Educación',              'educacion',        '📚', '#264653', false,  8),
  (NULL, 'Compras y Ropa',         'compras',          '🛍️', '#CDB4DB', false,  9),
  (NULL, 'Ingresos',               'ingreso',          '💰', '#2A9D8F', true,  10),
  (NULL, 'Otros',                  'otros',            '📦', '#BDC3C7', false, 11);
