# Memória dos agentes

Cada agente tem um arquivo aqui, com o nome dele. O agente **lê o seu arquivo antes de começar** e **escreve nele ao terminar**, quando aprendeu algo que vale para as próximas vezes.

Subagente não guarda nada sozinho: nasce do zero a cada chamada. Estes arquivos são a única memória que atravessa sessões.

## O que entra

- Decisão do usuário sobre gosto, ritmo ou estilo — e o motivo
- Erro que custou tempo, com a causa real e como evitar
- Número que foi difícil de descobrir (um frame, um limite da máquina, um tamanho de fonte que estoura)
- Armadilha de ferramenta que enganou o diagnóstico

## O que não entra

- O que já está na definição do agente ou no `CLAUDE.md`
- O que se descobre lendo o código em dez segundos
- Detalhe de uma tarefa específica que não se repete
- Registro de conversa ou lista do que foi feito

## Como escrever

Uma entrada por bloco, com data. Fato primeiro, motivo depois. Curto.

```markdown
## 2026-09-16 — Título curto
O que é.
**Por quê:** a razão, ou o que aconteceu quando foi ignorado.
```

Se uma entrada nova contradiz uma antiga, **corrija a antiga** em vez de empilhar. Memória errada é pior que memória vazia.
