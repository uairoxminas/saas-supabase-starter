import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Client Supabase para uso server-side (Server Components, Route Handlers,
// Server Actions). Lê/escreve a sessão via cookies da request.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Chamado de um Server Component: o proxy/middleware cuida do refresh.
          }
        },
      },
    },
  );
}
