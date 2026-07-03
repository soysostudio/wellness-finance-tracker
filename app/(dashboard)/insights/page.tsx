import { createClient } from "@/lib/supabase/server";
import { formatCOP } from "@/lib/utils/currency";
import { getCategoryColor } from "@/lib/utils/categories";
import { CategoryIcon } from "@/components/ui/category-icon";
import { getCurrentMonthRange, getLastMonthRange } from "@/lib/utils/dates";
import { redirect } from "next/navigation";
import { AnimateIn } from "@/components/ui/animate-in";

export const revalidate = 0;

export default async function InsightsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { start, end }               = getCurrentMonthRange();
  const { start: lastStart, end: lastEnd } = getLastMonthRange();

  const [{ data: transactions }, { data: lastMonthTxs }, { data: profile }] = await Promise.all([
    supabase
      .from("transactions")
      .select("amount, transaction_type, occurred_at, categories(name, slug, color, icon)")
      .eq("user_id", user.id)
      .gte("occurred_at", start)
      .lte("occurred_at", end)
      .order("occurred_at", { ascending: true }),

    supabase
      .from("transactions")
      .select("amount, transaction_type")
      .eq("user_id", user.id)
      .eq("transaction_type", "expense")
      .gte("occurred_at", lastStart)
      .lte("occurred_at", lastEnd),

    supabase
      .from("users")
      .select("monthly_income")
      .eq("id", user.id)
      .single(),
  ]);

  const expenses = (transactions ?? []).filter((t) => t.transaction_type === "expense");
  const income   = (transactions ?? []).filter((t) => t.transaction_type === "income");

  const totalExpenses  = expenses.reduce((s, t) => s + t.amount, 0);
  // Configured salary + logged income — consistent with the Overview summary
  const totalIncome    = income.reduce((s, t) => s + t.amount, 0) + (profile?.monthly_income ?? 0);
  const lastMonthTotal = (lastMonthTxs ?? []).reduce((s, t) => s + t.amount, 0);

  const savingsRate = totalIncome > 0
    ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100)
    : 0;

  // Month-over-month comparison (null if no last month data)
  const monthDelta: number | null = lastMonthTotal > 0
    ? Math.round(((totalExpenses - lastMonthTotal) / lastMonthTotal) * 100)
    : null;

  // Projection to end of month
  const now         = new Date();
  const daysPassed  = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const projection  = daysPassed > 0
    ? Math.round((totalExpenses / daysPassed) * daysInMonth)
    : 0;

  // Category breakdown
  const byCat: Record<string, { name: string; slug: string; color: string; icon: string; total: number }> = {};
  for (const t of expenses) {
    const cat  = Array.isArray(t.categories) ? t.categories[0] : t.categories;
    const slug = cat?.slug ?? "otros";
    if (!byCat[slug]) {
      byCat[slug] = {
        name:  cat?.name  ?? "Otros",
        slug,
        color: cat?.color ?? getCategoryColor(slug),
        icon:  "",
        total: 0,
      };
    }
    byCat[slug].total += t.amount;
  }
  const categories  = Object.values(byCat).sort((a, b) => b.total - a.total);
  const topCategory = categories[0];

  // Daily sparkline
  const dailyMap: Record<string, number> = {};
  for (const t of expenses) {
    const day = t.occurred_at.slice(0, 10);
    dailyMap[day] = (dailyMap[day] ?? 0) + t.amount;
  }
  const dailyValues = Object.values(dailyMap);
  const maxDaily    = Math.max(...dailyValues, 1);
  const avgDaily    = dailyValues.length > 0
    ? Math.round(dailyValues.reduce((s, v) => s + v, 0) / dailyValues.length)
    : 0;

  const monthName = now.toLocaleDateString("es-CO", { month: "long", year: "numeric" });

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <AnimateIn>
        <p className="text-[10px] uppercase tracking-widest text-foreground/40 capitalize">{monthName}</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold mt-1 text-foreground">
          Insights de Luca
        </h1>
      </AnimateIn>

      {expenses.length === 0 ? (
        <AnimateIn>
          <div className="text-center py-20 space-y-4">
            <p className="text-5xl">✨</p>
            <p className="font-display text-2xl font-normal text-foreground">Sin datos suficientes aún</p>
            <p className="text-foreground/50 text-sm max-w-xs mx-auto leading-relaxed">
              Registra algunos gastos y Luca generará tus insights automáticamente.
            </p>
          </div>
        </AnimateIn>
      ) : (
        <div className="space-y-6">

          {/* Key metrics */}
          <div className="grid grid-cols-3 gap-6 py-6 border-t border-b border-foreground/8">
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-widest text-foreground/40">Gasto total</p>
              <p className="font-display text-xl md:text-2xl font-normal text-foreground">{formatCOP(totalExpenses)}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-widest text-foreground/40">Ingreso total</p>
              <p className="font-display text-xl md:text-2xl font-normal text-foreground">{formatCOP(totalIncome)}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-widest text-foreground/40">Tasa de ahorro</p>
              <p className={`font-display text-xl md:text-2xl font-normal ${savingsRate < 10 ? "text-[#E8673C]" : "text-foreground"}`}>
                {savingsRate}%
              </p>
            </div>
          </div>

          {/* Daily avg + sparkline */}
          <AnimateIn delay={80}>
            <div className="bg-card border border-foreground/5 rounded-2xl p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-foreground/40">Gasto promedio por día</p>
                <p className="font-display text-2xl font-bold text-foreground mt-1">{formatCOP(avgDaily)}</p>
              </div>
              <div className="flex items-end gap-1 h-12 shrink-0">
                {dailyValues.slice(-14).map((v, i) => (
                  <div
                    key={i}
                    className="w-2 rounded-sm"
                    style={{
                      height: `${Math.max(4, Math.round((v / maxDaily) * 48))}px`,
                      backgroundColor: "#FFB0FF",
                      opacity: 0.4 + (i / 14) * 0.6,
                    }}
                  />
                ))}
              </div>
            </div>
          </AnimateIn>

          {/* Month comparison + projection */}
          <AnimateIn delay={100}>
            <div className="grid grid-cols-2 gap-4">
              {/* vs. last month */}
              <div className="bg-card border border-foreground/5 rounded-2xl p-5 space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-foreground/40">vs. mes anterior</p>
                {monthDelta === null ? (
                  <p className="font-display text-2xl font-normal text-foreground/30">—</p>
                ) : (
                  <>
                    <p className={`font-display text-2xl font-normal ${
                      monthDelta > 10 ? "text-[#E8673C]" : monthDelta < -5 ? "text-[#2A9D8F]" : "text-foreground"
                    }`}>
                      {monthDelta > 0 ? "+" : ""}{monthDelta}%
                    </p>
                    <p className="text-xs text-foreground/40">
                      {monthDelta > 0
                        ? `Gastaste ${formatCOP(totalExpenses - lastMonthTotal)} más`
                        : monthDelta < 0
                        ? `Ahorraste ${formatCOP(lastMonthTotal - totalExpenses)} más`
                        : "Igual que el mes pasado"}
                    </p>
                  </>
                )}
              </div>

              {/* Projection */}
              <div className="bg-card border border-foreground/5 rounded-2xl p-5 space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-foreground/40">Proyección del mes</p>
                <p className="font-display text-2xl font-normal text-foreground">{formatCOP(projection)}</p>
                <p className="text-xs text-foreground/40">
                  Día {daysPassed} de {daysInMonth} · a este ritmo
                </p>
              </div>
            </div>
          </AnimateIn>

          {/* Category breakdown */}
          {categories.length > 0 && (
            <section>
              <AnimateIn>
                <p className="text-[10px] uppercase tracking-widest text-foreground/40 mb-4">
                  Gastos por categoría
                </p>
              </AnimateIn>
              <div className="space-y-4">
                {categories.map((cat, i) => {
                  const pct = totalExpenses > 0 ? Math.round((cat.total / totalExpenses) * 100) : 0;
                  return (
                    <AnimateIn key={cat.slug} delay={i * 50}>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <CategoryIcon slug={cat.slug} name={cat.name} size={15} strokeWidth={1.5} style={{ color: cat.color }} />
                            <span>{cat.name}</span>
                          </span>
                          <span className="font-display text-sm font-normal text-foreground">
                            {formatCOP(cat.total)}
                          </span>
                        </div>
                        <div className="h-1.5 bg-foreground/8 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, backgroundColor: cat.color }}
                          />
                        </div>
                        <p className="text-xs text-foreground/40 text-right">{pct}% del total</p>
                      </div>
                    </AnimateIn>
                  );
                })}
              </div>
            </section>
          )}

          {/* Luca tip */}
          {topCategory && (
            <AnimateIn>
              <div className="rounded-2xl p-5 space-y-2" style={{ backgroundColor: "#FEFF6E" }}>
                <p className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/50">Tip de Luca ✨</p>
                <p className="text-sm text-[#1A1A1A] leading-relaxed">
                  Tu mayor gasto este mes es en <strong>{topCategory.name}</strong> con{" "}
                  {formatCOP(topCategory.total)}.{" "}
                  {savingsRate < 20
                    ? "Intenta reducirlo un 10% el próximo mes."
                    : "¡Vas muy bien con tus finanzas!"}
                </p>
              </div>
            </AnimateIn>
          )}
        </div>
      )}
    </div>
  );
}
