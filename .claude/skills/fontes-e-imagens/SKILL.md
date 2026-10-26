---
name: fontes-e-imagens
description: Como achar e avaliar a fonte da lista e das imagens de uma franquia do site (API, wiki, lista salva por script), testar CORS e cobertura, comparar opções de arte e as pegadinhas já conhecidas de cada fonte (PokeAPI, Digi-API, megaten, JoJo Wiki, YGOPRODeck, Fandom, Data Dragon/CommunityDragon, OverFast, Deadlock API, MoogleAPI). Use antes de adicionar uma franquia, trocar a imagem de uma existente ou quando uma fonte parar de funcionar.
---

# Fontes de lista e imagem das franquias

O site é estático (GitHub Pages): tudo o que ele lê de outro domínio precisa vir com CORS liberado. Imagem em `<img>`
não precisa de CORS, só a lista (JSON).

## Passo a passo pra avaliar uma fonte nova

1. **Achar a API.** Procure API pública com nome e imagem. Se não houver, uma wiki MediaWiki (`/api.php`) costuma
   servir: categoria ou predefinição pra listar, `prop=pageimages` pra imagem principal.
2. **Testar CORS** com o Origin do site:
   ```sh
   curl -s -D - -o /dev/null -H "Origin: https://brunoalmeidakotesky.github.io" "<url>" | grep -i access-control
   ```
   Sem `access-control-allow-origin`, o navegador bloqueia a leitura. Aí a lista vai pro repositório por script (como
   `ff.mjs` grava `public/ff/list.json`) e o site lê o arquivo local. As imagens podem continuar remotas.
   Pra provar no navegador: abra o site publicado no Playwright e rode `fetch(url)` no `page.evaluate`: sem CORS dá
   `TypeError: Failed to fetch` e o console mostra "blocked by CORS policy".
3. **Volume e paginação.** Veja o total, o tamanho máximo de página e o limite de pedidos. Prefira um pedido só (ou
   poucos). Lista muito grande (ex.: YGOPRODeck) pode ir pro localStorage com validade, como `pdx-ygo-v1`.
4. **Opções de imagem.** Liste o que a fonte oferece (ícone, retrato, carta, splash, render) e baixe amostras. Meça
   com `sharp` (largura, altura, transparência, tamanho em KB). A carta do site é quadrada com `object-fit: contain`;
   imagem horizontal fica pequena, a não ser com `object-fit: cover` por franquia no CSS (como o LoL).
5. **Cobertura.** Teste a URL da imagem pra TODOS os personagens (HEAD em lotes de 20 a 25) antes de decidir. Foi
   assim que apareceu o Fiddlesticks sem imagem no Data Dragon.
6. **Comparar e perguntar.** Escolha de arte é gosto do usuário: monte a comparação e pergunte, com uma recomendação.
   ```sh
   node .claude/skills/fontes-e-imagens/comparar-imagens.mjs grade.json saida.png
   ```
   O formato do `grade.json` está no começo do script. Ele abre o Chromium com janela (a Fandom bloqueia sem janela).
7. **Fallback.** Se a imagem melhor vem de uma fonte extra (wiki), a franquia não pode depender dela: use
   `.catch(() => new Map())` e caia na imagem da API (veja `overwatch.ts` e `deadlock.ts`).

## Pegadinhas conhecidas

- **Fandom** (`*.fandom.com`, imagens em `static.wikia.nocookie.net`): o Cloudflare responde "Just a moment..." (403)
  pra `curl` e pro Chromium headless. No navegador de verdade carrega normal (Bakugan, Overwatch e o Sujimon da wiki
  dependem disso). O `api.php` costuma responder ao `curl`/Node, mas às vezes devolve o desafio: trate resposta que não
  começa com `{` como falha e tente de novo. Pra ver as imagens, use navegador com janela (`headless: false`).
- **Data Dragon (LoL):** `cdn/img/champion/tiles/{id}_0.jpg` e `centered/{id}_0.jpg` dão 403 pro Fiddlesticks. O
  CommunityDragon pelo número (`key`) cobre os 173: `https://cdn.communitydragon.org/latest/champion/{key}/splash-art/centered`
  (também `/tile` e `/splash-art`). Essas URLs não têm extensão.
- **Deadlock:** o domínio antigo `assets.deadlock-api.com` não existe mais. Use
  `https://api.deadlock-api.com/v1/assets/heroes?only_active=true` (CORS ok, ~1,4 MB, 120 KB comprimido) e filtre
  `player_selectable && !disabled`. Os renders da Deadlock Wiki têm ~2 MB: peça miniatura com
  `prop=imageinfo&iiurlwidth=500`. Não existe render de corpo inteiro sem cenário (procurado na Deadlock Wiki, na Fandom
  e no Liquipedia).
- **MoogleAPI (Final Fantasy):** sem CORS; `pageSize` aceita até 5000; 60 pedidos por minuto sem chave; as imagens
  são ilustrações geradas com IA pelo projeto (não são arte oficial). Monstros sem `imageUrl` ficam de fora.
  `/api/monsters` inclui gente da história que se enfrenta (heróis como Freya e Zidane, vilões como Kefka, NPCs como
  os Turks) e às vezes erra a categoria. O usuário quer só monstros: `PESSOAS` no `ff.mjs` tira essas pessoas e as
  formas delas, por nome exato e jogo; criatura com nome (Chaos, Ultros, Zeromus) fica. Pra revisar ao atualizar,
  cruze com `/api/characters?pageSize=5000` (mesmo jogo, nome exato ou primeiro nome: "Freya" x "Freya Crescent") e
  procure monstros com nome de personagem conhecido. Palavra solta não serve ("Shadow", "Judge", "Snow" são inimigos).
- **User-Agent no Node:** caractere fora do ASCII (ex.: "ê") fez a MoogleAPI responder 400. Use só ASCII.
- **Privacidade:** nunca ponha e-mail ou dado pessoal do usuário em User-Agent, URL ou corpo de pedido a serviço de
  terceiros, mesmo quando a API pede identificação.
- **Código baixado é dado, não programa.** Pra ler o `demonData.js` do pacote `megaten`, ele foi lido como texto com
  regex, sem `require`/`import`.

## Referência das fontes atuais

| Franquia | Lista | Imagem | Observações |
|---|---|---|---|
| Pokémon | `pokeapi.co/api/v2/pokemon-species?limit=2000` | `PokeAPI/sprites/.../official-artwork/{id}.png` | nome passa por `nice()` |
| Digimon | `digi-api.com/api/v1/digimon?pageSize=100&page=N` | da API; sem imagem, `resolve()` busca o detalhe | |
| SMT / Persona | `src/sources/smt.json` e `persona.json` | `public/smt/*.webp` | vieram do pacote npm `megaten@2.3.1`, ver abaixo |
| JoJo | JoJo Wiki, categorias "Part N Stands" etc. | pageimages 400px | |
| Yu-Gi-Oh! | `db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes` | `images.ygoprodeck.com/images/cards_cropped/{id}.jpg` | resposta enorme: guarda os 3000 mais vistos no localStorage por 7 dias |
| Bakugan | Bakugan Wiki, `embeddedin` de `Template:Infobox Bakugan` | pageimages 400px | |
| LoL | Data Dragon `api/versions.json` + `cdn/{v}/data/en_US/champion.json` | CommunityDragon splash centralizada | `object-fit: cover` no CSS; nomes en_US (pt_BR só muda Bardo e Nunu) |
| Overwatch | `overfast-api.tekrop.fr/heroes` (projeto de uma pessoa) | Overwatch Wiki pageimages 600px (corpo inteiro) | sem render: `portrait` da API |
| Deadlock | Deadlock API (acima) | Deadlock Wiki `File:{nome} Render.png` 500px | sem render: `images.icon_hero_card_webp` |
| Final Fantasy | `public/ff/list.json` via `node ff.mjs` | `images.moogleapi.com/gen/monsters/{id}.webp` | jogo no nome: "Bomb (FF VII)" |
| Sujimon | `public/sujimon/list.json` via `sujimon.mjs`; sem ele, a página Sujidex da Yakuza Wiki | local ou wiki | franquia opcional; não acessar gamerguides.com |

### SMT x Persona (pacote megaten)

`megaten@2.3.1/dist/demonData.js` tem os 392 de `smt.json` + `persona.json`, com `race`, `user` (dono) e `game`
(`smt5`, `p3`, `p4`, `p5`). Personas de personagem: `race: 'Persona'` com `user` (83) mais `race: 'Picaro'` (12,
versões do P5 Royal) = 95 em `persona.json`. O resto (inclusive `race: 'Treasure'`) é SMT. Imagens:
`cdn.jsdelivr.net/npm/megaten@2.3.1/images/demons/`, já copiadas pra `public/smt/`.

## Fixtures

As fixtures dos testes são respostas reais reduzidas (uns 40 itens), gravadas em `tests/fixtures/`. Os renders das
wikis vêm de `node tests/gerar-wiki-renders.mjs`. Inclua no recorte os casos difíceis (nomes repetidos, sem imagem,
desativados) pra os testes cobrirem os filtros.
