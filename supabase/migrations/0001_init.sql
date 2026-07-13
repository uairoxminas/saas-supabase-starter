-- ─────────────────────────────────────────────────────────────
-- Boilerplate base — tabela de perfis (1:1 com auth.users)
-- Rode no SQL Editor do Supabase OU via `supabase db push`.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,

  -- Assinatura / billing
  --
  -- subscription_status — vocabulário FECHADO. Quem grava:
  --   active     → Stripe (active/trialing) e DM Guru (grant)
  --   canceled   → Stripe (canceled/unpaid) e DM Guru (cancelamento)
  --   past_due   → Stripe
  --   incomplete → Stripe
  --   refunded   → DM Guru (estorno ou chargeback)
  --   null       → nunca assinou
  -- Regra prática: acesso liberado somente quando status = 'active'.
  subscription_status text,
  subscription_provider text,               -- stripe | digitalmanager | null
  stripe_customer_id text,
  stripe_subscription_id text,
  dmg_subscription_id text,
  plan text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── updated_at automático ───────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- ── Cria profile automaticamente quando um usuário se cadastra ─
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Row Level Security ──────────────────────────────────────
alter table public.profiles enable row level security;

drop policy if exists "Profiles: usuário lê o próprio" on public.profiles;
create policy "Profiles: usuário lê o próprio"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Profiles: usuário atualiza o próprio" on public.profiles;
create policy "Profiles: usuário atualiza o próprio"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Escrita de billing (subscription_*, stripe_*, dmg_*) é feita pelo
-- service_role nos webhooks, que bypassa RLS — por isso não há policy de insert
-- pública aqui (o insert vem do trigger handle_new_user com security definer).
