"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Pencil, X } from "lucide-react";
import { CategoryIcon } from "@/components/ui/category-icon";
import { getCategoryColor, SYSTEM_CATEGORIES } from "@/lib/utils/categories";
import { formatCOP, formatAmountInput, parseAmountInput } from "@/lib/utils/currency";

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  merchant: string | null;
  occurred_at: string;
  categories: { name: string; slug: string } | { name: string; slug: string }[] | null;
}

export function TransactionRow({ t }: { t: Transaction }) {
  const router = useRouter();
  const [editing, setEditing]       = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [saving, setSaving]         = useState(false);

  const cat      = Array.isArray(t.categories) ? t.categories[0] : t.categories;
  const slug     = cat?.slug ?? "otros";
  const color    = getCategoryColor(slug);
  const label    = t.merchant || t.description || cat?.name || "Movimiento";
  const isExpense = t.transaction_type === "expense";
  const date     = new Date(t.occurred_at).toLocaleDateString("es-CO", {
    day: "numeric", month: "short",
  });

  // Edit form state
  const [amount,      setAmount]      = useState(formatAmountInput(String(t.amount)));
  const [merchant,    setMerchant]    = useState(t.merchant ?? "");
  const [description, setDescription] = useState(t.description ?? "");
  const [categorySlug, setCategorySlug] = useState(slug);
  const [occurredAt,  setOccurredAt]  = useState(t.occurred_at.slice(0, 10));

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/transactions/${t.id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/transactions/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount:        parseAmountInput(amount),
          merchant:      merchant || null,
          description:   description || null,
          category_slug: categorySlug,
          occurred_at:   new Date(occurredAt).toISOString(),
        }),
      });
      if (res.ok) {
        setEditing(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Row */}
      <div className="rounded-2xl group">
      <div className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-card border border-foreground/5 hover:border-foreground/10 transition-colors">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: color + "26" }}
        >
          <CategoryIcon slug={slug} size={16} strokeWidth={1.5} style={{ color }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground capitalize truncate">{label}</p>
          <p className="text-xs text-foreground/40 mt-0.5">{date}</p>
        </div>

        <p className={`font-amount text-sm font-medium shrink-0 ${isExpense ? "text-foreground" : "text-[#2A9D8F]"}`}>
          {isExpense ? "−" : "+"}{formatCOP(t.amount)}
        </p>

        {/* Action buttons — visible on hover */}
        {confirming ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-foreground/50">¿Eliminar?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs font-medium text-red-500 hover:text-red-600 disabled:opacity-50 transition-colors"
            >
              {deleting ? "..." : "Sí"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-xs text-foreground/40 hover:text-foreground transition-colors"
            >
              No
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg hover:bg-foreground/6 text-foreground/40 hover:text-foreground transition-colors"
              title="Editar"
            >
              <Pencil size={14} strokeWidth={1.5} />
            </button>
            <button
              onClick={() => setConfirming(true)}
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-foreground/40 hover:text-red-500 transition-colors"
              title="Eliminar"
            >
              <Trash2 size={14} strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card rounded-2xl p-6 space-y-4 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-normal text-foreground">Editar transacción</h2>
              <button
                onClick={() => setEditing(false)}
                className="p-1.5 rounded-lg hover:bg-foreground/6 text-foreground/40 hover:text-foreground transition-colors"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-3">
              {/* Amount */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-foreground/40">Monto (COP)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(formatAmountInput(e.target.value))}
                  className="w-full h-11 px-4 rounded-xl bg-background border border-foreground/8 text-sm text-foreground outline-none focus:border-foreground/30 transition-colors"
                />
              </div>

              {/* Merchant */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-foreground/40">Comercio / Merchant</label>
                <input
                  type="text"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder="Ej: Rappi, Uber, D1..."
                  className="w-full h-11 px-4 rounded-xl bg-background border border-foreground/8 text-sm text-foreground placeholder-foreground/30 outline-none focus:border-foreground/30 transition-colors"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-foreground/40">Descripción</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej: Almuerzo, gasolina..."
                  className="w-full h-11 px-4 rounded-xl bg-background border border-foreground/8 text-sm text-foreground placeholder-foreground/30 outline-none focus:border-foreground/30 transition-colors"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-foreground/40">Categoría</label>
                <select
                  value={categorySlug}
                  onChange={(e) => setCategorySlug(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-background border border-foreground/8 text-sm text-foreground outline-none focus:border-foreground/30 transition-colors"
                >
                  {SYSTEM_CATEGORIES.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-foreground/40">Fecha</label>
                <input
                  type="date"
                  value={occurredAt}
                  onChange={(e) => setOccurredAt(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-background border border-foreground/8 text-sm text-foreground outline-none focus:border-foreground/30 transition-colors"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 h-11 rounded-full border border-foreground/10 text-sm text-foreground/60 hover:text-foreground hover:border-foreground/20 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 h-11 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
