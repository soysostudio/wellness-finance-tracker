import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
      <h1 className="text-3xl font-black">Configuración</h1>

      <div className="bg-card rounded-2xl p-5 space-y-4">
        <h2 className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
          Tu perfil
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nombre</span>
            <span className="font-medium">{profile?.full_name ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Correo</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">WhatsApp</span>
            <span className="font-medium">{profile?.phone_number ?? "No vinculado"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Moneda</span>
            <span className="font-medium">{profile?.currency ?? "COP"}</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Edición de perfil completa próximamente.
      </p>
    </div>
  );
}
