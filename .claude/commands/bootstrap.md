---
name: bootstrap
description: Bootstrap the project with custom configuration, Supabase tables, RLS, and billing setup based on your SaaS idea.
argument-hint: [project name]
---

# SaaS Supabase Boilerplate — Project Bootstrapper

Você é um arquiteto de software especialista. Sua tarefa é configurar um novo projeto SaaS a partir deste boilerplate com base nos requisitos do usuário.

## Fase 1: Coleta de Informações (Interativa)

**Step 1.1**: Verifique se o usuário forneceu o nome do projeto nos argumentos.
- Se NÃO: "Qual é o nome do seu novo projeto SaaS?"
- Se SIM: continue.

**Step 1.2**: Descrição em uma frase.
- "Me dê uma descrição rápida do que o [Project Name] faz."

**Step 1.3**: Preferência de tema visual.
- "Qual tema visual você quer usar? (ex: Modern Minimal, T3 Chat, Twitter, etc.)"
- Use a `theme-handler` skill para instalar o tema escolhido.

**Step 1.4**: Entidades principais e fluxos do usuário.
- "Quais são as entidades/recursos principais do seu app? (ex: para plataforma de cursos: Cursos, Aulas, Quizzes)."
- Para cada entidade, esclareça:
  1. Os usuários gerenciam isso no dashboard? (ex: `/app/projects`)
  2. O dashboard principal é uma visão geral/stats ou lista direta dessas entidades?

**Step 1.5**: Gateway de pagamento.
- "Você usará Stripe, Digital Manager Guru, ou ambos?"
- Use `stripe-handler` e/ou `digitalmanager-handler` conforme a escolha.

**Step 1.6**: Auth.
- "Quais métodos de login você quer? (email+senha, magic link, Google OAuth)"
- Atualize `src/lib/config.ts` com `enablePasswordAuth` e `enableGoogleAuth`.

**Step 1.7**: Requisitos extras.
- "Há algum documento de requisitos ou base de conhecimento que devo considerar?"
- "Alguma preferência para o design da Landing Page ou do Header do app?"

## Fase 2: Plano de Execução

Após coletar as respostas, anuncie: "Ótimo! Vou configurar o [Project Name]. Aqui está o plano:"

1. Atualizar Config (`src/lib/config.ts`).
2. Instalar tema selecionado (`theme-handler`).
3. Criar tabelas Supabase + RLS (`db-handler`) — migration SQL em `supabase/migrations/`.
4. Criar páginas e APIs do usuário (`src/app/(in-app)/app/[entity]/`).
5. Configurar billing (`stripe-handler` e/ou `digitalmanager-handler`).
6. Customizar Landing Page (`src/app/(website-layout)/page.tsx`).
7. Criar Dashboard in-app e navegação.

**Confirme com o usuário: "Posso prosseguir?"**

## Fase 3: Implementação

Após confirmação, execute sem pedir permissão a cada arquivo.

### 1. Configuração
- **`src/lib/config.ts`**: Atualize `projectName`, `description`, `keywords`, `auth`, `payments`.

### 2. Tema
- Use `theme-handler` para instalar o tema escolhido:
  ```bash
  pnpm dlx shadcn@latest add <theme-url>
  ```

### 3. Banco de Dados (Supabase)
- Para cada entidade, crie `supabase/migrations/{numero}_{nome}.sql` usando `db-handler`.
- **Obrigatório**: `id uuid primary key default gen_random_uuid()`, `user_id` FK para `auth.users`, `created_at`, `updated_at`, RLS habilitado e policies.
- Consulte `public.profiles` para billing/plano do usuário.
- Lembre o usuário de rodar: `supabase db push`

### 4. Páginas e APIs do Usuário
Para cada entidade que o usuário gerencia:
- **Diretório**: `src/app/(in-app)/app/[entity-plural]/`
- **Páginas**: `page.tsx` (lista), `create/page.tsx`, `[id]/page.tsx`.
- **API Routes**: `src/app/api/app/[entity-plural]/...` — sempre protegidas com `withAuthRequired`.
- Queries sempre filtradas por `user.id`.

### 5. Billing
- **Stripe**: use `stripe-handler` — checkout session, webhook, portal.
- **Digital Manager Guru**: use `digitalmanager-handler` — webhook `access.grant`/`access.revoke`, `grantAccess` / `revokeAccess` em `provisioning.ts`.
- Ambos atualizam `public.profiles` (subscription_status, plan, provider).

### 6. Landing Page & Layout
- **`src/app/(website-layout)/page.tsx`**: substitua pelo conteúdo específico do projeto.
- **`src/app/(website-layout)/layout.tsx`**: atualize metadata.

### 7. Dashboard in-app & Navegação
- **`src/app/(in-app)/app/page.tsx`**: remova conteúdo demo, crie dashboard profissional.
- **`src/components/layout/app-header.tsx`**: adicione links de navegação para as entidades.

## Conclusão

Ao terminar, reporte:
"Projeto [Project Name] configurado!

- Config atualizado.
- Tema instalado.
- Migrations criadas: [listar arquivos].
- Páginas criadas: [listar caminhos].
- Billing configurado: [Stripe/DMG].
- Landing page customizada.
- Dashboard e header atualizados.

### Próximos passos
1. Preencher `.env.local` com as variáveis de ambiente (Supabase, Stripe, DMG).
2. Rodar `supabase db push` para aplicar as migrations.
3. `pnpm dev` para iniciar."
