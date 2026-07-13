# Database Architecture Reference

## Estrutura de arquivos

```
supabase/
└── migrations/
    └── 0001_init.sql       # Tabela profiles + RLS + triggers
src/lib/supabase/
    ├── client.ts           # Browser (singleton)
    ├── server.ts           # Server-side (cookies)
    ├── admin.ts            # Service role (bypassa RLS)
    └── middleware.ts       # Renova sessão no proxy.ts
```

## Tabela profiles — schema completo

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  subscription_status text,     -- active | canceled | past_due | incomplete | null
  subscription_provider text,   -- stripe | digitalmanager | null
  stripe_customer_id text,
  stripe_subscription_id text,
  dmg_subscription_id text,
  plan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

O trigger `on_auth_user_created` insere automaticamente um profile quando um usuário se cadastra no Supabase Auth.

## Patterns de query

### Ler o profile do usuário logado (server)
```typescript
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
const { data: profile } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", user!.id)
  .single();
```

### Atualizar profile pelo webhook (admin — bypassa RLS)
```typescript
import { createAdminClient } from "@/lib/supabase/admin";

const admin = createAdminClient();
await admin
  .from("profiles")
  .update({ subscription_status: "active", plan: "pro", subscription_provider: "stripe" })
  .eq("stripe_customer_id", customerId);
```

### Select com join (Supabase embedded select)
```typescript
const { data } = await supabase
  .from("posts")
  .select("id, title, profiles(email, full_name)")
  .eq("user_id", user.id);
```

## Índices recomendados

Adicione na migration SQL de cada tabela:

```sql
-- FK columns
create index posts_user_id_idx on public.posts(user_id);

-- Colunas de filtro frequente
create index profiles_email_idx on public.profiles(email);
create index profiles_stripe_customer_id_idx on public.profiles(stripe_customer_id);
create index profiles_dmg_subscription_id_idx on public.profiles(dmg_subscription_id);
```

## Row Level Security — padrões

### Política padrão (usuário acessa só os próprios)
```sql
alter table public.my_table enable row level security;

create policy "my_table: select" on public.my_table
  for select using (auth.uid() = user_id);

create policy "my_table: insert" on public.my_table
  for insert with check (auth.uid() = user_id);

create policy "my_table: update" on public.my_table
  for update using (auth.uid() = user_id);

create policy "my_table: delete" on public.my_table
  for delete using (auth.uid() = user_id);
```

### Tabela somente-leitura pública
```sql
create policy "public_read" on public.my_table
  for select using (true);
```

### Escrita privilegiada (só service_role via webhooks)
Não crie policies de insert/update para o usuário comum. O admin client bypassa o RLS automaticamente.

## Trigger updated_at automático

```sql
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger my_table_updated_at
  before update on public.my_table
  for each row execute function public.handle_updated_at();
```

## Comandos úteis

```bash
# Aplicar todas as migrations ao Supabase local ou remoto
supabase db push

# Gerar migration a partir do schema diff
supabase db diff -f minha_migration

# Reset local (destrói dados)
supabase db reset
```

## Boas práticas
- **Normalization**: 3NF por padrão. Use JSONB só para dados genuinamente não estruturados.
- **IDs**: `uuid primary key default gen_random_uuid()`.
- **Timestamps**: `timestamptz not null default now()` em ambos `created_at` e `updated_at`.
- **RLS sempre**: habilitar imediatamente após `create table`.
- **Admin client**: usar só em server actions privilegiados e webhooks — nunca expor no client.
