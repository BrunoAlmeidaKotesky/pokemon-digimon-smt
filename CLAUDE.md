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

## Ambiente desta máquina

- `npm`/`npx` globais podem estar quebrados: chame as ferramentas por `node node_modules/<pacote>/...` (comandos no
  README e na skill `publicar`).
- `core.autocrlf=true`: arquivos novos com LF viram CRLF no checkout; o aviso do git é esperado.
- No Git Bash daqui, heredoc às vezes come barras invertidas: script com regex vai melhor escrito com a ferramenta de
  arquivo do que com `cat <<EOF`.
- Imagens da Fandom não carregam no Chromium headless (Cloudflare): pra olhar, use Playwright com `headless: false`.
