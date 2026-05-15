import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { PhoneLinker } from "@/components/dashboard/phone-linker";

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

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, phone_number")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-border bg-card shrink-0">
        <div className="px-6 py-5 border-b border-border">
          <span className="text-xl font-black tracking-tight">Luca</span>
        </div>
        <SidebarNav />
        <div className="mt-auto px-4 py-4 text-xs text-muted-foreground truncate">
          {profile?.full_name ?? user.email}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {/* Phone linker: runs client-side after auth redirect */}
        <PhoneLinker userId={user.id} hasPhone={!!profile?.phone_number} />
        {children}
      </main>
    </div>
  );
}
