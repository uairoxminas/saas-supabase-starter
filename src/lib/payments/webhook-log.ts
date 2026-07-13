/**
 * Log de eventos de webhook — idempotência + auditoria.
 *
 * Ciclo de vida de um evento (tabela public.webhook_events, migration 0002):
 *
 *   claimWebhookEvent()  → grava 'processing'. Retorna false se este evento já
 *                          foi processado com sucesso antes (é um reenvio) —
 *                          nesse caso o handler deve dar 200 e sair.
 *   completeWebhookEvent() → marca 'processed'. Reenvios futuros são ignorados.
 *   failWebhookEvent()     → marca 'failed' + guarda o erro. Como NÃO fica
 *                          'processed', o reenvio do gateway reprocessa — que é
 *                          exatamente o que queremos numa falha transitória.
 *
 * Usa o admin client (service_role) — só server-side.
 */
import { createAdminClient } from "@/lib/supabase/admin";

export type WebhookProvider = "stripe" | "digitalmanager";

/** Chaves que nunca devem ir pro banco em texto claro. */
const SECRET_KEYS = new Set(["api_token", "token", "secret", "password"]);

/**
 * Copia o payload trocando valores de chaves sensíveis por "[redacted]".
 * O webhook da DM Guru manda o `api_token` dentro do corpo — sem isto,
 * guardaríamos um segredo em claro numa tabela de log.
 */
function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        SECRET_KEYS.has(k.toLowerCase()) ? "[redacted]" : redact(v),
      ]),
    );
  }
  return value;
}

/**
 * Registra a chegada do evento e diz se ele deve ser processado.
 *
 * @returns true  → evento novo (ou retentativa de uma falha): processe.
 *          false → já processado com sucesso antes: ignore e devolva 200.
 */
export async function claimWebhookEvent(
  provider: WebhookProvider,
  eventId: string,
  eventType: string | null,
  payload: unknown,
): Promise<boolean> {
  const admin = createAdminClient();

  const { data: existing, error: selectError } = await admin
    .from("webhook_events")
    .select("status")
    .eq("provider", provider)
    .eq("event_id", eventId)
    .maybeSingle();

  if (selectError) {
    throw new Error(`webhook_events select: ${selectError.message}`);
  }

  if (existing?.status === "processed") {
    return false;
  }

  const { error: upsertError } = await admin.from("webhook_events").upsert(
    {
      provider,
      event_id: eventId,
      event_type: eventType,
      status: "processing",
      error: null,
      payload: redact(payload),
    },
    { onConflict: "provider,event_id" },
  );

  if (upsertError) {
    throw new Error(`webhook_events upsert: ${upsertError.message}`);
  }

  return true;
}

/** Marca o evento como processado com sucesso. */
export async function completeWebhookEvent(
  provider: WebhookProvider,
  eventId: string,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("webhook_events")
    .update({ status: "processed", error: null })
    .eq("provider", provider)
    .eq("event_id", eventId);

  if (error) {
    // Não relançamos: o efeito de negócio já aconteceu. Falhar aqui faria o
    // gateway reenviar e reprocessar algo que deu certo.
    console.error(`[webhook-log] complete falhou (${provider}/${eventId}):`, error.message);
  }
}

/** Marca o evento como falho, guardando a mensagem para investigação. */
export async function failWebhookEvent(
  provider: WebhookProvider,
  eventId: string,
  message: string,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("webhook_events")
    .update({ status: "failed", error: message.slice(0, 2000) })
    .eq("provider", provider)
    .eq("event_id", eventId);

  if (error) {
    console.error(`[webhook-log] fail falhou (${provider}/${eventId}):`, error.message);
  }
}
