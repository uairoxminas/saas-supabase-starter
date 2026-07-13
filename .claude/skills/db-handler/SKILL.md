---
name: db-handler
description: Manage database with Supabase (PostgreSQL + RLS). Use when creating tables, modifying columns, writing migrations SQL, or working with profiles and Row Level Security.
tools: Read, Write, Edit
model: inherit
---

# Database Handler

## Stack
**Supabase (PostgreSQL)** com Row Level Security. Sem Drizzle ORM, sem `pg` direto.
- Acesso via `@supabase/ssr` (client/server/admin) conforme o contexto.
- Migrations em `supabase/migrations/*.sql` — rodar via `supabase db push` ou SQL Editor.
- Tabela base: `public.profiles` (1:1 com `auth.users`).

## Instructions

### 1. Criar uma nova tabela
1. **Escreva a migration SQL** em `supabase/migrations/{numero}_{nome}.sql`.
2. **Inclua obrigatoriamente**: `id uuid primary key`, `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()`.
3. **Habilite RLS** imediatamente após criar a tabela.
4. **Defina policies** — mínimo: usuário lê/escreve só os próprios registros.
5. **Lembre ao usuário** de rodar: `supabase db push` ou colar no SQL Editor.

```sql
-- supabase/migrations/0002_posts.sql
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS obrigatório
alter table public.posts enable row level security;

create policy "Posts: usuário lê os próprios"
  on public.posts for select
  using (auth.uid() = user_id);

create policy "Posts: usuário cria os próprios"
  on public.posts for insert
  with check (auth.uid() = user_id);

create policy "Posts: usuário atualiza os próprios"
  on public.posts for update
  using (auth.uid() = user_id);

create policy "Posts: usuário deleta os próprios"
  on public.posts for delete
  using (auth.uid() = user_id);
```

### 2. Escolher o cliente correto

| Contexto | Cliente | RLS |
|---|---|---|
| Client Component / browser | `createClient()` de `@/lib/supabase/client` | Respeitado |
| Server Component / Route Handler (usuário) | `createClient()` de `@/lib/supabase/server` | Respeitado |
| Webhook / server action privilegiado | `createAdminClient()` de `@/lib/supabase/admin` | Bypassa |

### 3. Queries com Supabase client

```typescript
// Leitura (server-side, RLS ativa)
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
const { data, error } = await supabase
  .from("posts")
  .select("id, title, created_at")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });

// Inserção
const { data: post, error } = await supabase
  .from("posts")
  .insert({ title: "Novo post", user_id: user.id })
  .select()
  .single();

// Admin (bypassa RLS — só webhooks/server actions privilegiados)
import { createAdminClient } from "@/lib/supabase/admin";
const admin = createAdminClient();
await admin.from("profiles").update({ plan: "pro" }).eq("id", userId);
```

### 4. Modificar colunas existentes
- Prefira adicionar colunas **nullable** ou com **default**.
- Evite `ALTER COLUMN ... NOT NULL` sem default em tabelas com dados.
- Confirme antes de `DROP COLUMN`.

### 5. Tabela `public.profiles`
Fonte de verdade do usuário. Colunas relevantes:

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `uuid` | FK para `auth.users.id` |
| `email` | `text` | Email do usuário |
| `full_name` | `text` | Nome completo |
| `subscription_status` | `text` | `active` / `canceled` / `past_due` / `incomplete` / `null` |
| `subscription_provider` | `text` | `stripe` / `digitalmanager` / `null` |
| `stripe_customer_id` | `text` | ID do customer na Stripe |
| `stripe_subscription_id` | `text` | ID da assinatura na Stripe |
| `dmg_subscription_id` | `text` | ID de assinatura no Digital Manager Guru |
| `plan` | `text` | Identificador do plano atual |

## Reference
Para padrões avançados, índices e exemplos completos, veja [reference.md](reference.md).
