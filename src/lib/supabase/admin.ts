/**
 * Admin Supabase client (service_role).
 *
 * ⚠️ SÓ USAR SERVER-SIDE: route handlers, server actions, server components.
 * Nunca importar em componente client — vaza a service_role key.
 *
 * Diferenças vs. createClient (lib/supabase/server.ts):
 * - Usa SUPABASE_SERVICE_ROLE_KEY (bypassa RLS)
 * - Sem cookies/sessão (stateless)
 * - Permite usar supabase.auth.admin.* (createUser, listUsers, generateLink)
 */
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
