# Missão: "Quem Você Prefere" — portar pra React + TypeScript e adicionar Sujimon e modo online

Você está no repositório `pokemon-digimon-smt`, publicado no GitHub Pages
(https://brunoalmeidakotesky.github.io/pokemon-digimon-smt/). É um site pessoal, em português, onde a pessoa
escolhe entre personagens de franquias diferentes. Quero jogar com meus amigos, cada um votando no seu celular.

## Regras de trabalho (leia antes de tudo)

Vou deixar você trabalhando sozinho a noite inteira, sem ninguém pra responder perguntas. Então:

1. **Não pare pra perguntar.** Quando algo estiver ambíguo, escolha a opção mais sensata, siga em frente e anote a
   decisão no relatório final (seção "Decisões que tomei").
2. **Nunca quebre o site que está no ar.** Todo o trabalho acontece na branch `react`. A `main` só recebe merge quando
   a etapa correspondente estiver com todos os testes passando e a publicação tiver sido verificada (ver Etapa 3).
   Nada de `push --force`, nada de reescrever o histórico da `main`.
3. **Siga as etapas na ordem.** Não comece uma etapa antes de a anterior estar com os testes passando. Se uma etapa
   empacar depois de várias tentativas honestas, pare naquela etapa, deixe tudo commitado na branch e explique no
   relatório o que falta. Não pule etapa pra "entregar mais".
4. **Commits pequenos, por etapa**, com mensagem em português. Faça push da branch `react` a cada etapa concluída,
   pra nada se perder.
5. **Não acesse gamerguides.com** em nenhum momento (eles bloqueiam agentes de IA). Os Sujimon usam só arquivos
   locais que eu já baixei.
6. **Preserve os dados dos jogadores**: as chaves do localStorage `pdx-stats`, `pdx-bags` e `pdx-ygo-v1` continuam
   com o mesmo nome e o mesmo formato, pra quem já usa o site não perder placar nem histórico.
7. **Testes são a prova de que funciona.** "Acho que está certo" não conta: rode os testes, e rode de novo depois de
   cada mudança relevante.
8. No fim, escreva `RELATORIO.md` na raiz (ver Etapa 7) e faça commit dele.

## Como o site funciona hoje (comportamento que precisa continuar igual)

Leia o `index.html` inteiro antes de começar. Ele tem uns 600 linhas, com HTML, CSS e JavaScript puro, sem
framework nem build. A lista de demônios de SMT fica embutida numa linha enorme (`SMT_DATA`).

**Visual**
- Variáveis CSS pra tema claro e escuro (`prefers-color-scheme`), cada franquia com uma cor: `--pokemon`, `--digimon`,
  `--smt`, `--jojo`, `--ygo`, `--bakugan`, `--sujimon`, e `--gold` pra coroa e roleta.
- Fonte "Chakra Petch" (Google Fonts) nos títulos.
- Ponto de quebra em 560px pro celular: no Trio, as cartas ficam empilhadas.
- `<meta name="referrer" content="no-referrer">` (necessário pras imagens das wikis carregarem).
- Título com os nomes das franquias coloridos. O "x Sujimon" só aparece quando os Sujimon carregam.
- Linha de status no topo com a contagem por franquia ("Pokémon: 1025 · Digimon: 1400 · …"), "carregando" ou
  "falhou". Franquia removida não aparece.

**Franquias** (objeto `SRC`, chaves em `KEYS`, nesta ordem):
- `pokemon`: `https://pokeapi.co/api/v2/pokemon-species?limit=2000`. O nome passa por `nice()` (troca hífen por espaço
  e capitaliza cada palavra). A imagem é a arte oficial em
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{id}.png`.
- `digimon`: `https://digi-api.com/api/v1/digimon?pageSize=100&page=N`, todas as páginas (`pageable.totalPages`).
  Se o item vier sem imagem, `resolve()` busca o `href` de detalhe e usa `images[0].href`.
- `smt`: lista embutida `[nome, arquivo]`, com a imagem em `smt/{arquivo}.webp` (392 demônios).
- `jojo`: API MediaWiki da jojowiki.com, `generator=categorymembers` nas categorias Part 3 a Part 9 Stands, Light
  Novel Stands, Other Stands, Thus Spoke Kishibe Rohan Stands e Evolved Stands, com `pageimages` (thumbnail 400) e
  `origin=*`. Junta por `pageid` e tira títulos com "/" ou começando com "List of".
- `ygo`: `https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes`. Só monstros (`type` contém "Monster", sem
  "Token"), formatos TCG ou OCG, ordenados por `misc_info[0].views`, um por nome, até 3000. A imagem é
  `https://images.ygoprodeck.com/images/cards_cropped/{id}.jpg`. A lista filtrada fica em cache no localStorage
  `pdx-ygo-v1` (`{t, list:[[nome,id]]}`) por 7 dias.
- `bakugan`: API MediaWiki do bakugan.fandom.com, `generator=embeddedin` em `Template:Infobox Bakugan`, com
  `pageimages`. Mesmos filtros do JoJo.
- `sujimon`: `sujimon/list.json` (`[[nome, "NNN"]]`), com a imagem em `sujimon/NNN.webp`. Se o arquivo não existir,
  `dropFranchise()` remove a franquia de todos os seletores, do campeonato e do status.
- Cada franquia carrega em paralelo. Uma que falhe não impede as outras.

**Sorteio**
- `draw(k)` funciona como "saco de bolinhas": embaralha os nomes da franquia e vai tirando, passando por todos antes
  de repetir. O que falta sortear fica salvo em `pdx-bags` (`{franquia: [nomes]}`). Nome que sumiu da lista é
  ignorado.
- `pick(k, avoid)` evita personagens que já estão na tela (até 20 tentativas).
- O próximo desafiante já é sorteado e a imagem pré-carregada (`preload`).

**Carta**: botão com a borda superior na cor da franquia. Em cima, o número da tecla e a coroa, se houver. No meio,
a imagem ("carregando…", "sem imagem" ou "imagem não carregou" enquanto não aparece). Embaixo, o nome e o rótulo da
franquia. Entre as cartas aparece "VS".

**Modos** (abas: Duelo, Trio, Campeonato, Placar):
- **Duelo**, estilo rei do morro: dois seletores de franquia (padrão Pokémon x Digimon).
  - Quem é escolhido fica no mesmo lado e ganha "♛ N vitória(s)". O outro lado recebe um desafiante novo da franquia
    daquele lado, e a sequência dele volta a zero.
  - Trocar a franquia de um lado troca só aquele lado. "Trocar os dois" recomeça tudo.
  - Atualiza `stats.best` (maior sequência).
- **Trio**: três seletores (padrão Pokémon, Digimon, SMT), com a mesma regra: quem vence fica e os outros dois
  recebem desafiantes novos. "Trocar os três" recomeça tudo.
- **Campeonato**:
  - Configuração: tamanho de 8 a 128 (padrão 16), caixinhas de franquia, "dividir igualmente entre as franquias" e
    "evitar confronto entre a mesma franquia".
  - Se uma franquia não tiver gente suficiente, as outras completam, e o tamanho cai pra maior potência de 2
    possível.
  - Com "evitar mesma franquia" ligado, `pairUp()` refaz os pares a cada rodada, juntando sempre a franquia com mais
    gente sobrando com a segunda maior.
  - Nomes das rodadas: "Rodada de N", "Quartas de final", "Semifinal", "Final".
  - Mostra "confronto X de Y" e tem o botão "Abandonar".
  - No fim mostra o campeão (carta com "♛ campeão"), o 2º lugar, os semifinalistas e "Novo campeonato".
  - O campeonato **não** grava no Placar.
- **Chaveamento visual** (sempre aberto, embaixo do campeonato):
  - Uma coluna por rodada e uma coluna "Campeão". Cada confronto é uma caixa com dois participantes: miniatura, nome
    e faixa na cor da franquia.
  - O vencedor aparece em negrito e o perdedor apagado. O confronto atual fica destacado.
  - Os confrontos que ainda não aconteceram aparecem como "???", sem nome nem imagem, pra não dar spoiler.
  - Linhas em SVG ligam cada confronto decidido ao confronto seguinte do vencedor, e são redesenhadas ao redimensionar
    a tela.
  - Tem rolagem horizontal quando não cabe.
- **Placar**:
  - Taxa de vitória por franquia: barra, porcentagem e "vitórias/confrontos". Só Duelo e Trio contam.
  - Maior sequência, com o personagem e a franquia.
  - Últimas 30 escolhas, em texto do tipo "X (Franquia) venceu Y (Franquia)".
  - "Zerar placar".
  - Formato de `pdx-stats`: `{w:{franquia:n}, n:{franquia:n}, hist:[texto], best:{name,fr,streak}|null}`.

**Roleta e teclado**
- Botão "Roleta", com um ícone de roda dividida nas cores das franquias, embaixo das cartas no Duelo, no Trio e no
  Campeonato. A tecla R faz o mesmo.
- As cartas acendem em sequência e desaceleram: espera de 55 ms + (k/total)³ × 420 ms. O total é de 3 a 4 voltas
  mais um deslocamento aleatório, começando numa carta aleatória.
- A carta escolhida pisca em dourado por 1 s e conta como escolha normal.
- Durante o giro, cliques e teclas são ignorados e a roda do ícone gira. Com `prefers-reduced-motion`, vai direto ao
  resultado.
- Trocar de aba cancela o giro.
- As teclas 1, 2 e 3 escolhem a carta (ignoradas dentro de campos de formulário).

## Etapa 0 — Preparação

1. Crie a branch `react` a partir da `main` e a tag `antes-do-react` na `main` atual (pra comparar e voltar se
   precisar).
2. Veja se `sujimon/_orig/` existe (eu deixo pronto antes de você começar). Ele é usado só na Etapa 4.

## Etapa 1 — Testes do site atual (antes de mexer em qualquer código)

Crie a estrutura de testes **contra o `index.html` atual**, pra registrar o comportamento de hoje.

- **Playwright** (Chromium), com viewports de celular (390×844) e de computador (1280×800).
- **Sem depender da internet**: intercepte todas as APIs com `page.route` e responda com fixtures pequenas e
  realistas em `tests/fixtures/` (umas 40 entradas por franquia, com o formato real de cada API). Responda as
  imagens externas com um PNG mínimo. Pode consultar as APIs reais uma vez só pra copiar o formato, nunca a
  gamerguides.com.
- **Aleatoriedade controlada**: troque `Math.random` por um gerador com semente via `addInitScript`, pra os testes
  serem repetíveis, sem mexer no código do site.
- **Cubra**:
  - Carregamento e status, inclusive uma franquia que falha e o Sujimon sem `list.json` (some de tudo).
  - Duelo: quem vence fica, a coroa conta, o outro lado troca e continua da mesma franquia, troca de seletor e
    "Trocar os dois".
  - Trio, com as mesmas regras.
  - Roleta, com `reducedMotion`: escolhe uma carta e conta. Teclas 1, 2 e R. Cliques ignorados durante o giro.
  - Campeonato de 8 e de 16 até o fim, com "evitar mesma franquia" ligado e desligado: sem confronto da mesma
    franquia na primeira rodada quando possível, "???" nos confrontos futuros, campeão, vice, semifinalistas e
    "Abandonar".
  - Campeonato com uma franquia de poucos personagens: completa com as outras e usa potência de 2.
  - Placar: grava Duelo e Trio, não grava Campeonato, histórico limitado a 30 e "Zerar".
  - localStorage: comece um teste com `pdx-stats`, `pdx-bags` e `pdx-ygo-v1` já preenchidos e confira que o site usa
    esses dados. Com o cache de YGO válido, a API não é chamada.
  - Sorteio sem repetição: N desafiantes seguidos de uma franquia com N personagens são todos diferentes.
- Tire **screenshots de referência** de cada tela (Duelo, Trio, Campeonato no meio e no fim, Placar), no celular e no
  computador, no tema claro e no escuro, e salve em `relatorio/antes/` (essa pasta vai pro `.gitignore`).
- Todos os testes precisam passar contra o site atual antes de seguir. Commit: "Testes do comportamento atual".

## Etapa 2 — Portar pra React + TypeScript + Vite (só portar, nada novo)

- Vite + React + TypeScript em modo estrito, com `base: './'` (o site fica em uma subpasta do GitHub Pages).
  Imagens locais (`smt/`, `sujimon/`) vão pra `public/`.
- **Organização** pensada pra crescer sem virar um arquivo gigante:
  - `src/sources/`: uma franquia por arquivo, com uma interface comum.
  - `src/core/`: lógica pura, sem React (sorteio/saco, `pairUp`, chaveamento, placar, persistência).
  - `src/modes/`: um modo por pasta.
  - `src/components/`: Carta, Arena, Roleta, Chaveamento, seletores.
  - A lista de SMT vira um JSON separado.
- **Aparência e comportamento idênticos**: mesmo CSS (pode virar CSS Modules ou um arquivo global, mas o resultado
  visual precisa ser igual), mesmas cores, textos, animações, teclas e chaves de localStorage.
- **Testes unitários com Vitest** pra tudo em `src/core/`.
- **Os mesmos testes da Etapa 1 precisam passar contra a versão nova** (rode o build e sirva com `vite preview`).
  Ajuste só os seletores dos testes, se precisar, nunca o comportamento esperado. Se um teste revelar diferença,
  corrija o código, não o teste.
- Tire os mesmos screenshots em `relatorio/depois/` e compare com `relatorio/antes/` (por exemplo com
  `toHaveScreenshot` ou uma comparação de pixels com tolerância pequena). Diferença visual relevante precisa ser
  corrigida. Anote no relatório o que sobrou de diferença e por quê.
- `npm run check` roda typecheck, lint, Vitest e Playwright. Precisa passar inteiro.
- Commit e push da branch.

## Etapa 3 — Publicação

- Crie um workflow do GitHub Actions que, a cada push na `main`, roda `npm ci`, `npm run check` (pode pular o
  Playwright se ficar lento demais, mas não o typecheck nem o Vitest) e o build, e publica no GitHub Pages
  (`actions/upload-pages-artifact` + `actions/deploy-pages`).
- O Pages hoje publica direto da `main` (raiz). Pra usar o workflow, a fonte precisa mudar pra "GitHub Actions". Tente
  com `gh api -X PUT repos/BrunoAlmeidaKotesky/pokemon-digimon-smt/pages -f build_type=workflow`.
  - **Se der certo**: faça o merge da `react` na `main`, espere o deploy terminar
    (`gh run watch`) e rode um teste rápido com Playwright contra o site real, usando as APIs de verdade: abre, carrega
    as franquias, faz um duelo. Se o site real estiver quebrado, reverta o merge na `main` (commit de revert, sem
    force) e anote no relatório.
  - **Se não der** (sem permissão, `gh` não logado etc.): não faça merge. Deixe tudo na branch `react` e escreva no
    relatório o passo exato que eu preciso fazer de manhã (Settings → Pages → Source: GitHub Actions) e o comando do
    merge. Continue as próximas etapas na branch normalmente.

## Etapa 4 — Sujimon (só arquivos locais)

`sujimon/_orig/` tem os screenshots do Sujidex de Like a Dragon: Infinite Wealth (arquivos `NNN.img`) e
`sujimon/_orig/nomes.json` (`{"NNN": "Nome"}`). O script `sujimon.mjs` (raiz) tem o comando
`node sujimon.mjs recortar`, que corta pelas frações em `RECORTE` e gera `sujimon/NNN.webp` e `sujimon/list.json`.
Ajuste o script pra gravar em `public/sujimon/`. Se faltar o `sharp`, rode
`npm install --no-save sharp@0.33.5 cheerio@1.0.0`.

1. Abra vários originais (ex.: 001, 050, 150, 300) e ache o painel do meio, onde fica só o personagem, entre as
   caixas de interface da esquerda e da direita. Ajuste `RECORTE` pra pegar exatamente esse meio, sem borda de caixa
   e sem cortar cabeça, pés ou objetos.
2. Gere tudo e confira pelo menos 15 resultados variados, olhando as imagens. Screenshot com layout diferente vira
   exceção: recorte próprio ou fica de fora (anote).
3. Confira se `list.json` tem todos os números e se os nomes estão certos.
4. Faça commit só de `public/sujimon/*.webp` e `public/sujimon/list.json`. Mantenha `sujimon/_orig/` no
   `.gitignore`.
5. Adicione um teste: com `list.json` presente, o Sujimon aparece nos seletores, no campeonato e no título.
6. Se `sujimon/_orig/` não existir, pule esta etapa e avise no relatório.

## Etapa 5 — Salas online + Duelo, Trio e Campeonato online

Hoje, pra jogar com amigos, a gente compartilha a tela e só uma pessoa clica. Quero salas em que cada um vota no
próprio aparelho.

**Arquitetura**
- O site é estático, sem servidor próprio. Use WebRTC com PeerJS (via npm), com o host como autoridade: o estado do
  jogo vive no navegador do host, que valida os votos e manda o estado pra todos.
- Escreva a lógica do jogo online como **funções puras em TypeScript**: estado + ação → novo estado. Isso inclui
  lobby, rodadas, votos, empate, roleta, reconexão e Draft. Teste tudo com Vitest, sem rede.
- As mensagens entre host e jogadores são **tipos TypeScript** (união discriminada) e são validadas ao chegar.
  Mensagem inválida é ignorada, nunca derruba o jogo.
- Crie uma interface de transporte com duas implementações: PeerJS (a real) e uma local via `BroadcastChannel`, usada
  nos testes. A local é escolhida com `?transporte=local` e só serve pra teste. Os testes de várias pessoas usam
  várias páginas do mesmo contexto do Playwright com o transporte local. Faça também um teste de fumaça com PeerJS de
  verdade entre dois contextos. Esse pode falhar por causa da rede: nesse caso anote, mas não trave a etapa por isso.

**Sala**
- O host cria a sala e recebe um código curto e um link (`...?sala=ABCD`). Quem abre o link, ou digita o código,
  escolhe um apelido e entra.
- Lobby com a lista de jogadores (o host também joga e vota). O host configura o modo, as franquias habilitadas, as
  opções de cada modo, o voto secreto e a roleta nas rodadas. Os outros veem a configuração, mas não mudam.
- O host inicia, e pode encerrar e voltar ao lobby a qualquer momento.
- **Problemas de conexão, sempre visíveis**:
  - Se o host fechar a página, a sala acaba. Mostre isso claramente.
  - Se a rede bloquear o P2P, mostre um erro compreensível, com um lugar preparado pra configurar um servidor TURN
    depois.
  - Quem cair e voltar com o mesmo aparelho (id no localStorage) recupera o lugar.
  - O jogo nunca trava esperando alguém que caiu: o host vê quem falta votar e pode remover o jogador ou avançar.
- Partidas online não mexem no Placar local nem no saco de sorteio local, que é do host.

**Duelo, Trio e Campeonato online**
- Funcionam como os modos solo (rei do morro, quem vence fica, chaveamento etc.), mas cada escolha vira uma
  votação. Todos veem as mesmas cartas, sorteadas pelo host.
- Cada um vota no seu aparelho e vê quem já votou. O resultado só sai quando todos tiverem votado, e mostra a
  contagem de votos.
- **Voto secreto** (opção do host, desligado por padrão): desligado, o resultado mostra quem votou em quem; ligado,
  só a contagem. Vale pra todas as votações online, inclusive as do Draft.
- Vence o mais votado. **Empate: a roleta gira só entre os empatados**, a mesma animação pra todos.
- **Roleta nas rodadas** (opção do host): quando ligada, o host pode girar a roleta em vez de esperar a votação.
- No Campeonato online, o chaveamento visual aparece pra todos, com as mesmas regras do "???".

**Testes**: Vitest pra lógica pura, e Playwright com 3 participantes (transporte local) cobrindo:
- Votação comum.
- Empate decidido pela roleta.
- Voto secreto ligado e desligado.
- Roleta do host.
- Jogador que cai e volta.
- Jogador removido pelo host.
- Host que sai.
- Campeonato online até o fim.

O modo solo continua passando em todos os testes antigos. Faça merge na `main` só se a Etapa 3 tiver dado certo e
tudo estiver passando, verificando o site real depois, como na Etapa 3.

## Etapa 6 — Modo online novo: Draft

Configuração do host:
- Franquias e ordem (ex.: JoJo, Pokémon, Digimon e SMT).
- Opções por franquia (X, padrão 3).
- Número de rodadas (padrão 1).
- Voto secreto e roleta, como nos outros modos.

O jogo tem uma ou mais **rodadas**, e cada rodada passa pelos passos 1 e 2. Os vencedores de cada rodada ficam
classificados, e depois da última rodada vem a final (passo 3). Personagem escolhido por alguém numa rodada não
aparece mais nas opções das rodadas seguintes. A tela mostra a rodada ("Rodada 2 de 3") e a lista de classificados.

1. **Escolha secreta, time inteiro primeiro.**
   - Cada jogador recebe X opções da primeira franquia e escolhe 1, depois X da segunda, e assim até a última.
   - As opções são sorteadas de forma independente pra cada jogador, então o mesmo personagem pode aparecer pra mais
     de uma pessoa. Ninguém vê as opções nem as escolhas dos outros; aparece só quem já terminou.
   - **Repetidos**: quando todos terminam, se duas ou mais pessoas escolheram o mesmo personagem numa franquia, todo
     mundo refaz aquela franquia, em segredo, com opções novas. O personagem que repetiu fica fora das novas opções.
     Repete até não ter repetido.
   - Avise que a franquia vai ser refeita por repetição, sem dizer qual personagem nem quem escolheu.
2. **Revelação e votação, franquia por franquia.**
   - Mostra pra todos o personagem que cada jogador escolheu naquela franquia, com o nome de quem escolheu.
   - Todos votam, podendo votar no próprio. Os votos aparecem com o nome de quem votou se o voto secreto estiver
     desligado.
   - O mais votado se classifica; empate vai pra roleta entre os empatados.
3. **Final entre os classificados** (rodadas × franquias).
   - Chaveamento mata-mata com votação em cada confronto e empate na roleta.
   - "Bye" quando o número não for potência de 2.
   - Reaproveite o componente de chaveamento.
4. **Fim**: mostra o campeão geral, quem o escolheu e em qual rodada, e o que cada jogador escolheu em cada rodada.

**Testes**: Vitest pra toda a lógica do Draft. Inclua:
- Repetidos que se repetem duas vezes seguidas.
- Exclusão entre rodadas.
- Bye.
- Empate.

E Playwright com 3 participantes fazendo um Draft de 2 rodadas e 3 franquias do começo ao fim, com um repetido
forçado pela semente.

## Etapa 7 — Revisão e relatório

1. Rode `npm run check` inteiro uma última vez.
2. Peça pra um subagente que não participou do trabalho revisar o código e os testes contra este documento, procurando
   regra não implementada ou comportamento antigo que mudou. Corrija o que for real.
3. Escreva `RELATORIO.md` na raiz, em português, com:
   - O que foi feito em cada etapa e o estado de cada uma (concluída, parcial ou não feita, e por quê).
   - O que está na `main` (no ar) e o que ficou só na branch `react`.
   - O que eu preciso fazer de manhã, em passos numerados (se houver).
   - **Decisões que tomei**, com o motivo de cada uma.
   - Como testar com amigos: criar sala, compartilhar e o que fazer se não conectar.
   - Diferenças visuais que sobraram em relação ao site antigo (com os screenshots em `relatorio/`).
   - Quantos Sujimon entraram e quais ficaram de fora.
4. Commit e push.

**Pronto significa**: o modo solo funciona exatamente como antes, provado pelos testes da Etapa 1 rodando na versão
nova, e cada etapa concluída tem os próprios testes passando.
