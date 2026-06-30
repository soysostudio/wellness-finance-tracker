import { createClient } from "@/lib/supabase/server";
import { formatCOP } from "@/lib/utils/currency";
import { redirect } from "next/navigation";
import { AnimateIn } from "@/components/ui/animate-in";
import { GoalRow } from "@/components/dashboard/goal-row";
import { NewGoalForm } from "@/components/dashboard/new-goal-form";

export const revalidate = 0;

export default async function GoalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: goals } = await supabase
    .from("goals")
    .select("id, name, description, target_amount, current_amount, target_date, status, icon, color")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const active    = (goals ?? []).filter((g) => g.status === "active");
  const completed = (goals ?? []).filter((g) => g.status === "completed");

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <AnimateIn>
        <p className="text-[10px] uppercase tracking-widest text-foreground/40">Objetivos</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold mt-1 text-foreground">
          Metas
        </h1>
      </AnimateIn>

      {/* New goal form — always visible */}
      <AnimateIn>
        <NewGoalForm />
      </AnimateIn>

      {!goals?.length ? (
        <AnimateIn>
          <div className="text-center py-16 space-y-4">
            <p className="text-5xl">🏆</p>
            <p className="font-display text-2xl font-normal text-foreground">Sin metas aún</p>
            <p className="text-foreground/50 text-sm max-w-xs mx-auto leading-relaxed">
              Créala arriba o dile a Luca por WhatsApp
            </p>
            <p className="text-sm font-mono bg-[#FEFF6E] rounded-xl px-4 py-2 inline-block text-[#1A1A1A]">
              &quot;quiero ahorrar 2 millones para vacaciones&quot;
            </p>
          </div>
        </AnimateIn>
      ) : (
        <div className="space-y-10">

          {/* Active */}
          {active.length > 0 && (
            <section className="space-y-3">
              <AnimateIn>
                <p className="text-[10px] uppercase tracking-widest text-foreground/40">Activas</p>
              </AnimateIn>
              {active.map((goal, i) => (
                <AnimateIn key={goal.id} delay={i * 70}>
                  <GoalRow goal={goal} />
                </AnimateIn>
              ))}
            </section>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <section className="space-y-3">
              <AnimateIn>
                <p className="text-[10px] uppercase tracking-widest text-foreground/40">Completadas</p>
              </AnimateIn>
              {completed.map((goal, i) => (
                <AnimateIn key={goal.id} delay={i * 60}>
                  <div className="opacity-60">
                    <GoalRow goal={goal} />
                  </div>
                </AnimateIn>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
