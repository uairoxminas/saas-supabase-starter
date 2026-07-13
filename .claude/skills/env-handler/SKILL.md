---
name: env-handler
description: Manage environment variables securely. Handles distinction between .env (template) and .env.local (secrets) for the Supabase + Stripe + Digital Manager Guru stack.
---

# Environment Variable Handler

## Core Rules
1. **`.env` = template**: apenas placeholders e valores públicos/defaults. Versionado no git.
2. **`.env.local` = segredos reais**: git-ignorado. Nunca commitado.
3. **Toda variável em `.env.local`** deve ter um placeholder correspondente em `.env`.

## Variáveis do projeto

### App
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Supabase
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...          # pública, usada no browser
SUPABASE_SERVICE_ROLE_KEY=eyJ...              # secreta, só server-side
```

### Stripe
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_ID=price_...                     # price ID do plano principal
```

### Digital Manager Guru
```env
DIGITALMANAGER_WEBHOOK_TOKEN=...             # token de validação do webhook
DIGITALMANAGER_API_TOKEN=...                 # token da API DMG
```

## Instructions

### 1. Adicionar variável sensível
1. Adicione ao `.env` com valor vazio:
   ```env
   MINHA_CHAVE=""
   ```
2. Peça ao usuário para preencher em `.env.local`:
   > "Adicionei `MINHA_CHAVE` ao `.env`. Por favor, abra `.env.local` e coloque o valor real: `MINHA_CHAVE=seu_valor`"

### 2. Adicionar variável pública/config
1. Adicione ao `.env` com o valor default ou de desenvolvimento:
   ```env
   NEXT_PUBLIC_FEATURE_FLAG=false
   ```

### 3. Leitura no código
- Server-side: `process.env.SUPABASE_SERVICE_ROLE_KEY`
- Client-side: apenas `NEXT_PUBLIC_*` são acessíveis no browser

### 4. Variáveis `NEXT_PUBLIC_*`
São embutidas no bundle do cliente durante o build. Nunca coloque segredos com esse prefixo.

## Checklist
- [ ] A variável está no `.env` com placeholder?
- [ ] Se sensível, o valor está apenas no `.env.local`?
- [ ] Variáveis client-side usam o prefixo `NEXT_PUBLIC_`?
- [ ] A chave `SUPABASE_SERVICE_ROLE_KEY` não aparece em nenhum componente client?
