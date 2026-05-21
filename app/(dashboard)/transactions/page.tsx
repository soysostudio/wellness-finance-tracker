import { createClient } from "@/lib/supabase/server";
import { formatCOP } from "@/lib/utils/currency";
import { redirect } from "next/navigation";
import { AnimateIn } from "@/components/ui/animate-in";
import { TransactionRow } from "@/components/dashboard/transaction-row";

export const revalidate = 0;

export default async function TransactionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: transactions } = await supabase
    .from("transactions")
    .select("id, amount, transaction_type, description, merchant, occurred_at, categories(name, slug, color, icon)")
    .eq("user_id", user.id)
    .order("occurred_at", { ascending: false })
    .limit(100);

  const expenses = (transactions ?? []).filter((t) => t.transaction_type === "expense");
  const income   = (transactions ?? []).filter((t) => t.transaction_type === "income");
  const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome   = income.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <AnimateIn>
        <p className="text-[10px] uppercase tracking-widest text-foreground/40">Historial</p>
        <h1 className="font-serif text-4xl md:text-5xl font-normal mt-1 text-foreground">
          Transacciones
        </h1>
      </AnimateIn>

      {/* Summary stats */}
      <AnimateIn>
        <div className="grid grid-cols-2 gap-6 py-6 border-t border-b border-foreground/8">
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-foreground/40">Total gastos</p>
            <p className="font-serif text-xl md:text-2xl font-normal text-foreground">{formatCOP(totalExpenses)}</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-foreground/40">Total ingresos</p>
            <p className="font-serif text-xl md:text-2xl font-normal text-foreground">{formatCOP(totalIncome)}</p>
          </div>
        </div>
      </AnimateIn>

      {/* List */}
      {!transactions?.length ? (
        <AnimateIn>
          <EmptyState
            emoji="💬"
            title="Sin transacciones aún"
            body="Cuéntale un gasto a Luca por WhatsApp"
            example='"gasté 30 mil en el mercado"'
          />
        </AnimateIn>
      ) : (
        <AnimateIn delay={60}>
          <div className="space-y-1.5">
            {transactions.map((t) => (
              <TransactionRow key={t.id} t={t} />
            ))}
          </div>
        </AnimateIn>
      )}
    </div>
  );
}

function EmptyState({ emoji, title, body, example }: { emoji: string; title: string; body: string; example: string }) {
  return (
    <div className="text-center py-20 space-y-4">
      <p className="text-5xl">{emoji}</p>
      <p className="font-serif text-2xl font-normal text-foreground">{title}</p>
      <p className="text-foreground/50 text-sm max-w-xs mx-auto leading-relaxed">{body}</p>
      <p className="text-sm font-mono bg-[#FEFF6E] rounded-xl px-4 py-2 inline-block text-foreground">
        &quot;{example}&quot;
      </p>
    </div>
  );
}
