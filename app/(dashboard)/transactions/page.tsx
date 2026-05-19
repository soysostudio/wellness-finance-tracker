import { createClient } from "@/lib/supabase/server";
import { formatCOP } from "@/lib/utils/currency";
import { getCategoryIcon } from "@/lib/utils/categories";
import { redirect } from "next/navigation";

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
  const income = (transactions ?? []).filter((t) => t.transaction_type === "income");
  const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome = income.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black">Transacciones</h1>
        <p className="text-muted-foreground text-sm mt-1">Historial completo de tus movimientos</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl p-4 space-y-1">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Total gastos</p>
          <p className="text-xl font-black" style={{ color: "#E76F51" }}>{formatCOP(totalExpenses)}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 space-y-1">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Total ingresos</p>
          <p className="text-xl font-black" style={{ color: "#2A9D8F" }}>{formatCOP(totalIncome)}</p>
        </div>
      </div>

      {!transactions?.length ? (
        <div className="text-center py-20 space-y-3">
          <p className="text-5xl">💬</p>
          <p className="font-semibold">Sin transacciones aún</p>
          <p className="text-muted-foreground text-sm">Cuéntale un gasto a Luca por WhatsApp</p>
          <p className="text-sm font-mono bg-muted rounded-xl px-4 py-2 inline-block">&quot;gasté 30 mil en el mercado&quot;</p>
        </div>
      ) : (
        <div className="space-y-1">
          {transactions.map((t) => {
            const cat = Array.isArray(t.categories) ? t.categories[0] : t.categories;
            const icon = cat?.icon ?? getCategoryIcon(cat?.slug ?? "otros");
            const label = t.merchant || t.description || cat?.name || "Movimiento";
            const isExpense = t.transaction_type === "expense";
            const date = new Date(t.occurred_at).toLocaleDateString("es-CO", {
              day: "numeric", month: "short",
            });

            return (
              <div
                key={t.id}
                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-card transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                  style={{ backgroundColor: cat?.color ?? "#BDC3C7" }}
                >
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm capitalize truncate">{label}</p>
                  <p className="text-xs text-muted-foreground">{date}</p>
                </div>
                <p
                  className="font-bold text-sm shrink-0"
                  style={{ color: isExpense ? "#E76F51" : "#2A9D8F" }}
                >
                  {isExpense ? "-" : "+"}{formatCOP(t.amount)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
