---
name: stripe-handler
description: Handle Stripe payments, checkout sessions, subscriptions, and webhook fulfillment. Updates public.profiles (subscription_status, plan, stripe_customer_id) via Supabase admin client.
deps: ["db-handler", "auth-handler"]
---

# Stripe Handler

## Stack
**Stripe** + **Supabase** (`public.profiles`). Sem Drizzle, sem sistema de créditos/planos separado.
- Billing salvo direto em `profiles`: `subscription_status`, `plan`, `stripe_customer_id`, `stripe_subscription_id`.
- Webhook em `src/app/api/webhooks/stripe/route.ts` — usa `createAdminClient()` para bypassar RLS.

## Quando usar
- Criar sessão de checkout (assinatura ou one-time).
- Tratar eventos do webhook Stripe.
- Atualizar campos de billing no `profiles`.
- Customizar `src/app/api/webhooks/stripe/route.ts` para novos eventos.

## Processo

### 1. Criar sessão de checkout (server action ou API route)
```typescript
import { stripe } from "@/lib/stripe";

const session = await stripe.checkout.sessions.create({
  mode: "subscription", // ou "payment" para one-time
  customer_email: user.email,
  metadata: {
    userId: user.id,
    plan: "pro",             // identifica o plano no webhook
  },
  line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
  success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/subscribe/error`,
});

return session.url;
```

### 2. Webhook — arquitetura
O arquivo `src/app/api/webhooks/stripe/route.ts` trata:

| Evento | Ação em `profiles` |
|---|---|
| `checkout.session.completed` (mode=subscription) | `subscription_status = active`, `stripe_customer_id`, `stripe_subscription_id` |
| `customer.subscription.updated` | Atualiza `subscription_status` mapeado |
| `customer.subscription.deleted` | `subscription_status = canceled` |

Para adicionar um novo evento:
1. Adicione um `case` no `switch(event.type)`.
2. Extraia `event.data.object` com o tipo correto do Stripe.
3. Use `createAdminClient()` para atualizar `profiles`.

### 3. Atualizar o campo `plan` no profiles
O campo `plan` em `profiles` é uma string livre (ex: `"free"`, `"pro"`, `"enterprise"`).
Para manter mapeamento price→plan:

```typescript
const PRICE_TO_PLAN: Record<string, string> = {
  [process.env.STRIPE_PRICE_ID!]: "pro",
};

// No webhook:
const priceId = subscription.items.data[0]?.price.id;
const plan = priceId ? PRICE_TO_PLAN[priceId] ?? null : null;
await admin.from("profiles").update({ plan }).eq("stripe_customer_id", customerId);
```

### 4. Portal do cliente (gerenciar assinatura)
```typescript
const session = await stripe.billingPortal.sessions.create({
  customer: profile.stripe_customer_id,
  return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings`,
});
redirect(session.url);
```

### 5. Idempotência
O webhook pode ser disparado mais de uma vez. O `UPDATE` no Supabase por `stripe_customer_id` já é idempotente — repetir não duplica dados. Para one-time payments, verifique antes se `payment_intent_id` já foi processado.

## Boas práticas
- **Body cru**: sempre use `await req.text()` antes de `stripe.webhooks.constructEvent` — nunca `req.json()`.
- **Segredo obrigatório**: valide `STRIPE_WEBHOOK_SECRET` em todo ambiente.
- **Admin client**: use `createAdminClient()` nos webhooks para atualizar `profiles` sem política RLS bloqueando.
- **CLI local**: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

## Reference
Veja [reference.md](reference.md) para snippets de criação de sessão, webhook e portal.
