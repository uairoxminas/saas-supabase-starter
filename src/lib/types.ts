export interface AppConfigPublic {
  projectName: string;
  projectSlug: string;
  description: string;
  keywords: string[];
  auth: {
    /** Habilita login por email + senha (além do magic link e Google). */
    enablePasswordAuth?: boolean;
    /** Habilita o botão "Continuar com Google" (precisa configurar no Supabase). */
    enableGoogleAuth?: boolean;
  };
  /** Gateways de pagamento ativos. O template já vem com Stripe e Digital Manager Guru. */
  payments?: {
    stripe?: boolean;
    digitalManagerGuru?: boolean;
  };
  legal: {
    companyName: string;
    email: string;
  };
  social: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    facebook?: string;
    youtube?: string;
  };
}

/**
 * Perfil do usuário — espelha a tabela `public.profiles` (1:1 com auth.users).
 * Fonte única de verdade do shape do usuário em todo o app.
 */
export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  /** "active" | "canceled" | "past_due" | "incomplete" | null */
  subscription_status: string | null;
  /** Gateway que originou a assinatura: "stripe" | "digitalmanager" | null */
  subscription_provider: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  dmg_subscription_id: string | null;
  plan: string | null;
  created_at: string;
}

/** Resposta de GET /api/app/me */
export interface MeResponse {
  user: Profile;
}
