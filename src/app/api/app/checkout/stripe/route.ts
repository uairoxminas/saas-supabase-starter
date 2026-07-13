/**
 * POST /api/app/checkout/stripe
 *
 * Cria uma Stripe Checkout Session de assinatura para o usuário logado e
 * retorna { url } pra redirecionar o cliente ao checkout hospedado da Stripe.
 *
 * Autenticado: usa o client server do Supabase (sessão via cookies) + getUser().
 * 401 se não houver usuário logado.
 */
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    console.error("[checkout/stripe] STRIPE_PRICE_ID não configurada");
    return NextResponse.json(
      { error: "server_misconfigured" },
      { status: 500 },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email ?? undefined,
      success_url: `${appUrl}/app?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/app?checkout=cancel`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "checkout_session_no_url" },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[checkout/stripe] erro criando sessão:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
