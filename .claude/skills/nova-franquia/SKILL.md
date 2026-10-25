---
name: nova-franquia
description: Checklist completo pra adicionar (ou separar/renomear) uma franquia no site Quem Você Prefere — fonte em src/sources, testes Vitest, fixture, título, cores, roleta, sala online, mocks e specs do Playwright, README. Use sempre que o pedido for "coloca a franquia X no site", "separa X de Y" ou trocar a chave/rótulo de uma franquia.
---

# Adicionar uma franquia

Antes de escrever código, decida a fonte com a skill `fontes-e-imagens` (CORS, cobertura de imagem, qual arte).
Depois de pronto, publique com a skill `publicar`.

## Decisões

- **Chave** curta em minúsculas (`lol`, `ff`), estável: o placar (`pdx-stats`) e o saco (`pdx-bags`) guardam por
  chave. Nunca reaproveite nem renomeie a chave de uma franquia que já existe; mude só o rótulo (como `smt`, que passou
  de "SMT/Persona" pra "SMT").
- **Rótulo** como aparece no site (`'LoL'`, `'Final Fantasy'`).
- **Ordem:** antes de `sujimon`, que fica por último porque o título mostra ele só quando carrega. Franquias da mesma
  série ficam juntas (`smt`, `persona`).
- **Nome único** dentro da franquia: o saco de sorteio e o placar usam o nome como chave. Se a fonte repete nomes (o
  mesmo monstro em jogos diferentes), ponha o diferencial no nome: `"Bomb (FF VII)"`.
- **Falha:** franquia normal mostra "falhou" no status; `optional: true` (só o Sujimon) some de tudo.
- **Lista pronta:** se a lista é fixa no bundle, use `initial` (SMT, Persona) e ela não passa por "carregando".
- **Cor:** uma pro tema claro e outra pro escuro, num tom livre. Hoje (claro / escuro):
  pokemon `#d6302a`/`#ff5a4f`, digimon `#1f6fd1`/`#4f9bff`, smt `#7a1fa8`/`#b866e8`, persona `#a0168f`/`#e879d6`,
  jojo `#0c8a5a`/`#3fd39a`, ygo `#c2410c`/`#ff8a4c`, bakugan `#0e8fa8`/`#3cc8e6`, lol `#4a3fc4`/`#9a92ff`,
  overwatch `#5a6f8a`/`#9fb5d0`, deadlock `#77791a`/`#c9cc5e`, ff `#3f8a1c`/`#86d95a`, sujimon `#c0267a`/`#ff6fb5`,
  e `--gold` `#c58a00`/`#ffc23d` é da coroa e da roleta (não use). Cinza-escuro some no título (fica igual aos "x").
  Confira nos dois temas com screenshot.

## Arquivos

**Código**
1. `src/sources/<chave>.ts`: `export const <chave>: Source = { key, label, load }`. `load()` lança `Error('vazio')` se
   não sobrar nada. Comentário no topo dizendo de onde vem a lista e a imagem. Wiki: use `collectPages`/`wikiItems`
   ou `pageThumbs`/`fileThumbs` de `mediawiki.ts`. Lista local: `fetch('<pasta>/list.json')` (URL relativa).
2. `src/sources/index.ts`: import e posição em `SOURCES`. `KEYS` e `LABELS` saem daí.
3. `src/types.ts`: a lista de chaves no comentário de `FranchiseKey`.
4. `src/App.tsx`: `<span className="<classe>">Rótulo</span>` no `h1`, na mesma ordem.
5. `src/styles.css`: `--<chave>` no `:root` claro e no escuro, `h1 .<classe>{color:var(--<chave>)}` e
   `.card[data-fr=<chave>]{--c:var(--<chave>)}`. Arte horizontal que deve preencher a carta: regra de `object-fit:
   cover` como a do LoL (carta, `.slot .th img` do chaveamento e `.team li img` do Draft).
6. `src/online/room.ts`: `LABELS` e `DEFAULT_CONFIG.cup.frs`.
7. A roleta (`SpinButton.tsx`) e o placar já se montam a partir de `KEYS`: nada a fazer.

**Vitest**
8. `src/sources/<chave>.test.ts` (modelo: `bakugan.test.ts`, `deadlock.test.ts`): rótulo e chave, URLs pedidas,
   contagem e primeiro item da fixture, filtros, fallback de imagem, lista vazia (`'vazio'`) e API com erro.
9. `src/sources/test-utils.ts`: rota da fixture em `fixtureRoute`.
10. `src/sources/index.test.ts` (chaves, rótulos, "as N franquias", `initial`) e `src/online/room.test.ts`
    (`DEFAULT_CONFIG`, `frLabel`, avisos com o rótulo).
11. `tests/fixtures/<chave>*.json`: resposta real reduzida (uns 40 itens) com os casos difíceis.

**Playwright**
12. `tests/helpers.ts`: `Franquia`, `LABEL`, `CONTAGEM` (na ordem de `KEYS`) e a rota em `mockApis` com
    `count('<chave>')`, `espera('<chave>')` e `falha.has('<chave>')`. Lista local fica no ramo de `localhost`, antes
    do `route.continue()`. URL de imagem sem extensão precisa cair na rota de imagem (ver a regra do CommunityDragon).
13. Specs que costumam mudar: `carregamento.spec.ts` (texto do `h1`, chamadas, teste de "falhou", um teste próprio da
    franquia nova), `placar.spec.ts` (`ORDEM` e linhas das barras), `screenshots.spec.ts` (placar semeado),
    `campeonato.spec.ts` (comentário com o número de franquias), `online-draft.spec.ts` e `quarteto.spec.ts` se o
    rótulo de uma franquia mudar, e `tests/real/site-real.spec.ts` (lista de rótulos).

**Docs**
14. `README.md`: título e tabela de franquias. Script novo de lista: seção "Listas salvas no repositório".

## Verificação

- `tsc -b --noEmit`, `eslint .`, Vitest, build e Playwright inteiros (comandos na skill `publicar`).
- Olhe de verdade: `vite --port 5299` e um script Playwright com janela que escolhe a franquia no Trio e tira
  screenshot nos temas claro e escuro (`colorScheme: 'dark'`). Imagens da Fandom só aparecem com janela.

## Dividir o trabalho

Funcionou bem: fazer `src/` + fixture + Vitest e, em paralelo, um subagente atualizando `tests/helpers.ts` e os
specs do Playwright, com a lista exata de chave, rótulo, contagem da fixture, URLs e ordem. Depois, rodar tudo de novo
por conta própria antes de publicar.
