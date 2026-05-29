import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { AnimateIn } from "@/components/ui/animate-in";
import { GroupsManager } from "@/components/dashboard/groups-manager";
import { getMonthRange } from "@/lib/utils/dates";

export const revalidate = 0;

export default async function GroupsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const { start, end } = getMonthRange(yearMonth);

  // Fetch user's groups with members
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: memberRows } = await (admin as any)
    .from("group_members")
    .select("group_id, expense_groups(id, name, icon, color, budget, owner_id, group_members(user_id, role, users(full_name, phone_number)))")
    .eq("user_id", user.id);

  type GroupShape = {
    id: string; name: string; icon: string; color: string;
    budget: number | null; owner_id: string;
    group_members: { user_id: string; role: string; users: { full_name: string | null; phone_number: string | null } | null }[];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allGroups: GroupShape[] = ((memberRows ?? []) as any[])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((m: any) => m.expense_groups as GroupShape | GroupShape[] | null)
    .map((g) => (Array.isArray(g) ? g[0] : g))
    .filter((g): g is GroupShape => !!g);

  const owned  = allGroups.filter((g) => g.owner_id === user.id);
  const member = allGroups.filter((g) => g.owner_id !== user.id);

  // Fetch spending per group this month
  const groupIds = allGroups.map((g) => g.id);
  let spendingByGroup: Record<string, number> = {};

  if (groupIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: txs } = await (admin as any)
      .from("transactions")
      .select("amount, group_id")
      .in("group_id", groupIds)
      .eq("transaction_type", "expense")
      .gte("occurred_at", start)
      .lte("occurred_at", end);

    for (const tx of (txs ?? []) as { amount: number; group_id: string }[]) {
      spendingByGroup[tx.group_id] = (spendingByGroup[tx.group_id] ?? 0) + tx.amount;
    }
  }

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
        <GroupsManager
          userId={user.id}
          initialOwned={owned}
          initialMember={member}
          spendingByGroup={spendingByGroup}
        />
      </AnimateIn>
    </div>
  );
}
