import { createClient } from "@/lib/supabase/server";
import { formatCOP } from "@/lib/utils/currency";
import { redirect } from "next/navigation";

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

  const active = (goals ?? []).filter((g) => g.status === "active");
  const completed = (goals ?? []).filter((g) => g.status === "completed");

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black">Metas</h1>
        <p className="text-muted-foreground text-sm mt-1">Tus objetivos financieros</p>
      </div>

      {!goals?.length ? (
        <div className="text-center py-20 space-y-3">
          <p className="text-5xl">🏆</p>
          <p className="font-semibold">Sin metas aún</p>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Dile a Luca en WhatsApp qué quieres ahorrar
          </p>
          <p className="text-sm font-mono bg-muted rounded-xl px-4 py-2 inline-block">
            &quot;quiero ahorrar 2 millones para vacaciones&quot;
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
                Activas
              </h2>
              {active.map((goal) => {
                const pct = Math.min(
                  Math.round((goal.current_amount / goal.target_amount) * 100),
                  100
                );
                const remaining = goal.target_amount - goal.current_amount;
                const daysLeft = goal.target_date
                  ? Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / 86400000)
                  : null;

                return (
                  <div key={goal.id} className="bg-card rounded-2xl p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-base">{goal.icon ?? "🎯"} {goal.name}</p>
                        {goal.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{goal.description}</p>
                        )}
                      </div>
                      <span className="text-xs bg-muted rounded-full px-3 py-1 font-semibold shrink-0">
                        {pct}%
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: goal.color ?? "#2A9D8F",
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatCOP(goal.current_amount)} ahorrado</span>
                        <span>meta: {formatCOP(goal.target_amount)}</span>
                      </div>
                    </div>

                    <div className="flex gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Falta</p>
                        <p className="font-bold">{formatCOP(remaining)}</p>
                      </div>
                      {daysLeft !== null && (
                        <div>
                          <p className="text-xs text-muted-foreground">Días restantes</p>
                          <p className="font-bold">{daysLeft > 0 ? daysLeft : "Vencida"}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {completed.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
                Completadas
              </h2>
              {completed.map((goal) => (
                <div key={goal.id} className="bg-card rounded-2xl p-5 flex items-center gap-4 opacity-70">
                  <span className="text-2xl">{goal.icon ?? "✅"}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{goal.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCOP(goal.target_amount)} — completada</p>
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
