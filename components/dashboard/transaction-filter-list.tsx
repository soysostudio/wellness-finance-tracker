"use client";

import { useState } from "react";
import { TransactionRow } from "./transaction-row";

interface TxCategory {
  name: string;
  slug: string;
  color: string | null;
  icon: string | null;
}

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  merchant: string | null;
  occurred_at: string;
  categories: TxCategory | TxCategory[] | null;
}

interface Props {
  initialTransactions: Transaction[];
  initialHasMore: boolean;
}

const TYPE_FILTERS = [
  { value: "all",     label: "Todos"    },
  { value: "expense", label: "Gastos"   },
  { value: "income",  label: "Ingresos" },
];

export function TransactionFilterList({ initialTransactions, initialHasMore }: Props) {
  const [typeFilter, setCategoryType] = useState<"all" | "expense" | "income">("all");
  const [catFilter, setCatFilter]     = useState<string>("all");
  const [transactions, setTransactions] = useState(initialTransactions);
  const [loading, setLoading]           = useState(false);
  const [hasMore, setHasMore]           = useState(initialHasMore);

  // Derive unique category options from loaded data
  const catMap = new Map<string, string>();
  for (const t of transactions) {
    const cat = Array.isArray(t.categories) ? t.categories[0] : t.categories;
    catMap.set(cat?.slug ?? "otros", cat?.name ?? "Otros");
  }
  const catOptions = Array.from(catMap.entries());

  const filtered = transactions.filter((t) => {
    if (typeFilter !== "all" && t.transaction_type !== typeFilter) return false;
    if (catFilter !== "all") {
      const cat = Array.isArray(t.categories) ? t.categories[0] : t.categories;
      if ((cat?.slug ?? "otros") !== catFilter) return false;
    }
    return true;
  });

  async function loadMore() {
    setLoading(true);
    try {
      const res  = await fetch(`/api/transactions?offset=${transactions.length}&limit=50`);
      const data = await res.json() as { transactions: Transaction[]; hasMore: boolean };
      setTransactions((prev) => [...prev, ...data.transactions]);
      setHasMore(data.hasMore);
    } finally {
      setLoading(false);
    }
  }

  const filtersActive = typeFilter !== "all" || catFilter !== "all";

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Type pills */}
        <div className="flex gap-1 bg-foreground/5 rounded-xl p-1">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setCategoryType(f.value as "all" | "expense" | "income")}
              className={`px-3 h-8 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === f.value
                  ? "bg-foreground text-background"
                  : "text-foreground/50 hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Category select */}
        {catOptions.length > 1 && (
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="h-10 px-3 rounded-xl bg-foreground/5 border-none text-xs text-foreground/70 outline-none cursor-pointer"
          >
            <option value="all">Todas las categorías</option>
            {catOptions.map(([slug, name]) => (
              <option key={slug} value={slug}>{name}</option>
            ))}
          </select>
        )}

        {filtersActive && (
          <button
            onClick={() => { setCategoryType("all"); setCatFilter("all"); }}
            className="text-xs text-foreground/40 hover:text-foreground transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-foreground/40 text-sm">Sin resultados para este filtro</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((t) => (
            <TransactionRow key={t.id} t={t} />
          ))}
        </div>
      )}

      {/* Load more — only when no filters active */}
      {hasMore && !filtersActive && (
        <div className="flex justify-center pt-2">
          <button
            onClick={loadMore}
            disabled={loading}
            className="text-sm text-foreground/50 hover:text-foreground transition-colors disabled:opacity-50 px-6 py-2 rounded-full border border-foreground/10 hover:border-foreground/20"
          >
            {loading ? "Cargando..." : "Cargar más"}
          </button>
        </div>
      )}
    </div>
  );
}
