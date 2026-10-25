---
name: publicar
description: Publica o site Quem Você Prefere no GitHub Pages pelo fluxo do repositório — checagens locais, commit e push na branch react, espera o CI (com Playwright), merge --no-ff na main, espera o deploy e roda o teste de fumaça contra o site no ar. Use quando o usuário pedir pra publicar, subir ou "colocar no ar".
---

# Publicar

A `main` só recebe merge da `react` com tudo verde; nada de `push --force` nem reescrever histórico. Commits e
mensagens de merge em português. Só publique quando o usuário pedir.

## 1. Checagens locais

Se `npm` funcionar, `npm run check` faz tudo. Nesta máquina o `npm`/`npx` global costuma estar quebrado; então:

```sh
node node_modules/typescript/bin/tsc -b --noEmit
node node_modules/eslint/bin/eslint.js .
node node_modules/vitest/vitest.mjs run
node node_modules/vite/bin/vite.js build
node node_modules/@playwright/test/cli.js test        # sobe o vite preview sozinho (playwright.config.ts)
```

Os 8 testes pulados do Playwright são esperados (screenshots só com `SHOTS`, e layouts que valem só pra um tamanho de
tela).

## 2. Commit e push na `react`

- Adicione os caminhos explicitamente (`git add src tests README.md ...`); nunca `git add -A`: o
  `PROMPT-claude-code.md` da raiz é do usuário e fica fora do git.
- Mensagem: título curto no estilo do histórico ("LoL, Overwatch e Deadlock como franquias novas, direto das APIs") e
  corpo com o porquê.

```sh
git push origin react
```

## 3. Esperar o CI da `react`

`gh run watch` às vezes sai com erro por timeout de TLS mesmo com o run em andamento; um laço com `gh run view` é
mais confiável:

```sh
sha=$(git rev-parse HEAD); id=""
for i in $(seq 1 12); do id=$(gh run list --branch react --limit 3 --json databaseId,headSha -q '.[] | select(.headSha=="'$sha'") | .databaseId' 2>/dev/null | head -1); [ -n "$id" ] && break; sleep 5; done
r="?"; until [ "${r%% *}" = "completed" ]; do sleep 15; r=$(gh run view "$id" --json status,conclusion -q '.status+" "+.conclusion' 2>/dev/null || echo "?"); done; echo "$r"
```

(Se o shell bloquear `sleep`, troque por `node -e "setTimeout(()=>{},15000)"`.) Só siga com `completed success`.

## 4. Merge na `main`

```sh
git checkout main && git pull --ff-only origin main
git merge --no-ff react -m "Merge da branch react: <resumo>"
git push origin main
git checkout react
```

Espere o run da `main` do mesmo jeito (`--branch main`, sha de `main`): os jobs `build` e `deploy` precisam terminar
com `success`.

## 5. Conferir o site no ar

```sh
node node_modules/@playwright/test/cli.js test -c playwright.real.config.ts
```

Roda contra https://brunoalmeidakotesky.github.io/pokemon-digimon-smt/ com as APIs de verdade e imprime a linha de
status (contagem por franquia). Também roda o teste do PeerJS. Pra ter certeza de que a versão nova está no ar, procure
no bundle publicado um texto que só existe nela (`assets/index-*.js`, lido a partir do `index.html`).

Imagens da Fandom não carregam no Chromium headless: o teste de fumaça só confere as imagens do duelo padrão
(Pokémon x Digimon). Pra olhar outras franquias no ar, use navegador com janela.
