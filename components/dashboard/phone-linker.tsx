"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface PhoneLinkerProps {
  userId: string;
  hasPhone: boolean;
}

export function PhoneLinker({ userId, hasPhone }: PhoneLinkerProps) {
  useEffect(() => {
    if (hasPhone) return;

    const pending = localStorage.getItem("luca_pending_phone");
    if (!pending) return;

    const supabase = createClient();
    supabase
      .from("users")
      .update({ phone_number: pending })
      .eq("id", userId)
      .then(({ error }) => {
        if (!error) localStorage.removeItem("luca_pending_phone");
      });
  }, [userId, hasPhone]);

  return null;
}
