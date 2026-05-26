import { createClient } from "@/lib/supabase/server";
import { formatCOP } from "@/lib/utils/currency";
import { getMonthRange } from "@/lib/utils/dates";
import { getCategoryColor, getCategoryIcon } from "@/lib/utils/categories";
import { redirect } from "next/navigation";
import { TransactionRow } from "@/components/dashboard/transaction-row";
import { AnimateIn } from "@/components/ui/animate-in";
import { CategoryIcon } from "@/components/ui/category-icon";
import { MonthNav } from "@/components/dashboard/month-nav";

export const revalidate = 0;

async function getOverviewData(userId: string, yearMonth: string) {
  const supabase = await createClient();
  const { start, end } = getMonthRange(yearMonth);

  const [{ data: transactions }, { data: goals }, { data: budgets }] =
    await Promise.all([
      supabase
        .from("transactions")
        .select("id, amount, transaction_type, category_id, occurred_at, description, merchant, categories(name, slug, color, icon)")
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
  const income   = (transactions ?? []).filter((t) => t.transaction_type === "income");

  const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome   = income.reduce((s, t) => s + t.amount, 0);

  const byCat: Record<string, { name: string; slug: string; color: string; icon: string; total: number }> = {};
  for (const t of expenses) {
    const cat  = Array.isArray(t.categories) ? t.categories[0] : t.categories;
    const slug = cat?.slug ?? "otros";
    if (!byCat[slug]) {
      byCat[slug] = {
        name:  cat?.name ?? "Otros",
        slug,
        color: getCategoryColor(slug),
        icon:  getCategoryIcon(slug),
        total: 0,
      };
    }
    byCat[slug].total += t.amount;
  }

  const categoryBreakdown = Object.values(byCat)
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  return {
    totalExpenses,
    totalIncome,
    categoryBreakdown,
    recentTransactions: (transactions ?? []).slice(0, 8),
    goals:   goals ?? [],
    budgets: budgets ?? [],
  };
}

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Resolve month — default to current month
  const { month: monthParam } = await searchParams;
  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const yearMonth = /^\d{4}-\d{2}$/.test(monthParam ?? "") ? monthParam! : currentYM;
  const isCurrentMonth = yearMonth === currentYM;

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, monthly_income")
    .eq("id", user.id)
    .single();

  const overview   = await getOverviewData(user.id, yearMonth);
  const firstName  = profile?.full_name?.split(" ")[0] ?? "tú";

  // Use configured monthly_income as fallback only for current month
  const displayIncome  = overview.totalIncome > 0
    ? overview.totalIncome
    : isCurrentMonth ? (profile?.monthly_income ?? 0) : 0;
  const incomeIsSalary = overview.totalIncome === 0 && isCurrentMonth && (profile?.monthly_income ?? 0) > 0;
  const displayNet     = displayIncome - overview.totalExpenses;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-10">

      {/* ── Header ─────────────────────────────────── */}
      <AnimateIn>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl md:text-5xl font-normal text-foreground">
              {isCurrentMonth ? `Hola, ${firstName} 👋` : "Resumen"}
            </h1>
          </div>
          <div className="pt-1">
            <MonthNav yearMonth={yearMonth} />
          </div>
        </div>
      </AnimateIn>

      {/* ── Summary stats ──────────────────────────── */}
      <AnimateIn>
        <div className="grid grid-cols-3 gap-6 py-6 border-t border-b border-foreground/8">
          <StatBlock label="Gastos"   value={formatCOP(overview.totalExpenses)} />
          <StatBlock
            label="Ingresos"
            value={formatCOP(displayIncome)}
            sublabel={incomeIsSalary ? "salario configurado" : undefined}
          />
          <StatBlock
            label="Balance neto"
            value={formatCOP(displayNet)}
            muted={displayNet < 0}
          />
        </div>
      </AnimateIn>

      {/* ── Category breakdown ─────────────────────── */}
      {overview.categoryBreakdown.length > 0 && (
        <section>
          <AnimateIn>
            <SectionLabel>Gastos por categoría</SectionLabel>
          </AnimateIn>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
            {overview.categoryBreakdown.map((cat, i) => (
              <AnimateIn key={cat.slug} delay={i * 60}>
                <div
                  className="rounded-2xl p-4 flex flex-col gap-2 h-full"
                  style={{ backgroundColor: cat.color }}
                >
                  <CategoryIcon slug={cat.slug} size={18} strokeWidth={1.5} style={{ color: cat.color, filter: "brightness(0.6)" }} />
                  <p className="text-[10px] text-[#1A1A1A]/50 uppercase tracking-widest leading-none">
                    {cat.name}
                  </p>
                  <p className="font-serif text-xl font-normal text-[#1A1A1A]">
                    {formatCOP(cat.total)}
                  </p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </section>
      )}

      {/* ── Recent transactions ────────────────────── */}
      <section>
        <AnimateIn>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Últimas transacciones</SectionLabel>
            <a
              href="/transactions"
              className="text-xs text-foreground/40 hover:text-foreground transition-colors underline underline-offset-4"
            >
              Ver todas
            </a>
          </div>
        </AnimateIn>
        <AnimateIn delay={60}>
          {overview.recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-foreground/40 text-sm">
              Sin transacciones en {new Date(yearMonth + "-01").toLocaleDateString("es-CO", { month: "long", year: "numeric" })}
            </div>
          ) : (
            <div className="space-y-1.5">
              {overview.recentTransactions.map((t) => (
                <TransactionRow key={t.id} t={t} />
              ))}
            </div>
          )}
        </AnimateIn>
      </section>

      {/* ── Goals (solo mes actual) ─────────────────── */}
      {isCurrentMonth && overview.goals.length > 0 && (
        <section>
          <AnimateIn>
            <SectionLabel className="mb-3">Tus metas activas</SectionLabel>
          </AnimateIn>
          <div className="space-y-3">
            {overview.goals.map((goal, i) => {
              const pct = Math.min(
                Math.round((goal.current_amount / goal.target_amount) * 100),
                100
              );
              return (
                <AnimateIn key={goal.id} delay={i * 80}>
                  <div className="bg-card rounded-2xl p-5 space-y-3 border border-foreground/5">
                    <div className="flex justify-between items-baseline">
                      <p className="text-sm font-medium text-foreground">{goal.name}</p>
                      <p className="text-xs text-foreground/40">{pct}%</p>
                    </div>
                    <div className="h-1.5 bg-foreground/8 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-foreground transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-foreground/40">
                      <span>{formatCOP(goal.current_amount)}</span>
                      <span>{formatCOP(goal.target_amount)}</span>
                    </div>
                  </div>
                </AnimateIn>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Empty state ────────────────────────────── */}
      {overview.totalExpenses === 0 && overview.totalIncome === 0 && (
        <AnimateIn>
          <div className="text-center py-16 space-y-4">
            <p className="text-5xl">💬</p>
            <p className="font-serif text-2xl font-normal text-foreground">
              {isCurrentMonth ? "Sin movimientos este mes" : "Sin movimientos ese mes"}
            </p>
            {isCurrentMonth && (
              <>
                <p className="text-foreground/50 text-sm max-w-xs mx-auto leading-relaxed">
                  Cuéntale a Luca tu primer gasto por WhatsApp y aparecerá aquí al instante.
                </p>
                <p className="text-sm font-mono bg-[#FEFF6E] rounded-xl px-4 py-2 inline-block text-foreground">
                  &quot;gasté 45 mil en Rappi&quot;
                </p>
              </>
            )}
          </div>
        </AnimateIn>
      )}
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────── */

function StatBlock({ label, value, muted, sublabel }: { label: string; value: string; muted?: boolean; sublabel?: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] uppercase tracking-widest text-foreground/40">{label}</p>
      <p className={`font-serif text-xl md:text-2xl font-normal ${muted ? "text-[#E8673C]" : "text-foreground"}`}>
        {value}
      </p>
      {sublabel && (
        <p className="text-[9px] uppercase tracking-widest text-foreground/30">{sublabel}</p>
      )}
    </div>
  );
}

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-[10px] uppercase tracking-widest text-foreground/40 font-medium ${className ?? ""}`}>
      {children}
    </p>
  );
}
