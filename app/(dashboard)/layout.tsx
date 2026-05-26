import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { MobileNav } from "@/components/dashboard/mobile-nav";
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
      <aside className="hidden md:flex w-56 flex-col border-r border-foreground/8 bg-background shrink-0">
        <div className="px-6 py-5 border-b border-foreground/8">
          <Link href="/overview" className="font-serif text-xl font-normal tracking-tight no-underline text-foreground hover:opacity-70 transition-opacity">Luca</Link>
        </div>
        <SidebarNav />
        <div className="mt-auto px-4 py-4 text-xs text-foreground/40 truncate">
          {profile?.full_name ?? user.email}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <MobileNav userName={profile?.full_name ?? user.email ?? ""} />
        <PhoneLinker userId={user.id} hasPhone={!!profile?.phone_number} />
        {children}
      </main>
    </div>
  );
}
