import { createClient } from "@/lib/supabase/server";
import { formatCOP } from "@/lib/utils/currency";
import { getCategoryIcon, getCategoryColor } from "@/lib/utils/categories";
import { getCurrentMonthRange } from "@/lib/utils/dates";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function InsightsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { start, end } = getCurrentMonthRange();

  const { data: transactions } = await supabase
    .from("transactions")
    .select("amount, transaction_type, occurred_at, categories(name, slug, color, icon)")
    .eq("user_id", user.id)
    .gte("occurred_at", start)
    .lte("occurred_at", end)
    .order("occurred_at", { ascending: true });

  const expenses = (transactions ?? []).filter((t) => t.transaction_type === "expense");
  const income = (transactions ?? []).filter((t) => t.transaction_type === "income");

  const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome = income.reduce((s, t) => s + t.amount, 0);
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

  // Spending by category
  const byCat: Record<string, { name: string; slug: string; color: string; icon: string; total: number }> = {};
  for (const t of expenses) {
    const cat = Array.isArray(t.categories) ? t.categories[0] : t.categories;
    const slug = cat?.slug ?? "otros";
    if (!byCat[slug]) {
      byCat[slug] = {
        name: cat?.name ?? "Otros",
        slug,
        color: cat?.color ?? getCategoryColor(slug),
        icon: cat?.icon ?? getCategoryIcon(slug),
        total: 0,
      };
    }
    byCat[slug].total += t.amount;
  }
  const categories = Object.values(byCat).sort((a, b) => b.total - a.total);
  const topCategory = categories[0];

  // Daily spending for sparkline
  const dailyMap: Record<string, number> = {};
  for (const t of expenses) {
    const day = t.occurred_at.slice(0, 10);
    dailyMap[day] = (dailyMap[day] ?? 0) + t.amount;
  }
  const dailyValues = Object.values(dailyMap);
  const maxDaily = Math.max(...dailyValues, 1);

  const avgDaily = dailyValues.length > 0
    ? Math.round(dailyValues.reduce((s, v) => s + v, 0) / dailyValues.length)
    : 0;

  const now = new Date();
  const monthName = now.toLocaleDateString("es-CO", { month: "long", year: "numeric" });

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium capitalize">{monthName}</p>
        <h1 className="text-3xl font-black mt-1">Insights de Luca</h1>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <p className="text-5xl">✨</p>
          <p className="font-semibold">Sin datos suficientes aún</p>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Registra algunos gastos y Luca generará tus insights automáticamente.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Key metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <MetricCard label="Gasto total" value={formatCOP(totalExpenses)} accent="#E76F51" />
            <MetricCard label="Ingreso total" value={formatCOP(totalIncome)} accent="#2A9D8F" />
            <MetricCard
              label="Tasa de ahorro"
              value={`${savingsRate}%`}
              accent={savingsRate >= 20 ? "#2A9D8F" : savingsRate >= 10 ? "#F4A261" : "#E76F51"}
            />
          </div>

          {/* Daily avg */}
          <div className="bg-card rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Gasto promedio por día</p>
              <p className="text-2xl font-black mt-1">{formatCOP(avgDaily)}</p>
            </div>
            <div className="flex items-end gap-1 h-12">
              {dailyValues.slice(-14).map((v, i) => (
                <div
                  key={i}
                  className="w-2 rounded-sm"
                  style={{
                    height: `${Math.round((v / maxDaily) * 48)}px`,
                    backgroundColor: "#E76F51",
                    opacity: 0.4 + (i / 14) * 0.6,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Category breakdown */}
          {categories.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
                Gastos por categoría
              </h2>
              {categories.map((cat) => {
                const pct = totalExpenses > 0 ? Math.round((cat.total / totalExpenses) * 100) : 0;
                return (
                  <div key={cat.slug} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium">
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                      </span>
                      <span className="font-bold">{formatCOP(cat.total)}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: cat.color }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-right">{pct}% del total</p>
                  </div>
                );
              })}
            </section>
          )}

          {/* Luca tip */}
          {topCategory && (
            <div className="rounded-2xl p-5 space-y-1" style={{ backgroundColor: topCategory.color + "33" }}>
              <p className="text-xs uppercase tracking-widest font-semibold text-foreground/60">Tip de Luca</p>
              <p className="font-semibold text-sm">
                Tu mayor gasto este mes es en <strong>{topCategory.name}</strong> con {formatCOP(topCategory.total)}.
                {savingsRate < 20
                  ? " Intenta reducirlo un 10% el próximo mes."
                  : " ¡Vas muy bien con tus finanzas!"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="bg-card rounded-2xl p-4 space-y-1">
      <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">{label}</p>
      <p className="text-xl font-black" style={{ color: accent }}>{value}</p>
    </div>
  );
}
