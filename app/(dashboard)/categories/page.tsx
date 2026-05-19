import { createClient } from "@/lib/supabase/server";
import { SYSTEM_CATEGORIES } from "@/lib/utils/categories";
import { redirect } from "next/navigation";
import { NewCategoryForm } from "@/components/dashboard/new-category-form";

export const revalidate = 0;

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: customCategories } = await supabase
    .from("categories")
    .select("id, name, slug, icon, color, is_income")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black">Categorías</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Luca usa estas categorías para clasificar tus gastos automáticamente
        </p>
      </div>

      {/* Custom categories */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
            Mis categorías
          </h2>
        </div>

        <NewCategoryForm userId={user.id} />

        {customCategories && customCategories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
            {customCategories.map((cat) => (
              <div
                key={cat.id}
                className="rounded-2xl p-4 flex flex-col gap-1"
                style={{ backgroundColor: cat.color ?? "#BDC3C7" }}
              >
                <span className="text-2xl">{cat.icon ?? "📦"}</span>
                <p className="text-xs font-semibold text-black/70 uppercase tracking-wide truncate">
                  {cat.name}
                </p>
                <p className="text-xs text-black/50">
                  {cat.is_income ? "Ingreso" : "Gasto"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">
            Aún no tienes categorías personalizadas.
          </p>
        )}
      </section>

      {/* System categories */}
      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
          Categorías del sistema
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SYSTEM_CATEGORIES.map((cat) => (
            <div
              key={cat.slug}
              className="rounded-2xl p-4 flex flex-col gap-1"
              style={{ backgroundColor: cat.color }}
            >
              <span className="text-2xl">{cat.icon}</span>
              <p className="text-xs font-semibold text-black/70 uppercase tracking-wide truncate">
                {cat.name}
              </p>
              <p className="text-xs text-black/50">
                {cat.isIncome ? "Ingreso" : "Gasto"}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
