import { createClient } from "@/lib/supabase/server";
import { formatCOP } from "@/lib/utils/currency";
import { redirect } from "next/navigation";
import { AnimateIn } from "@/components/ui/animate-in";
import { NewTransactionForm } from "@/components/dashboard/new-transaction-form";
import { TransactionFilterList } from "@/components/dashboard/transaction-filter-list";
import { ExportCsvButton } from "@/components/dashboard/export-csv-button";

export const revalidate = 0;

export default async function TransactionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const PAGE_SIZE = 50;

  const { data: transactions } = await supabase
    .from("transactions")
    .select("id, amount, transaction_type, description, merchant, occurred_at, categories(name, slug, color, icon)")
    .eq("user_id", user.id)
    .order("occurred_at", { ascending: false })
    .limit(PAGE_SIZE);

  const allTxs       = transactions ?? [];
  const expenses     = allTxs.filter((t) => t.transaction_type === "expense");
  const income       = allTxs.filter((t) => t.transaction_type === "income");
  const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome   = income.reduce((s, t) => s + t.amount, 0);
  const initialHasMore = allTxs.length === PAGE_SIZE;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <AnimateIn>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-foreground/40">Historial</p>
            <h1 className="font-serif text-4xl md:text-5xl font-normal mt-1 text-foreground">
              Transacciones
            </h1>
          </div>
          <div className="pt-3">
            <ExportCsvButton />
          </div>
        </div>
      </AnimateIn>

      {/* New transaction */}
      <AnimateIn>
        <NewTransactionForm />
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
      {!allTxs.length ? (
        <AnimateIn>
          <div className="text-center py-20 space-y-4">
            <p className="text-5xl">💬</p>
            <p className="font-serif text-2xl font-normal text-foreground">Sin transacciones aún</p>
            <p className="text-foreground/50 text-sm max-w-xs mx-auto leading-relaxed">
              Agrégala arriba o cuéntale un gasto a Luca por WhatsApp
            </p>
          </div>
        </AnimateIn>
      ) : (
        <AnimateIn delay={60}>
          <TransactionFilterList
            initialTransactions={allTxs}
            initialHasMore={initialHasMore}
          />
        </AnimateIn>
      )}
    </div>
  );
}
