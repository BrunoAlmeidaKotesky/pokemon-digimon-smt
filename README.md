# Quem Você Prefere — Pokémon x Digimon x SMT x Persona x JoJo x Yu-Gi-Oh! x Bakugan x LoL x Overwatch x Deadlock x Final Fantasy x Sujimon

Site pessoal (em português) pra escolher entre personagens de franquias diferentes. Publicado no GitHub Pages:
https://brunoalmeidakotesky.github.io/pokemon-digimon-smt/

**Modos:** Duelo (rei do morro), Trio, Quarteto, Campeonato com chaveamento, Ranking (top às cegas: um personagem por vez
vai pra uma posição do top e fica travado lá), Placar, franquias personalizadas (grupos
de imagens próprias) e Online (salas com votação em cada celular: Duelo, Trio, Quarteto, Campeonato, Draft e Ranking, via
PeerJS). O passo a passo pra jogar com amigos está em [RELATORIO.md](RELATORIO.md#como-testar-com-amigos).

## Franquias

Cada franquia é um arquivo em `src/sources/`, na ordem de `SOURCES` (`src/sources/index.ts`).

| Chave | Rótulo | Lista | Imagem |
|---|---|---|---|
| `pokemon` | Pokémon | PokeAPI (`pokemon-species`) e, no fim, as Megas, Primais, formas regionais e outras formas que mudam de verdade, como Giratina (Origin) (`pokemon`) | arte oficial do repositório de sprites da PokeAPI |
| `digimon` | Digimon | Digi-API, todas as páginas | da própria API (detalhe sob demanda) |
| `smt` | SMT | `src/sources/smt.json` (pacote npm `megaten`), 297 demônios | `public/smt/*.webp` |
| `persona` | Persona | `src/sources/persona.json` (mesmo pacote), 95 personas dos personagens | `public/smt/*.webp` |
| `jojo` | JoJo | JoJo Wiki, categorias de Stands | imagem principal da página |
| `ygo` | Yu-Gi-Oh! | YGOPRODeck, os 3000 monstros mais vistos (cache de 7 dias) | arte recortada da YGOPRODeck |
| `bakugan` | Bakugan | Bakugan Wiki (Fandom) | imagem principal da página |
| `lol` | LoL | Data Dragon da Riot (versão mais nova) | splash centralizada do CommunityDragon, recortada pra preencher a carta |
| `overwatch` | Overwatch | OverFast API | render da Overwatch Wiki; sem ele, o retrato da API |
| `deadlock` | Deadlock | Deadlock API (`api.deadlock-api.com`), só heróis jogáveis | render da Deadlock Wiki (500px); sem ele, a carta da API |
| `ff` | Final Fantasy | `public/ff/list.json`, gerado pelo `ff.mjs` a partir da MoogleAPI (só monstros, sem personagens) | `images.moogleapi.com` |
| `sujimon` | Sujimon | `public/sujimon/list.json` (gerado pelo `sujimon.mjs`); sem ele, a Yakuza Wiki | `public/sujimon/*.webp` ou a wiki |

- O nome de cada personagem precisa ser único dentro da franquia: o saco de sorteio e o placar guardam pelo nome. Por
  isso o Final Fantasy põe o jogo no nome ("Bomb (FF VII)").
- Sujimon é opcional: se as duas fontes falharem, some de tudo. As outras mostram "falhou" no status.
- Se a wiki dos renders (Overwatch, Deadlock) falhar, a franquia carrega igual com a imagem da API.

## Desenvolvimento

React 19 + TypeScript (estrito) + Vite.

```sh
npm ci
npm run dev        # servidor local
npm run build      # gera dist/
npm run check      # typecheck + lint + Vitest + build + Playwright
```

Se o `npm` da máquina estiver quebrado, os mesmos comandos funcionam chamando o Node direto:

```sh
node node_modules/typescript/bin/tsc -b --noEmit
node node_modules/eslint/bin/eslint.js .
node node_modules/vitest/vitest.mjs run
node node_modules/vite/bin/vite.js build
node node_modules/@playwright/test/cli.js test
```

**Estrutura**

- `src/sources/`: uma franquia por arquivo, com o teste Vitest ao lado. `mediawiki.ts` tem a consulta paginada e a
  busca de imagens em lote (50 títulos por pedido) usada pelas wikis.
- `src/core/`: lógica pura sem React (saco de sorteio, campeonato, placar, roleta, localStorage).
- `src/state/`: estado do site e ações dos modos.
- `src/modes/`: um modo por pasta. `src/components/`: Carta, Arena, Roleta, Chaveamento, posições do Ranking, seletores.
- `src/online/`: modo online (redutor puro da sala, protocolo, transporte PeerJS).
- `src/customs/`: franquias personalizadas.
- `public/`: imagens e listas locais (`smt/`, `sujimon/`, `ff/`).

## Testes

- **Vitest** (`*.test.ts` ao lado do código): fontes, lógica pura e sala online. O `fetch` é falso
  (`src/sources/test-utils.ts`) e responde com `tests/fixtures/`.
- **Playwright** (`tests/*.spec.ts`): o site buildado, sem internet. `tests/helpers.ts` intercepta todas as APIs com as
  fixtures e troca toda imagem externa por um PNG cinza. Roda só no tamanho de computador (1280px): é um site pessoal,
  o layout de celular não tem teste próprio.
- **Fumaça no site publicado** (`tests/real/`): APIs de verdade, roda à parte com
  `node node_modules/@playwright/test/cli.js test -c playwright.real.config.ts`.

As fixtures são respostas reais reduzidas. `tests/sujidex-mock.ts` e `tests/wiki-renders-mock.ts` montam as respostas
das wikis a partir delas; servem tanto pro Vitest quanto pro Playwright.

## Listas salvas no repositório

Algumas fontes não podem ser lidas pelo navegador (sem CORS) ou dão trabalho demais na hora; um script gera a lista:

- `node ff.mjs`: baixa o bestiário da MoogleAPI pra `public/ff/list.json` (só monstros com imagem). A API não manda
  cabeçalho CORS, então o site lê a lista salva. Ela também lista como monstro os personagens que se enfrenta (Freya,
  Kefka, Sephiroth...): a lista `PESSOAS` do script tira esses, por nome exato e jogo. Rode de novo pra pegar monstros
  novos e confira os avisos.
- `node sujimon.mjs recortar`: recorta os screenshots do Sujidex de `sujimon/_orig/` pra `public/sujimon/`. Instruções
  no começo do arquivo.
- `node catalogo.mjs [chaves]`: gera `public/catalogo/<chave>.json` com o que a fonte informa de cada personagem (um
  coletor por franquia em `catalogo/`). A aba **Catálogo** lista cada franquia com essas informações, filtros e marcações
  do Set 1 do modo estilo TFT (salvas em `pdx-set1`), e exporta/importa um `set1.json`.
- Planejamento do Set 1 na mesma aba: grupo "Set 1 (base)", classes (com a ult padrão), linhas e rascunhos de
  habilidade vêm de `public/catalogo/set1-base.json` (gerado por `node docs/tft/base/gerar.mjs`); classes, habilidade,
  custo (1 a 5) e linha evolutiva de cada personagem (vista Linhas, subabas Classes e Custos, que conta quantos cabem em
  cada custo e avisa quem passou do limite) ficam em `pdx-set1-plano` e vão no `set1.json` (Importar restaura).

## Publicação

O trabalho acontece na branch `react`. O workflow `.github/workflows/pages.yml` roda typecheck, lint, Vitest e build em
todo push; na `react` (e em PRs) roda também o Playwright. Só a `main` publica no GitHub Pages:

1. Commit e push na `react`; esperar o CI ficar verde.
2. `git merge --no-ff react` na `main` (mensagem "Merge da branch react: ...") e push.
3. Esperar o deploy e rodar o teste de fumaça contra o site publicado.

## Dados dos jogadores

Ficam no localStorage com as chaves `pdx-stats` (placar e histórico), `pdx-bags` (saco de sorteio por franquia) e
`pdx-ygo-v1` (cache da lista de Yu-Gi-Oh!). O nome e o formato dessas chaves não mudam, pra ninguém perder o placar.

## Histórico

[RELATORIO.md](RELATORIO.md) conta a migração pro React, o Sujimon e o modo online (outubro de 2026).
