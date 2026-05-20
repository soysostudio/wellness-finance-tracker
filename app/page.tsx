import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#F5F6F8] text-[#1A1A1A]" style={{ fontFamily: "var(--font-sans)" }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 md:px-16 py-6 max-w-7xl mx-auto">
        <span className="text-base font-semibold tracking-tight">Luca</span>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm text-[#1A1A1A]/50 hover:text-[#1A1A1A] transition-colors">
            Iniciar sesión
          </Link>
          <Link href="/signup" className="bg-[#1A1A1A] text-[#F7F3EC] text-sm font-medium px-5 py-2 rounded-full hover:opacity-80 transition-opacity">
            Empieza gratis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-8 md:px-16 pt-16 pb-24 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-7">
          <h1 className="font-serif text-5xl md:text-6xl leading-[1.1] font-normal text-[#1A1A1A]">
            Maneja tu plata<br />
            <span style={{ color: "#1A1A1A", background: "#FEFF6E", padding: "0 4px", borderRadius: "4px" }}>por WhatsApp.</span>
          </h1>
          <p className="text-[#1A1A1A]/55 text-lg leading-relaxed max-w-md">
            Escríbele a Luca como le escribes a un amigo.
            Él registra tus gastos, controla tus presupuestos
            y te ayuda a ahorrar — sin apps complicadas.
          </p>
          <div className="flex items-center gap-4 pt-1">
            <Link href="/signup" className="bg-[#1A1A1A] text-[#F7F3EC] font-medium px-7 py-3 rounded-full text-sm hover:opacity-80 transition-opacity">
              Crear cuenta gratis
            </Link>
            <a href="#como-funciona" className="text-sm text-[#1A1A1A]/50 hover:text-[#1A1A1A] transition-colors flex items-center gap-1.5">
              Ver cómo funciona
              <span>↓</span>
            </a>
          </div>
          <p className="text-xs text-[#1A1A1A]/35">Gratis para siempre · Sin contraseñas · 2 minutos para empezar</p>
        </div>

        {/* Chat mockup */}
        <div className="flex justify-center">
          <div className="w-full max-w-sm">
            {/* Decorative block behind */}
            <div className="relative">
              <div className="absolute -top-4 -right-4 w-full h-full rounded-3xl" style={{ backgroundColor: "#FFB0FF", opacity: 0.5 }} />
              <div className="relative bg-white rounded-3xl shadow-lg overflow-hidden">
                <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: "#075E54" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold" style={{ backgroundColor: "#25D366" }}>L</div>
                  <div>
                    <p className="text-white text-sm font-medium">Luca</p>
                    <p className="text-white/50 text-xs">en línea</p>
                  </div>
                </div>
                <div className="p-4 space-y-3 min-h-72" style={{ backgroundColor: "#ECE5DD" }}>
                  <ChatBubble from="user" text="gasté 45 mil en Rappi" time="8:02" />
                  <ChatBubble from="luca" text="¡Listo! $45.000 en Comida 🍔 Llevas $312.000 este mes." time="8:02" />
                  <ChatBubble from="user" text="cuánto llevo esta semana?" time="8:15" />
                  <ChatBubble from="luca" text="Esta semana $187.000 💳 Mayor gasto: transporte con $65.000." time="8:15" />
                  <ChatBubble from="user" text="ponme presupuesto de 400 mil para comida" time="9:30" />
                  <ChatBubble from="luca" text="Hecho 🎯 Te aviso cuando llegues al 80%." time="9:30" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section id="como-funciona" className="px-8 md:px-16 py-20 max-w-7xl mx-auto">
        <p className="text-sm text-[#1A1A1A]/40 mb-3">Lo que hace Luca</p>
        <h2 className="font-serif text-3xl md:text-4xl font-normal mb-14 text-[#1A1A1A]">
          Todo lo que necesitas,<br />sin la complejidad.
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { icon: "💬", t: "Lenguaje natural", d: "Dile exactamente lo que gastaste, como se lo dirías a un amigo." },
            { icon: "📊", t: "Dashboard en tiempo real", d: "Visualiza tus gastos por categoría, presupuestos y metas." },
            { icon: "🎯", t: "Alertas de presupuesto", d: "Te avisamos antes de que te pases. Tú decides el límite." },
            { icon: "🏆", t: "Metas de ahorro", d: "Define tus objetivos y Luca trackea tu progreso cada semana." },
          ].map((f) => (
            <div key={f.t} className="space-y-3">
              <span className="text-3xl">{f.icon}</span>
              <p className="font-medium text-sm text-[#1A1A1A]">{f.t}</p>
              <p className="text-[#1A1A1A]/50 text-sm leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works — color blocks */}
      <section className="px-8 md:px-16 py-16 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { n: "01", color: "#FEFF6E", t: "Escríbele a Luca", d: "«gasté 45 mil en Rappi» o «pagué el arriendo». Luca entiende cómo hablas tú, no al revés.", emoji: "💬" },
            { n: "02", color: "#ADDEFF", t: "Luca lo clasifica", d: "En segundos organiza el gasto, actualiza tu presupuesto y te confirma. Powered by IA.", emoji: "⚡" },
            { n: "03", color: "#FFB0FF", t: "Revisa tu dashboard", d: "Todo en tiempo real. Gastos, metas, categorías y insights semanales directo al WhatsApp.", emoji: "📈" },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl p-8 flex flex-col gap-6" style={{ backgroundColor: s.color }}>
              <div className="flex justify-between items-start">
                <span className="text-2xl">{s.emoji}</span>
                <span className="font-serif text-5xl font-normal" style={{ color: "rgba(0,0,0,0.12)" }}>{s.n}</span>
              </div>
              <div>
                <p className="font-medium text-base mb-2 text-[#1A1A1A]">{s.t}</p>
                <p className="text-sm leading-relaxed text-[#1A1A1A]/60">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-8 md:px-16 py-20 max-w-7xl mx-auto">
        <p className="text-sm text-[#1A1A1A]/40 mb-3">Personas reales</p>
        <h2 className="font-serif text-3xl md:text-4xl font-normal mb-12 text-[#1A1A1A]">
          Lo que dicen quienes<br />ya usan Luca.
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { q: "Llevaba años queriendo organizar mis finanzas pero todas las apps me aburrían. Con Luca simplemente le escribo y ya. Llevo 3 meses sin perder el hilo.", name: "Valentina M.", role: "Diseñadora, Bogotá", accent: "#FFB0FF" },
            { q: "Me di cuenta que gastaba 800 mil al mes en comida sin saberlo. En la primera semana ya lo tenía claro. Ese mes ahorré 300 mil.", name: "Sebastián R.", role: "Freelance, Medellín", accent: "#ADDEFF" },
            { q: "Lo que más me gusta es que no tengo que abrir ninguna app. Le escribo por WhatsApp cuando gasto y él hace todo. Cero esfuerzo.", name: "Camila T.", role: "Estudiante, Cali", accent: "#FEFF6E" },
          ].map((t) => (
            <div key={t.name} className="bg-white rounded-2xl p-7 space-y-5">
              <div className="w-6 h-0.5 rounded-full" style={{ backgroundColor: t.accent }} />
              <p className="text-[#1A1A1A]/65 text-sm leading-relaxed">"{t.q}"</p>
              <div>
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-[#1A1A1A]/40 mt-0.5">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 md:px-16 py-24 max-w-3xl mx-auto text-center space-y-6">
        <h2 className="font-serif text-4xl md:text-5xl font-normal leading-snug text-[#1A1A1A]">
          Tu plata, finalmente<br />
          <span style={{ background: "#FFB0FF", padding: "0 4px", borderRadius: "4px" }}>organizada.</span>
        </h2>
        <p className="text-[#1A1A1A]/50 leading-relaxed">
          Únete gratis en 2 minutos. Sin contraseñas, sin apps, sin complicaciones.
        </p>
        <div className="pt-2">
          <Link href="/signup" className="inline-block bg-[#1A1A1A] text-[#F7F3EC] font-medium px-10 py-3.5 rounded-full text-sm hover:opacity-80 transition-opacity">
            Crear mi cuenta gratis
          </Link>
        </div>
        <p className="text-xs text-[#1A1A1A]/30">Gratis para siempre · Sin tarjeta de crédito</p>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1A1A1A]/8 px-8 md:px-16 py-8 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="text-sm font-semibold text-[#1A1A1A]">Luca</span>
        <p className="text-xs text-[#1A1A1A]/35">Finanzas personales para Colombia 🇨🇴</p>
        <div className="flex gap-6 text-xs text-[#1A1A1A]/40">
          <Link href="/login" className="hover:text-[#1A1A1A] transition-colors">Iniciar sesión</Link>
          <Link href="/signup" className="hover:text-[#1A1A1A] transition-colors">Registrarse</Link>
        </div>
      </footer>

    </main>
  );
}

function ChatBubble({ from, text, time }: { from: "user" | "luca"; text: string; time: string }) {
  const isUser = from === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm ${isUser ? "bg-[#DCF8C6]" : "bg-white"}`}>
        <p className="leading-snug text-[#1A1A1A]">{text}</p>
        <p className="text-right mt-1 text-[10px] text-[#1A1A1A]/40">{time}</p>
      </div>
    </div>
  );
}
