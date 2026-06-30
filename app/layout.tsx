import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono, Space_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display / "receipt register" voice — used for headlines and receipt labels
const spaceMono = Space_Mono({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Luca — Tu asistente de finanzas",
  description: "Maneja tu plata de forma sencilla por WhatsApp. Luca registra tus gastos, controla tus presupuestos y te ayuda a ahorrar.",
  // Disable iOS Safari data detectors (phone, date, address, name → contact)
  // that auto-underline text like names with a dotted link style
  other: {
    "format-detection": "telephone=no, date=no, address=no, email=no, url=no",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${plusJakarta.variable} ${geistMono.variable} ${spaceMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
