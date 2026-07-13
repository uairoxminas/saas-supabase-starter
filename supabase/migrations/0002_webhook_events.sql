-- ─────────────────────────────────────────────────────────────
-- Log de eventos de webhook — idempotência + auditoria.
--
-- Por que existe: um gateway reenvia o mesmo evento quando não recebe 200
-- (timeout, deploy no meio do caminho, erro transitório). Sem esta tabela,
-- o reenvio reprocessa a concessão de acesso às cegas e não sobra rastro
-- nenhum pra investigar um pagamento que não provisionou.
--
-- A unique (provider, event_id) é o que garante a idempotência. O parser da
-- DM Guru já monta um event_id único por TRANSIÇÃO de estado (id + timestamp
-- do último status), então uma mesma assinatura pode gerar vários eventos
-- legítimos sem colidir aqui. A Stripe já entrega um event.id único.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.webhook_events (
  id bigint generated always as identity primary key,

  provider text not null,                    -- stripe | digitalmanager
  event_id text not null,                    -- ID do evento no provedor
  event_type text,                           -- ex: subscription.active
  status text not null default 'processing', -- processing | processed | failed
  error text,                                -- mensagem, quando status = failed
  payload jsonb,                             -- payload recebido (segredos redigidos)

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint webhook_events_provider_event_id_key unique (provider, event_id)
);

create index if not exists webhook_events_created_at_idx
  on public.webhook_events (created_at desc);

create index if not exists webhook_events_status_idx
  on public.webhook_events (status)
  where status <> 'processed';

drop trigger if exists webhook_events_updated_at on public.webhook_events;
create trigger webhook_events_updated_at
  before update on public.webhook_events
  for each row execute function public.handle_updated_at();

-- ── Row Level Security ──────────────────────────────────────
-- RLS ligado SEM nenhuma policy: ninguém acessa via anon/authenticated.
-- Só o service_role (que bypassa RLS) escreve aqui, a partir dos webhooks.
alter table public.webhook_events enable row level security;
