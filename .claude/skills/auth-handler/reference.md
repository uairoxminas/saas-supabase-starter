# Auth Architecture Reference

## Arquivos-chave

| Arquivo | Responsabilidade |
|---|---|
| `src/proxy.ts` | Entry point do middleware (Next 16). Chama `updateSession`. |
| `src/lib/supabase/middleware.ts` | Renova sessão + protege `/app/*` e `/api/app/*`. |
| `src/lib/supabase/client.ts` | Singleton browser (`createBrowserClient`). |
| `src/lib/supabase/server.ts` | Cliente server-side com cookies (`createServerClient`). |
| `src/lib/supabase/admin.ts` | Cliente com `service_role` — bypassa RLS. Só server. |
| `src/lib/auth/withAuthRequired.ts` | Wrapper de API Routes que valida a sessão. |
| `src/lib/users/useUser.ts` | Hook SWR (`/api/app/me`) que retorna `Profile`. |
| `src/app/api/app/me/route.ts` | Retorna o profile do usuário logado. |

## Padrões de uso

### Server Component
```typescript
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // Buscar profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return <div>{profile?.full_name}</div>;
}
```

### API Route protegida
```typescript
import withAuthRequired from "@/lib/auth/withAuthRequired";
import { NextResponse } from "next/server";

export const GET = withAuthRequired(async (req, { user, supabase }) => {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return NextResponse.json(data);
});
```

### Client Component
```typescript
"use client";
import useUser from "@/lib/users/useUser";

export function Header() {
  const { user, isLoading } = useUser();
  if (isLoading) return null;
  return <span>{user?.email}</span>;
}
```

### Magic Link (sign-in sem senha)
```typescript
const supabase = createClient(); // browser
await supabase.auth.signInWithOtp({
  email,
  options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
});
```

### OAuth Google
```typescript
await supabase.auth.signInWithOAuth({
  provider: "google",
  options: { redirectTo: `${window.location.origin}/auth/callback` },
});
```

### Sign Out
```typescript
await supabase.auth.signOut();
router.push("/sign-in");
```

## Variáveis de ambiente necessárias

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # só server, nunca expor no client
```

## Troubleshooting

| Problema | Causa | Solução |
|---|---|---|
| `Lock sb-auth-auth-token was released because another request stole it` | Múltiplos clientes browser criados por componente | Usar o singleton em `client.ts` — não chamar `createBrowserClient` diretamente |
| 401 em `/api/app/*` | Cookie de sessão expirado ou não enviado | Verificar que `proxy.ts` está rodando e `updateSession` renova o token |
| Redirect loop em `/sign-in` | `proxy.ts` não excluindo assets estáticos no matcher | Conferir o `matcher` em `proxy.ts` — deve excluir `_next/static`, `_next/image`, etc. |
| OAuth não funciona | Provider Google não ativo no Supabase | Habilitar em Supabase Dashboard → Auth → Providers → Google |
