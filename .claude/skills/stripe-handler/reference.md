# Stripe Payment Reference

## Arquivos-chave

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/stripe/index.ts` | Inicializa o client Stripe (exporta `stripe` e default) |
| `src/app/api/webhooks/stripe/route.ts` | Handler de eventos Stripe |
| `src/lib/supabase/admin.ts` | Admin client para atualizar `profiles` no webhook |
| `src/lib/types.ts` | Interface `Profile` com campos de billing |

## Criando sessão de checkout

### Assinatura (subscription)
```typescript
import { stripe } from "@/lib/stripe";

const session = await stripe.checkout.sessions.create({
  mode: "subscription",
  customer_email: user.email,
  metadata: { userId: user.id, plan: "pro" },
  line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
  success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app?subscribed=1`,
  cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
  subscription_data: {
    metadata: { userId: user.id },
  },
});

return Response.redirect(session.url!);
```

### One-time payment
```typescript
const session = await stripe.checkout.sessions.create({
  mode: "payment",
  customer_email: user.email,
  metadata: { userId: user.id, type: "lifetime" },
  line_items: [{ price: process.env.STRIPE_LIFETIME_PRICE_ID!, quantity: 1 }],
  success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app?purchased=1`,
  cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
});
```

## Webhook — padrão de update no profiles

```typescript
import { createAdminClient } from "@/lib/supabase/admin";

const supabase = createAdminClient();

// Atualiza por stripe_customer_id (preferido) ou email (fallback)
await supabase
  .from("profiles")
  .update({
    subscription_status: "active",
    subscription_provider: "stripe",
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    plan: "pro",
  })
  .eq("stripe_customer_id", customerId);
```

## Portal de billing

```typescript
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return Response.json({ error: "No Stripe customer" }, { status: 400 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings`,
  });

  redirect(session.url);
}
```

## Ambiente e teste local

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # gerado pelo `stripe listen`
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_ID=price_...
```

```bash
# Escutar eventos locais
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Disparar evento de teste
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

## Mapeamento de status Stripe → profiles

| Status Stripe | `subscription_status` em profiles |
|---|---|
| `active` / `trialing` | `active` |
| `canceled` / `unpaid` | `canceled` |
| `past_due` | `past_due` |
| `incomplete` / `incomplete_expired` | `incomplete` |
