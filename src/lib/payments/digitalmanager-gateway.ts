/**
 * Cliente HTTP da API REST da Digital Manager Guru.
 *
 * Usado APENAS pra ações de saída (cancelar assinatura). A entrada via webhook
 * é tratada em src/app/api/webhooks/digitalmanager/route.ts.
 *
 * Auth: Bearer <DIGITALMANAGER_API_TOKEN>
 * Base: https://digitalmanager.guru/api/v2
 */

const BASE_URL = "https://digitalmanager.guru/api/v2";

function getToken(): string {
  const token = process.env.DIGITALMANAGER_API_TOKEN;
  if (!token) {
    throw new Error("DIGITALMANAGER_API_TOKEN não configurada");
  }
  return token;
}

export type GatewayResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; status?: number };

/**
 * Cancela uma assinatura na DM Guru.
 * cancel_at_cycle_end=true → cliente mantém acesso até o fim do período pago.
 */
export async function cancelDigitalManagerSubscription(
  subscriptionId: string,
  opts?: { reason?: string },
): Promise<GatewayResult> {
  if (!subscriptionId) {
    return { ok: false, error: "subscriptionId vazio" };
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/subscriptions/${subscriptionId}/cancel`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cancel_at_cycle_end: true,
        comment:
          opts?.reason ?? "Cancelamento solicitado pelo usuário via plataforma",
      }),
    });
  } catch (err) {
    return { ok: false, error: `Network: ${String(err)}` };
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return {
      ok: false,
      status: res.status,
      error: `DM Guru ${res.status}: ${text.slice(0, 300)}`,
    };
  }

  return { ok: true };
}
