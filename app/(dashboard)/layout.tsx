import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMonthRange } from "@/lib/utils/dates";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { MobileNav } from "@/components/dashboard/mobile-nav";

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

  const { start: monthStart, end: monthEnd } = getCurrentMonthRange();

  // Fetch profile and budgets in parallel
  const [{ data: profile }, { data: budgets }] = await Promise.all([
    supabase
      .from("users")
      .select("full_name, phone_number")
      .eq("id", user.id)
      .single(),
    supabase
      .from("budgets")
      .select("category_id, amount_limit, alert_at")
      .eq("user_id", user.id)
      .eq("is_active", true),
  ]);

  let hasBudgetAlert = false;
  if (budgets && budgets.length > 0) {
    const categoryIds = budgets.map((b) => b.category_id).filter(Boolean);
    const { data: txs } = await supabase
      .from("transactions")
      .select("amount, category_id")
      .eq("user_id", user.id)
      .eq("transaction_type", "expense")
      .in("category_id", categoryIds)
      .gte("occurred_at", monthStart)
      .lte("occurred_at", monthEnd);

    const spent: Record<string, number> = {};
    for (const tx of txs ?? []) {
      if (tx.category_id) spent[tx.category_id] = (spent[tx.category_id] ?? 0) + tx.amount;
    }
    hasBudgetAlert = budgets.some(
      (b) => b.category_id && (spent[b.category_id] ?? 0) / b.amount_limit >= (b.alert_at ?? 0.8)
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r border-foreground/8 bg-background shrink-0">
        <div className="px-6 py-5 border-b border-foreground/8">
          <Link href="/overview" className="font-display text-xl font-normal tracking-tight no-underline text-foreground hover:opacity-70 transition-opacity">Luca</Link>
        </div>
        <SidebarNav budgetAlert={hasBudgetAlert} />
        <div className="mt-auto px-4 py-4 text-xs text-foreground/40 truncate">
          {profile?.full_name ?? user.email}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <MobileNav userName={profile?.full_name ?? user.email ?? ""} budgetAlert={hasBudgetAlert} />
        {children}
      </main>
    </div>
  );
}
