import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresca a sessão Supabase e protege rotas.
 *
 * - `/app/*` e `/api/app/*`: exigem login (redireciona p/ /sign-in ou 401).
 * - `/sign-in`, `/sign-up`: se já logado, manda pro /app.
 *
 * Chamada a partir do `proxy.ts` (Next 16). É aqui que a sessão é renovada
 * a cada request — não remova a chamada a `getUser()`.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const isAuthPage =
    pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");
  const isAppRoute = pathname.startsWith("/app");
  const isAppApi = pathname.startsWith("/api/app");

  // API protegida sem sessão → 401
  if (!user && isAppApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Página privada sem sessão → /sign-in
  if (!user && isAppRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = "";
    url.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(url);
  }

  // Já logado em página de auth → /app
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
