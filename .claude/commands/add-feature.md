---
name: add-feature
description: Add a new feature to the project, handling Supabase tables/RLS, API routes, UI, and billing integration.
argument-hint: [feature name]
---

# Add Feature Command

Você é um arquiteto de software especialista. Sua tarefa é adicionar uma nova feature ao projeto SaaS existente, integrando com a arquitetura atual.

## Fase 1: Coleta de Contexto (Interativa)

**Step 1.1**: Identifique o nome da feature.
- Se o usuário forneceu `[feature name]`, use-o.
- Caso contrário, pergunte: "Qual é o nome da feature?"

**Step 1.2**: Analise o contexto silenciosamente.
- **DB**: Leia `supabase/migrations/` e `src/lib/types.ts` para entender as entidades existentes.
- **API**: Leia `src/app/api/` para entender os padrões atuais (auth, validação).
- **Skills**: Consulte `.claude/skills/` para saber quais capacidades estão disponíveis.

**Step 1.3**: Pergunte os detalhes (máx 5 perguntas).
1. **Dados**: "Isso requer armazenar novos dados? Quais campos? Relação com `profiles` ou outras tabelas?"
2. **UI/UX**: "Onde fica na interface? (nova aba no dashboard, página pública, modal?)"
3. **Billing/Acesso**: "A feature é restrita a usuários com `subscription_status = active`?"
4. **Integrações**: "Precisa de Stripe ou Digital Manager Guru?"
5. **Permissões**: "Há controle de acesso específico?"

## Fase 2: Plano de Execução

Formule um plano usando as skills disponíveis.

**Step 2.1**: Apresente o plano.
"Tenho um plano para implementar [Feature Name]:"

1. **Banco de Dados** (`db-handler`):
   - Novas tabelas ou colunas em `supabase/migrations/{numero}_{nome}.sql`.
   - RLS e policies.
2. **API** (padrões do projeto):
   - Rotas em `src/app/api/app/...`.
   - Validação com Zod, proteção com `withAuthRequired`.
3. **Billing/Acesso** (`stripe-handler`, `digitalmanager-handler`):
   - Verificar `subscription_status` em `profiles` se necessário.
4. **Interface** (`ui-handler`, `form-creator`):
   - Novas páginas/componentes em `src/app/(in-app)/...`.
5. **Integrações extras**:
   - Listagem de chamadas externas se houver.

**Confirme com o usuário: "Posso prosseguir com este plano?"**

## Fase 3: Implementação

Após confirmação, execute sem pedir permissão a cada arquivo.

### 1. Banco de Dados
- Crie/atualize migration SQL em `supabase/migrations/` usando `db-handler`.
- Garanta `id`, `created_at`, `updated_at`, `user_id` FK, RLS.
- Lembre o usuário: `supabase db push`.

### 2. Lógica e API
- Crie API routes ou Server Actions.
- Implemente verificação de auth (`withAuthRequired`).
- Verifique `subscription_status` em `profiles` para features premium.

### 3. Interface do Usuário
- Crie componentes com `ui-handler` (Shadcn UI).
- Formulários com react-hook-form + Zod.
- Responsivo, respeitando o tema atual (`theme-handler`).
- Adicione navegação em `src/components/layout/app-header.tsx` se necessário.

### 4. Wiring Final
- Conecte UI às APIs/Actions.
- Handle loading states e error messages.
- Atualize `src/lib/config.ts` se novas constantes forem necessárias.

## Conclusão
"Feature [Feature Name] adicionada com sucesso!
- **Banco**: [resumo das mudanças].
- **API**: [resumo das rotas criadas].
- **UI**: [resumo de páginas/componentes].

### Próximos passos
1. `supabase db push` para aplicar migrations.
2. Verificar em [URL]."
