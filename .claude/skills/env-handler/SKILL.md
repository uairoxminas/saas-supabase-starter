---
name: env-handler
description: Gerencia variáveis de ambiente em projetos Next.js — distinção entre .env.example (template versionado) e .env.local (segredos reais, git-ignorado). Use ao adicionar qualquer variável de ambiente, chave de API ou segredo neste stack (Supabase + Stripe + Digital Manager Guru).
---

# Environment Variable Handler

## Regras centrais

1. **`.env.example` = template**: só placeholders e valores públicos/default.
   **É o único arquivo de env versionado no git.**
2. **`.env.local` = segredos reais**: git-ignorado. Nunca commitado.
3. **Toda variável em `.env.local`** precisa de um placeholder correspondente em
   `.env.example` — senão quem clonar o projeto não descobre que ela existe.

> **Atenção:** o `.gitignore` deste stack ignora `.env` e `.env.*`, com exceção
> de `.env.example`. Colocar o placeholder num arquivo `.env` é inútil: ele não
> vai pro repositório e o próximo desenvolvedor (ou o deploy) não sabe que a
> variável existe. Use **`.env.example`**.

Setup inicial de um clone: `cp .env.example .env.local`

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
DIGITALMANAGER_WEBHOOK_TOKEN=...              # token de validação do webhook
DIGITALMANAGER_API_TOKEN=...                  # token da API DMG
```

## Instruções

### 1. Adicionar variável sensível
1. Adicione ao `.env.example` com valor vazio:
   ```env
   MINHA_CHAVE=
   ```
2. Peça ao usuário para preencher em `.env.local`:
   > "Adicionei `MINHA_CHAVE` ao `.env.example`. Abra o `.env.local` e coloque o
   > valor real: `MINHA_CHAVE=seu_valor`"
3. Se o projeto já estiver em produção, lembre-o de adicionar a variável também
   no painel do Vercel — o `.env.local` não sobe no deploy.

### 2. Adicionar variável pública/config
Adicione ao `.env.example` com o valor default:
```env
NEXT_PUBLIC_FEATURE_FLAG=false
```

### 3. Leitura no código
- Server-side: `process.env.SUPABASE_SERVICE_ROLE_KEY`
- Client-side: apenas `NEXT_PUBLIC_*` são acessíveis no browser

### 4. Variáveis `NEXT_PUBLIC_*`
São embutidas no bundle do cliente durante o build. **Nunca** coloque segredos
com esse prefixo — qualquer visitante do site consegue lê-las.

## Checklist
- [ ] A variável tem placeholder no `.env.example` (não no `.env`)?
- [ ] Se sensível, o valor real está apenas no `.env.local`?
- [ ] Variáveis client-side usam o prefixo `NEXT_PUBLIC_`?
- [ ] A `SUPABASE_SERVICE_ROLE_KEY` não aparece em nenhum componente client?
- [ ] Se em produção: a variável foi adicionada no painel do Vercel?
