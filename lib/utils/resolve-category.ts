import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Resolve a category slug to its id for a given user.
 *
 * A user can create a custom category whose slug collides with a system one
 * (e.g. a personal "comida" alongside the built-in "comida"), because the
 * unique index is per-user. A naive `.eq('slug').single()` then matches two
 * rows and throws. This resolver fetches both and deterministically prefers
 * the user's own category over the system default.
 *
 * Returns the category id, or null if no matching category exists.
 */
export async function resolveCategoryId(
  supabase: SupabaseClient,
  slug: string,
  userId: string,
): Promise<string | null> {
  const { data: cats } = await supabase
    .from('categories')
    .select('id, user_id')
    .eq('slug', slug)
    .or(`user_id.is.null,user_id.eq.${userId}`);

  if (!cats || cats.length === 0) return null;

  const own = cats.find((c) => c.user_id === userId);
  return (own ?? cats[0]).id;
}
