import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Route Handler do callback OAuth / magic link / link de recuperação.
// O Supabase redireciona para cá com um `code` na query, que trocamos
// por uma sessão (cookies) antes de mandar o usuário para o destino final.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/app";

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=auth`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/sign-in?error=auth`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
