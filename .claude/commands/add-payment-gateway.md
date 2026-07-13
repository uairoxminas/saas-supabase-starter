---
name: add-payment-gateway
description: Guide for integrating a new payment gateway (Stripe or Digital Manager Guru) into the boilerplate. Updates profiles, webhooks, and checkout flows.
---

# Add Payment Gateway Command

Use este guia para integrar ou customizar um gateway de pagamento. O boilerplate já suporta **Stripe** e **Digital Manager Guru (DMG)** — use este comando para configurar do zero ou estender o que existe.

## Gateways suportados

| Gateway | Skill | Webhook |
|---|---|---|
| Stripe | `stripe-handler` | `src/app/api/webhooks/stripe/route.ts` |
| Digital Manager Guru | `digitalmanager-handler` | `src/app/api/webhooks/digitalmanager/route.ts` |

## 1. Habilitar o gateway em config.ts

```typescript
// src/lib/config.ts
payments: {
  stripe: true,
  digitalManagerGuru: true,
},
```

## 2. Configurar variáveis de ambiente

### Stripe
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_ID=price_...
```

### Digital Manager Guru
```env
DIGITALMANAGER_WEBHOOK_TOKEN=...
DIGITALMANAGER_API_TOKEN=...
```

## 3. Checkout (criar sessão)

### Stripe
Crie uma API route ou Server Action que chama `stripe.checkout.sessions.create`.
Consulte `stripe-handler/SKILL.md` e `stripe-handler/reference.md`.

### Digital Manager Guru
O checkout é feito diretamente no painel do DM Guru (link de vendas). Não há sessão criada pelo backend — o acesso é concedido via webhook após a compra.

## 4. Webhook — efeito em `public.profiles`

Ambos os gateways atualizam as mesmas colunas em `profiles`:

| Coluna | Stripe | DMG |
|---|---|---|
| `subscription_status` | `active` / `canceled` / `past_due` / `incomplete` | `active` / `canceled` / `refunded` |
| `subscription_provider` | `"stripe"` | `"digitalmanager"` |
| `stripe_customer_id` | ID do customer Stripe | — |
| `stripe_subscription_id` | ID da subscription Stripe | — |
| `dmg_subscription_id` | — | ID da subscription DMG |
| `plan` | (preenchido manualmente, ver stripe-handler) | recorrência inferida ou productId |

## 5. Verificar acesso em rotas protegidas

```typescript
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
const { data: profile } = await supabase
  .from("profiles")
  .select("subscription_status, plan")
  .eq("id", user.id)
  .single();

if (profile?.subscription_status !== "active") {
  return NextResponse.json({ error: "Subscription required" }, { status: 403 });
}
```

## 6. Portal de billing / cancelamento

### Stripe
```typescript
const session = await stripe.billingPortal.sessions.create({
  customer: profile.stripe_customer_id,
  return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings`,
});
redirect(session.url);
```

### Digital Manager Guru
```typescript
import { cancelDigitalManagerSubscription } from "@/lib/payments/digitalmanager-gateway";
await cancelDigitalManagerSubscription(profile.dmg_subscription_id);
// O webhook de cancelamento chegará e atualizará o profiles automaticamente
```

## 7. Testar localmente

### Stripe
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger checkout.session.completed
stripe trigger customer.subscription.deleted
```

### Digital Manager Guru
```bash
curl -X POST http://localhost:3000/api/webhooks/digitalmanager \
  -H "Content-Type: application/json" \
  -d '{"api_token":"seu_token","id":"sub_test","webhook_type":"subscription","last_status":"active","subscriber":{"email":"test@test.com","name":"Test"},"product":{"id":"prod_abc"}}'
```

## Checklist Final

- [ ] Variáveis de ambiente configuradas no `.env.local`?
- [ ] `config.ts` com `payments.stripe` / `payments.digitalManagerGuru` habilitados?
- [ ] Webhook testado (grant + revoke)?
- [ ] Checkout redireciona corretamente?
- [ ] `profiles.subscription_status` atualiza após compra e cancelamento?
- [ ] Rotas premium verificam `subscription_status === "active"`?
