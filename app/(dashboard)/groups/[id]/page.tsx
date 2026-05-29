import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { formatCOP } from "@/lib/utils/currency";
import { getMonthRange } from "@/lib/utils/dates";
import { getCategoryColor, getCategoryIcon } from "@/lib/utils/categories";
import { redirect, notFound } from "next/navigation";
import { TransactionRow } from "@/components/dashboard/transaction-row";
import { AnimateIn } from "@/components/ui/animate-in";
import { CategoryIcon } from "@/components/ui/category-icon";
import { MonthNav } from "@/components/dashboard/month-nav";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const revalidate = 0;

export default async function GroupDeepDivePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id: groupId } = await params;
  const { month: monthParam } = await searchParams;

  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const yearMonth  = /^\d{4}-\d{2}$/.test(monthParam ?? "") ? monthParam! : currentYM;

  const { start, end } = getMonthRange(yearMonth);
  const prevDate = new Date(yearMonth + "-01");
  prevDate.setMonth(prevDate.getMonth() - 1);
  const prevYM = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  const { start: prevStart, end: prevEnd } = getMonthRange(prevYM);

  const admin = createAdminClient();

  // 1. Fetch group info + verify membership
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [{ data: group }, { data: memberCheck }] = await Promise.all([
    (admin as any)
      .from("expense_groups")
      .select("id, name, icon, color, budget, end_date, owner_id")
      .eq("id", groupId)
      .single(),
    (admin as any)
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (!group || !memberCheck) notFound();

  // 2. Fetch transactions + members in parallel
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [{ data: txs }, { data: prevTxs }, { data: members }] = await Promise.all([
    (admin as any)
      .from("transactions")
      .select("id, amount, transaction_type, category_id, occurred_at, description, merchant, user_id, categories(name, slug, color, icon), users(full_name)")
      .eq("group_id", groupId)
      .gte("occurred_at", start)
      .lte("occurred_at", end)
      .order("occurred_at", { ascending: false }),

    (admin as any)
      .from("transactions")
      .select("amount, transaction_type")
      .eq("group_id", groupId)
      .eq("transaction_type", "expense")
      .gte("occurred_at", prevStart)
      .lte("occurred_at", prevEnd),

    (admin as any)
      .from("group_members")
      .select("user_id, role, users(full_name)")
      .eq("group_id", groupId),
  ]);

  type TxRow = {
    id: string; amount: number; transaction_type: string; category_id: string | null;
    occurred_at: string; description: string | null; merchant: string | null;
    user_id: string;
    categories: { name: string; slug: string; color: string | null; icon: string | null } | { name: string; slug: string; color: string | null; icon: string | null }[] | null;
    users: { full_name: string | null } | { full_name: string | null }[] | null;
  };

  const allTxs     = (txs ?? []) as TxRow[];
  const expenses   = allTxs.filter((t) => t.transaction_type === "expense");
  const prevExpAmt = ((prevTxs ?? []) as { amount: number }[]).reduce((s, t) => s + t.amount, 0);

  const totalSpent = expenses.reduce((s, t) => s + t.amount, 0);
  const pctChange  = prevExpAmt > 0
    ? Math.round(((totalSpent - prevExpAmt) / prevExpAmt) * 100)
    : null;

  // Category breakdown
  const byCat: Record<string, { name: string; slug: string; color: string; icon: string; total: number }> = {};
  for (const t of expenses) {
    const cat  = Array.isArray(t.categories) ? t.categories[0] : t.categories;
    const slug = cat?.slug ?? "otros";
    if (!byCat[slug]) {
      byCat[slug] = { name: cat?.name ?? "Otros", slug, color: getCategoryColor(slug), icon: getCategoryIcon(slug), total: 0 };
    }
    byCat[slug].total += t.amount;
  }
  const categoryBreakdown = Object.values(byCat).sort((a, b) => b.total - a.total).slice(0, 6);

  // Member contributions
  type MemberRow = { user_id: string; role: string; users: { full_name: string | null } | { full_name: string | null }[] | null };
  const memberMap: Record<string, string> = {};
  for (const m of (members ?? []) as MemberRow[]) {
    const usersData = m.users;
    const userObj   = Array.isArray(usersData) ? usersData[0] : usersData;
    memberMap[m.user_id] = userObj?.full_name?.split(" ")[0] ?? "Miembro";
  }

  const byMember: Record<string, { name: string; total: number }> = {};
  for (const t of expenses) {
    const uid = t.user_id;
    if (!byMember[uid]) byMember[uid] = { name: memberMap[uid] ?? "Miembro", total: 0 };
    byMember[uid].total += t.amount;
  }
  const memberContributions = Object.entries(byMember)
    .map(([uid, v]) => ({ userId: uid, name: v.name, total: v.total }))
    .sort((a, b) => b.total - a.total);

  const monthLabel = new Date(yearMonth + "-01").toLocaleDateString("es-CO", { month: "long", year: "numeric" });

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">

      {/* Back */}
      <AnimateIn>
        <Link
          href="/groups"
          className="inline-flex items-center gap-1.5 text-xs text-foreground/40 hover:text-foreground transition-colors"
        >
          <ArrowLeft size={13} strokeWidth={1.5} />
          Volver a grupos
        </Link>
      </AnimateIn>

      {/* Header */}
      <AnimateIn>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-card border border-foreground/8 text-3xl">
              {group.icon}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-foreground/40">Grupo</p>
              <h1 className="font-serif text-3xl md:text-4xl font-normal text-foreground mt-0.5">
                {group.name}
              </h1>
            </div>
          </div>
          <div className="pt-1 shrink-0">
            <MonthNav yearMonth={yearMonth} />
          </div>
        </div>
      </AnimateIn>

      {/* Stats */}
      <AnimateIn>
        <div className="flex items-end gap-6 py-6 border-t border-b border-foreground/8 flex-wrap">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-foreground/40">Total en {monthLabel}</p>
            <p className="font-serif text-4xl font-normal text-foreground">{formatCOP(totalSpent)}</p>
          </div>

          {pctChange !== null && totalSpent > 0 && (
            <div className="pb-1 space-y-0.5">
              <p className="text-[10px] uppercase tracking-widest text-foreground/40">vs mes anterior</p>
              <p className={`text-sm font-medium ${pctChange > 0 ? "text-[#E8673C]" : pctChange < 0 ? "text-emerald-600" : "text-foreground/50"}`}>
                {pctChange > 0 ? "+" : ""}{pctChange}%
              </p>
            </div>
          )}

          <div className="pb-1 space-y-0.5">
            <p className="text-[10px] uppercase tracking-widest text-foreground/40"># transacciones</p>
            <p className="text-sm font-medium text-foreground/60">{expenses.length}</p>
          </div>

          {group.budget && (
            <div className="pb-1 space-y-0.5">
              <p className="text-[10px] uppercase tracking-widest text-foreground/40">presupuesto</p>
              <p className="text-sm font-medium text-foreground/60">{formatCOP(group.budget)}</p>
            </div>
          )}
        </div>
      </AnimateIn>

      {/* Budget progress */}
      {group.budget && group.budget > 0 && (
        <AnimateIn>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-foreground/40">
              <span>{formatCOP(totalSpent)} gastado</span>
              <span>{Math.min(Math.round((totalSpent / group.budget) * 100), 100)}%</span>
            </div>
            <div className="h-2 bg-foreground/8 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${totalSpent / group.budget >= 0.9 ? "bg-[#E8673C]" : "bg-foreground/40"}`}
                style={{ width: `${Math.min((totalSpent / group.budget) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-foreground/30">de {formatCOP(group.budget)} presupuestado</p>
          </div>
        </AnimateIn>
      )}

      {/* Member contributions */}
      {memberContributions.length > 0 && (
        <section>
          <AnimateIn>
            <p className="text-[10px] uppercase tracking-widest text-foreground/40 mb-3">Contribución por miembro</p>
          </AnimateIn>
          <div className="space-y-3">
            {memberContributions.map((m, i) => {
              const pct = totalSpent > 0 ? Math.round((m.total / totalSpent) * 100) : 0;
              return (
                <AnimateIn key={m.userId} delay={i * 40}>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm">👤</span>
                        <span className="text-sm font-medium truncate">{m.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-foreground/40">{pct}%</span>
                        <span className="font-serif text-base font-normal">{formatCOP(m.total)}</span>
                      </div>
                    </div>
                    <div className="h-1 bg-foreground/8 rounded-full overflow-hidden">
                      <div className="h-full bg-foreground/30 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </AnimateIn>
              );
            })}
          </div>
        </section>
      )}

      {/* Category breakdown */}
      {categoryBreakdown.length > 0 && (
        <section>
          <AnimateIn>
            <p className="text-[10px] uppercase tracking-widest text-foreground/40 mb-3">Gastos por categoría</p>
          </AnimateIn>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categoryBreakdown.map((cat, i) => (
              <AnimateIn key={cat.slug} delay={i * 60}>
                <div
                  className="rounded-2xl p-4 flex flex-col gap-2"
                  style={{ backgroundColor: cat.color }}
                >
                  <CategoryIcon slug={cat.slug} size={18} strokeWidth={1.5} style={{ color: cat.color, filter: "brightness(0.6)" }} />
                  <p className="text-[10px] text-[#1A1A1A]/50 uppercase tracking-widest leading-none">{cat.name}</p>
                  <p className="font-serif text-xl font-normal text-[#1A1A1A]">{formatCOP(cat.total)}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </section>
      )}

      {/* Transaction list */}
      <section>
        <AnimateIn>
          <p className="text-[10px] uppercase tracking-widest text-foreground/40 mb-3">
            Transacciones — {monthLabel}
          </p>
        </AnimateIn>

        {allTxs.length === 0 ? (
          <AnimateIn delay={40}>
            <div className="text-center py-16 space-y-3">
              <p className="text-4xl">{group.icon}</p>
              <p className="font-serif text-xl font-normal text-foreground">Sin movimientos en {group.name}</p>
              <p className="text-sm text-foreground/40">
                Registra gastos del grupo desde WhatsApp:<br />
                <span className="font-mono">&quot;40 mil en mercado para {group.name}&quot;</span>
              </p>
            </div>
          </AnimateIn>
        ) : (
          <div className="space-y-1.5">
            {allTxs.map((t, i) => {
              const usersData = t.users;
              const userObj   = Array.isArray(usersData) ? usersData[0] : usersData;
              const memberName = userObj?.full_name?.split(" ")[0];
              const showChip  = memberName && t.user_id !== user.id;
              return (
                <AnimateIn key={t.id} delay={i * 25}>
                  <div className="relative">
                    <TransactionRow t={t} />
                    {showChip && (
                      <span className="absolute top-3 right-14 text-[10px] bg-foreground/6 text-foreground/40 px-2 py-0.5 rounded-full pointer-events-none">
                        {memberName}
                      </span>
                    )}
                  </div>
                </AnimateIn>
              );
            })}
          </div>
        )}
      </section>

      {/* Previous month teaser */}
      {prevExpAmt > 0 && (
        <AnimateIn delay={80}>
          <div className="rounded-2xl border border-foreground/8 p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-foreground/40">Mes anterior</p>
              <p className="font-serif text-xl font-normal text-foreground mt-0.5">{formatCOP(prevExpAmt)}</p>
            </div>
            <Link
              href={`/groups/${groupId}?month=${prevYM}`}
              className="text-xs text-foreground/40 hover:text-foreground underline underline-offset-4 transition-colors shrink-0"
            >
              Ver {new Date(prevYM + "-01").toLocaleDateString("es-CO", { month: "long" })}
            </Link>
          </div>
        </AnimateIn>
      )}
    </div>
  );
}
