"use client";

import { formatCOP } from "@/lib/utils/currency";
import { getCategoryColor, getCategoryIcon } from "@/lib/utils/categories";
import { formatInTimeZone } from "date-fns-tz";

interface Transaction {
  id?: string;
  amount: number;
  transaction_type: string;
  occurred_at: string;
  description: string | null;
  merchant: string | null;
  categories?: { name: string; slug: string; color: string | null; icon: string | null } | { name: string; slug: string; color: string | null; icon: string | null }[] | null;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Sin transacciones aún
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx, i) => {
        const cat = Array.isArray(tx.categories) ? tx.categories[0] : tx.categories;
        const slug = cat?.slug ?? "otros";
        const color = cat?.color ?? getCategoryColor(slug);
        const icon = cat?.icon ?? getCategoryIcon(slug);
        const label = tx.merchant ?? tx.description ?? "Sin descripción";
        const isIncome = tx.transaction_type === "income";
        const date = formatInTimeZone(
          new Date(tx.occurred_at),
          "America/Bogota",
          "d MMM"
        );

        return (
          <div
            key={tx.id ?? i}
            className="flex items-center gap-3 bg-card rounded-xl px-4 py-3"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
              style={{ backgroundColor: color + "33" }}
            >
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{label}</p>
              <p className="text-xs text-muted-foreground">{date}</p>
            </div>
            <p
              className="text-sm font-bold shrink-0"
              style={{ color: isIncome ? "#2A9D8F" : undefined }}
            >
              {isIncome ? "+" : "-"}{formatCOP(tx.amount)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
