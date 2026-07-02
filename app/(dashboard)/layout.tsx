import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { MobileNav } from "@/components/dashboard/mobile-nav";

// El layout solo espera la verificación de sesión (rápida, ya validada también
// en proxy.ts). El nombre viene de user_metadata (sin consulta extra a `users`)
// y la alerta de presupuesto se resuelve del lado del cliente — así el
// contenido de cada página empieza a renderizar de inmediato, sin pantalla en
// blanco mientras se resuelven datos secundarios.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const displayName = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "";

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r border-foreground/8 bg-background shrink-0">
        <div className="px-6 py-5 border-b border-foreground/8">
          <Link href="/overview" className="font-display text-xl font-normal tracking-tight no-underline text-foreground hover:opacity-70 transition-opacity">Luca</Link>
        </div>
        <SidebarNav />
        <div className="mt-auto px-4 py-4 text-xs text-foreground/40 truncate">
          {displayName}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <MobileNav userName={displayName} />
        {children}
      </main>
    </div>
  );
}
