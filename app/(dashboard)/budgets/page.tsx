import { createClient } from "@/lib/supabase/server";
import { SYSTEM_CATEGORIES } from "@/lib/utils/categories";
import { getCurrentMonthRange } from "@/lib/utils/dates";
import { redirect } from "next/navigation";
import { AnimateIn } from "@/components/ui/animate-in";
import { NewBudgetForm } from "@/components/dashboard/new-budget-form";
import { BudgetRow } from "@/components/dashboard/budget-row";

export const revalidate = 0;

export default async function BudgetsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { start, end } = getCurrentMonthRange();

  const [{ data: budgets }, { data: transactions }, { data: customCategories }] = await Promise.all([
    supabase
      .from("budgets")
      .select("id, amount_limit, alert_at, period, category_id, categories(name, slug, color, icon)")
      .eq("user_id", user.id)
      .eq("is_active", true),

    supabase
      .from("transactions")
      .select("amount, category_id")
      .eq("user_id", user.id)
      .eq("transaction_type", "expense")
      .gte("occurred_at", start)
      .lte("occurred_at", end),

    supabase
      .from("categories")
      .select("id, name, slug")
      .eq("user_id", user.id),
  ]);

  // Map category_id → total spent this month
  const spentByCategory: Record<string, number> = {};
  for (const t of transactions ?? []) {
    if (t.category_id) {
      spentByCategory[t.category_id] = (spentByCategory[t.category_id] ?? 0) + t.amount;
    }
  }

  // Categories that already have an active budget — can't be picked again
  const usedSlugs = new Set(
    (budgets ?? []).map((b) => {
      const c = Array.isArray(b.categories) ? b.categories[0] : b.categories;
      return c?.slug;
    }).filter(Boolean) as string[],
  );

  const systemCats = SYSTEM_CATEGORIES
    .map((c) => ({ slug: c.slug, name: c.name }))
    .filter((c) => !usedSlugs.has(c.slug));
  const customCats = (customCategories ?? [])
    .map((c) => ({ id: c.id, slug: c.slug, name: c.name }))
    .filter((c) => !usedSlugs.has(c.slug));

  // Compute alert summary for banner
  const alertBudgets = (budgets ?? []).filter((b) => {
    const spent   = spentByCategory[b.category_id ?? ""] ?? 0;
    const pct     = spent / b.amount_limit;
    const alertAt = b.alert_at ?? 0.8;
    return pct >= alertAt;
  });
  const overBudgets  = alertBudgets.filter((b) => {
    const spent = spentByCategory[b.category_id ?? ""] ?? 0;
    return spent >= b.amount_limit;
  });
  const nearBudgets  = alertBudgets.filter((b) => {
    const spent = spentByCategory[b.category_id ?? ""] ?? 0;
    return spent < b.amount_limit;
  });

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <AnimateIn>
        <p className="text-[10px] uppercase tracking-widest text-foreground/40">Este mes</p>
        <h1 className="font-serif text-4xl md:text-5xl font-normal mt-1 text-foreground">
          Presupuestos
        </h1>
      </AnimateIn>

      {/* Alert banner */}
      {alertBudgets.length > 0 && (
        <AnimateIn>
          <div
            className="rounded-2xl px-5 py-4 flex items-start gap-3"
            style={{ backgroundColor: overBudgets.length > 0 ? "#FEE2E2" : "#FEF9C3" }}
          >
            <span className="text-xl shrink-0 mt-0.5">
              {overBudgets.length > 0 ? "🚨" : "⚠️"}
            </span>
            <div>
              <p className="text-sm font-semibold text-[#1A1A1A]">
                {overBudgets.length > 0
                  ? `${overBudgets.length} presupuesto${overBudgets.length > 1 ? "s" : ""} superado${overBudgets.length > 1 ? "s" : ""}`
                  : `${nearBudgets.length} presupuesto${nearBudgets.length > 1 ? "s" : ""} cerca del límite`}
              </p>
              <p className="text-xs text-[#1A1A1A]/60 mt-0.5">
                {overBudgets.length > 0 && nearBudgets.length > 0
                  ? `Además, ${nearBudgets.length} está${nearBudgets.length > 1 ? "n" : ""} cerca del límite.`
                  : overBudgets.length > 0
                  ? "Revisa tus gastos para el resto del mes."
                  : "Vas bien, pero vigila los gastos que quedan."}
              </p>
            </div>
          </div>
        </AnimateIn>
      )}

      {/* New budget form */}
      <AnimateIn>
        <NewBudgetForm systemCategories={systemCats} customCategories={customCats} />
      </AnimateIn>

      {!budgets?.length ? (
        <AnimateIn>
          <div className="text-center py-16 space-y-4">
            <p className="text-5xl">🎯</p>
            <p className="font-serif text-2xl font-normal text-foreground">Sin presupuestos aún</p>
            <p className="text-foreground/50 text-sm max-w-xs mx-auto leading-relaxed">
              Créalo arriba o dile a Luca por WhatsApp
            </p>
            <p className="text-sm font-mono bg-[#FEFF6E] rounded-xl px-4 py-2 inline-block text-[#1A1A1A]">
              &quot;ponme un presupuesto de 300 mil para comida&quot;
            </p>
          </div>
        </AnimateIn>
      ) : (
        <div className="space-y-3">
          {budgets.map((budget, i) => {
            const spent = spentByCategory[budget.category_id ?? ""] ?? 0;
            return (
              <AnimateIn key={budget.id} delay={i * 70}>
                <BudgetRow budget={budget} spent={spent} />
              </AnimateIn>
            );
          })}
        </div>
      )}
    </div>
  );
}
