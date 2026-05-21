import Link from "next/link";
import {
  MessageCircle,
  BarChart3,
  Target,
  Trophy,
  Zap,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { AnimateIn } from "@/components/ui/animate-in";

/* ── Data ─────────────────────────────────────────────── */

const CAPABILITIES: { Icon: LucideIcon; t: string; d: string }[] = [
  { Icon: MessageCircle, t: "Lenguaje natural",       d: "Dile exactamente lo que gastaste, como se lo dirías a un amigo." },
  { Icon: BarChart3,     t: "Dashboard en tiempo real", d: "Visualiza tus gastos por categoría, presupuestos y metas." },
  { Icon: Target,        t: "Alertas de presupuesto",  d: "Te avisamos antes de que te pases. Tú decides el límite." },
  { Icon: Trophy,        t: "Metas de ahorro",         d: "Define tus objetivos y Luca trackea tu progreso cada semana." },
];

const STEPS: { n: string; color: string; Icon: LucideIcon; t: string; d: string }[] = [
  {
    n: "01", color: "#FEFF6E", Icon: MessageCircle,
    t: "Escríbele a Luca",
    d: "«gasté 45 mil en Rappi» o «pagué el arriendo». Luca entiende cómo hablas tú, no al revés.",
  },
  {
    n: "02", color: "#ADDEFF", Icon: Zap,
    t: "Luca lo clasifica",
    d: "En segundos organiza el gasto, actualiza tu presupuesto y te confirma. Powered by IA.",
  },
  {
    n: "03", color: "#FFB0FF", Icon: TrendingUp,
    t: "Revisa tu dashboard",
    d: "Todo en tiempo real. Gastos, metas, categorías e insights semanales directo al WhatsApp.",
  },
];

const TESTIMONIALS = [
  { q: "Llevaba años queriendo organizar mis finanzas pero todas las apps me aburrían. Con Luca simplemente le escribo y ya. Llevo 3 meses sin perder el hilo.", name: "Valentina M.", role: "Diseñadora, Bogotá",  accent: "#FFB0FF" },
  { q: "Me di cuenta que gastaba 800 mil al mes en comida sin saberlo. En la primera semana ya lo tenía claro. Ese mes ahorré 300 mil.",                          name: "Sebastián R.", role: "Freelance, Medellín", accent: "#ADDEFF" },
  { q: "Lo que más me gusta es que no tengo que abrir ninguna app. Le escribo por WhatsApp cuando gasto y él hace todo. Cero esfuerzo.",                          name: "Camila T.",    role: "Estudiante, Cali",   accent: "#FEFF6E" },
];

/* ── Page ─────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground" style={{ fontFamily: "var(--font-sans)" }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 md:px-16 py-6 max-w-7xl mx-auto">
        <span className="text-base font-semibold tracking-tight">Luca</span>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm text-foreground/50 hover:text-foreground transition-colors">
            Iniciar sesión
          </Link>
          <Link href="/signup" className="bg-foreground text-background text-sm font-medium px-5 py-2 rounded-full hover:opacity-80 transition-opacity">
            Empieza gratis
          </Link>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────── */}
      <section className="px-8 md:px-16 pt-16 pb-24 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <AnimateIn className="space-y-7">
          <h1 className="font-serif text-5xl md:text-6xl leading-[1.1] font-normal text-foreground">
            Maneja tu plata<br />
            <span style={{ background: "linear-gradient(to top, #FEFF6E 80%, transparent 80%)" }}>por WhatsApp.</span>
          </h1>
          <p className="text-foreground/55 text-lg leading-relaxed max-w-md">
            Escríbele a Luca como le escribes a un amigo.
            Él registra tus gastos, controla tus presupuestos
            y te ayuda a ahorrar — sin apps complicadas.
          </p>
          <div className="flex items-center gap-4 pt-1">
            <Link href="/signup" className="bg-foreground text-background font-medium px-7 py-3 rounded-full text-sm hover:opacity-80 transition-opacity">
              Crear cuenta gratis
            </Link>
            <a href="#como-funciona" className="text-sm text-foreground/50 hover:text-foreground transition-colors flex items-center gap-1.5">
              Ver cómo funciona
              <span>↓</span>
            </a>
          </div>
          <p className="text-xs text-foreground/35">Gratis para siempre · Sin contraseñas · 2 minutos para empezar</p>
        </AnimateIn>

        {/* Chat mockup */}
        <AnimateIn delay={120} from="fade" className="flex justify-center">
          <div className="w-full max-w-sm">
            <div className="relative">
              <div className="absolute -top-4 -right-4 w-full h-full rounded-3xl opacity-50 dark:opacity-20" style={{ backgroundColor: "#FFB0FF" }} />
              <div className="relative bg-card rounded-3xl shadow-lg overflow-hidden">
                <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: "#075E54" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold" style={{ backgroundColor: "#25D366" }}>L</div>
                  <div>
                    <p className="text-white text-sm font-medium">Luca</p>
                    <p className="text-white/50 text-xs">en línea</p>
                  </div>
                </div>
                <div className="p-4 space-y-3 min-h-72 bg-[#ECE5DD] dark:bg-[#111B21]">
                  <ChatBubble from="user" text="gasté 45 mil en Rappi" time="8:02" />
                  <ChatBubble from="luca" text="¡Listo! $45.000 en Comida. Llevas $312.000 este mes." time="8:02" />
                  <ChatBubble from="user" text="cuánto llevo esta semana?" time="8:15" />
                  <ChatBubble from="luca" text="Esta semana $187.000. Mayor gasto: transporte con $65.000." time="8:15" />
                  <ChatBubble from="user" text="ponme presupuesto de 400 mil para comida" time="9:30" />
                  <ChatBubble from="luca" text="Hecho. Te aviso cuando llegues al 80%." time="9:30" />
                </div>
              </div>
            </div>
          </div>
        </AnimateIn>
      </section>

      {/* ── Capabilities ──────────────────────────────── */}
      <section id="como-funciona" className="px-8 md:px-16 py-20 max-w-7xl mx-auto">
        <AnimateIn>
          <p className="text-xs text-foreground/40 uppercase tracking-widest mb-3">Lo que hace Luca</p>
          <h2 className="font-serif text-3xl md:text-4xl font-normal mb-14 text-foreground">
            Todo lo que necesitas,<br />sin la complejidad.
          </h2>
        </AnimateIn>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {CAPABILITIES.map(({ Icon, t, d }, i) => (
            <AnimateIn key={t} delay={i * 80} className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center">
                <Icon size={18} strokeWidth={1.5} className="text-foreground/60" />
              </div>
              <p className="font-medium text-sm text-foreground">{t}</p>
              <p className="text-foreground/50 text-sm leading-relaxed">{d}</p>
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────── */}
      <section className="px-8 md:px-16 py-16 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-4">
          {STEPS.map(({ n, color, Icon, t, d }, i) => (
            <AnimateIn key={n} delay={i * 100}>
              <div className="rounded-2xl p-8 flex flex-col gap-6 h-full" style={{ backgroundColor: color }}>
                <div className="flex justify-between items-start">
                  <div className="w-9 h-9 rounded-lg bg-[#1A1A1A]/10 flex items-center justify-center">
                    <Icon size={16} strokeWidth={1.5} className="text-[#1A1A1A]/70" />
                  </div>
                  <span className="font-serif text-5xl font-normal" style={{ color: "rgba(0,0,0,0.10)" }}>{n}</span>
                </div>
                <div>
                  <p className="font-medium text-base mb-2 text-[#1A1A1A]">{t}</p>
                  <p className="text-sm leading-relaxed text-[#1A1A1A]/60">{d}</p>
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────── */}
      <section className="px-8 md:px-16 py-20 max-w-7xl mx-auto">
        <AnimateIn>
          <p className="text-xs text-foreground/40 uppercase tracking-widest mb-3">Personas reales</p>
          <h2 className="font-serif text-3xl md:text-4xl font-normal mb-12 text-foreground">
            Lo que dicen quienes<br />ya usan Luca.
          </h2>
        </AnimateIn>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ q, name, role, accent }, i) => (
            <AnimateIn key={name} delay={i * 80}>
              <div className="bg-card rounded-2xl p-7 space-y-5 h-full">
                <div className="w-6 h-0.5 rounded-full" style={{ backgroundColor: accent }} />
                <p className="text-foreground/65 text-sm leading-relaxed">"{q}"</p>
                <div>
                  <p className="text-sm font-medium">{name}</p>
                  <p className="text-xs text-foreground/40 mt-0.5">{role}</p>
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────── */}
      <section className="px-8 md:px-16 py-24 max-w-3xl mx-auto text-center">
        <AnimateIn className="space-y-6">
          <h2 className="font-serif text-4xl md:text-5xl font-normal leading-snug text-foreground">
            Tu plata, finalmente<br />
            <span style={{ background: "linear-gradient(to top, #FFB0FF 80%, transparent 80%)" }}>organizada.</span>
          </h2>
          <p className="text-foreground/50 leading-relaxed">
            Únete gratis en 2 minutos. Sin contraseñas, sin apps, sin complicaciones.
          </p>
          <div className="pt-2">
            <Link href="/signup" className="inline-block bg-foreground text-background font-medium px-10 py-3.5 rounded-full text-sm hover:opacity-80 transition-opacity">
              Crear mi cuenta gratis
            </Link>
          </div>
          <p className="text-xs text-foreground/30">Gratis para siempre · Sin tarjeta de crédito</p>
        </AnimateIn>
      </section>

      {/* Footer */}
      <footer className="border-t border-foreground/8 px-8 md:px-16 py-8 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="text-sm font-semibold text-foreground">Luca</span>
        <p className="text-xs text-foreground/35">Finanzas personales para Colombia 🇨🇴</p>
        <div className="flex gap-6 text-xs text-foreground/40">
          <Link href="/login" className="hover:text-foreground transition-colors">Iniciar sesión</Link>
          <Link href="/signup" className="hover:text-foreground transition-colors">Registrarse</Link>
        </div>
      </footer>

    </main>
  );
}

function ChatBubble({ from, text, time }: { from: "user" | "luca"; text: string; time: string }) {
  const isUser = from === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm ${isUser ? "bg-[#DCF8C6] dark:bg-[#005C4B]" : "bg-card"}`}>
        <p className="leading-snug text-foreground">{text}</p>
        <p className="text-right mt-1 text-[10px] text-foreground/40">{time}</p>
      </div>
    </div>
  );
}
