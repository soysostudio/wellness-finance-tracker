import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AnimateIn } from "@/components/ui/animate-in";
import { GroupsManager } from "@/components/dashboard/groups-manager";

export const revalidate = 0;

export default async function GroupsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-8">
      <AnimateIn>
        <p className="text-[10px] uppercase tracking-widest text-foreground/40">Colaboración</p>
        <h1 className="font-serif text-4xl md:text-5xl font-normal mt-1 text-foreground">
          Grupos
        </h1>
        <p className="text-sm text-foreground/40 mt-2 leading-relaxed">
          Organiza gastos compartidos con familia, amigos o en un viaje.
          Cada miembro registra sus gastos y aparecen en el grupo.
        </p>
      </AnimateIn>

      <AnimateIn delay={40}>
        <GroupsManager userId={user.id} />
      </AnimateIn>
    </div>
  );
}
