"use client";

import { useState, useEffect, useRef } from "react";
import { TransactionRow } from "./transaction-row";
import { Skeleton } from "@/components/ui/skeleton";

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

interface CategoryOption {
  slug: string;
  name: string;
}

interface Props {
  initialTransactions: Transaction[];
  initialHasMore: boolean;
  categories: CategoryOption[];
}

const PAGE_SIZE = 50;

const TYPE_FILTERS = [
  { value: "all",     label: "Todos"    },
  { value: "expense", label: "Gastos"   },
  { value: "income",  label: "Ingresos" },
];

export function TransactionFilterList({ initialTransactions, initialHasMore, categories }: Props) {
  const [typeFilter, setTypeFilter]     = useState<"all" | "expense" | "income">("all");
  const [catFilter, setCatFilter]       = useState<string>("all");
  const [transactions, setTransactions] = useState(initialTransactions);
  const [loading, setLoading]           = useState(false);
  const [hasMore, setHasMore]           = useState(initialHasMore);
  const [error, setError]               = useState(false);

  const filtersActive = typeFilter !== "all" || catFilter !== "all";

  // Build the query string for the current filters at a given offset
  function buildUrl(offset: number) {
    const params = new URLSearchParams({ offset: String(offset), limit: String(PAGE_SIZE) });
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (catFilter !== "all")  params.set("category", catFilter);
    return `/api/transactions?${params.toString()}`;
  }

  // Refetch from the server whenever filters change (skips the first mount,
  // which already has the server-rendered initial page).
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch(buildUrl(0))
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json() as Promise<{ transactions: Transaction[]; hasMore: boolean }>;
      })
      .then((data) => {
        if (cancelled) return;
        setTransactions(data.transactions ?? []);
        setHasMore(data.hasMore);
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, catFilter]);

  async function loadMore() {
    setLoading(true);
    try {
      const res  = await fetch(buildUrl(transactions.length));
      const data = await res.json() as { transactions: Transaction[]; hasMore: boolean };
      setTransactions((prev) => [...prev, ...data.transactions]);
      setHasMore(data.hasMore);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Type pills */}
        <div className="flex gap-1 bg-foreground/5 rounded-xl p-1">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value as "all" | "expense" | "income")}
              aria-pressed={typeFilter === f.value}
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
        {categories.length > 0 && (
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="h-10 px-3 rounded-xl bg-foreground/5 border-none text-xs text-foreground/70 outline-none cursor-pointer"
          >
            <option value="all">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        )}

        {filtersActive && (
          <button
            onClick={() => { setTypeFilter("all"); setCatFilter("all"); }}
            className="text-xs text-foreground/40 hover:text-foreground transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* List */}
      {error ? (
        <div className="text-center py-10 space-y-2">
          <p className="text-foreground/50 text-sm">No pudimos cargar las transacciones.</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-foreground/50 hover:text-foreground underline underline-offset-4"
          >
            Reintentar
          </button>
        </div>
      ) : loading && transactions.length === 0 ? (
        <div className="space-y-1.5" aria-busy="true" aria-label="Cargando transacciones">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-foreground/40 text-sm">Sin resultados para este filtro</p>
        </div>
      ) : (
        <div className={`space-y-1.5 transition-opacity ${loading ? "opacity-50" : ""}`}>
          {transactions.map((t) => (
            <TransactionRow key={t.id} t={t} />
          ))}
        </div>
      )}

      {/* Load more — works with filters applied (server-side pagination) */}
      {hasMore && (
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
