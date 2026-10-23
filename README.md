# Quem Você Prefere — Pokémon x Digimon x SMT x JoJo x Yu-Gi-Oh! x Bakugan x Sujimon

Site pessoal (em português) pra escolher entre personagens de franquias diferentes: Duelo (rei do morro), Trio,
Campeonato com chaveamento e Placar. Publicado no GitHub Pages.

## Desenvolvimento

React + TypeScript (estrito) + Vite.

```sh
npm ci
npm run dev        # servidor local
npm run build      # gera dist/
npm run check      # typecheck + lint + Vitest + build + Playwright
```

- `src/sources/`: uma franquia por arquivo (carga das listas).
- `src/core/`: lógica pura sem React (saco de sorteio, campeonato, placar, roleta, localStorage), com testes Vitest.
- `src/state/`: estado do site e ações dos modos.
- `src/modes/`: um modo por pasta. `src/components/`: Carta, Arena, Roleta, Chaveamento, seletores.
- `tests/`: Playwright sem internet (APIs respondem com `tests/fixtures/`).

Os dados dos jogadores ficam no localStorage com as chaves `pdx-stats`, `pdx-bags` e `pdx-ygo-v1`.
