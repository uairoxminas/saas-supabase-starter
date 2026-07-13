import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next 16 usa `proxy.ts` no lugar do antigo `middleware.ts`.
// Toda request passa por aqui: a sessão Supabase é renovada e as rotas
// privadas são protegidas em lib/supabase/middleware.ts.
export async function proxy(req: NextRequest) {
  return await updateSession(req);
}

export const config = {
  matcher: [
    /*
     * Roda em tudo, menos assets estáticos e arquivos de imagem.
     * Importante para manter a sessão Supabase sempre fresca.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
