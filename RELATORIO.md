# Relatório da noite: "Quem Você Prefere" em React, Sujimon e modo online

Data: 23/10/2026. Branch de trabalho: `react`. Tag do site antigo: `antes-do-react`.

## Resumo

| Etapa | Estado | Onde |
|---|---|---|
| 0. Preparação | concluída | tag `antes-do-react`, branch `react` |
| 1. Testes do site atual | concluída | `d9b8d8d` |
| 2. Porte pra React + TypeScript + Vite | concluída | `991c6f3` |
| 3. Publicação pelo GitHub Actions | concluída (Pages já publica pelo Actions) | `687cea1`, `0b52c5e` |
| 4. Sujimon | concluída do jeito que você decidiu: Yakuza Wiki + script pra você rodar | `f9c904d` |
| 5. Salas online (Duelo, Trio, Campeonato) | concluída | `3b04c56` |
| 6. Draft online | concluída | `4c07045` |
| 7. Revisão e relatório | concluída | este arquivo |
| Extra: Quarteto e franquias personalizadas (pedido durante a noite) | concluída | `3b156f5` e o commit seguinte |

**Está tudo no ar.** Cada etapa entrou na `main` com merge (`--no-ff`, dá pra reverter um merge sozinho) só depois
dos testes passarem no CI. Depois de cada deploy, rodei um teste de fumaça contra o site real, com as APIs de
verdade: abre, carrega as franquias, faz um duelo e, desde a etapa 5, cria uma sala online com PeerJS de verdade
entre dois navegadores e vota. A `main` e a `react` têm o mesmo código; a `main` só tem os commits de merge a mais.

`npm run check` (typecheck + lint + Vitest + build + Playwright) passa inteiro: 463 testes Vitest e 210 Playwright
(6 pulados de propósito: os de layout de um projeto só e os de screenshot, que só rodam com `SHOTS=...`).

## O que foi feito em cada etapa

### Etapa 0
- Tag `antes-do-react` na `main` antiga e branch `react`, as duas no GitHub.
- `sujimon/_orig/` não existia (nem às 04:10, nem depois).

### Etapa 1: testes do site antigo
- Playwright (Chromium) em celular (390×844) e computador (1280×800), **sem internet**: `tests/helpers.ts`
  intercepta tudo. As APIs respondem com fixtures do formato real em `tests/fixtures/` (consultei cada API uma vez
  pra copiar o formato), as imagens externas com um PNG mínimo, e o que sobrar é bloqueado.
- `Math.random` com semente via `addInitScript` (`window.__reseed(n)` recomeça a sequência).
- Cobre carregamento e status (inclusive franquia que falha e Sujimon sem `list.json`), Duelo, Trio, Roleta e
  teclado, Campeonato de 8/16/32 com e sem "evitar mesma franquia", franquia pequena, Placar (limite de 30, Zerar),
  localStorage pré-preenchido (`pdx-stats`, `pdx-bags`, `pdx-ygo-v1` com e sem cache válido) e sorteio sem repetição.
- Screenshots de referência em `relatorio/antes/` (fora do git), determinísticos byte a byte.

### Etapa 2: porte
- Vite + React 19 + TypeScript 6 estrito, `base: './'`, imagens em `public/`.
- `src/sources/` (uma franquia por arquivo), `src/core/` (lógica pura com Vitest), `src/state/app.ts` (controlador
  que reproduz o fluxo antigo **na mesma ordem de chamadas a Math.random**), `src/modes/`, `src/components/`, e a
  lista de SMT em `smt.json`.
- Os testes da etapa 1 rodam contra a versão nova (`vite preview`) sem mudar o comportamento esperado.
- Screenshots `relatorio/depois/` × `relatorio/antes/`: no máximo 0,006% de pixels diferentes (veja abaixo).

### Etapa 3: publicação
- `.github/workflows/pages.yml`: em push na `main` roda `npm ci`, typecheck, lint, Vitest, build e Playwright e
  publica com `upload-pages-artifact` + `deploy-pages`. Na `react` e em PR só checa.
- `gh api -X PUT .../pages -f build_type=workflow` funcionou: o Pages publica pelo Actions.
- `tests/real/` + `playwright.real.config.ts`: fumaça contra o site publicado (`npx playwright test -c playwright.real.config.ts`).

### Etapa 4: Sujimon
- `sujimon/_orig/` não existe. Você pediu pra eu pegar da gamerguides.com e eu recusei, porque o documento proíbe
  e o site bloqueia agentes de IA. Você decidiu: Yakuza Wiki + um script pra você rodar.
- **No ar agora:** sem `public/sujimon/list.json`, o Sujimon vem da Yakuza Wiki (Fandom), da tabela "List of
  Sujimon (LaD:IW)" da página Sujidex, com a imagem da página de cada um ou, se não tiver, o ícone da tabela.
- **Entraram 154 Sujimon. Ficaram de fora 163**, que não têm nenhuma imagem na wiki. A lista completa (número e
  nome) está em [`relatorio/sujimon-fora.md`](relatorio/sujimon-fora.md). Quase todos são os Sujimon novos de
  Infinite Wealth (133 a 281) e alguns personagens.
- `sujimon.mjs`: `baixar` (você roda) e `recortar` (só local, grava em `public/sujimon/`). Testei o `recortar` com
  screenshots sintéticos. O `baixar` não foi testado, porque eu não acesso a gamerguides. Com a lista local, o site
  passa a usá-la no lugar da wiki.
- Teste: com `list.json`, o Sujimon aparece nos seletores, no campeonato e no título; sem ele, vem da wiki; sem os
  dois, some de tudo.

### Etapa 5: salas online
- WebRTC com PeerJS (npm, carregado só quando você entra na aba Online), com o host como autoridade.
- Lógica pura em `src/online/room.ts`, `draft.ts` e `view.ts` (estado + ação → novo estado), mensagens tipadas e
  validadas em `protocol.ts` (mensagem inválida é ignorada), e transporte com duas implementações: PeerJS e
  `BroadcastChannel` (`?transporte=local`, só pra teste).
- Sala com código de 4 letras e link `?sala=ABCD`; lobby; configuração só do host; voto secreto; roleta nas rodadas;
  empate na roleta só entre os empatados (mesma animação pra todos); reconexão; host remove ou encerra a votação;
  aviso quando o host sai; erro claro quando a rede bloqueia o P2P, com campo pra TURN.
- Playwright com 3 participantes (transporte local): votação comum, empate com roleta (Trio 1-1-1 e Duelo 1-1),
  voto secreto ligado e desligado, roleta do host, jogador que cai e volta, removido pelo host, host que sai e
  campeonato até o fim. Fumaça com PeerJS de verdade entre dois contextos: passou no local e no site publicado.

### Etapa 6: Draft
- Configuração: franquias e ordem (↑ ↓ ×, + pra adicionar), opções por franquia (2 a 6, padrão 3) e rodadas
  (1 a 5, padrão 1), mais voto secreto e roleta.
- Escolha secreta do time inteiro, repetidos refeitos por todos sem dizer qual personagem nem quem, revelação e
  votação franquia por franquia com o nome de quem escolheu, exclusão entre rodadas, "Rodada X de Y", classificados,
  final com bye e tela de fim (campeão, quem escolheu, em qual rodada e o que cada um escolheu em cada rodada).
- Vitest: repetido duas vezes seguidas, exclusão entre rodadas, bye (3, 5 e 6 classificados), empate, skip, quem
  entra no meio, segredo da visão. Playwright: Draft de 2 rodadas × 3 franquias com 3 participantes, do começo ao fim,
  com um repetido forçado pela semente.

### Extra: Quarteto e franquias personalizadas (o que você pediu no meio da noite)
- **Quarteto** (solo e online): igual ao Trio, com quatro franquias (padrão Pokémon, Digimon, SMT e JoJo), teclas
  1 a 4, roleta e Placar. No celular as cartas ficam numa grade 2×2. O Trio e o Quarteto usam o mesmo código de N
  lados, com as chamadas a Math.random na mesma ordem de antes (os testes e screenshots do Trio não mudaram).
- **Franquias personalizadas**: aba nova **Personalizar**.
  - Você cria grupos, arrasta, cola ou escolhe imagens (no celular, pelo botão "Escolher imagens") e dá um nome a
    cada uma.
  - As imagens são reduzidas no próprio aparelho (até 512px, WebP).
  - Cada grupo vira uma franquia nos seletores do Duelo, Trio e Quarteto, no Campeonato e no lobby das salas online,
    valendo pra Duelo, Trio, Quarteto, Campeonato e Draft.
  - **Nada é salvo:** some ao fechar ou recarregar a aba. Nem o localStorage guarda nome, imagem ou chave dessas
    franquias; confronto com franquia personalizada não entra no Placar, e o sorteio delas usa um saco só na memória.
- **Na sala online:**
  - o host vê o mesmo editor no lobby (são as mesmas franquias da aba Personalizar);
  - os jogadores recebem os grupos com as imagens assim que entram e a cada mudança;
  - com **"Deixar os jogadores adicionarem imagens e mudarem os rótulos"** ligado (começa desligado), eles podem
    adicionar imagens e renomear; criar ou apagar grupo é só do host;
  - tudo vale só enquanto a sala existir.
- Testes: Vitest do modelo, do registro e da validação pela rede. Playwright: aba Personalizar (escolher, arrastar,
  rotular, usar no Duelo, nada no localStorage, some ao recarregar, apagar grupo) e sala online (host cria, convidado
  vê, com permissão adiciona e renomeia, Duelo com a franquia personalizada). Quarteto: solo e online.
- Na nav do celular as 7 abas ocupam 3 linhas (antes eram 2).

### Etapa 7
- `npm run check` inteiro passando, revisão independente por um subagente (resultado abaixo) e este relatório.

## O que você precisa fazer de manhã

Nada é obrigatório: o site está no ar e funcionando. Opcionais:

1. **Testar com os amigos** (passo a passo abaixo).
2. **Sujimon completos:** na pasta do repositório, rode
   `npm install --no-save sharp@0.33.5 cheerio@1.0.0`, depois `node sujimon.mjs baixar` (demora: tem uma pausa entre
   os pedidos), `node sujimon.mjs recortar --teste`, confira as imagens em `public/sujimon/_teste/`, ajuste
   `RECORTE` no topo do script se precisar, rode `node sujimon.mjs recortar` e faça commit de
   `public/sujimon/*.webp` e `public/sujimon/list.json`.
3. O `PROMPT-claude-code.md` ficou na raiz sem commit. Apague ou comite, como preferir.

## Como testar com amigos

1. Abra https://brunoalmeidakotesky.github.io/pokemon-digimon-smt/ e vá na aba **Online**.
2. Digite seu apelido e toque em **Criar sala**. Aparece o código de 4 letras e o link.
3. Mande o link (botão **Copiar link** ou **Convidar** no celular). Quem abre o link só digita o apelido e toca em
   **Entrar**; dá também pra digitar o código na aba Online.
4. No lobby, escolha o modo (Duelo, Trio, Campeonato ou Draft), as franquias e as opções, e toque em **Começar**.
5. Cada um vota no próprio aparelho. O resultado aparece quando todos votam; o host toca em **Próximo** pra seguir.
   Se alguém sumir, o host vê quem falta e pode tocar em **Encerrar votação** ou no **×** do jogador (toque duas
   vezes pra confirmar).
6. **Quem cria a sala precisa ficar com a página aberta.** Se o host fechar a página (ou o celular dele matar a aba),
   a sala acaba e todo mundo vê o aviso. O site pede pra tela não apagar enquanto você está numa sala.
7. **Se não conectar:**
   - "Não achei a sala": confira o código; a sala some quando o host sai.
   - "a rede bloqueou a conexão direta": troque de rede (por exemplo, o 4G no lugar do Wi-Fi da empresa ou faculdade).
   - Se continuar: crie um servidor TURN (Metered, Twilio ou um coturn próprio) e preencha em **Problemas de
     conexão?**, na aba Online, de preferência em todos os aparelhos. Ou coloque o TURN no código, em
     `TURN_SERVERS` (`src/online/config.ts`).
   - Quem cair volta sozinho (tenta por uns 50 s) ou reabrindo o link no mesmo aparelho, e recupera o lugar e o voto.

## Decisões que tomei

**Sujimon e regras**
- Não acessei a gamerguides.com, mesmo com o seu pedido no meio da noite: o documento proíbe e o site bloqueia
  agentes de IA. Você escolheu a alternativa (wiki + script). O script `baixar` é seu pra rodar.
- Sujimon da wiki entra só com imagem; quem não tem imagem fica de fora em vez de aparecer com "sem imagem".

**Porte (comportamento idêntico, de propósito)**
- **Bug antigo mantido:** o painel "Novo campeonato" continua visível durante o campeonato (no site antigo,
  `.stack{display:grid}` anula o atributo `hidden`). Corrigir mudaria o visual, e a regra era só portar.
- **Mantidas outras esquisitices antigas**, porque os testes da etapa 1 registram o comportamento:
  - o desafiante pré-sorteado é descartado no carregamento;
  - aparece "1 vitórias seguidas";
  - "Zerar placar" não zera a sequência em andamento;
  - o Placar lista o Sujimon mesmo quando ele some;
  - o Trio não conta pra "maior sequência".
- **Única diferença interna:** trocar de aba no meio da roleta agora cancela o giro de verdade. No antigo, o timer
  continuava e podia destravar a tela no meio de um giro novo. O que se vê é o mesmo.
- O controlador (`src/state/app.ts`) é imperativo de propósito: reproduz o JS antigo na mesma ordem, e por isso os
  screenshots com semente batem quase pixel a pixel.

**Ferramentas**
- O `npm` desta máquina está quebrado (mistura nvm 20 com node 24). Usei um npm 12 avulso no scratchpad. O CI usa o
  npm do Node 24.
- TypeScript 6.0.3: o typescript-eslint ainda não aceita o TS 7.

**Modo online**
- **Fluxo da partida:**
  - depois de cada resultado, o host toca em "Próximo", pra todos verem os votos;
  - a "roleta nas rodadas" e o voto secreto começam sempre desligados em cada sala nova (o resto da última
    configuração do host é lembrado);
  - dá pra trocar o voto até todos votarem.
- **Jogadores:**
  - quem entra no meio da partida vota já na votação aberta (o resultado espera por ele); no Draft, monta time a
    partir da próxima rodada;
  - jogador que cai continua na sala como "fora do ar" e a votação espera: o host decide remover ou encerrar;
  - **apelido de jogador fora do ar recupera o lugar** mesmo de outro aparelho (útil se o celular limpou os dados).
    O risco é alguém "assumir" o lugar de quem caiu digitando o mesmo apelido; entre amigos, achei que valia;
  - a volta pelo mesmo aparelho usa uma senha que só fica no localStorage dele. O id que os outros veem é outro,
    então ninguém toma o lugar de alguém só copiando o id;
  - a mesma pessoa abrindo a sala em outra aba: a aba nova fica, e a antiga sai com um aviso (sem ficar reconectando);
  - limite de 16 jogadores; código de 4 letras sem I e O.
- **Conexão:**
  - o host avisa a saída ao fechar a página;
  - o jogador detecta a queda por heartbeat (4 s, timeout 12 s) e tenta reconectar por uns 50 s;
  - o PeerJS usa o servidor de convites público e o TURN público dele, mais o seu, se configurado.
- **Dados locais:**
  - partidas online usam um saco de sorteio próprio, na memória do host, sem mexer no `pdx-bags` nem no Placar;
  - chaves novas no localStorage: `pdx-online-id`, `pdx-online-nome`, `pdx-online-cfg` (última configuração do
    host) e `pdx-turn`.
- **Testes:** `?jogador=N` só existe com `?transporte=local`, pra várias abas do mesmo navegador serem pessoas
  diferentes.

**Quarteto e franquias personalizadas**
- O Quarteto conta no Placar como o Trio (o texto virou "Duelo, Trio e Quarteto") e não conta pra "maior sequência",
  que continua sendo só do Duelo.
- Nada das franquias personalizadas fica no Placar nem no localStorage, pra cumprir o "nada fica salvo". Um
  confronto em que uma delas participa simplesmente não é gravado.
- Limites: 8 grupos, 200 imagens por grupo, rótulos de até 40 caracteres, imagem reduzida pra até 512px. Nomes
  repetidos dentro de um grupo ganham " (2)", " (3)" no jogo, porque o sorteio usa o nome como chave.
- Na sala, o host manda a lista completa (com as imagens) quando alguém entra e quando ela muda, juntando mudanças
  seguidas. Os votos e cartas levam só uma referência (`cst:grupo/imagem`), pra não repetir as imagens a cada voto.
- Rótulos são enviados ao sair do campo ou apertar Enter, não a cada tecla.

**Draft**
- **Sorteio e repetidos:**
  - cada jogador tem o próprio saco por franquia (sorteio independente, sem repetir até passar por todos);
  - quando mais de uma franquia tem repetido, todas são refeitas juntas;
  - repete até não ter repetido, sem limite (cada refação tira o repetido das opções, então sempre termina);
  - se uma franquia acabar (personagens já usados), as opções ignoram os já usados, mas nunca o repetido.
- **Escolha:**
  - o host pode "Seguir sem quem falta"; o time pulado fica fora daquela rodada, com as escolhas parciais descartadas;
  - "Seu time" mostra só as próprias escolhas.
- **Final:**
  - os byes ficam espalhados ao acaso e passam sozinhos quando chega a vez (até lá aparecem como "???", pra não dar
    spoiler);
  - 1 classificado vira campeão direto.

## Diferenças visuais que sobraram

Comparação pixel a pixel (`node tests/comparar-screenshots.mjs`) dos screenshots de antes e depois do porte, em
celular e computador, nos temas claro e escuro. O resultado completo está em
[`relatorio/diferencas.md`](relatorio/diferencas.md). A maior diferença é de **0,006% dos pixels** (Placar no
celular), coisa de serrilhado de texto. Não há diferença visível. As imagens ficam em `relatorio/antes/`,
`relatorio/depois/` e `relatorio/diff/`, nesta máquina (fora do git).

As únicas mudanças visuais nas telas antigas são as abas novas **Quarteto**, **Personalizar** e **Online** na
barra (no celular a barra passou a ocupar 3 linhas) e o texto do Placar, que virou "Duelo, Trio e Quarteto". Com
elas, 4 telas do celular passam um pouco da tolerância de 0,5% (até 0,6%), e o resto continua igual
(`relatorio/diferencas.md` tem os números atualizados).

## Revisão independente

Um subagente que não participou do trabalho revisou o código e os testes contra o documento. Ele comparou o modo
solo linha a linha com `antes-do-react:index.html` e não achou regra faltando nem mudança no comportamento antigo.

**Defeitos que ele achou (todos no modo online) e já estão corrigidos:**

1. A roleta de empate não animava numa segunda sala aberta na mesma aba, porque o id da roleta recomeça a cada sala.
   A chave da animação agora é código da sala + id.
2. Duas abas com o mesmo aparelho ficavam se derrubando em loop. Agora o host avisa a aba antiga (`replaced`), e
   ela sai sem tentar voltar. Tem teste e2e.
3. As cartas remontavam a cada voto, mostrando "carregando…" de novo. Agora as chaves são estáveis e a carta só
   recarrega se a imagem mudar.
4. Voto secreto e roleta vinham ligados na sala seguinte de quem já tinha ligado. Agora começam sempre desligados.
5. A mensagem `state` era validada só por cima. Agora a visão é conferida por modo (jogo, votação, resultado,
   roleta e configuração). Pra garantir, a aba Online ganhou uma proteção que mostra um aviso em vez de deixar a
   tela em branco.

**Sugestões que também apliquei:**
- Sem limite de refações no Draft.
- Senha do aparelho separada do id público.
- Nome limpo antes de validar a entrada.
- Classe própria no `body` pra roleta online (não mexe na roda do solo).
- Dica de rede/TURN quando a reconexão desiste.
- Teste do voto secreto no Draft (revelação e final).
