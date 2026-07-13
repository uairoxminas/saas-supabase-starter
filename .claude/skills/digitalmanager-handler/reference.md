# Digital Manager Guru — Reference

## Arquivos-chave

| Arquivo | Responsabilidade |
|---|---|
| `src/app/api/webhooks/digitalmanager/route.ts` | Recebe webhooks, valida token, despacha |
| `src/lib/payments/digitalmanager-events.ts` | Parser tolerante do payload cru |
| `src/lib/payments/provisioning.ts` | Regras de negócio: grantAccess / revokeAccess |
| `src/lib/payments/digitalmanager-gateway.ts` | Client HTTP da API REST do DM Guru |
| `src/lib/supabase/admin.ts` | Admin client usado em todos os updates de profiles |

## Payload real do DM Guru (campos relevantes)

```json
{
  "api_token": "seu_token_aqui",
  "id": "sub_xxxxxxxx",
  "webhook_type": "subscription",
  "last_status": "active",
  "subscriber": {
    "email": "usuario@exemplo.com",
    "name": "João Silva"
  },
  "product": {
    "id": "prod_123",
    "internal_id": "uuid-do-produto",
    "name": "Plano Pro"
  },
  "charged_every_days": 30,
  "dates": {
    "cycle_end_date": "2025-08-01T00:00:00Z",
    "canceled_at": null
  },
  "current_invoice": {
    "period_end": "2025-08-01T00:00:00Z"
  }
}
```

Para `webhook_type=transaction`, o status vem em `status` (raiz) ou `last_transaction.status`,
e o email em `last_transaction.contact.email`.

## Testar o webhook localmente

```bash
# 1. Via curl (simula uma compra aprovada)
curl -X POST http://localhost:3000/api/webhooks/digitalmanager \
  -H "Content-Type: application/json" \
  -d '{
    "api_token": "seu_token_aqui",
    "id": "sub_test001",
    "webhook_type": "subscription",
    "last_status": "active",
    "subscriber": { "email": "test@example.com", "name": "Test User" },
    "product": { "id": "prod_abc", "internal_id": "prod_abc", "name": "Pro" },
    "charged_every_days": 30
  }'

# 2. Simula cancelamento
curl -X POST http://localhost:3000/api/webhooks/digitalmanager \
  -H "Content-Type: application/json" \
  -d '{
    "api_token": "seu_token_aqui",
    "id": "sub_test001",
    "webhook_type": "subscription",
    "last_status": "canceled",
    "subscriber": { "email": "test@example.com", "name": "Test User" },
    "product": { "id": "prod_abc" }
  }'
```

## Padrão de atualização do profile (provisioning.ts)

```typescript
// Grant — via admin client (bypassa RLS)
import { createAdminClient } from "@/lib/supabase/admin";
const admin = createAdminClient();

await admin.from("profiles").update({
  subscription_status: "active",
  subscription_provider: "digitalmanager",
  dmg_subscription_id: "sub_xxx",
  plan: "monthly",         // ou "yearly" / productId
}).eq("id", userId);

// Revoke
await admin.from("profiles").update({
  subscription_status: "canceled",
}).eq("dmg_subscription_id", "sub_xxx");
```

## Cancelar assinatura via API

```typescript
import { cancelDigitalManagerSubscription } from "@/lib/payments/digitalmanager-gateway";

// Em uma rota /api/app/subscription (protegida por withAuthRequired)
const result = await cancelDigitalManagerSubscription(
  profile.dmg_subscription_id!,
  { reason: "Usuário solicitou cancelamento" },
);

if (!result.ok) {
  return NextResponse.json({ error: result.error }, { status: 500 });
}
// O webhook de `subscription.canceled` chegará e atualizará o profiles
return NextResponse.json({ ok: true });
```

## Lógica de recorrência inferida

O campo `plan` em `profiles` é preenchido com a recorrência inferida:

| `charged_every_days` | `plan` |
|---|---|
| 25–35 | `monthly` |
| 300–400 | `yearly` |
| null/outro | `productId` do produto |

Também é lido de `next_product.offer.plan.interval_type` = `"month"` / `"year"`.

## Mapeamento de status

| `last_status` / `status` DM Guru | `ParsedEvent.kind` | `subscription_status` em profiles |
|---|---|---|
| `active`, `started`, `renewed`, `trialing` | `access.grant` | `active` |
| `approved` (transaction) | `access.grant` | `active` |
| `canceled`, `cancelled`, `ended`, `expired` | `access.revoke` | `canceled` |
| `refunded` (transaction) | `access.revoke` | `refunded` |
| `chargeback` (transaction) | `access.revoke` | `refunded` |
| `inactive` (sem canceled_at) | `ignored` | — |
| Qualquer outro | `ignored` | — |

## Troubleshooting

| Problema | Causa | Solução |
|---|---|---|
| 401 no webhook | `api_token` do body != `DIGITALMANAGER_WEBHOOK_TOKEN` | Verificar o token no painel DM Guru e no `.env.local` |
| `profiles update by email` não encontra usuário | Usuário não existe no Supabase Auth ainda | `grantAccess` cria o usuário automaticamente via `auth.admin.createUser` |
| Evento `subscription.inactive` sendo ignorado | Esperado — é o estado inicial antes do primeiro pagamento | Nenhuma ação; o `subscription.active` virá depois |
| `DIGITALMANAGER_API_TOKEN` erro 401 | Token da API expirado ou errado | Gerar novo token no painel DM Guru |
