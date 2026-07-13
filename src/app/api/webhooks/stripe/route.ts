/**
 * Webhook endpoint para Stripe.
 *
 * Fluxo:
 * 1. Valida a assinatura (stripe.webhooks.constructEvent) com STRIPE_WEBHOOK_SECRET
 *    usando o body cru (await req.text()).
 * 2. Trata checkout.session.completed / customer.subscription.updated /
 *    customer.subscription.deleted.
 * 3. Atualiza `public.profiles` via admin client (service_role, bypassa RLS),
 *    casando por email do customer ou pelo stripe_customer_id já salvo.
 *
 * Sem ORM legado, sem sistema de créditos/planos — só billing no profiles.
 */
import type Stripe from "stripe";
import { NextResponse, type NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  claimWebhookEvent,
  completeWebhookEvent,
  failWebhookEvent,
} from "@/lib/payments/webhook-log";

// Precisa do body cru pra validar a assinatura → roda em Node, não Edge.
export const runtime = "nodejs";
export const maxDuration = 20;

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

type ProfileBillingUpdate = {
  subscription_status?: string | null;
  subscription_provider?: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  plan?: string | null;
};

/**
 * Mapeia o status de assinatura da Stripe pro vocabulário do profiles
 * (active | canceled | past_due | incomplete | null).
 */
function mapSubscriptionStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "canceled":
    case "unpaid":
      return "canceled";
    case "past_due":
      return "past_due";
    case "incomplete":
    case "incomplete_expired":
      return "incomplete";
    default:
      return status;
  }
}

/**
 * Aplica um update de billing no profile do usuário. Casa por
 * stripe_customer_id (mais específico) e, em fallback, por email.
 * Retorna false se nenhuma linha foi encontrada.
 */
async function updateProfileBilling(
  supabase: SupabaseAdmin,
  match: { customerId?: string | null; email?: string | null },
  update: ProfileBillingUpdate,
): Promise<boolean> {
  // 1. Tenta casar pelo stripe_customer_id já salvo.
  if (match.customerId) {
    const { data, error } = await supabase
      .from("profiles")
      .update(update)
      .eq("stripe_customer_id", match.customerId)
      .select("id");
    if (error) throw new Error(`profiles update by customer_id: ${error.message}`);
    if (data && data.length > 0) return true;
  }

  // 2. Fallback: casa pelo email do customer.
  if (match.email) {
    const { data, error } = await supabase
      .from("profiles")
      .update(update)
      .eq("email", match.email.toLowerCase())
      .select("id");
    if (error) throw new Error(`profiles update by email: ${error.message}`);
    if (data && data.length > 0) return true;
  }

  return false;
}

/** Resolve o email de um customer da Stripe (string id ou objeto). */
async function resolveCustomerEmail(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
): Promise<string | null> {
  if (!customer) return null;
  if (typeof customer === "string") {
    try {
      const c = await stripe.customers.retrieve(customer);
      if (c.deleted) return null;
      return c.email ?? null;
    } catch {
      return null;
    }
  }
  if (customer.deleted) return null;
  return customer.email ?? null;
}

async function onCheckoutSessionCompleted(
  supabase: SupabaseAdmin,
  session: Stripe.Checkout.Session,
) {
  // Só assinaturas pagas interessam ao boilerplate.
  if (session.mode !== "subscription") return;

  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;
  const email =
    session.customer_details?.email ??
    session.customer_email ??
    (await resolveCustomerEmail(session.customer));

  await updateProfileBilling(
    supabase,
    { customerId, email },
    {
      subscription_status: "active",
      subscription_provider: "stripe",
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
    },
  );
}

async function onSubscriptionUpdated(
  supabase: SupabaseAdmin,
  subscription: Stripe.Subscription,
) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null;
  const email = await resolveCustomerEmail(subscription.customer);

  await updateProfileBilling(
    supabase,
    { customerId, email },
    {
      subscription_status: mapSubscriptionStatus(subscription.status),
      subscription_provider: "stripe",
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
    },
  );
}

async function onSubscriptionDeleted(
  supabase: SupabaseAdmin,
  subscription: Stripe.Subscription,
) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null;
  const email = await resolveCustomerEmail(subscription.customer);

  await updateProfileBilling(
    supabase,
    { customerId, email },
    {
      subscription_status: "canceled",
      subscription_provider: "stripe",
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
    },
  );
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET não configurada");
    return NextResponse.json(
      { received: false, error: "server_misconfigured" },
      { status: 500 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { received: false, error: "missing_signature" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe-webhook] verificação de assinatura falhou:", err);
    return NextResponse.json(
      { received: false, error: "invalid_signature" },
      { status: 400 },
    );
  }

  // Idempotência — a Stripe reenvia o mesmo event.id quando não recebe 200.
  const isNew = await claimWebhookEvent("stripe", event.id, event.type, event);
  if (!isNew) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await onCheckoutSessionCompleted(
          supabase,
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case "customer.subscription.updated":
        await onSubscriptionUpdated(
          supabase,
          event.data.object as Stripe.Subscription,
        );
        break;
      case "customer.subscription.deleted":
        await onSubscriptionDeleted(
          supabase,
          event.data.object as Stripe.Subscription,
        );
        break;
      default:
        // Evento não tratado — ack pra Stripe não reenviar.
        break;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[stripe-webhook] erro processando", event.type, msg);
    // Fica 'failed', não 'processed' → o reenvio da Stripe reprocessa.
    await failWebhookEvent("stripe", event.id, msg);
    return NextResponse.json({ received: false, error: msg }, { status: 500 });
  }

  await completeWebhookEvent("stripe", event.id);
  return NextResponse.json({ received: true });
}
