# Biblioteca de componentes

Tudo que a diretora (IA) pode combinar para montar um vídeo, post ou carrossel.
Ela NUNCA lê o código daqui: lê só o catálogo gerado em `catalog/` (`tools/catalog.mjs`).

## Como um componente nasce

1. Crie a pasta `biblioteca/componentes/<id>/` com:
   - `meta.json` — o catálogo (veja o schema abaixo)
   - `<Nome>.tsx` — a implementação React
2. Registre o componente em `src/engine/registro.ts` (1 linha).
3. Rode `node tools/catalog.mjs` — o catálogo é regenerado e avisa se falta algo.
4. (Opcional) confira no Studio: composição `Biblioteca` com `--props='{"componente":"<id>"}'`.

Nada mais muda: o Motor resolve o componente pelo id na hora de renderizar.
Componente novo entra sem reconstruir nada — só meta + registro + catalog.

## `meta.json` (o que a diretora enxerga)

```json
{
  "id": "texto_titulo",
  "tipo": "texto_impacto",
  "formatos": ["9:16", "1:1", "4:5"],
  "estilos": ["cinematico", "luxo", "motivacional", "informacional"],
  "descricao": "Título grande na fonte display do tema.",
  "uso_recomendado": ["frases de impacto", "gancho inicial", "títulos"],
  "duracao_recomendada": "1-3 s",
  "parametros": {
    "texto": {"tipo": "string", "descricao": "O texto a mostrar", "obrigatorio": true},
    "cor": {"tipo": "cor", "descricao": "Cor do texto (hex ou nome de cor do tema)", "obrigatorio": false}
  }
}
```

Tipos de parâmetro aceitos: `string`, `numero`, `boolean`, `cor`, `imagem`, `video`, `lista`.
`obrigatorio: true` = o Motor/catálogo avisam se faltar na spec.

## Tipos de componente (`tipo`)

`layout_post`, `layout_story`, `layout_carrossel`, `texto_impacto`, `titulo`,
`legenda`, `transicao`, `midia`, `cta`, `logo`, `efeito`, `som`, `tema`.

## Temas

`biblioteca/temas/<id>/` = `tema.tsx` (cores + fontes carregadas) + `meta.json`.
Registro em `biblioteca/temas/registro.ts`. O Motor aplica o tema da spec em toda a peça.

## Convenção do código

- Comentários e identificadores em inglês.
- Um componente recebe `{params, tema, dims, children}` e decide tudo pelos
  `params` com padrões seguros (nunca quebra se um param faltar).
- Caminhos de mídia em params: relativos a `public/` (ex.: `images/foo/bar.jpg`),
  aceitando também o prefixo `public/`.
