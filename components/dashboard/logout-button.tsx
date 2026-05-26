"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center gap-2 text-sm text-destructive hover:opacity-70 transition-opacity disabled:opacity-40 font-medium"
    >
      <LogOut size={14} strokeWidth={1.5} />
      {loading ? "Cerrando sesión..." : "Cerrar sesión"}
    </button>
  );
}
