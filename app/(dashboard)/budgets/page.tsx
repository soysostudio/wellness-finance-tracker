import { createClient } from "@/lib/supabase/server";
import { formatCOP } from "@/lib/utils/currency";
import { getCategoryIcon } from "@/lib/utils/categories";
import { getCurrentMonthRange } from "@/lib/utils/dates";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function BudgetsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { start, end } = getCurrentMonthRange();

  const { data: budgets } = await supabase
    .from("budgets")
    .select("id, amount_limit, alert_at, period, categories(name, slug, color, icon)")
    .eq("user_id", user.id)
    .eq("is_active", true);

  const { data: transactions } = await supabase
    .from("transactions")
    .select("amount, category_id")
    .eq("user_id", user.id)
    .eq("transaction_type", "expense")
    .gte("occurred_at", start)
    .lte("occurred_at", end);

  const spentByCategory: Record<string, number> = {};
  for (const t of transactions ?? []) {
    if (t.category_id) {
      spentByCategory[t.category_id] = (spentByCategory[t.category_id] ?? 0) + t.amount;
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black">Presupuestos</h1>
        <p className="text-muted-foreground text-sm mt-1">Control de límites por categoría este mes</p>
      </div>

      {!budgets?.length ? (
        <div className="text-center py-20 space-y-3">
          <p className="text-5xl">🎯</p>
          <p className="font-semibold">Sin presupuestos aún</p>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Dile a Luca qué límite quieres para cada categoría
          </p>
          <p className="text-sm font-mono bg-muted rounded-xl px-4 py-2 inline-block">
            &quot;ponme un presupuesto de 300 mil para comida&quot;
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {budgets.map((budget) => {
            const cat = Array.isArray(budget.categories) ? budget.categories[0] : budget.categories;
            const icon = cat?.icon ?? getCategoryIcon(cat?.slug ?? "otros");
            const spent = spentByCategory[budget.id] ?? 0;
            const pct = Math.min(Math.round((spent / budget.amount_limit) * 100), 100);
            const remaining = budget.amount_limit - spent;
            const alertPct = Math.round((budget.alert_at ?? 0.8) * 100);

            const barColor =
              pct >= 100 ? "#E76F51" :
              pct >= alertPct ? "#F4A261" :
              "#2A9D8F";

            return (
              <div key={budget.id} className="bg-card rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: cat?.color ?? "#BDC3C7" }}
                  >
                    {icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{cat?.name ?? "Categoría"}</p>
                    <p className="text-xs text-muted-foreground capitalize">{budget.period}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm">{pct}%</p>
                    <p className="text-xs text-muted-foreground">usado</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: barColor }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatCOP(spent)} gastado</span>
                    <span>límite: {formatCOP(budget.amount_limit)}</span>
                  </div>
                </div>

                {pct >= 100 ? (
                  <p className="text-xs font-semibold" style={{ color: "#E76F51" }}>
                    🚨 Superaste tu presupuesto por {formatCOP(Math.abs(remaining))}
                  </p>
                ) : pct >= alertPct ? (
                  <p className="text-xs font-semibold" style={{ color: "#F4A261" }}>
                    ⚠️ Quedan {formatCOP(remaining)} — estás cerca del límite
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Quedan {formatCOP(remaining)} disponibles
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
