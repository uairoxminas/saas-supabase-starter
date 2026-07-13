"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaSpinner } from "react-icons/fa";
import { createClient } from "@/lib/supabase/client";

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    const signOut = async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    };

    signOut();
  }, [router]);

  return (
    <div className="h-full flex flex-col items-center justify-center py-10 space-y-4">
      <FaSpinner className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Saindo...</p>
    </div>
  );
}
