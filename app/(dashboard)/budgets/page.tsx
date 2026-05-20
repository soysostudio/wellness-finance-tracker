import { createClient } from "@/lib/supabase/server";
import { formatCOP } from "@/lib/utils/currency";
import { getCategoryIcon } from "@/lib/utils/categories";
import { getCurrentMonthRange } from "@/lib/utils/dates";
import { redirect } from "next/navigation";
import { AnimateIn } from "@/components/ui/animate-in";

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
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <AnimateIn>
        <p className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/40">Este mes</p>
        <h1 className="font-serif text-4xl md:text-5xl font-normal mt-1 text-[#1A1A1A]">
          Presupuestos
        </h1>
      </AnimateIn>

      {!budgets?.length ? (
        <AnimateIn>
          <div className="text-center py-20 space-y-4">
            <p className="text-5xl">🎯</p>
            <p className="font-serif text-2xl font-normal text-[#1A1A1A]">Sin presupuestos aún</p>
            <p className="text-[#1A1A1A]/50 text-sm max-w-xs mx-auto leading-relaxed">
              Dile a Luca qué límite quieres para cada categoría
            </p>
            <p className="text-sm font-mono bg-[#FEFF6E] rounded-xl px-4 py-2 inline-block text-[#1A1A1A]">
              &quot;ponme un presupuesto de 300 mil para comida&quot;
            </p>
          </div>
        </AnimateIn>
      ) : (
        <div className="space-y-3">
          {budgets.map((budget, i) => {
            const cat      = Array.isArray(budget.categories) ? budget.categories[0] : budget.categories;
            const icon     = cat?.icon ?? getCategoryIcon(cat?.slug ?? "otros");
            const color    = cat?.color ?? "#BDC3C7";
            const spent    = spentByCategory[budget.id] ?? 0;
            const pct      = Math.min(Math.round((spent / budget.amount_limit) * 100), 100);
            const remaining = budget.amount_limit - spent;
            const alertPct = Math.round((budget.alert_at ?? 0.8) * 100);

            const barColor =
              pct >= 100 ? "#E76F51" :
              pct >= alertPct ? "#F4A261" :
              "#1A1A1A";

            return (
              <AnimateIn key={budget.id} delay={i * 70}>
                <div className="bg-card border border-[#1A1A1A]/5 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                      style={{ backgroundColor: color + "26" }}
                    >
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A1A]">{cat?.name ?? "Categoría"}</p>
                      <p className="text-xs text-[#1A1A1A]/40 capitalize">{budget.period}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-serif text-xl font-normal text-[#1A1A1A]">{pct}%</p>
                      <p className="text-[10px] text-[#1A1A1A]/40 uppercase tracking-widest">usado</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="h-1.5 bg-[#1A1A1A]/8 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: barColor }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-[#1A1A1A]/40">
                      <span>{formatCOP(spent)} gastado</span>
                      <span>límite {formatCOP(budget.amount_limit)}</span>
                    </div>
                  </div>

                  {pct >= 100 ? (
                    <p className="text-xs text-[#E76F51] font-medium">
                      🚨 Superaste tu presupuesto por {formatCOP(Math.abs(remaining))}
                    </p>
                  ) : pct >= alertPct ? (
                    <p className="text-xs text-[#F4A261] font-medium">
                      ⚠️ Quedan {formatCOP(remaining)} — cerca del límite
                    </p>
                  ) : (
                    <p className="text-xs text-[#1A1A1A]/40">
                      {formatCOP(remaining)} disponibles
                    </p>
                  )}
                </div>
              </AnimateIn>
            );
          })}
        </div>
      )}
    </div>
  );
}
