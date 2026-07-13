"use client";

import React, { Suspense } from "react";
import { Toaster } from "sonner";
import { SWRConfig } from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import { ThemeProvider } from "next-themes";

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Suspense>
        <SWRConfig value={{ fetcher }}>
          {children}
          <Toaster position="top-center" richColors />
        </SWRConfig>
      </Suspense>
    </ThemeProvider>
  );
}

export default Providers;
