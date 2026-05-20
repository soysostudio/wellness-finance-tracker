import { createClient } from "@/lib/supabase/server";
import { formatCOP } from "@/lib/utils/currency";
import { getCurrentMonthRange } from "@/lib/utils/dates";
import { getCategoryColor, getCategoryIcon } from "@/lib/utils/categories";
import { redirect } from "next/navigation";
import { RecentTransactions } from "@/components/dashboard/transaction-list";

export const revalidate = 0;

async function getOverviewData(userId: string) {
  const supabase = await createClient();
  const { start, end } = getCurrentMonthRange();

  const [{ data: transactions }, { data: goals }, { data: budgets }] =
    await Promise.all([
      supabase
        .from("transactions")
        .select("amount, transaction_type, category_id, occurred_at, description, merchant, categories(name, slug, color, icon)")
        .eq("user_id", userId)
        .gte("occurred_at", start)
        .lte("occurred_at", end)
        .order("occurred_at", { ascending: false }),

      supabase
        .from("goals")
        .select("id, name, target_amount, current_amount, status")
        .eq("user_id", userId)
        .eq("status", "active")
        .limit(3),

      supabase
        .from("budgets")
        .select("id, amount_limit, category_id, categories(name, slug, color)")
        .eq("user_id", userId)
        .eq("is_active", true),
    ]);

  const expenses = (transactions ?? []).filter((t) => t.transaction_type === "expense");
  const income = (transactions ?? []).filter((t) => t.transaction_type === "income");

  const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome = income.reduce((s, t) => s + t.amount, 0);

  // Spending by category
  const byCat: Record<string, { name: string; slug: string; color: string; icon: string; total: number }> = {};
  for (const t of expenses) {
    const cat = Array.isArray(t.categories) ? t.categories[0] : t.categories;
    const slug = cat?.slug ?? "otros";
    const key = slug;
    if (!byCat[key]) {
      byCat[key] = {
        name: cat?.name ?? "Otros",
        slug,
        color: cat?.color ?? getCategoryColor(slug),
        icon: getCategoryIcon(slug),
        total: 0,
      };
    }
    byCat[key].total += t.amount;
  }

  const categoryBreakdown = Object.values(byCat)
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  return {
    totalExpenses,
    totalIncome,
    net: totalIncome - totalExpenses,
    categoryBreakdown,
    recentTransactions: (transactions ?? []).slice(0, 8),
    goals: goals ?? [],
    budgets: budgets ?? [],
  };
}

export default async function OverviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const overview = await getOverviewData(user.id);
  const firstName = profile?.full_name?.split(" ")[0] ?? "tú";

  const now = new Date();
  const monthName = now.toLocaleDateString("es-CO", { month: "long" });
  const year = now.getFullYear();

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground uppercase tracking-widest font-medium">
          {monthName} {year}
        </p>
        <h1 className="font-serif text-4xl md:text-5xl font-normal mt-1">
          Hola, {firstName} 👋
        </h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="Gastos del mes"  value={formatCOP(overview.totalExpenses)} bg="#FFB0FF" />
        <SummaryCard label="Ingresos del mes" value={formatCOP(overview.totalIncome)}   bg="#ADDEFF" />
        <SummaryCard label="Balance neto"     value={formatCOP(overview.net)}           bg={overview.net >= 0 ? "#FEFF6E" : "#FFB0FF"} />
      </div>

      {/* Category breakdown — editorial bold blocks */}
      {overview.categoryBreakdown.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-widest font-semibold text-muted-foreground mb-3">
            Gastos por categoría
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {overview.categoryBreakdown.map((cat) => (
              <div
                key={cat.slug}
                className="rounded-2xl p-4 flex flex-col gap-1"
                style={{ backgroundColor: cat.color }}
              >
                <span className="text-2xl">{cat.icon}</span>
                <p className="text-xs font-semibold text-black/70 uppercase tracking-wide">
                  {cat.name}
                </p>
                <p className="text-xl font-black text-black">
                  {formatCOP(cat.total)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent transactions */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
            Últimas transacciones
          </h2>
          <a href="/transactions" className="text-xs font-semibold underline underline-offset-4">
            Ver todas
          </a>
        </div>
        <RecentTransactions transactions={overview.recentTransactions} />
      </section>

      {/* Goals */}
      {overview.goals.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-widest font-semibold text-muted-foreground mb-3">
            Tus metas activas
          </h2>
          <div className="space-y-3">
            {overview.goals.map((goal) => {
              const pct = Math.min(
                Math.round((goal.current_amount / goal.target_amount) * 100),
                100
              );
              return (
                <div key={goal.id} className="bg-card rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-sm">{goal.name}</p>
                    <p className="text-xs text-muted-foreground">{pct}%</p>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-foreground transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatCOP(goal.current_amount)}</span>
                    <span>{formatCOP(goal.target_amount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty state */}
      {overview.totalExpenses === 0 && overview.totalIncome === 0 && (
        <div className="text-center py-16 space-y-3">
          <p className="text-5xl">💬</p>
          <p className="font-semibold">Aún no hay movimientos este mes</p>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Cuéntale a Luca tu primer gasto por WhatsApp y aparecerá aquí al instante.
          </p>
          <p className="text-sm font-mono bg-muted rounded-xl px-4 py-2 inline-block">
            &quot;gasté 45 mil en Rappi&quot;
          </p>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, bg }: { label: string; value: string; bg: string }) {
  return (
    <div className="rounded-2xl p-5 space-y-1" style={{ backgroundColor: bg }}>
      <p className="text-xs uppercase tracking-widest font-medium text-[#1A1A1A]/50">
        {label}
      </p>
      <p className="font-serif text-2xl font-normal text-[#1A1A1A]">
        {value}
      </p>
    </div>
  );
}
