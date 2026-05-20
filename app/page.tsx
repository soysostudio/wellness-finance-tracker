import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A] overflow-x-hidden">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5">
        <span className="text-xl font-black tracking-tight">Luca</span>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-semibold text-[#0A0A0A]/60 hover:text-[#0A0A0A] transition-colors">
            Iniciar sesión
          </Link>
          <Link href="/signup" className="bg-[#0A0A0A] text-[#F5F0E8] text-sm font-bold px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity">
            Empieza gratis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 md:px-12 pt-12 pb-0 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-[#2A9D8F]/15 text-[#2A9D8F] text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full">
              <span className="w-1.5 h-1.5 bg-[#2A9D8F] rounded-full animate-pulse" />
              Tu asistente de finanzas
            </div>
            <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight">
              Maneja<br />
              tu plata<br />
              <em className="not-italic" style={{ color: "#2A9D8F" }}>por WhatsApp.</em>
            </h1>
            <p className="text-lg text-[#0A0A0A]/60 max-w-md leading-relaxed">
              Escríbele a Luca como le escribes a un amigo.
              Sin apps complicadas, sin hojas de cálculo.
              Solo tú, tu WhatsApp y tu plata organizada.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href="/signup" className="bg-[#0A0A0A] text-[#F5F0E8] font-bold px-8 py-4 rounded-2xl text-base hover:opacity-90 transition-opacity text-center">
                Crear cuenta gratis →
              </Link>
              <a href="#como-funciona" className="border border-[#0A0A0A]/20 font-semibold px-8 py-4 rounded-2xl text-base hover:bg-[#0A0A0A]/5 transition-colors text-center">
                Ver cómo funciona
              </a>
            </div>
            <p className="text-xs text-[#0A0A0A]/40 font-medium">Gratis para siempre · Sin contraseñas · 2 minutos para empezar</p>
          </div>

          {/* WhatsApp mockup */}
          <div className="flex justify-center md:justify-end">
            <div className="w-full max-w-xs">
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                {/* WhatsApp header */}
                <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center text-white font-black text-sm">L</div>
                  <div>
                    <p className="text-white font-semibold text-sm">Luca 💚</p>
                    <p className="text-white/60 text-xs">en línea</p>
                  </div>
                </div>
                {/* Chat */}
                <div className="bg-[#ECE5DD] p-4 space-y-3 min-h-[340px]">
                  <ChatBubble from="user" text="gasté 45 mil en Rappi" time="8:02" />
                  <ChatBubble from="luca" text="¡Listo! Te anoté $45.000 en Comida 🍔 Llevas $312.000 este mes." time="8:02" />
                  <ChatBubble from="user" text="cuánto llevo gastado esta semana?" time="8:15" />
                  <ChatBubble from="luca" text="Esta semana llevas $187.000 💳 Tu mayor gasto fue transporte con $65.000." time="8:15" />
                  <ChatBubble from="user" text="ponme un presupuesto de 400 mil para comida" time="9:30" />
                  <ChatBubble from="luca" text="¡Hecho! Presupuesto de $400.000 para Comida activado 🎯 Te aviso cuando vayas al 80%." time="9:30" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats banner */}
      <section className="bg-[#0A0A0A] text-[#F5F0E8] mt-16 py-10 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { n: "2 min", l: "Para empezar" },
            { n: "100%", l: "Por WhatsApp" },
            { n: "$0", l: "Para siempre gratis" },
            { n: "24/7", l: "Luca disponible" },
          ].map((s) => (
            <div key={s.l} className="space-y-1">
              <p className="font-serif text-4xl font-black" style={{ color: "#2A9D8F" }}>{s.n}</p>
              <p className="text-[#F5F0E8]/50 text-sm font-medium">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="px-6 md:px-12 py-20 max-w-7xl mx-auto">
        <p className="text-xs uppercase tracking-widest font-bold text-[#0A0A0A]/40 mb-4">Así funciona</p>
        <h2 className="font-serif text-4xl md:text-5xl font-black mb-14 max-w-xl leading-tight">
          Tan fácil como<br />mandar un mensaje.
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { n: "01", color: "#F4A261", t: "Escríbele a Luca", d: "«gasté 45 mil en Rappi» — así de simple. Luca entiende lenguaje natural, montos, fechas y contexto.", emoji: "💬" },
            { n: "02", color: "#2A9D8F", t: "Luca lo procesa", d: "En segundos clasifica el gasto, actualiza tu presupuesto y te confirma todo. Powered by OpenAI.", emoji: "⚡" },
            { n: "03", color: "#E9C46A", t: "Ve tu dashboard", d: "Todo organizado en tiempo real. Gastos por categoría, metas de ahorro y alertas de presupuesto.", emoji: "📊" },
          ].map((s) => (
            <div key={s.n} className="rounded-3xl p-7 flex flex-col gap-4" style={{ backgroundColor: s.color }}>
              <div className="flex justify-between items-start">
                <span className="text-3xl">{s.emoji}</span>
                <span className="font-serif text-5xl font-black text-black/20">{s.n}</span>
              </div>
              <div>
                <p className="font-bold text-lg text-[#0A0A0A] mb-2">{s.t}</p>
                <p className="text-[#0A0A0A]/70 text-sm leading-relaxed">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="px-6 md:px-12 pb-20 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-4">

          <div className="bg-[#0A0A0A] text-[#F5F0E8] rounded-3xl p-8 space-y-4">
            <span className="text-4xl">🧠</span>
            <h3 className="font-serif text-3xl font-bold">Entiende cómo hablas tú.</h3>
            <p className="text-[#F5F0E8]/60 leading-relaxed">No hay formularios. Dile «me tomé un café de 8 lucas» o «pagué el arriendo de enero» — Luca lo entiende y lo clasifica solo.</p>
          </div>

          <div className="bg-[#CDB4DB] rounded-3xl p-8 space-y-4">
            <span className="text-4xl">🎯</span>
            <h3 className="font-serif text-3xl font-bold">Presupuestos que te avisan.</h3>
            <p className="text-[#0A0A0A]/70 leading-relaxed">Define cuánto quieres gastar en comida, transporte o salidas. Luca te alerta cuando vas al 80% antes de que te pases.</p>
          </div>

          <div className="bg-[#A8DADC] rounded-3xl p-8 space-y-4">
            <span className="text-4xl">🏆</span>
            <h3 className="font-serif text-3xl font-bold">Metas de ahorro reales.</h3>
            <p className="text-[#0A0A0A]/70 leading-relaxed">«Quiero ahorrar 2 millones para vacaciones en diciembre». Luca trackea tu progreso y te dice si vas bien o hay que ajustar.</p>
          </div>

          <div className="bg-[#F4A261] rounded-3xl p-8 space-y-4">
            <span className="text-4xl">📅</span>
            <h3 className="font-serif text-3xl font-bold">Resumen semanal automático.</h3>
            <p className="text-[#0A0A0A]/70 leading-relaxed">Cada semana Luca te manda un resumen por WhatsApp con tus gastos, categorías y tips para mejorar. Sin que tengas que pedirlo.</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-[#0A0A0A] text-[#F5F0E8] px-6 md:px-12 py-20">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs uppercase tracking-widest font-bold text-[#F5F0E8]/30 mb-4">Lo que dicen</p>
          <h2 className="font-serif text-4xl md:text-5xl font-black mb-12">Personas reales.<br />Resultados reales.</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { q: "Llevaba años queriendo organizar mis finanzas pero todas las apps me aburrían. Con Luca simplemente le escribo como si fuera un amigo y ya. Llevo 3 meses sin perder el hilo.", name: "Valentina M.", role: "Diseñadora, Bogotá", color: "#2A9D8F" },
              { q: "Me di cuenta que gastaba 800 mil al mes en comida y no lo sabía. En la primera semana con Luca ya lo tenía claro y puse un presupuesto. Ese mes ahorré 300 mil.", name: "Sebastián R.", role: "Freelance, Medellín", color: "#F4A261" },
              { q: "Lo que más me gusta es que no tengo que abrir ninguna app. Le escribo por WhatsApp cuando gasto algo y él hace todo. Es literalmente cero esfuerzo.", name: "Camila T.", role: "Estudiante, Cali", color: "#CDB4DB" },
            ].map((t) => (
              <div key={t.name} className="bg-[#F5F0E8]/5 rounded-3xl p-7 space-y-6 border border-[#F5F0E8]/10">
                <div className="w-8 h-1 rounded-full" style={{ backgroundColor: t.color }} />
                <p className="text-[#F5F0E8]/80 leading-relaxed text-sm">"{t.q}"</p>
                <div>
                  <p className="font-bold text-sm">{t.name}</p>
                  <p className="text-[#F5F0E8]/40 text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-6 md:px-12 py-24 max-w-4xl mx-auto text-center space-y-8">
        <h2 className="font-serif text-5xl md:text-7xl font-black leading-tight">
          Tu plata,<br />
          <span style={{ color: "#2A9D8F" }}>finalmente</span><br />
          organizada.
        </h2>
        <p className="text-[#0A0A0A]/60 text-lg max-w-md mx-auto">
          Únete gratis en 2 minutos. Sin contraseñas, sin apps, sin complicaciones.
        </p>
        <Link href="/signup" className="inline-block bg-[#0A0A0A] text-[#F5F0E8] font-bold px-12 py-5 rounded-2xl text-lg hover:opacity-90 transition-opacity">
          Crear mi cuenta gratis →
        </Link>
        <p className="text-xs text-[#0A0A0A]/30">Gratis para siempre · Sin tarjeta de crédito</p>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#0A0A0A]/10 px-6 md:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#0A0A0A]/40">
        <span className="font-black text-[#0A0A0A]">Luca</span>
        <p>Finanzas personales para Colombia 🇨🇴</p>
        <div className="flex gap-6">
          <Link href="/login" className="hover:text-[#0A0A0A] transition-colors">Iniciar sesión</Link>
          <Link href="/signup" className="hover:text-[#0A0A0A] transition-colors">Registrarse</Link>
        </div>
      </footer>

    </main>
  );
}

function ChatBubble({ from, text, time }: { from: "user" | "luca"; text: string; time: string }) {
  const isUser = from === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
          isUser ? "bg-[#DCF8C6] text-[#0A0A0A]" : "bg-white text-[#0A0A0A]"
        }`}
      >
        <p className="leading-snug">{text}</p>
        <p className="text-[10px] text-right mt-1 opacity-50">{time}</p>
      </div>
    </div>
  );
}
