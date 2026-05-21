import { createClient } from "@/lib/supabase/server";
import { SYSTEM_CATEGORIES } from "@/lib/utils/categories";
import { redirect } from "next/navigation";
import { NewCategoryForm } from "@/components/dashboard/new-category-form";
import { CategoryCard } from "@/components/dashboard/category-card";
import { AnimateIn } from "@/components/ui/animate-in";
import { CategoryIcon } from "@/components/ui/category-icon";

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
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-10">

      {/* Header */}
      <AnimateIn>
        <p className="text-[10px] uppercase tracking-widest text-foreground/40">Clasificación</p>
        <h1 className="font-serif text-4xl md:text-5xl font-normal mt-1 text-foreground">
          Categorías
        </h1>
        <p className="text-sm text-foreground/40 mt-2 leading-relaxed">
          Luca usa estas categorías para clasificar tus gastos automáticamente
        </p>
      </AnimateIn>

      {/* Custom categories */}
      <section className="space-y-4">
        <AnimateIn>
          <p className="text-[10px] uppercase tracking-widest text-foreground/40">Mis categorías</p>
        </AnimateIn>

        <AnimateIn delay={40}>
          <NewCategoryForm userId={user.id} />
        </AnimateIn>

        {customCategories && customCategories.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
            {customCategories.map((cat, i) => (
              <AnimateIn key={cat.id} delay={i * 50}>
                <CategoryCard cat={cat} />
              </AnimateIn>
            ))}
          </div>
        )}

        {(!customCategories || customCategories.length === 0) && (
          <p className="text-sm text-foreground/40 py-2">
            Aún no tienes categorías personalizadas.
          </p>
        )}
      </section>

      {/* System categories */}
      <section className="space-y-4">
        <AnimateIn>
          <p className="text-[10px] uppercase tracking-widest text-foreground/40">Categorías del sistema</p>
        </AnimateIn>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SYSTEM_CATEGORIES.map((cat, i) => (
            <AnimateIn key={cat.slug} delay={i * 40}>
              <div
                className="rounded-2xl p-4 flex flex-col gap-2 h-full"
                style={{ backgroundColor: cat.color }}
              >
                <CategoryIcon slug={cat.slug} size={18} strokeWidth={1.5} style={{ color: cat.color, filter: "brightness(0.6)" }} />
                <p className="text-[10px] text-[#1A1A1A]/50 uppercase tracking-widest truncate">
                  {cat.name}
                </p>
                <p className="text-xs text-[#1A1A1A]/40">
                  {cat.isIncome ? "Ingreso" : "Gasto"}
                </p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </section>
    </div>
  );
}
