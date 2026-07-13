---
name: project-memory
description: Estrutura de memória e documentação de um projeto — CLAUDE.md como lei (schemas, regras, invariantes) e os arquivos de progresso como histórico. Use ao iniciar um projeto, ao mudar uma regra ou arquitetura, e sempre que a lógica de negócio mudar (o documento muda ANTES do código).
---

# Memória de projeto — a lei e o histórico

Dois tipos de escrita, com pesos diferentes. Confundi-los é o que faz a
documentação apodrecer.

## CLAUDE.md é lei

É o único arquivo que o Claude Code carrega automaticamente em toda sessão.
Qualquer regra que precise valer sempre mora aqui — e **só aqui**.

> Se você veio do B.L.A.S.T. ou de outro método que usa `gemini.md` como
> constituição: no Claude Code esse arquivo **não é lido**. Uma lei que o agente
> nunca vê não é lei. Use `CLAUDE.md`.

O que entra:

- **Schemas de dados** — input e output, com exemplos reais.
- **Regras de comportamento** — o que o sistema nunca pode fazer.
- **Invariantes de arquitetura** — decisões que não se renegociam a cada tarefa.
- **Restrições descobertas na marra** — headers exigidos, rate limits, formatos
  inconsistentes. Alimentado pelo loop de [[self-anneal]].

O que **não** entra: narrativa do que foi feito, log de tarefas, ideias futuras.
Isso incha o contexto de toda sessão e afoga as regras que importam.

Atualize o `CLAUDE.md` somente quando: um schema mudar, uma regra for
adicionada, ou a arquitetura mudar.

## A regra de ouro: documento antes do código

Se a lógica de negócio muda, **o documento muda primeiro**. Escrever a regra
força você a perceber que ela conflita com outra — coisa que o código esconde
até o dia em que quebra em produção.

Isso vale para SOPs em `architecture/`, se o projeto tiver: são o "como
funciona" de cada peça. Se o SOP e o código discordarem, o SOP está certo e o
código é o bug.

## Histórico é opcional, e é outra coisa

Para projetos longos, arquivos separados carregam o histórico sem poluir a lei:

- `progress.md` — o que foi feito, o que falhou, resultado dos testes.
- `findings.md` — pesquisa e descobertas que ainda não viraram regra.

Eles são memória, não lei. Não precisam ser lidos toda sessão — leia sob demanda.
Em projetos pequenos, dispense: o histórico do git já cumpre esse papel.

Ver também [[blueprint]] — onde os schemas nascem.
