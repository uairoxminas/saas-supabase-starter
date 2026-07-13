---
name: blueprint
description: Define o escopo e o formato dos dados ANTES de escrever qualquer código. Use ao iniciar um projeto novo, uma automação, um pipeline ou uma feature grande — sempre que ainda não estiver claro qual é o resultado final, de onde vêm os dados e onde eles precisam chegar. Bloqueia a escrita de código até o schema estar definido.
---

# Blueprint — pensar antes de codar

A causa mais cara de retrabalho não é código errado: é código certo para o
problema errado. Esta skill existe para tornar impossível começar a construir
sem saber o que se está construindo.

## Regra de parada (obrigatória)

**Não escreva código de produção enquanto as 5 perguntas abaixo não estiverem
respondidas e o schema de dados não estiver escrito.** Se o usuário pedir para
"só começar", explique o que está faltando e por quê — não adivinhe regra de
negócio. Chutar o formato do dado é o erro que mais custa depois, porque tudo
que for construído em cima herda o chute.

Exceção: correções pontuais, exploração descartável e leitura de código não
precisam de blueprint.

## As 5 perguntas de descoberta

Faça-as ao usuário. Se ele já respondeu alguma no pedido, não repita — confirme.

1. **Norte** — qual é o ÚNICO resultado desejado? (Se houver dois, o projeto
   são dois.)
2. **Integrações** — quais serviços externos entram? As credenciais já existem
   ou precisam ser criadas?
3. **Fonte da verdade** — onde o dado primário vive hoje?
4. **Entrega** — onde o resultado final precisa aterrissar, e em que formato?
5. **Regras de comportamento** — o que o sistema NUNCA pode fazer? Tom, limites,
   restrições de negócio.

Pergunte tudo de uma vez, não uma a uma.

## Schema primeiro

Com as respostas, escreva no `CLAUDE.md` do projeto (a constituição — ver
[[project-memory]]):

- **Input**: o formato do dado cru que entra, com um exemplo real.
- **Output**: o formato do payload que sai, com um exemplo real.
- **Invariantes**: o que é sempre verdade sobre esse dado (campos obrigatórios,
  unicidade, faixas válidas).

Use exemplos concretos, não descrições. `{"email": "a@b.com", "valor": 4990}`
comunica mais do que "objeto com email e valor".

Só depois disso o código começa.

## Pronto ≠ rodou

Um projeto está completo quando o **payload chegou ao destino final** — a
planilha atualizada, a mensagem no Slack, a linha no banco. Não quando o script
executou sem erro. Arquivos intermediários (dados raspados, logs, caches) são
efêmeros: mantenha em `.tmp/` e garanta que `.tmp/` está no `.gitignore`.
