# Quem Você Prefere

Site pessoal em português (React + TypeScript estrito + Vite) publicado no GitHub Pages. Visão geral, franquias,
testes e publicação: [README.md](README.md).

## Regras

- Tudo que o usuário vê, comentários, commits e mensagens de merge: em português.
- Trabalhe na branch `react`. A `main` só recebe `merge --no-ff` da `react` com CI verde, e só quando o usuário pedir
  pra publicar. Nada de `push --force`.
- Não mude o nome nem o formato das chaves do localStorage (`pdx-stats`, `pdx-bags`, `pdx-ygo-v1`) nem a chave de uma
  franquia existente: é o placar de quem já usa o site.
- `PROMPT-claude-code.md` na raiz é do usuário: não comite nem apague.
- Não acesse gamerguides.com (bloqueia agentes de IA).
- Nunca mande o e-mail ou outro dado pessoal do usuário pra serviço de terceiros (User-Agent, URL, corpo).
- Escolha de arte/imagem é gosto do usuário: mostre a comparação e pergunte, com uma recomendação.

## Skills do projeto (`.claude/skills/`)

- `nova-franquia`: checklist de todos os arquivos ao adicionar, separar ou renomear uma franquia.
- `fontes-e-imagens`: como avaliar uma fonte (CORS, cobertura de imagem), comparar artes e as pegadinhas de cada API.
- `publicar`: checagens, `react` → CI → `main` → deploy → teste de fumaça no site no ar.

## Modo estilo TFT (em planejamento)

- Decisões, discutidas com o usuário: doc compartilhado "Modo estilo TFT: planejamento"
  (https://claude.ai/artifact/YZWHvKZY5tyVaJSqgz8Hx7). Já decidido: set fixo e curado, origem = franquia, classes
  gerais que cruzam franquias.
- Detalhes técnicos de cada fonte (campos, cobertura, custo): [docs/tft/notas-tecnicas.md](docs/tft/notas-tecnicas.md).
- Contas do jogo (equilíbrio dos traços, loja, economia), sobre o nosso set e não copiadas do TFT da Riot (o usuário
  não quer o LoL como régua): [docs/tft/matematica/](docs/tft/matematica/README.md). Conta nova vai pra lá (função em
  `lib.mjs` com teste, saída em `resultado.md`), não em chute.
- `node catalogo.mjs` gera `public/catalogo/<chave>.json` (informações de cada personagem) pra aba Catálogo, onde o
  usuário marca e exporta os personagens do Set 1.

## Ambiente desta máquina

- `npm`/`npx` globais podem estar quebrados: chame as ferramentas por `node node_modules/<pacote>/...` (comandos no
  README e na skill `publicar`).
- `core.autocrlf=true`: arquivos novos com LF viram CRLF no checkout; o aviso do git é esperado.
- No Git Bash daqui, heredoc às vezes come barras invertidas: script com regex vai melhor escrito com a ferramenta de
  arquivo do que com `cat <<EOF`.
- Imagens da Fandom não carregam no Chromium headless (Cloudflare): pra olhar, use Playwright com `headless: false`.
