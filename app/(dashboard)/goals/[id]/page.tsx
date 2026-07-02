import { createClient } from "@/lib/supabase/server";
import { formatCOP } from "@/lib/utils/currency";
import { redirect, notFound } from "next/navigation";
import { AnimateIn } from "@/components/ui/animate-in";
import { GoalContributionForm } from "@/components/dashboard/goal-contribution-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const revalidate = 0;

export default async function GoalDeepDivePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const [{ data: goal }, { data: contributions }] = await Promise.all([
    supabase
      .from("goals")
      .select("id, name, description, target_amount, current_amount, target_date, status, icon")
      .eq("id", id)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("goal_contributions")
      .select("id, amount, note, created_at")
      .eq("goal_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!goal) notFound();

  const pct       = Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100);
  const remaining = Math.max(0, goal.target_amount - goal.current_amount);
  const completed = goal.status === "completed";

  // Proyección: cuánto ahorrar por mes para llegar a la fecha meta
  let monthlyNeeded: number | null = null;
  let monthsLeft: number | null = null;
  if (goal.target_date && remaining > 0) {
    const now = new Date();
    const target = new Date(goal.target_date);
    monthsLeft = Math.max(
      0,
      (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth())
    );
    monthlyNeeded = monthsLeft > 0 ? Math.ceil(remaining / monthsLeft) : remaining;
  }

  const targetLabel = goal.target_date
    ? new Date(goal.target_date).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">

      {/* Back */}
      <AnimateIn>
        <Link
          href="/goals"
          className="inline-flex items-center gap-1.5 text-xs text-foreground/40 hover:text-foreground transition-colors"
        >
          <ArrowLeft size={13} strokeWidth={1.5} />
          Volver a metas
        </Link>
      </AnimateIn>

      {/* Header */}
      <AnimateIn>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-card border border-foreground/8 text-3xl">
            {goal.icon ?? "🎯"}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-foreground/40">
              {completed ? "Meta completada 🎉" : "Meta"}
            </p>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-0.5">{goal.name}</h1>
            {goal.description && <p className="text-sm text-foreground/50 mt-1">{goal.description}</p>}
          </div>
        </div>
      </AnimateIn>

      {/* Progress */}
      <AnimateIn>
        <div className="bg-card border border-foreground/5 rounded-2xl p-5 space-y-4">
          <div className="leader-row items-baseline">
            <span className="font-display text-xs uppercase tracking-widest text-foreground/55 shrink-0">Ahorrado</span>
            <span className="leader-fill text-foreground" />
            <span className="font-amount text-2xl font-bold text-foreground shrink-0">{formatCOP(goal.current_amount)}</span>
          </div>
          <div className="h-2 bg-foreground/8 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-foreground transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between font-amount text-xs text-foreground/45">
            <span>{pct}%</span>
            <span>meta {formatCOP(goal.target_amount)}</span>
          </div>
        </div>
      </AnimateIn>

      {/* Projection + remaining */}
      <AnimateIn>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-foreground/8 p-5 space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-foreground/40">Falta</p>
            <p className="font-amount text-xl font-semibold text-foreground">
              {remaining > 0 ? formatCOP(remaining) : "¡Listo! 🎉"}
            </p>
          </div>
          <div className="rounded-2xl border border-foreground/8 p-5 space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-foreground/40">
              {monthlyNeeded !== null ? "Ahorra por mes" : "Fecha meta"}
            </p>
            {monthlyNeeded !== null ? (
              <>
                <p className="font-amount text-xl font-semibold text-foreground">{formatCOP(monthlyNeeded)}</p>
                <p className="text-[11px] text-foreground/40">
                  {monthsLeft && monthsLeft > 0 ? `en ${monthsLeft} ${monthsLeft === 1 ? "mes" : "meses"}` : "este mes"}
                  {targetLabel ? ` · ${targetLabel}` : ""}
                </p>
              </>
            ) : (
              <p className="text-sm text-foreground/60">{targetLabel ?? "Sin fecha"}</p>
            )}
          </div>
        </div>
      </AnimateIn>

      {/* Contribution form */}
      <AnimateIn>
        <GoalContributionForm goalId={goal.id} />
      </AnimateIn>

      {/* History */}
      <section>
        <AnimateIn>
          <p className="text-[10px] uppercase tracking-widest text-foreground/40 mb-3">Historial de aportes</p>
        </AnimateIn>
        {!contributions?.length ? (
          <AnimateIn delay={40}>
            <div className="text-center py-12 space-y-2">
              <p className="text-3xl">🐷</p>
              <p className="text-sm text-foreground/40">Aún no registras aportes a esta meta.</p>
            </div>
          </AnimateIn>
        ) : (
          <div className="space-y-1.5">
            {contributions.map((c, i) => {
              const positive = c.amount >= 0;
              return (
                <AnimateIn key={c.id} delay={i * 30}>
                  <div className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-card border border-foreground/5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{positive ? "Aporte" : "Retiro"}</p>
                      <p className="text-xs text-foreground/40 mt-0.5">
                        {new Date(c.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                        {c.note ? ` · ${c.note}` : ""}
                      </p>
                    </div>
                    <p className={`font-amount text-sm font-medium shrink-0 ${positive ? "text-[#2A9D8F]" : "text-foreground"}`}>
                      {positive ? "+" : "−"}{formatCOP(Math.abs(c.amount))}
                    </p>
                  </div>
                </AnimateIn>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
