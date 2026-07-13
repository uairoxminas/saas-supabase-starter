---
name: digitalmanager-handler
description: Integrate the Digital Manager Guru payment gateway. Use when handling DMG webhooks, granting/revoking access, updating profiles, or using the DMG API to cancel subscriptions.
tools: Read, Write, Edit
model: inherit
---

# Digital Manager Guru Handler

## Stack
**Digital Manager Guru (DMG)** + **Supabase** (`public.profiles`). Sem banco de eventos dedicado.
- Webhook em `src/app/api/webhooks/digitalmanager/route.ts`.
- Parser de payload em `src/lib/payments/digitalmanager-events.ts`.
- Regras de negócio (grant/revoke) em `src/lib/payments/provisioning.ts`.
- API de saída (cancelamento) em `src/lib/payments/digitalmanager-gateway.ts`.

## Arquitetura em 3 camadas

```
Webhook POST
    ↓
route.ts
  1. Valida api_token (campo do body)
  2. Chama parseDigitalManagerEvent()
  3. Chama grantAccess() ou revokeAccess()
    ↓
digitalmanager-events.ts
  • parseDigitalManagerEvent(payload) → ParsedEvent
  • Kinds: "ignored" | "access.grant" | "access.revoke"
    ↓
provisioning.ts
  • grantAccess()   → upsert profiles (subscription_status=active)
  • revokeAccess()  → update profiles (subscription_status=canceled/refunded)
  Usa createAdminClient() — bypassa RLS
```

## Eventos tratados

| Evento DM Guru | Resultado |
|---|---|
| `transaction.approved` | `access.grant` → marca `subscription_status = active` |
| `subscription.started / active / renewed / trialing` | `access.grant` |
| `subscription.canceled / cancelled / ended / expired` | `access.revoke` (reason: canceled) |
| `subscription.inactive` + `dates.canceled_at` ou `cancel_reason` | `access.revoke` |
| `subscription.inactive` sem sinal de cancelamento | ignored (aguardando 1º pagamento) |
| `transaction.refunded` | `access.revoke` (reason: refunded) |
| `transaction.chargeback` | `access.revoke` (reason: chargeback) |
| Qualquer outro | ignored |

## Como adicionar lógica extra no grant
Edite `provisioning.ts → grantAccess()`. Exemplo — salvar o `plan` mapeado pelo `productId`:

```typescript
const PRODUCT_TO_PLAN: Record<string, string> = {
  "prod_abc123": "pro",
  "prod_def456": "enterprise",
};

const plan = PRODUCT_TO_PLAN[input.productId] ?? input.recurrence ?? input.productId;
```

## API de saída — cancelar assinatura
```typescript
import { cancelDigitalManagerSubscription } from "@/lib/payments/digitalmanager-gateway";

const result = await cancelDigitalManagerSubscription(
  profile.dmg_subscription_id,
  { reason: "Cancelado pelo usuário" },
);
if (!result.ok) console.error(result.error);
```

Requer `DIGITALMANAGER_API_TOKEN` configurada.

## Variáveis de ambiente

```env
DIGITALMANAGER_WEBHOOK_TOKEN=...   # validado em cada POST do webhook (campo api_token do body)
DIGITALMANAGER_API_TOKEN=...       # Bearer token para chamadas à API REST DMG
```

## Efeito no `public.profiles`

| Coluna | Valor após grant | Valor após revoke |
|---|---|---|
| `subscription_status` | `active` | `canceled` / `refunded` |
| `subscription_provider` | `digitalmanager` | (mantido) |
| `dmg_subscription_id` | ID da assinatura DMG | (mantido) |
| `plan` | recorrência inferida ou productId | (mantido) |

## Reference
Para payloads de exemplo, detalhes do parser e snippets de teste, veja [reference.md](reference.md).
