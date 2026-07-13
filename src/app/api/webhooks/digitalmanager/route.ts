/**
 * Webhook endpoint para Digital Manager Guru.
 *
 * Fluxo (versão simplificada do boilerplate):
 * 1. Valida o api_token do body (compartilhado com o painel DM Guru) contra
 *    DIGITALMANAGER_WEBHOOK_TOKEN.
 * 2. Parseia o evento → ignored | access.grant | access.revoke.
 * 3. Despacha pra provisioning.grantAccess / revokeAccess, que reflete o estado
 *    no `public.profiles` (subscription_status / subscription_provider /
 *    dmg_subscription_id / plan), casado por email.
 *
 * Idempotência: cada evento é registrado em `public.webhook_events` antes de
 * ser processado (migration 0002). Reenvio de um evento já processado com
 * sucesso devolve 200 sem reprocessar.
 */
import { NextResponse } from "next/server";
import { parseDigitalManagerEvent } from "@/lib/payments/digitalmanager-events";
import { grantAccess, revokeAccess } from "@/lib/payments/provisioning";
import {
  claimWebhookEvent,
  completeWebhookEvent,
  failWebhookEvent,
} from "@/lib/payments/webhook-log";

// Roda em Node (precisa de service_role), não Edge.
export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  // 1. Validar o token do webhook (DM Guru manda dentro do body, em `api_token`).
  const expected = process.env.DIGITALMANAGER_WEBHOOK_TOKEN;
  if (!expected) {
    console.error("[dm-webhook] DIGITALMANAGER_WEBHOOK_TOKEN não configurada");
    return NextResponse.json(
      { ok: false, error: "server_misconfigured" },
      { status: 500 },
    );
  }

  const got =
    typeof body === "object" && body !== null && "api_token" in body
      ? (body as { api_token?: unknown }).api_token
      : null;

  if (got !== expected) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // 2. Parse
  const event = parseDigitalManagerEvent(body);
  if (event.kind === "ignored") {
    return NextResponse.json({ ok: true, ignored: event.reason });
  }

  // 3. Idempotência — reenvio de evento já processado sai aqui, com 200.
  const isNew = await claimWebhookEvent(
    "digitalmanager",
    event.eventId,
    event.eventType,
    body,
  );
  if (!isNew) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  // 4. Dispatch
  try {
    if (event.kind === "access.grant") {
      const result = await grantAccess({
        email: event.email,
        name: event.name,
        productId: event.productId,
        subscriptionId: event.subscriptionId,
        recurrence: event.recurrence,
        currentPeriodEnd: event.currentPeriodEnd,
      });
      await completeWebhookEvent("digitalmanager", event.eventId);
      return NextResponse.json({
        ok: true,
        action: "grant",
        userId: result.userId,
        isNewUser: result.isNewUser,
      });
    } else {
      await revokeAccess({
        email: event.email,
        subscriptionId: event.subscriptionId,
        reason: event.reason,
      });
      await completeWebhookEvent("digitalmanager", event.eventId);
      return NextResponse.json({ ok: true, action: "revoke" });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[dm-webhook] erro processando evento:", event.eventType, msg);
    // Fica 'failed', não 'processed' → o reenvio da DM Guru reprocessa.
    await failWebhookEvent("digitalmanager", event.eventId, msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// Healthcheck — algumas plataformas (Vercel, monitoring) batem GET.
export async function GET() {
  return NextResponse.json({
    ok: true,
    gateway: "digitalmanager",
    endpoint: "webhook",
  });
}
