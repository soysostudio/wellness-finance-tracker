import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border">
        <span className="text-xl font-black tracking-tight">Luca</span>
        <Link href="/login">
          <Button variant="outline" size="sm" className="font-semibold">
            Iniciar sesión
          </Button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <p className="text-sm uppercase tracking-widest text-muted-foreground font-semibold mb-4">
          Tu asistente de finanzas
        </p>
        <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
          Maneja tu plata
          <br />
          <span style={{ color: "#2A9D8F" }}>por WhatsApp</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mb-10">
          Escríbele a Luca como le escribes a un amigo. Él registra tus gastos,
          controla tus presupuestos y te ayuda a ahorrar — sin apps complicadas.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link href="/signup">
            <Button size="lg" className="w-full sm:w-auto font-bold h-14 px-8 text-base">
              Empieza gratis 🚀
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="w-full sm:w-auto font-semibold h-14 px-8 text-base">
              Ya tengo cuenta
            </Button>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xs uppercase tracking-widest font-semibold text-muted-foreground text-center mb-10">
            Así funciona
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { n: "01", t: "Escríbele a Luca", d: '"gasté 45 mil en Rappi"' },
              { n: "02", t: "Luca lo entiende", d: "Registra, categoriza y actualiza tu presupuesto automáticamente" },
              { n: "03", t: "Ve tu dashboard", d: "Todo organizado y visualizado en tiempo real" },
            ].map((s) => (
              <div key={s.n} className="space-y-3">
                <span className="text-4xl font-black text-muted-foreground/30">{s.n}</span>
                <p className="font-bold">{s.t}</p>
                <p className="text-muted-foreground text-sm">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="text-center py-6 text-xs text-muted-foreground border-t border-border">
        Luca — Finanzas personales para Colombia 🇨🇴
      </footer>
    </main>
  );
}
