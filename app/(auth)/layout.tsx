import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <nav className="px-8 py-6">
        <Link href="/" className="text-sm font-semibold text-foreground tracking-tight">
          Luca
        </Link>
      </nav>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </main>
  );
}
