import { AppConfigPublic } from "./types";

// ─────────────────────────────────────────────────────────────
// Configuração pública do app. Edite aqui para personalizar o
// boilerplate (nome, descrição, social, gateways de pagamento).
// ─────────────────────────────────────────────────────────────
export const appConfig: AppConfigPublic = {
  projectName: "Meu SaaS",
  projectSlug: "meu-saas",
  keywords: ["SaaS", "Next.js", "Supabase"],
  description: "Um SaaS construído com Next.js + Supabase.",
  auth: {
    enablePasswordAuth: true,
    enableGoogleAuth: false, // ligue depois de configurar o provider Google no Supabase
  },
  payments: {
    stripe: true,
    digitalManagerGuru: true,
  },
  legal: {
    companyName: "Sua Empresa LTDA",
    email: "contato@seudominio.com",
  },
  social: {
    twitter: "",
    instagram: "",
    linkedin: "",
  },
};
