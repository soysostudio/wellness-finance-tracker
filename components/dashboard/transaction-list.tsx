"use client";

import { formatCOP } from "@/lib/utils/currency";
import { getCategoryColor } from "@/lib/utils/categories";
import { CategoryIcon } from "@/components/ui/category-icon";
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
            className="flex items-center gap-3 bg-card rounded-xl px-4 py-3 border border-[#1A1A1A]/5"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: color + "26" }}
            >
              <CategoryIcon slug={slug} size={16} strokeWidth={1.5} style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1A1A1A] truncate capitalize">{label}</p>
              <p className="text-xs text-[#1A1A1A]/40 mt-0.5">{date}</p>
            </div>
            <p
              className="font-serif text-sm font-normal shrink-0"
              style={{ color: isIncome ? "#2A9D8F" : "#1A1A1A" }}
            >
              {isIncome ? "+" : "−"}{formatCOP(tx.amount)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
