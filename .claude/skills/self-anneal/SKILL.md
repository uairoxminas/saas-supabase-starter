---
name: self-anneal
description: Loop de auto-reparo — use quando um script, uma API, um build ou um teste falhar. Força a leitura do erro real antes de qualquer tentativa de correção, e obriga a registrar o aprendizado para que a mesma falha não se repita. Use também quando você estiver prestes a tentar a mesma correção uma segunda vez.
---

# Self-anneal — consertar e não repetir

Quando algo quebra, o instinto é tentar outra coisa. Isso transforma depuração
em loteria: você troca o código até parar de dar erro, sem nunca saber por quê —
e a falha volta em outro lugar, semanas depois.

## O loop, em ordem

**1. Analisar — leia o erro. Não adivinhe.**
Leia a stack trace inteira, não só a última linha. Ache o arquivo e a linha
reais. Se a mensagem for opaca, aumente a observabilidade (imprima o payload,
o status HTTP, o corpo da resposta) antes de mudar qualquer lógica.

Se você não consegue explicar em uma frase *por que* falhou, você ainda não
sabe — e ainda não pode corrigir.

**2. Corrigir — a causa, não o sintoma.**
Um `try/except` que engole o erro não é correção. Um retry que mascara um
rate limit não é correção — configurar o intervalo correto é.

**3. Testar — exercite o caminho que falhou.**
Rode de novo o que quebrou, com a mesma entrada. Se não der para reproduzir a
falha original, você não sabe se corrigiu.

**4. Registrar o aprendizado — este passo é o que impede a repetição.**
Escreva no `CLAUDE.md` do projeto o fato descoberto, não a narrativa do
conserto. Fatos que valem registro:

- "A API X exige o header `Accept: application/json` ou devolve HTML."
- "Rate limit é 5 req/s; acima disso devolve 429 sem `Retry-After`."
- "O campo `id` vem como número em alguns registros e string em outros."

Não registre "corrigi o bug do parser". Registre a restrição que você não sabia
que existia.

## Regra dos dois erros

Se a mesma correção falhar duas vezes, **pare de tentar**. Você está atacando o
sintoma. Volte ao passo 1 com mais observabilidade, ou diga ao usuário o que
você não está conseguindo enxergar. Insistir é o modo mais rápido de destruir
código que funcionava.

Ver também [[project-memory]] — onde o aprendizado é registrado.
