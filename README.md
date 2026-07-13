# SaaS Supabase Starter

Boilerplate Next.js para SaaS com Supabase Auth, Stripe e Digital Manager Guru. Pronto para deploy no Vercel.

## Stack

- **Next.js 16** — App Router, `proxy.ts` como middleware
- **React 19** + TypeScript + Tailwind CSS 4
- **shadcn/ui** — componentes acessíveis
- **Supabase** — Auth + PostgreSQL + RLS
- **Stripe** — checkout, assinaturas, webhook
- **Digital Manager Guru** — gateway de pagamento alternativo

## Features

- Auth completo: magic link, email+senha, OAuth Google
- Tabela `profiles` 1:1 com `auth.users`, criada automaticamente via trigger
- Webhooks para Stripe e Digital Manager Guru — atualizam `profiles` com status de billing
- `withAuthRequired` wrapper para proteger API routes
- Hook `useUser()` para Client Components
- `CLAUDE.md` com instruções para desenvolvimento com Claude Code

## Quick Start

```bash
# 1. Instalar dependências
pnpm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com seus valores

# 3. Criar projeto Supabase e aplicar a migration
# Opção A — SQL Editor do Supabase: cole o conteúdo de supabase/migrations/0001_init.sql
# Opção B — CLI:
supabase db push

# 4. Rodar em desenvolvimento
pnpm dev
```

## Variáveis de ambiente

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_ID=

# Digital Manager Guru
DIGITALMANAGER_WEBHOOK_TOKEN=
DIGITALMANAGER_API_TOKEN=
```

## Estrutura

```
src/
├── app/
│   ├── (website-layout)/    # Landing page, pricing
│   ├── (in-app)/app/        # Dashboard autenticado
│   ├── (auth)/              # Sign-in, sign-up
│   └── api/
│       ├── app/             # APIs autenticadas
│       └── webhooks/        # stripe/ e digitalmanager/
├── lib/
│   ├── supabase/            # client | server | admin | middleware
│   ├── stripe/              # Client Stripe
│   ├── payments/            # DMG: events, gateway, provisioning
│   └── auth/                # withAuthRequired
├── proxy.ts                 # Middleware (Next 16)
supabase/
└── migrations/0001_init.sql # profiles + RLS + triggers
```

## Deploy — Vercel + Supabase

1. Crie um projeto no [Supabase](https://supabase.com) e aplique a migration.
2. Importe o repositório no [Vercel](https://vercel.com) — detecta Next.js automaticamente.
3. Configure as variáveis de ambiente no painel Vercel.
4. Registre os endpoints de webhook:
   - Stripe Dashboard → `https://seu-dominio.com/api/webhooks/stripe`
   - Digital Manager Guru → `https://seu-dominio.com/api/webhooks/digitalmanager`

## Teste de webhooks local

```bash
# Stripe
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Digital Manager Guru
curl -X POST http://localhost:3000/api/webhooks/digitalmanager \
  -H "Content-Type: application/json" \
  -d '{"api_token":"seu_token","id":"sub_test","webhook_type":"subscription","last_status":"active","subscriber":{"email":"test@test.com","name":"Test"},"product":{"id":"prod_abc"}}'
```

## License

[Custom License](License.md)
