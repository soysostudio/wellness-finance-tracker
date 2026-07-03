import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Luca — Tu asistente de finanzas",
    short_name: "Luca",
    description: "Maneja tu plata de forma sencilla por WhatsApp. Luca registra tus gastos, controla tus presupuestos y te ayuda a ahorrar.",
    start_url: "/overview",
    display: "standalone",
    background_color: "#F4F4EF",
    theme_color: "#1A1D1C",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
