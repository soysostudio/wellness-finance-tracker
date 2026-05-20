import { createClient } from "@/lib/supabase/server";
import { formatCOP } from "@/lib/utils/currency";
import { CategoryIcon } from "@/components/ui/category-icon";
import { redirect } from "next/navigation";
import { AnimateIn } from "@/components/ui/animate-in";

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
        <p className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/40">Historial</p>
        <h1 className="font-serif text-4xl md:text-5xl font-normal mt-1 text-[#1A1A1A]">
          Transacciones
        </h1>
      </AnimateIn>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <AnimateIn delay={0}>
          <div className="rounded-2xl p-5 space-y-1.5" style={{ backgroundColor: "#FFB0FF" }}>
            <p className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/50">Total gastos</p>
            <p className="font-serif text-2xl font-normal text-[#1A1A1A]">{formatCOP(totalExpenses)}</p>
          </div>
        </AnimateIn>
        <AnimateIn delay={80}>
          <div className="rounded-2xl p-5 space-y-1.5" style={{ backgroundColor: "#ADDEFF" }}>
            <p className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/50">Total ingresos</p>
            <p className="font-serif text-2xl font-normal text-[#1A1A1A]">{formatCOP(totalIncome)}</p>
          </div>
        </AnimateIn>
      </div>

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
            {transactions.map((t) => {
              const cat      = Array.isArray(t.categories) ? t.categories[0] : t.categories;
              const color    = cat?.color ?? "#BDC3C7";
              const slug     = cat?.slug ?? "otros";
              const label    = t.merchant || t.description || cat?.name || "Movimiento";
              const isExpense = t.transaction_type === "expense";
              const date     = new Date(t.occurred_at).toLocaleDateString("es-CO", {
                day: "numeric", month: "short",
              });

              return (
                <div
                  key={t.id}
                  className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-card border border-[#1A1A1A]/5 hover:border-[#1A1A1A]/10 transition-colors"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: color + "26" }}
                  >
                    <CategoryIcon slug={slug} size={16} strokeWidth={1.5} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1A1A1A] capitalize truncate">{label}</p>
                    <p className="text-xs text-[#1A1A1A]/40 mt-0.5">{date}</p>
                  </div>
                  <p
                    className="font-serif text-sm font-normal shrink-0"
                    style={{ color: isExpense ? "#1A1A1A" : "#2A9D8F" }}
                  >
                    {isExpense ? "−" : "+"}{formatCOP(t.amount)}
                  </p>
                </div>
              );
            })}
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
      <p className="font-serif text-2xl font-normal text-[#1A1A1A]">{title}</p>
      <p className="text-[#1A1A1A]/50 text-sm max-w-xs mx-auto leading-relaxed">{body}</p>
      <p className="text-sm font-mono bg-[#FEFF6E] rounded-xl px-4 py-2 inline-block text-[#1A1A1A]">
        &quot;{example}&quot;
      </p>
    </div>
  );
}
