---
name: auth-handler
description: Manage authentication, authorization, and user sessions with Supabase Auth. Use when dealing with login, sign-up, API protection, proxy.ts, magic link, OAuth, or server-side user fetching.
tools: Read, Write, Edit
model: inherit
---

# Auth Handler

## Stack
**Supabase Auth** via `@supabase/ssr`. Sem NextAuth, sem JWT customizado.
- Sessão armazenada em cookies, renovada automaticamente pelo `proxy.ts`.
- Tabela `public.profiles` espelha `auth.users` (1:1) com dados de billing.

## Instructions

### 1. Proteção de API Routes
Use `withAuthRequired` em todas as rotas autenticadas em `src/app/api/app/`.

```typescript
import withAuthRequired from "@/lib/auth/withAuthRequired";

export const GET = withAuthRequired(async (req, { user, supabase }) => {
  // user: User do Supabase Auth
  // supabase: cliente server-side com a sessão do usuário
  return NextResponse.json({ userId: user.id });
});
```

- **Nunca** dependa só do `proxy.ts`. Cada rota deve validar a sessão.
- Para rotas públicas não use o wrapper.

### 2. Acesso no Frontend (Client Components)
Use o hook `useUser()` que faz SWR em `/api/app/me` e retorna o `Profile`.

```typescript
import useUser from "@/lib/users/useUser";

export default function MyComponent() {
  const { user, isLoading } = useUser();
  if (isLoading) return <Spinner />;
  return <p>{user?.email}</p>;
}
```

Nunca importe nada de `next-auth/react` — não existe mais no projeto.

### 3. Acesso Server-Side (Server Components / Route Handlers)
```typescript
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect("/sign-in");
```

Para bypassar RLS (apenas webhooks e server actions privilegiados):
```typescript
import { createAdminClient } from "@/lib/supabase/admin";
const supabase = createAdminClient();
```

### 4. Fluxos de Auth suportados
| Fluxo | Como acionar |
|---|---|
| Magic Link | `supabase.auth.signInWithOtp({ email })` |
| Email + Senha | `supabase.auth.signInWithPassword({ email, password })` — requer `enablePasswordAuth: true` em `config.ts` |
| OAuth Google | `supabase.auth.signInWithOAuth({ provider: "google" })` — requer provider Google ativo no Supabase |
| Sign Out | `supabase.auth.signOut()` |

### 5. Proteção de rotas (proxy.ts)
O `src/proxy.ts` chama `updateSession` em `src/lib/supabase/middleware.ts`:
- `/app/*` e `/api/app/*` → exige login (redireciona para `/sign-in` ou retorna 401).
- `/sign-in`, `/sign-up` → se já logado, redireciona para `/app`.

## Reference
Para arquivos-chave, padrões completos e troubleshooting, veja [reference.md](reference.md).
