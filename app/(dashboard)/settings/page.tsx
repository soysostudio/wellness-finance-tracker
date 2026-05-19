import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/dashboard/profile-form";

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

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black">Configuración</h1>
        <p className="text-muted-foreground text-sm mt-1">Tu perfil y preferencias de Luca</p>
      </div>

      <ProfileForm
        userId={user.id}
        email={user.email ?? ""}
        initialName={profile?.full_name ?? ""}
        initialPhone={profile?.phone_number ?? ""}
        initialCurrency={profile?.currency ?? "COP"}
        initialIncome={profile?.monthly_income ?? null}
      />

      <div className="bg-card rounded-2xl p-5 space-y-3">
        <h2 className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
          WhatsApp
        </h2>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Número vinculado</span>
          <span className="font-semibold">
            {profile?.phone_number ?? (
              <span className="text-destructive">No vinculado</span>
            )}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Luca te reconoce por este número. Si cambiás de número, actualízalo arriba.
        </p>
      </div>

      <div className="bg-card rounded-2xl p-5 space-y-2">
        <h2 className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
          Cuenta
        </h2>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Correo</span>
          <span className="font-medium">{user.email}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">ID de usuario</span>
          <span className="font-mono text-xs text-muted-foreground">{user.id.slice(0, 8)}…</span>
        </div>
      </div>
    </div>
  );
}
