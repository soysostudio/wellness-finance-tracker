import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { RemindersForm } from "@/components/dashboard/reminders-form";
import { AnimateIn } from "@/components/ui/animate-in";

export const revalidate = 0;

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, phone_number, currency, timezone, monthly_income")
    .eq("id", user.id)
    .single();

  const { data: reminders } = await supabase
    .from("reminders")
    .select("id, reminder_type, is_active")
    .eq("user_id", user.id)
    .in("reminder_type", ["daily_summary", "weekly_summary"]);

  const dailyReminder  = reminders?.find((r) => r.reminder_type === "daily_summary");
  const weeklyReminder = reminders?.find((r) => r.reminder_type === "weekly_summary");

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-8">

      {/* Header */}
      <AnimateIn>
        <p className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/40">Preferencias</p>
        <h1 className="font-serif text-4xl md:text-5xl font-normal mt-1 text-[#1A1A1A]">
          Configuración
        </h1>
      </AnimateIn>

      {/* Profile */}
      <AnimateIn delay={60}>
        <ProfileForm
          userId={user.id}
          email={user.email ?? ""}
          initialName={profile?.full_name ?? ""}
          initialPhone={profile?.phone_number ?? ""}
          initialCurrency={profile?.currency ?? "COP"}
          initialIncome={profile?.monthly_income ?? null}
        />
      </AnimateIn>

      {/* WhatsApp */}
      <AnimateIn delay={100}>
        <div className="bg-card border border-[#1A1A1A]/5 rounded-2xl p-5 space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/40">WhatsApp</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#1A1A1A]/50">Número vinculado</span>
            <span className="font-medium text-[#1A1A1A]">
              {profile?.phone_number ?? (
                <span className="text-destructive text-xs">No vinculado</span>
              )}
            </span>
          </div>
          <p className="text-xs text-[#1A1A1A]/40 leading-relaxed">
            Luca te reconoce por este número. Si cambias de número, actualízalo arriba.
          </p>
        </div>
      </AnimateIn>

      {/* Reminders */}
      <AnimateIn delay={140}>
        <RemindersForm
          userId={user.id}
          active={{
            daily:  dailyReminder?.is_active  ?? false,
            weekly: weeklyReminder?.is_active ?? false,
          }}
          reminderIds={{
            daily:  dailyReminder?.id  ?? null,
            weekly: weeklyReminder?.id ?? null,
          }}
        />
      </AnimateIn>

      {/* Account */}
      <AnimateIn delay={180}>
        <div className="bg-card border border-[#1A1A1A]/5 rounded-2xl p-5 space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/40">Cuenta</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#1A1A1A]/50">Correo</span>
            <span className="font-medium text-[#1A1A1A]">{user.email}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#1A1A1A]/50">ID de usuario</span>
            <span className="font-mono text-xs text-[#1A1A1A]/40">{user.id.slice(0, 8)}…</span>
          </div>
        </div>
      </AnimateIn>

    </div>
  );
}
