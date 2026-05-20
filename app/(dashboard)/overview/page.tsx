import { createClient } from "@/lib/supabase/server";
import { formatCOP } from "@/lib/utils/currency";
import { getCurrentMonthRange } from "@/lib/utils/dates";
import { getCategoryColor, getCategoryIcon } from "@/lib/utils/categories";
import { redirect } from "next/navigation";
import { RecentTransactions } from "@/components/dashboard/transaction-list";
import { AnimateIn } from "@/components/ui/animate-in";
import { CategoryIcon } from "@/components/ui/category-icon";

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

  const byCat: Record<string, { name: string; slug: string; color: string; icon: string; total: number }> = {};
  for (const t of expenses) {
    const cat = Array.isArray(t.categories) ? t.categories[0] : t.categories;
    const slug = cat?.slug ?? "otros";
    if (!byCat[slug]) {
      byCat[slug] = {
        name:  cat?.name ?? "Otros",
        slug,
        color: getCategoryColor(slug), // always use code palette, not stale DB color
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
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-10">

      {/* ── Header ─────────────────────────────────── */}
      <AnimateIn>
        <p className="text-xs text-[#1A1A1A]/40 uppercase tracking-widest">
          {monthName} {year}
        </p>
        <h1 className="font-serif text-4xl md:text-5xl font-normal mt-1 text-[#1A1A1A]">
          Hola, {firstName} 👋
        </h1>
      </AnimateIn>

      {/* ── Summary stats ──────────────────────────── */}
      <AnimateIn>
        <div className="grid grid-cols-3 gap-6 py-6 border-t border-b border-[#1A1A1A]/8">
          <StatBlock label="Gastos del mes"   value={formatCOP(overview.totalExpenses)} />
          <StatBlock label="Ingresos del mes" value={formatCOP(overview.totalIncome)} />
          <StatBlock
            label="Balance neto"
            value={formatCOP(overview.net)}
            muted={overview.net < 0}
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
                  style={{ backgroundColor: cat.color + "CC" }}
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
              className="text-xs text-[#1A1A1A]/40 hover:text-[#1A1A1A] transition-colors underline underline-offset-4"
            >
              Ver todas
            </a>
          </div>
        </AnimateIn>
        <AnimateIn delay={60}>
          <RecentTransactions transactions={overview.recentTransactions} />
        </AnimateIn>
      </section>

      {/* ── Goals ──────────────────────────────────── */}
      {overview.goals.length > 0 && (
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
                  <div className="bg-card rounded-2xl p-5 space-y-3 border border-[#1A1A1A]/5">
                    <div className="flex justify-between items-baseline">
                      <p className="text-sm font-medium text-[#1A1A1A]">{goal.name}</p>
                      <p className="text-xs text-[#1A1A1A]/40">{pct}%</p>
                    </div>
                    <div className="h-1.5 bg-[#1A1A1A]/8 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#1A1A1A] transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-[#1A1A1A]/40">
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
            <p className="font-serif text-2xl font-normal text-[#1A1A1A]">
              Sin movimientos este mes
            </p>
            <p className="text-[#1A1A1A]/50 text-sm max-w-xs mx-auto leading-relaxed">
              Cuéntale a Luca tu primer gasto por WhatsApp y aparecerá aquí al instante.
            </p>
            <p className="text-sm font-mono bg-[#FEFF6E] rounded-xl px-4 py-2 inline-block text-[#1A1A1A]">
              &quot;gasté 45 mil en Rappi&quot;
            </p>
          </div>
        </AnimateIn>
      )}
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────── */

function StatBlock({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/40">{label}</p>
      <p className={`font-serif text-xl md:text-2xl font-normal ${muted ? "text-[#E8673C]" : "text-[#1A1A1A]"}`}>
        {value}
      </p>
    </div>
  );
}

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-[10px] uppercase tracking-widest text-[#1A1A1A]/40 font-medium ${className ?? ""}`}>
      {children}
    </p>
  );
}
