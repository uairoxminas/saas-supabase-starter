/**
 * Provisioning — regras de negócio de concessão/revogação de acesso.
 *
 * Não conhece HTTP nem o payload cru da DM Guru. Recebe dados limpos
 * (vindos de digitalmanager-events.ts) e reflete o estado no `public.profiles`.
 *
 * Versão simplificada do boilerplate: não há tabela `subscriptions` nem sistema
 * de créditos/planos VHA. O efeito de uma concessão/revogação é só atualizar as
 * colunas de billing do profile do usuário, casado por email:
 *   - subscription_status   ('active' | 'canceled' | ...)
 *   - subscription_provider ('digitalmanager')
 *   - dmg_subscription_id
 *   - plan                  (recorrência inferida: 'monthly' | 'yearly' | productId)
 *
 * Usa sempre o admin client (service_role) — só rode server-side.
 */
import { createAdminClient } from "@/lib/supabase/admin";

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

export type GrantAccessInput = {
  email: string;
  name: string | null;
  productId: string;
  subscriptionId: string | null;
  recurrence: "monthly" | "yearly" | null;
  currentPeriodEnd: Date | null;
};

export type RevokeAccessInput = {
  email: string;
  subscriptionId: string | null;
  reason: "canceled" | "refunded" | "chargeback";
};

export type GrantAccessResult = {
  userId: string;
  isNewUser: boolean;
};

/**
 * Acha (ou cria) o user pelo email e marca a assinatura como ativa no profile.
 *
 * Ao criar o user, o trigger `handle_new_user` (migration 0001) já insere a
 * linha correspondente em `public.profiles`, então só precisamos dar o update
 * das colunas de billing por cima.
 */
export async function grantAccess(
  input: GrantAccessInput,
): Promise<GrantAccessResult> {
  const admin = createAdminClient();
  const email = input.email.toLowerCase();

  const { userId, isNewUser } = await findOrCreateUser(admin, email, input.name);

  const plan = input.recurrence ?? input.productId ?? null;

  const { error } = await admin
    .from("profiles")
    .update({
      subscription_status: "active",
      subscription_provider: "digitalmanager",
      dmg_subscription_id: input.subscriptionId,
      plan,
    })
    .eq("id", userId);
  if (error) {
    throw new Error(`profiles update (grant): ${error.message}`);
  }

  return { userId, isNewUser };
}

/**
 * Revoga acesso marcando subscription_status como canceled/refunded no profile.
 * Soft revoke: o user/profile continuam intactos.
 *
 * Casa primeiro pelo dmg_subscription_id (mais específico); fallback por email.
 */
export async function revokeAccess(input: RevokeAccessInput): Promise<void> {
  const admin = createAdminClient();
  const email = input.email.toLowerCase();

  const newStatus: "canceled" | "refunded" =
    input.reason === "canceled" ? "canceled" : "refunded";

  // 1. Preferir match pelo dmg_subscription_id já salvo.
  if (input.subscriptionId) {
    const { data, error } = await admin
      .from("profiles")
      .update({ subscription_status: newStatus })
      .eq("dmg_subscription_id", input.subscriptionId)
      .select("id");
    if (error) {
      throw new Error(`profiles update by dmg_subscription_id: ${error.message}`);
    }
    if (data && data.length > 0) return;
  }

  // 2. Fallback: casar pelo email.
  const { error } = await admin
    .from("profiles")
    .update({ subscription_status: newStatus })
    .eq("email", email);
  if (error) {
    throw new Error(`profiles update by email (revoke): ${error.message}`);
  }
}

/**
 * Acha o user pelo email; cria via auth.admin se não existir. O profile é
 * criado automaticamente pelo trigger `handle_new_user`.
 */
async function findOrCreateUser(
  admin: SupabaseAdmin,
  email: string,
  name: string | null,
): Promise<{ userId: string; isNewUser: boolean }> {
  // perPage:1000 cobre folga até 1k users; refatorar pra RPC/filtro depois.
  const { data: list, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) {
    throw new Error(`auth.admin.listUsers: ${listError.message}`);
  }

  // Tipo do elemento derivado do próprio retorno (evita importar o tipo
  // diretamente de @supabase/supabase-js).
  type SupabaseUser = (typeof list.users)[number];
  const existing = list.users.find(
    (u: SupabaseUser) => u.email?.toLowerCase() === email,
  );
  if (existing) {
    return { userId: existing.id, isNewUser: false };
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true, // já confirmado: passou pelo checkout
    user_metadata: { full_name: name },
  });
  if (error || !data.user) {
    throw new Error(
      `auth.admin.createUser: ${error?.message ?? "no user returned"}`,
    );
  }

  return { userId: data.user.id, isNewUser: true };
}
