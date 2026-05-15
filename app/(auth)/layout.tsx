export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Luca wordmark */}
        <div className="mb-8 text-center">
          <span className="text-3xl font-black tracking-tight">Luca</span>
          <p className="text-sm text-muted-foreground mt-1">Tu asistente de finanzas</p>
        </div>
        {children}
      </div>
    </main>
  );
}
