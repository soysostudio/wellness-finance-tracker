import { createClient } from "@/lib/supabase/server";
import { formatCOP } from "@/lib/utils/currency";
import { redirect } from "next/navigation";
import { AnimateIn } from "@/components/ui/animate-in";

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
        <p className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/40">Objetivos</p>
        <h1 className="font-serif text-4xl md:text-5xl font-normal mt-1 text-[#1A1A1A]">
          Metas
        </h1>
      </AnimateIn>

      {!goals?.length ? (
        <AnimateIn>
          <div className="text-center py-20 space-y-4">
            <p className="text-5xl">🏆</p>
            <p className="font-serif text-2xl font-normal text-[#1A1A1A]">Sin metas aún</p>
            <p className="text-[#1A1A1A]/50 text-sm max-w-xs mx-auto leading-relaxed">
              Dile a Luca en WhatsApp qué quieres ahorrar
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
                <p className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/40">Activas</p>
              </AnimateIn>
              {active.map((goal, i) => {
                const pct      = Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100);
                const remaining = goal.target_amount - goal.current_amount;
                const daysLeft  = goal.target_date
                  ? Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / 86400000)
                  : null;

                return (
                  <AnimateIn key={goal.id} delay={i * 70}>
                    <div className="bg-card border border-[#1A1A1A]/5 rounded-2xl p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-medium text-[#1A1A1A]">
                            {goal.icon ?? "🎯"} {goal.name}
                          </p>
                          {goal.description && (
                            <p className="text-xs text-[#1A1A1A]/40 mt-0.5">{goal.description}</p>
                          )}
                        </div>
                        <span
                          className="text-xs px-3 py-1 rounded-full shrink-0 font-medium"
                          style={{ backgroundColor: "#FEFF6E", color: "#1A1A1A" }}
                        >
                          {pct}%
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="h-1.5 bg-[#1A1A1A]/8 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, backgroundColor: goal.color ?? "#1A1A1A" }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-[#1A1A1A]/40">
                          <span>{formatCOP(goal.current_amount)} ahorrado</span>
                          <span>meta {formatCOP(goal.target_amount)}</span>
                        </div>
                      </div>

                      <div className="flex gap-6">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/40">Falta</p>
                          <p className="font-serif text-lg font-normal text-[#1A1A1A] mt-0.5">{formatCOP(remaining)}</p>
                        </div>
                        {daysLeft !== null && (
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/40">Días restantes</p>
                            <p className="font-serif text-lg font-normal text-[#1A1A1A] mt-0.5">
                              {daysLeft > 0 ? daysLeft : "Vencida"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </AnimateIn>
                );
              })}
            </section>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <section className="space-y-3">
              <AnimateIn>
                <p className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/40">Completadas</p>
              </AnimateIn>
              {completed.map((goal, i) => (
                <AnimateIn key={goal.id} delay={i * 60}>
                  <div className="bg-card border border-[#1A1A1A]/5 rounded-2xl p-4 flex items-center gap-4 opacity-60">
                    <span className="text-xl">{goal.icon ?? "✅"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A1A] truncate">{goal.name}</p>
                      <p className="text-xs text-[#1A1A1A]/40 mt-0.5">{formatCOP(goal.target_amount)} — completada</p>
                    </div>
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
