/**
 * Parser dos payloads de webhook da Digital Manager Guru.
 *
 * Aqui mora a ÚNICA referência ao formato cru. Outros arquivos só consomem ParsedEvent.
 *
 * Formato REAL da DM Guru (validado via payload de produção):
 *   {
 *     "api_token": "...",
 *     "id": "sub_xxx" | "txn_xxx",                  // sempre presente
 *     "internal_id": "uuid",                        // ID interno do DM Guru
 *     "webhook_type": "transaction" | "subscription",
 *     "last_status": "active" | "canceled" | ...,   // pra subscription
 *     "last_transaction": {
 *       "status": "approved" | "refunded" | ...,    // pra transaction
 *       "contact": { "email", "name" },
 *       ...
 *     },
 *     "subscriber": { "email", "name" },
 *     "product": { "id", "internal_id", "name" },
 *     "charged_every_days": 30 | 365,               // útil pra inferir recorrência
 *     "next_product": { "offer": { "plan": { "interval_type": "month" | "year" } } },
 *     "dates": {
 *       "started_at", "cycle_end_date", "next_cycle_at",
 *       "canceled_at", "last_status_at"
 *     },
 *     "current_invoice": { "period_end", "status", ... }
 *   }
 *
 * O parser é TOLERANTE: aceita variações de chave e busca em múltiplos caminhos.
 */

export type ParsedEvent =
  | { kind: "ignored"; reason: string }
  | {
      kind: "access.grant";
      eventId: string;
      eventType: string;
      email: string;
      name: string | null;
      productId: string;
      subscriptionId: string | null;
      recurrence: "monthly" | "yearly" | null;
      currentPeriodEnd: Date | null;
    }
  | {
      kind: "access.revoke";
      eventId: string;
      eventType: string;
      email: string;
      subscriptionId: string | null;
      reason: "canceled" | "refunded" | "chargeback";
    };

type AnyPayload = Record<string, unknown>;

function get(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== "object") return undefined;
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function getStr(obj: unknown, path: string): string | null {
  const v = get(obj, path);
  if (typeof v === "string" && v.length > 0) return v;
  if (typeof v === "number") return String(v);
  return null;
}

function getNum(obj: unknown, path: string): number | null {
  const v = get(obj, path);
  if (typeof v === "number" && !isNaN(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return isNaN(n) ? null : n;
  }
  return null;
}

function getDate(obj: unknown, path: string): Date | null {
  const v = get(obj, path);
  if (typeof v === "string" && v.length > 0) {
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d;
  }
  if (typeof v === "number") {
    // timestamp em ms ou s
    const d = new Date(v > 1e12 ? v : v * 1000);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function parseRecurrence(
  raw: string | null,
  chargedEveryDays: number | null,
): "monthly" | "yearly" | null {
  if (raw) {
    const r = raw.toLowerCase();
    if (r.includes("year") || r.includes("anu") || r === "yearly" || r === "annual") {
      return "yearly";
    }
    if (r.includes("month") || r.includes("mens") || r === "monthly") {
      return "monthly";
    }
  }
  // Fallback: charged_every_days do payload DM Guru
  if (chargedEveryDays !== null) {
    if (chargedEveryDays >= 300) return "yearly"; // ~365
    if (chargedEveryDays >= 25 && chargedEveryDays <= 35) return "monthly"; // ~30
  }
  return null;
}

function pickStr(obj: unknown, paths: string[]): string | null {
  for (const path of paths) {
    const v = getStr(obj, path);
    if (v) return v;
  }
  return null;
}

function pickDate(obj: unknown, paths: string[]): Date | null {
  for (const path of paths) {
    const v = getDate(obj, path);
    if (v) return v;
  }
  return null;
}

export function parseDigitalManagerEvent(payload: unknown): ParsedEvent {
  if (!payload || typeof payload !== "object") {
    return { kind: "ignored", reason: "empty_payload" };
  }
  const p = payload as AnyPayload;

  const webhookType = pickStr(p, ["webhook_type", "type"]);
  if (!webhookType) {
    return { kind: "ignored", reason: "missing_webhook_type" };
  }
  const wt = webhookType.toLowerCase();

  // Event ID — precisa ser ÚNICO por transição de estado, não por entidade.
  // A mesma subscription gera múltiplos webhooks (waiting_payment → active →
  // canceled), então o `id` cru (`sub_xxx`) não serve sozinho como event_id.
  // Solução: combinar o ID com o timestamp da última mudança de status.
  const baseId = pickStr(p, ["id", "event_id", "internal_id"]);
  if (!baseId) {
    return { kind: "ignored", reason: "missing_event_id" };
  }
  const statusTimestamp =
    wt === "transaction"
      ? pickStr(p, [
          "last_transaction.dates.updated_at",
          "last_transaction.dates.confirmed_at",
          "last_transaction.dates.created_at",
          "dates.last_status_at",
        ])
      : pickStr(p, [
          "dates.last_status_at",
          "current_invoice.updated_at",
          "dates.cycle_start_date",
        ]);
  const eventId = statusTimestamp ? `${baseId}.${statusTimestamp}` : baseId;

  // Status — diferente em subscription vs transaction:
  // - subscription: usa `last_status` (active, canceled, ...)
  // - transaction: usa `status` na raiz OU `last_transaction.status`
  let status: string | null = null;
  if (wt === "subscription") {
    status = pickStr(p, [
      "last_status",
      "status",
      "subscription_status",
      "subscription.status",
    ]);
  } else if (wt === "transaction") {
    status = pickStr(p, [
      "status",
      "last_transaction.status",
      "transaction_status",
    ]);
  } else {
    // Tipo desconhecido — tenta os dois
    status = pickStr(p, [
      "status",
      "last_status",
      "last_transaction.status",
      "transaction_status",
      "subscription_status",
    ]);
  }
  if (!status) {
    return { kind: "ignored", reason: "missing_status" };
  }

  const eventType = `${webhookType}.${status}`.toLowerCase();

  // Email — DM Guru tem em `subscriber.email`, `last_transaction.contact.email`
  // ou `contact.email`. Fallbacks pra outros providers.
  const email = (
    pickStr(p, [
      "subscriber.email",
      "last_transaction.contact.email",
      "contact.email",
      "customer.email",
      "buyer.email",
    ]) || ""
  ).toLowerCase();

  if (!email) {
    return { kind: "ignored", reason: "missing_email" };
  }

  // Name — análogo ao email
  const name = pickStr(p, [
    "subscriber.name",
    "last_transaction.contact.name",
    "contact.name",
    "customer.name",
    "buyer.name",
  ]);

  // Product ID — DM Guru usa `product.id` ou `product.internal_id`
  const productId =
    pickStr(p, [
      "product.internal_id",
      "product.id",
      "product_id",
      "last_transaction.product.internal_id",
      "last_transaction.product.id",
    ]) || "unknown";

  // Subscription ID — preferir o "código público" (`id` = "sub_xxx") por ser estável
  const subscriptionId = pickStr(p, [
    "subscription.id",
    "subscription_id",
    "subscription_code",
    // DM Guru: ID público da subscription é o `id` da raiz quando webhook_type=subscription
    ...(wt === "subscription" ? ["id"] : []),
    "internal_id",
    "last_transaction.subscription_id",
  ]);

  // Recurrence — múltiplos caminhos + fallback no `charged_every_days`
  const recurrenceRaw = pickStr(p, [
    "subscription.recurrence",
    "recurrence",
    "subscription.period",
    "next_product.offer.plan.interval_type",
    "product.offer.plan.interval_type",
    "last_transaction.product.offer.plan.interval_type",
  ]);
  const chargedEveryDays = getNum(p, "charged_every_days");
  const recurrence = parseRecurrence(recurrenceRaw, chargedEveryDays);

  // Current period end — DM Guru: `dates.cycle_end_date` ou `current_invoice.period_end`
  const currentPeriodEnd = pickDate(p, [
    "subscription.next_charge_date",
    "subscription.current_period_end",
    "subscription.next_due_date",
    "dates.cycle_end_date",
    "current_invoice.period_end",
    "dates.next_cycle_at",
  ]);

  const normalized = status.toLowerCase();

  // === GRANT ACCESS ===

  // Transaction approved (compra à vista, ou primeira cobrança fora do ciclo)
  if (wt === "transaction" && normalized === "approved") {
    return {
      kind: "access.grant",
      eventId,
      eventType,
      email,
      name,
      productId,
      subscriptionId,
      recurrence,
      currentPeriodEnd,
    };
  }

  // Subscription started/active/renewed (assinatura)
  if (
    wt === "subscription" &&
    (normalized === "started" ||
      normalized === "active" ||
      normalized === "renewed" ||
      normalized === "trialing")
  ) {
    return {
      kind: "access.grant",
      eventId,
      eventType,
      email,
      name,
      productId,
      subscriptionId,
      recurrence,
      currentPeriodEnd,
    };
  }

  // === REVOKE ACCESS ===

  // Cancelamento explícito → revoke
  if (
    wt === "subscription" &&
    (normalized === "canceled" ||
      normalized === "cancelled" ||
      normalized === "ended" ||
      normalized === "expired")
  ) {
    return {
      kind: "access.revoke",
      eventId,
      eventType,
      email,
      subscriptionId,
      reason: "canceled",
    };
  }

  // `inactive` é AMBÍGUO no DM Guru:
  //   - subscription recém-criada, ainda esperando 1º pagamento → IGNORAR
  //   - assinatura cancelada/expirada → REVOKE
  // O sinal confiável é `dates.canceled_at` ou `cancel_reason`. Se nenhum
  // sinal de cancelamento, é estado de espera, não revoke.
  if (wt === "subscription" && normalized === "inactive") {
    const canceledAt = pickDate(p, ["dates.canceled_at"]);
    const cancelReason = pickStr(p, ["cancel_reason"]);
    if (canceledAt || (cancelReason && cancelReason.length > 0)) {
      return {
        kind: "access.revoke",
        eventId,
        eventType,
        email,
        subscriptionId,
        reason: "canceled",
      };
    }
    return {
      kind: "ignored",
      reason: "subscription_inactive_awaiting_payment",
    };
  }
  if (wt === "transaction" && (normalized === "refunded" || normalized === "refund")) {
    return {
      kind: "access.revoke",
      eventId,
      eventType,
      email,
      subscriptionId,
      reason: "refunded",
    };
  }
  if (
    wt === "transaction" &&
    (normalized === "chargeback" || normalized === "chargedback" || normalized === "disputed")
  ) {
    return {
      kind: "access.revoke",
      eventId,
      eventType,
      email,
      subscriptionId,
      reason: "chargeback",
    };
  }

  // Tudo o resto (pending, awaiting_payment, in_review, etc) = ignorar
  return { kind: "ignored", reason: `unhandled_event:${eventType}` };
}
