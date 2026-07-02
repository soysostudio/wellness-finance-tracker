import { createClient } from "@/lib/supabase/server";
import { getMonthRange, getCurrentMonthRange } from "@/lib/utils/dates";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month"); // "YYYY-MM" or null = all time

  let start: string | undefined;
  let end:   string | undefined;

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    ({ start, end } = getMonthRange(monthParam));
  } else if (monthParam === "current") {
    ({ start, end } = getCurrentMonthRange());
  }
  // else no filter = all time

  let query = supabase
    .from("transactions")
    .select("id, occurred_at, transaction_type, amount, description, merchant, categories(name, slug)")
    .eq("user_id", user.id)
    .order("occurred_at", { ascending: false });

  if (start) query = query.gte("occurred_at", start);
  if (end)   query = query.lte("occurred_at", end);

  const { data: txs, error } = await query;
  if (error) return new Response("Error fetching data", { status: 500 });

  // Escapa una celda CSV y neutraliza inyección de fórmulas (=, +, -, @, tab, CR)
  const cell = (v: unknown) => {
    let s = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };

  // Build CSV
  const headers = ["Fecha", "Tipo", "Monto", "Comercio", "Descripción", "Categoría"];
  const rows = (txs ?? []).map((t) => {
    const cat  = Array.isArray(t.categories) ? t.categories[0] : t.categories;
    const date = new Date(t.occurred_at).toLocaleDateString("es-CO", { timeZone: "America/Bogota" });
    const type = t.transaction_type === "expense" ? "Gasto" : "Ingreso";
    return [date, type, t.amount, t.merchant ?? "", t.description ?? "", cat?.name ?? "Otros"]
      .map(cell)
      .join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");

  const filename = monthParam && monthParam !== "all"
    ? `luca-${monthParam}.csv`
    : "luca-transacciones.csv";

  return new Response(csv, {
    headers: {
      "Content-Type":        "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
