# CLAUDE.md

Guia do projeto para o Claude Code operar neste boilerplate Next.js SaaS.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router, `proxy.ts` como middleware) |
| UI | React 19, Tailwind CSS 4, shadcn/ui |
| Linguagem | TypeScript estrito, alias `@/` = `src/` |
| Auth + DB | Supabase (`@supabase/ssr`) |
| Pagamentos | Stripe + Digital Manager Guru |
| Runtime | Node.js (webhooks) / Edge (páginas) |

**Removidos do stack original:** NextAuth, Drizzle ORM, Neon/pg, Inngest, AWS S3/SES, React Email, Fumadocs/docs, blog, super-admin, créditos, planos, Sentry, Crisp, OpenAI, Replicate, Polar, Paddle, LemonSqueezy.

## Estrutura de pastas

```
src/
├── app/
│   ├── (website-layout)/       # Páginas públicas (landing, pricing)
│   ├── (in-app)/app/           # Páginas autenticadas do usuário
│   ├── (auth)/                 # sign-in, sign-up
│   └── api/
│       ├── app/                # APIs autenticadas (ex: /api/app/me)
│       ├── public/             # APIs públicas
│       └── webhooks/
│           ├── stripe/         # Webhook Stripe
│           └── digitalmanager/ # Webhook Digital Manager Guru
├── components/
│   ├── ui/                     # Átomos Shadcn
│   └── sections/               # Blocos de layout
├── lib/
│   ├── auth/withAuthRequired.ts
│   ├── supabase/               # client | server | admin | middleware
│   ├── stripe/                 # Client Stripe
│   ├── payments/               # DMG: events, gateway, provisioning
│   ├── users/useUser.ts        # Hook SWR → /api/app/me
│   ├── config.ts               # Config pública do app
│   └── types.ts                # AppConfigPublic, Profile, MeResponse
├── proxy.ts                    # Middleware Next 16 (chama updateSession)
supabase/
└── migrations/
    └── 0001_init.sql           # Tabela profiles + RLS + triggers
```

## Como rodar

```bash
# 1. Instalar dependências
pnpm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# Preencha .env.local com os valores reais (veja seção de env vars abaixo)

# 3. Criar projeto no Supabase e aplicar migration
#    - Crie um projeto em https://supabase.com
#    - Cole o conteúdo de supabase/migrations/0001_init.sql no SQL Editor, OU
supabase db push

# 4. Rodar em desenvolvimento
pnpm dev
```

## Variáveis de ambiente

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # só server-side, nunca expor no client

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_ID=price_...

# Digital Manager Guru
DIGITALMANAGER_WEBHOOK_TOKEN=...
DIGITALMANAGER_API_TOKEN=...
```

## Convenções

### Supabase: qual cliente usar?

| Contexto | Import | RLS |
|---|---|---|
| Client Component / browser | `@/lib/supabase/client` → `createClient()` | Respeitado |
| Server Component / Route Handler | `@/lib/supabase/server` → `createClient()` | Respeitado |
| Webhook / ação privilegiada | `@/lib/supabase/admin` → `createAdminClient()` | Bypassa |

### proxy.ts (middleware)
O arquivo `src/proxy.ts` é o ponto de entrada de todas as requests (Next 16 usa `proxy.ts` no lugar de `middleware.ts`). Ele chama `updateSession` em `src/lib/supabase/middleware.ts`, que:
- Renova o token de sessão Supabase a cada request.
- Redireciona `/app/*` e `/api/app/*` sem sessão para `/sign-in` (ou 401).
- Redireciona usuários já logados que acessam `/sign-in` ou `/sign-up` para `/app`.

### Proteção de API Routes
Toda rota em `src/app/api/app/` deve usar `withAuthRequired`:

```typescript
import withAuthRequired from "@/lib/auth/withAuthRequired";
export const GET = withAuthRequired(async (req, { user, supabase }) => { ... });
```

### Tabela `public.profiles`
Espelha `auth.users` (1:1). Criada automaticamente pelo trigger `handle_new_user` ao signup.
Campos de billing (`subscription_status`, `plan`, `stripe_*`, `dmg_*`) são atualizados pelos webhooks usando o admin client (service_role bypassa RLS).

### Hook `useUser()`
Para Client Components, use `useUser()` de `src/lib/users/useUser.ts`. Faz SWR em `/api/app/me` e retorna o `Profile` completo.

## Pagamentos

### Stripe
- Webhook: `src/app/api/webhooks/stripe/route.ts`
- Trata: `checkout.session.completed` (subscription), `customer.subscription.updated`, `customer.subscription.deleted`
- Skill: `stripe-handler`

### Digital Manager Guru
- Webhook: `src/app/api/webhooks/digitalmanager/route.ts`
- Autenticação: campo `api_token` no body validado contra `DIGITALMANAGER_WEBHOOK_TOKEN`
- Trata: `transaction.approved` (grant), `subscription.active/started/renewed` (grant), `subscription.canceled` (revoke), `transaction.refunded/chargeback` (revoke)
- Skill: `digitalmanager-handler`

Ambos atualizam `public.profiles.subscription_status`, `subscription_provider` e o respectivo `*_subscription_id`.

## Skills disponíveis

| Skill | Uso |
|---|---|
| `auth-handler` | Supabase Auth, proxy.ts, withAuthRequired, useUser |
| `db-handler` | Tabelas Supabase, RLS, migrations SQL, profiles |
| `env-handler` | Variáveis de ambiente, .env vs .env.local |
| `stripe-handler` | Checkout Stripe, webhook, portal de billing |
| `digitalmanager-handler` | Webhook DMG, grant/revoke, API REST |
| `ui-handler` | Shadcn MCP, componentes, layouts |
| `theme-handler` | Instalar/trocar temas Shadcn |
| `seo-handler` | Sitemap, metadata, JSON-LD, robots.txt |
| `form-creator` | Formulários react-hook-form + Zod |
| `page-builder` | Montar páginas Next.js |
| `copywriter` | Copy e textos de marketing |

## Commands

| Command | Uso |
|---|---|
| `bootstrap` | Configura o boilerplate para um novo projeto |
| `add-feature` | Adiciona uma nova feature (DB + API + UI) |
| `add-payment-gateway` | Configura ou estende um gateway de pagamento |

## Deploy — Vercel + Supabase

1. Push para GitHub.
2. Import no Vercel → detects Next.js automaticamente.
3. Adicionar todas as variáveis de `NEXT_PUBLIC_*` e segredos no painel Vercel.
4. `NEXT_PUBLIC_APP_URL` = URL de produção do Vercel.
5. `STRIPE_WEBHOOK_SECRET` = registrar o endpoint de produção no Stripe Dashboard.
6. `DIGITALMANAGER_WEBHOOK_TOKEN` = configurar no painel DM Guru.
