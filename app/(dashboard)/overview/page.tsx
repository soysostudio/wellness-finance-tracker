import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCOP } from "@/lib/utils/currency";
import { getMonthRange } from "@/lib/utils/dates";
import { getCategoryColor, getCategoryIcon } from "@/lib/utils/categories";
import { redirect } from "next/navigation";
import { TransactionRow } from "@/components/dashboard/transaction-row";
import { AnimateIn } from "@/components/ui/animate-in";
import { CategoryIcon } from "@/components/ui/category-icon";
import { MonthNav } from "@/components/dashboard/month-nav";
import Link from "next/link";

export const revalidate = 0;

// ── Personal overview ─────────────────────────────────────────────────────────
async function getOverviewData(userId: string, yearMonth: string) {
  const supabase = await createClient();
  const { start, end } = getMonthRange(yearMonth);

  const [{ data: transactions }, { data: goals }, { data: budgets }] =
    await Promise.all([
      supabase
        .from("transactions")
        .select("id, amount, transaction_type, category_id, occurred_at, description, merchant, categories(name, slug, color, icon)")
        .eq("user_id", userId)
        .is("group_id", null)
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

  return buildOverviewResult(transactions ?? [], expenses, income, goals ?? [], budgets ?? []);
}

// ── Groups spending summary ───────────────────────────────────────────────────
async function getGroupsSpending(userId: string, yearMonth: string) {
  const admin = createAdminClient();
  const { start, end } = getMonthRange(yearMonth);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: memberRows } = await (admin as any)
    .from("group_members")
    .select("group_id, expense_groups(id, name, icon, color, budget)")
    .eq("user_id", userId);

  type GroupInfo = { id: string; name: string; icon: string; color: string; budget: number | null };
  const groups: GroupInfo[] = ((memberRows ?? []) as { expense_groups: GroupInfo | GroupInfo[] | null }[])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((m: any) => m.expense_groups as GroupInfo | GroupInfo[] | null)
    .map((g) => (Array.isArray(g) ? g[0] : g))
    .filter((g): g is GroupInfo => !!g);

  if (groups.length === 0) return [];

  const groupIds = groups.map((g) => g.id);

  // Single query: all group transactions this month
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: txs } = await (admin as any)
    .from("transactions")
    .select("amount, group_id, transaction_type")
    .in("group_id", groupIds)
    .eq("transaction_type", "expense")
    .gte("occurred_at", start)
    .lte("occurred_at", end);

  const spendingByGroup: Record<string, number> = {};
  for (const tx of (txs ?? []) as { amount: number; group_id: string }[]) {
    spendingByGroup[tx.group_id] = (spendingByGroup[tx.group_id] ?? 0) + tx.amount;
  }

  return groups.map((g) => ({
    ...g,
    totalSpent: spendingByGroup[g.id] ?? 0,
  }));
}

// ── Shared helper ─────────────────────────────────────────────────────────────
function buildOverviewResult(
  transactions: { amount: number; transaction_type: string; category_id: string | null; occurred_at: string; id: string; description: string | null; merchant: string | null; categories: { name: string; slug: string; color: string | null; icon: string | null } | { name: string; slug: string; color: string | null; icon: string | null }[] | null }[],
  expenses: typeof transactions,
  income:   typeof transactions,
  goals:    { id: string; name: string; target_amount: number; current_amount: number; status: string }[],
  budgets:  { id: string; amount_limit: number; category_id: string | null; categories: { name: string; slug: string; color: string | null } | { name: string; slug: string; color: string | null }[] | null }[],
) {
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

  return {
    totalExpenses,
    totalIncome,
    categoryBreakdown:  Object.values(byCat).sort((a, b) => b.total - a.total).slice(0, 6),
    recentTransactions: transactions.slice(0, 8),
    goals,
    budgets,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { month: monthParam } = await searchParams;

  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const yearMonth  = /^\d{4}-\d{2}$/.test(monthParam ?? "") ? monthParam! : currentYM;
  const isCurrentMonth = yearMonth === currentYM;

  const [profileResult, overview, groupsSpending] = await Promise.all([
    supabase.from("users").select("full_name, monthly_income").eq("id", user.id).single(),
    getOverviewData(user.id, yearMonth),
    getGroupsSpending(user.id, yearMonth),
  ]);

  const profile   = profileResult.data;
  const firstName = profile?.full_name?.split(" ")[0] ?? "tú";

  // Configured salary applies only to the current month (it's a present-day setting,
  // not historical). Logged income transactions are summed on top of it.
  const salary         = isCurrentMonth ? (profile?.monthly_income ?? 0) : 0;
  const displayIncome  = overview.totalIncome + salary;
  const includesSalary = salary > 0;
  const displayNet     = displayIncome - overview.totalExpenses;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-10">

      {/* ── Header ─────────────────────────────────── */}
      <AnimateIn>
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-serif text-4xl md:text-5xl font-normal text-foreground">
            {isCurrentMonth ? `Hola, ${firstName} 👋` : "Resumen"}
          </h1>
          <div className="pt-1">
            <MonthNav yearMonth={yearMonth} />
          </div>
        </div>
      </AnimateIn>

      {/* ── Summary stats: recibo del mes ────────────── */}
      <AnimateIn>
        <div className="receipt-torn bg-card rounded-t-3xl border-t border-x border-foreground/8 px-6 pt-6 pb-8">
          <p className="text-[10px] uppercase tracking-widest text-foreground/40 mb-4">
            {isCurrentMonth
              ? "Recibo de este mes"
              : new Date(yearMonth + "-01").toLocaleDateString("es-CO", { month: "long", year: "numeric" })}
          </p>

          <div className="space-y-2.5">
            <div className="leader-row text-sm">
              <span className="text-foreground/55 shrink-0">Gastos</span>
              <span className="leader-fill text-foreground" />
              <span className="font-amount text-foreground shrink-0">{formatCOP(overview.totalExpenses)}</span>
            </div>
            <div className="leader-row text-sm">
              <span className="text-foreground/55 shrink-0">
                Ingresos{includesSalary ? " · incluye salario" : ""}
              </span>
              <span className="leader-fill text-foreground" />
              <span className="font-amount text-foreground shrink-0">{formatCOP(displayIncome)}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-foreground/20 mt-4 pt-4">
            <div className="leader-row">
              <span className="text-[10px] uppercase tracking-widest font-semibold text-foreground/60 shrink-0">
                Balance neto
              </span>
              <span className="leader-fill text-foreground" />
              <span className={`font-amount text-2xl font-semibold shrink-0 ${displayNet < 0 ? "text-[#E8673C]" : "text-foreground"}`}>
                {formatCOP(displayNet)}
              </span>
            </div>
          </div>
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
                <Link
                  href={`/categories/${cat.slug}${yearMonth !== currentYM ? `?month=${yearMonth}` : ""}`}
                  className="block rounded-2xl p-4 flex flex-col gap-2 h-full transition-opacity hover:opacity-80 active:scale-[0.98]"
                  style={{ backgroundColor: cat.color }}
                >
                  <CategoryIcon slug={cat.slug} size={18} strokeWidth={1.5} style={{ color: cat.color, filter: "brightness(0.6)" }} />
                  <p className="text-[10px] text-[#1A1A1A]/50 uppercase tracking-widest leading-none">
                    {cat.name}
                  </p>
                  <p className="font-amount text-lg font-semibold text-[#1A1A1A]">
                    {formatCOP(cat.total)}
                  </p>
                </Link>
              </AnimateIn>
            ))}
          </div>
        </section>
      )}

      {/* ── Groups ─────────────────────────────────── */}
      {groupsSpending.length > 0 && (
        <section>
          <AnimateIn>
            <SectionLabel>Tus grupos</SectionLabel>
          </AnimateIn>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
            {groupsSpending.map((g, i) => {
              const pct = g.budget && g.budget > 0
                ? Math.min(Math.round((g.totalSpent / g.budget) * 100), 100)
                : null;
              return (
                <AnimateIn key={g.id} delay={i * 60}>
                  <Link
                    href={`/groups/${g.id}`}
                    className="block rounded-2xl p-4 flex flex-col gap-2 h-full bg-card border border-foreground/8 transition-opacity hover:opacity-80 active:scale-[0.98]"
                  >
                    <span className="text-2xl leading-none">{g.icon}</span>
                    <p className="text-[10px] text-foreground/50 uppercase tracking-widest leading-none truncate">
                      {g.name}
                    </p>
                    <p className="font-amount text-lg font-semibold text-foreground">
                      {formatCOP(g.totalSpent)}
                    </p>
                    {pct !== null && (
                      <div className="space-y-1 mt-0.5">
                        <div className="h-1 bg-foreground/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-[#E8673C]" : "bg-foreground/40"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-[9px] text-foreground/30">{pct}% del presupuesto</p>
                      </div>
                    )}
                  </Link>
                </AnimateIn>
              );
            })}
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

      {/* ── Goals (current month only) ─────────────── */}
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
                    <div className="flex justify-between text-xs text-foreground/40 font-amount">
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

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-[10px] uppercase tracking-widest text-foreground/40 font-medium ${className ?? ""}`}>
      {children}
    </p>
  );
}
