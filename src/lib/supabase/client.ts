import { createBrowserClient } from "@supabase/ssr";

// Singleton: uma única instância no browser. Criar várias (uma por componente)
// faz as instâncias disputarem o lock do auth token
// ("Lock sb-auth-auth-token was released because another request stole it").
let browserClient: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (browserClient) return browserClient;

  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  return browserClient;
}
