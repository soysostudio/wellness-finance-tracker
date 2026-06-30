import { createClient } from "@/lib/supabase/server";
import { formatCOP } from "@/lib/utils/currency";
import { getMonthRange } from "@/lib/utils/dates";
import { getCategoryColor, getCategoryIcon, SYSTEM_CATEGORIES, tintFromColor } from "@/lib/utils/categories";
import { redirect } from "next/navigation";
import { TransactionRow } from "@/components/dashboard/transaction-row";
import { AnimateIn } from "@/components/ui/animate-in";
import { CategoryIcon } from "@/components/ui/category-icon";
import { MonthNav } from "@/components/dashboard/month-nav";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const revalidate = 0;

export default async function CategoryDeepDivePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { slug } = await params;
  const { month: monthParam } = await searchParams;

  // Resolve month
  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const yearMonth  = /^\d{4}-\d{2}$/.test(monthParam ?? "") ? monthParam! : currentYM;

  const { start, end } = getMonthRange(yearMonth);

  // Previous month for comparison
  const prevDate = new Date(yearMonth + "-01");
  prevDate.setMonth(prevDate.getMonth() - 1);
  const prevYM = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  const { start: prevStart, end: prevEnd } = getMonthRange(prevYM);

  // Resolve category metadata (system or custom)
  const systemCat = SYSTEM_CATEGORIES.find((c) => c.slug === slug);

  const { data: customCat } = await supabase
    .from("categories")
    .select("id, name, slug, icon, color, is_income")
    .eq("user_id", user.id)
    .eq("slug", slug)
    .maybeSingle();

  const catName  = customCat?.name  ?? systemCat?.name  ?? slug;
  const catIcon  = customCat?.icon  ?? systemCat?.icon  ?? "📦";
  const catColor = customCat?.color ?? systemCat?.color ?? getCategoryColor(slug);

  // Fetch transactions this month
  const { data: transactions } = await supabase
    .from("transactions")
    .select("id, amount, transaction_type, category_id, occurred_at, description, merchant, categories(name, slug, color, icon)")
    .eq("user_id", user.id)
    .eq("transaction_type", "expense")
    .gte("occurred_at", start)
    .lte("occurred_at", end)
    .order("occurred_at", { ascending: false });

  // Filter to this slug (join may return by id, so we match by slug via categories join)
  const filtered = (transactions ?? []).filter((t) => {
    const cat = Array.isArray(t.categories) ? t.categories[0] : t.categories;
    return cat?.slug === slug;
  });

  // Fetch previous month total for comparison
  const { data: prevTx } = await supabase
    .from("transactions")
    .select("id, amount, transaction_type, category_id, occurred_at, description, merchant, categories(name, slug, color, icon)")
    .eq("user_id", user.id)
    .eq("transaction_type", "expense")
    .gte("occurred_at", prevStart)
    .lte("occurred_at", prevEnd);

  const prevFiltered = (prevTx ?? []).filter((t) => {
    const cat = Array.isArray(t.categories) ? t.categories[0] : t.categories;
    return cat?.slug === slug;
  });

  const totalThisMonth = filtered.reduce((s, t) => s + t.amount, 0);
  const totalPrevMonth = prevFiltered.reduce((s, t) => s + t.amount, 0);

  const pctChange = totalPrevMonth > 0
    ? Math.round(((totalThisMonth - totalPrevMonth) / totalPrevMonth) * 100)
    : null;

  const monthLabel = new Date(yearMonth + "-01").toLocaleDateString("es-CO", {
    month: "long",
    year:  "numeric",
  });

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">

      {/* Back */}
      <AnimateIn>
        <Link
          href="/overview"
          className="inline-flex items-center gap-1.5 text-xs text-foreground/40 hover:text-foreground transition-colors"
        >
          <ArrowLeft size={13} strokeWidth={1.5} />
          Volver al resumen
        </Link>
      </AnimateIn>

      {/* Header */}
      <AnimateIn>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Category chip */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border"
              style={{ backgroundColor: tintFromColor(catColor), borderColor: tintFromColor(catColor, 34) }}
            >
              <CategoryIcon
                slug={slug}
                size={24}
                strokeWidth={1.5}
                style={{ color: catColor }}
              />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-foreground/40">Categoría</p>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-0.5">
                {catName}
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
        <div className="flex items-end gap-6 py-6 border-t border-b border-foreground/8">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-foreground/40">
              Total en {monthLabel}
            </p>
            <p className="font-display text-3xl font-bold text-foreground">
              {formatCOP(totalThisMonth)}
            </p>
          </div>

          {pctChange !== null && totalThisMonth > 0 && (
            <div className="pb-1 space-y-0.5">
              <p className="text-[10px] uppercase tracking-widest text-foreground/40">vs mes anterior</p>
              <p
                className={`text-sm font-medium ${
                  pctChange > 0
                    ? "text-[#E8673C]"
                    : pctChange < 0
                    ? "text-emerald-600"
                    : "text-foreground/50"
                }`}
              >
                {pctChange > 0 ? "+" : ""}{pctChange}%
              </p>
            </div>
          )}

          <div className="pb-1 space-y-0.5">
            <p className="text-[10px] uppercase tracking-widest text-foreground/40"># transacciones</p>
            <p className="text-sm font-medium text-foreground/60">{filtered.length}</p>
          </div>
        </div>
      </AnimateIn>

      {/* Transaction list */}
      <section>
        <AnimateIn>
          <p className="text-[10px] uppercase tracking-widest text-foreground/40 mb-3">
            Transacciones — {monthLabel}
          </p>
        </AnimateIn>

        {filtered.length === 0 ? (
          <AnimateIn delay={40}>
            <div className="text-center py-16 space-y-3">
              <p className="text-4xl">{catIcon}</p>
              <p className="font-display text-xl font-normal text-foreground">
                Sin gastos en {catName}
              </p>
              <p className="text-sm text-foreground/40">
                No hay transacciones en esta categoría para {monthLabel}.
              </p>
            </div>
          </AnimateIn>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((t, i) => (
              <AnimateIn key={t.id} delay={i * 30}>
                <TransactionRow t={t} />
              </AnimateIn>
            ))}
          </div>
        )}
      </section>

      {/* Previous month teaser */}
      {totalPrevMonth > 0 && (
        <AnimateIn delay={80}>
          <div className="rounded-2xl border border-foreground/8 p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-foreground/40">Mes anterior</p>
              <p className="font-display text-xl font-normal text-foreground mt-0.5">
                {formatCOP(totalPrevMonth)}
              </p>
              <p className="text-xs text-foreground/40 mt-0.5">
                {prevFiltered.length} {prevFiltered.length === 1 ? "transacción" : "transacciones"}
              </p>
            </div>
            <Link
              href={`/categories/${slug}?month=${prevYM}`}
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
