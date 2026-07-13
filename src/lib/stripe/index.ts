import Stripe from "stripe";

// Client Stripe inicializado com STRIPE_SECRET_KEY.
//
// Usa fallback não-vazio pra não estourar o `next build` quando
// STRIPE_SECRET_KEY não está setada (o construtor do Stripe exige uma chave
// não-vazia). Em runtime, se a chave real estiver setada, ela é usada.
//
// apiVersion fixado na versão atual pinada pelo pacote `stripe` (17.x →
// "2025-02-24.acacia"), garantindo shapes de evento estáveis.
export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || "sk_test_placeholder",
  {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
  },
);

export default stripe;
