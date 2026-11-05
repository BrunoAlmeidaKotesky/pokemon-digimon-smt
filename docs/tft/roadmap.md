# Autobatalha: pendências pra revisar juntos

O que eu decidi sozinho enquanto você dormia, e o que ficou em aberto. O design completo está em
[autobatalha.md](autobatalha.md). Respostas suas de 04/11/2026 marcadas com **[você]**.

## Decisões que tomei (dá pra mudar)

1. **Como a luta se resolve:** luta automática simulada (o doc sugeria pontuação de sinergia, mas o pedido de
   tabuleiro, habilidades e itens só faz sentido com luta). Passo de 0,1 s, 30 s no máximo. **[você] ok.**
2. **Escadas das origens:** **[você] mais degraus em todas.** Agora 5 (6 nas maiores), pela conta (resultado.md,
   seção 6b): Persona 1/2/3/4/5, Digimon, Deadlock e Sujimon 2/3/4/5/6, Overwatch 2/3/4/5/7, SMT 2/3/4/6/8, JoJo,
   Yu-Gi-Oh! e LoL 2/3/5/7/9/10, Pokémon 2/4/6/8/9/10 (grande demais pra igualar; degraus de baixo dão pouco).
   Elementos 2/3/4. A conta usa 10 unidades como teto; o tabuleiro vai até 12 (limite = nível).
3. **Efeitos das classes sem número** (Demoníacos, Criaturinha Bizarra, Fadinhas, Safada, Atirador, Anjo, Robô,
   Dragão, Temporais): escrevi números a partir da sua ideia de cada uma. Dragão virou escada normal (2/4/6) com bônus
   de vida e dano; a ideia "só cabe um ativo" ficou de fora. **[você] nerf no Dragão:** +10/20/32% (era 15/30/50%),
   +5% pro time no 6 (era 10%), papel ×1,05. Depois veio a rodada de equilíbrio (equilibrio.md).
4. **Bônus das origens** que estavam "A definir" (Pokémon, SMT, Persona, LoL, Overwatch): seguem a mecânica que você
   escreveu; os números são meus. Persona: o atributo que cada Persona dá sai da 1ª classe dela.
5. **Digimon de 4 formas:** as 3 primeiras são as estrelas; a 4ª é a transformação da ult da 3ª. War Greymon →
   Omegamon vira uma segunda transformação. **[você] ok.**
6. **Formas alternativas no nível 1** (Jack Frost ou Jack-o'-Lantern, Daemon ou Succubus, Orpheus ou Orpheus F): a
   loja sorteia qual vem; todas contam como cópias do mesmo campeão. **[você] e ao comprar dá pra escolher qual:**
   feito (sem resposta, fica a da loja; bot fica com a sorteada).
7. **Custos que faltavam:** **[você] saem do set** (personagem sem custo no Catálogo não entra).
8. **Carrossel como o do gênero** (decidido por você; trocou o "presente" de 1 de 3 componentes): no começo de
   cada estágio a partir do 2, 9 campeões de estrela 1 segurando um item (componente até o estágio 4, completo do 5
   em diante), custos subindo com o estágio, escolha em duplas da menor vida pra maior. Números meus: 3 s até a 1ª
   dupla e entre as duplas, 4 s depois da última, fecha 1,5 s depois de todos pegarem, 50/50 entre os dois custos
   de cada estágio (40/40/20 no 5+), banco cheio vende o campeão pelo custo (menos quando fecha evolução, como na
   loja), e dá pra mexer na loja durante o carrossel.
9. **Atributos, economia e loja:** tabelas no design. **[você] economia mais generosa e mais unidades:** renda 6,
   vitória +2, sequência +1/+2/+3/+4, nível máximo 12, XP mais barata nos níveis baixos e médios. O limite nível + 1
   virou **limite = nível** depois que você jogou (05/11): começar com dois não foi boa ideia.
   Atributos e habilidades passaram pela rodada de equilíbrio (equilibrio.md).
10. **Bots:** 7, com os nomes dos atributos Bakugan (Pyrus, Aquos…). **[você] fortes demais:** dificuldade Fácil
    (padrão), Normal e Difícil. Um jogador "normal" fica em ~2,9º contra os fáceis e ~4,9º contra os normais. O
    Difícil ainda é quase igual ao Normal (5,0º): falta reforçar.

11. **Zygarde:** linha 10% → 50% → Complete → Mega Zygarde, como você queria; o Zygarde da PokeAPI é a forma 50% e
    agora aparece como "Zygarde (50%)".
12. **Digimon com duas 4ª formas** (EBEmon ou EBEmon X, os dois Justimon, Saint Galgomon ou Rapidmon Armor): as duas
    viram opções da transformação; o jogador escolhe qual no tooltip.

13. **Dano na derrota:** diminuí o do rascunho do design (as partidas acabavam no estágio 5). Agora vão até o 6 ou
    7, umas 35 rodadas.
14. **Monstros:** calibrados com partidas de bots. Os comuns quase sempre perdem; o chefe ganha umas 40% das vezes na 3-7
    e 65% depois. Com limite = nível e todo Stand ocupando vaga baixei o chefe (vida 4000 → 3200, dano 260 → 210, crescimento 1,4 → 1,34), pra ele não ficar mais forte só
    porque o tabuleiro tem uma unidade a menos. A 1-1 continua ganha com um campeão só (98%).
15. **Detalhes da partida:**
    - a sequência de vitórias e derrotas só conta luta contra jogador;
    - empate conta como derrota pros dois;
    - as cópias de quem é eliminado voltam pro pool;
    - o campeão de graça do começo nunca é Stand;
    - a partida é salva só no começo de cada planejamento (compra feita no meio se perde se a página fechar).
16. **Deadlock:** o degrau 3 tinha o mesmo efeito do 2. Agora, com 5 degraus, cada um dá +1,5 / 2 / 2,5 / 3 / 4% por
    10 almas.

## Decididos depois da rodada de equilíbrio

- **1º lançamento** entre 4 e 10 s de luta (média 8,5 s). **[você] ok.**
- **Formas que não lançam:** **[você] buff:** +22% de vida e dano na estrela 1 e +28% na 2 e na 3 (era 20/25%). O
  playtest mediu 52 campeões fora da faixa com isso (eram 73); +25/33% passava do ponto (80 fora).
- **Atirador com a ult Charme:** **[você] nerf:** quem é Atirador não escolhe mais a ult da Safada.
- **Tooltip:** **[você] passar o mouse mostra só o essencial** (nome, custo, estrelas, alcance, traços, habilidade,
  itens); o botão direito fixa com todos os detalhes.
- **Baba (Deadlock):** **[você] bate de perto** (alcance 1).
- **Quem é de longe:** **[você] tem gente demais de longe, muitos sem sentido.** Revi forma por forma: 96 foram pra alcance
  1 pela tabela `CORPO_A_CORPO` (`combate/atributos.ts`), e 7 trocaram de classe na exportação (`set1-escolhas-v5.json`,
  editada no lugar). De 408 formas de longe (69%) foram pra 306 (52%). Critério meu, pra você revisar: quem na obra bate,
  morde ou corta no contato; LoL pelo "Corpo a corpo" do Catálogo, JoJo pelo alcance do Stand na wiki (menos quem atira:
  Tusk, Bad Company e Ball Breaker continuam), Deadlock e Overwatch ficaram como estavam (todos têm arma).
  **Classe:** Atirador tinha gente sem tiro nenhum, e trocar só o alcance deixaria um Atirador de perto com a vida
  mais frágil do jogo, então troquei a classe: Chikorita, Bayleef e Meganium viraram Tanque; Justimon (Blitz e Critical
  Arm), Porradeiro; Bystial Magnamhut, Dragão; Cironnup perdeu a classe (tem outras duas). Atirador foi de 27 pra 24
  campeões, dentro da faixa de 23 a 33, e o traço continua fechando 2/4/6. **Pra você ver:** se alguém da lista devia
  atirar, ou se quer mais gente de perto (Personas e demônios do SMT ficaram como conjuradores).
- **Lobby:** **[você] pediu** a sala antes da partida no lugar da tela inicial: os 8 jogadores (você com a marca de
  anfitrião; os bots com o ícone e o tabuleiro que vão ter), as regras da sala que só o anfitrião muda (relógio,
  segundos, dificuldade), o seu nome, o seu **tabuleiro** (8 estilos só de cores e fundo: Gramado, Deserto, Neve,
  Vulcão, Oceano, Noite estrelada, Floresta e Roxo arcano; na luta, a metade do adversário fica com o dele) e o seu
  **ícone** (grade de todos os personagens com busca, origem e custo). O estado já separa sala e jogador, pensando no
  online. **Pra você ver:** as cores de cada estilo e os desenhos por cima (prints do lobby e da partida).
- **Loja e "Pronto":** **[você] pediu** todas as etiquetas de traço visíveis na carta (agora em até duas linhas, o
  nome comprido no fim), destaque forte de campeão que você já tem (anel dourado pulsando; se a compra evolui, anel
  girando com brilho mais forte e o ★★/★★★) e o "Pronto" como **votação** (placar "Prontos 7/8", ✓ em quem votou;
  com todos prontos a luta começa na hora; no solo os bots votam no começo e o seu voto fecha; dá pra desfazer). O
  voto fica na partida (`Jogador.pronto`), pensando no online. **Pra você ver:** as cores dos anéis (prints da loja).
- **Online (jogar com amigos):** **[você] pediu** como prioridade. Feito com o anfitrião autoritativo (o navegador de
  quem cria a sala roda a partida; a luta de cada um é reproduzida no navegador dele com a mesma semente), link
  `?autobatalha=ABCD`, até 8 pessoas e bots no resto; detalhes na seção "Online" do design. Decisões minhas: quem cai
  vira bot até voltar (pelo mesmo aparelho ou pelo mesmo nome); partida em andamento não aceita gente nova; o
  anfitrião que fecha a página acaba a sala (sem trocar de anfitrião); a rodada espera todos verem a luta (cada um na
  velocidade dele), com um limite; a partida online não é salva; nome vazio vira "Jogador N".

- **Stands (JoJo):** **[você] decidido em 05/11/2026: Stand nunca excede a vaga.** Todo Stand ocupa vaga como qualquer
  unidade. Isso substitui "Stand não ocupa vaga" e a tentativa de um fora da vaga a cada 3 níveis, que não chegou a ser
  publicada. Cada Stand precisa de um usuário de outra origem, que também ocupa vaga: cabem ⌊nível/2⌋ Stands, 6 no nível
  12. Por isso a escada virou 2/3/4/5/6, e a mana a menos vem no degrau de 5.

  Sem compensar, a origem morria, então o bônus subiu. Duas medidas, porque bônus alto demais vira obrigação: **time
  cheio** é metade Stands contra as outras origens (4 ★1, 6 ★2, 8 ★2, 10 ★2, 10 ★3); **2 Stands no time** é trocar 2
  normais por 2 Stands no mesmo time ★2, contra ele sem Stand (tabuleiro de 4, 6, 8 e 10; 50% = tanto faz).

  | Bônus por degrau | Time cheio | 2 Stands no time |
  |---|---|---|
  | +6 / 10 / 13 / 16 / 18% | 8 / 12 / 11 / 20 / 27% | 23 / 23 / 23 / 24% |
  | +20 / 30 / 42 / 50 / 55% | 25 / 37 / 41 / 54 / 62% | 45 / 43 / 44 / 36% |
  | **+25 / 30 / 40 / 48 / 55%** | **34 / 37 / 41 / 52 / 60%** | **53 / 49 / 51 / 41%** |
  | +35 / 40 / 45 / 48 / 52% | 47 / 49 / 44 / 52 / 60% | 66 / 61 / 62 / 53% |

  **Escolhi +25/30/40/48/55%:** com +35% no primeiro degrau, botar 2 Stands em qualquer time vencia até 66%, e todo mundo
  ia querer. Assim 2 Stands ficam neutros e JoJo cheio é fraco no começo e forte no fim. O preço é o começo fraco (34%
  com 4 no tabuleiro). Os números do bônus são altos perto dos outros traços porque cada Stand gasta duas vagas e, se um
  morre, o outro morre junto. Os bots quase não usam Stand (0,3 em média), então a colocação deles com JoJo diz pouco:
  **pra conferir jogando**.

- **Pokémon e Digimon:** **[você] vale um buff no escalonamento.** Li como o ganho de força ao evoluir das linhas (se era
  a escada do traço, é só falar). Bônus de vida e dano nas linhas: Pokémon +5% (★2) e +10% (★3), Digimon +12% e +30%; o
  Digimon ganha mais porque era a origem mais fraca de verdade na luta. Time cheio contra as outras origens (4 ★1, 6 ★2,
  8 ★2, 10 ★2, 10 ★3): Pokémon 53 / 41 / 33 / 48 / 45% → 53 / 48 / 38 / 56 / 59%; Digimon 40 / 31 / 29 / 29 / 19% → 39 /
  46 / 40 / 41 / 46%. Ninguém passa do meio do grupo (Yu-Gi-Oh! e Sujimon seguem no topo). Parei aí porque +10/+20 já
  punha o Pokémon em 73% no 10 ★3. **Efeito colateral:** estrela vale mais que custo nas linhas (★2 de custo 3 contra ★1
  de custo 5 foi de 71% pra 77%, alvo 35% a 65%), e as formas de Digimon que só atacam na ★2 ficam muito fortes no
  rodízio (Numemon, Garurumon, Vegimon, Devimon: 90% a 93%). Baixar o +12% pra +5% tirava só 7 dos 105 campeões fora da
  faixa e derrubava o Digimon de 46% pra 37% no 6 ★2, então ficou.

- **Mais degraus nos traços:** **[você] Fogo com 2/3/4 tendo muito mais gente.** O número de degraus agora sai do tamanho
  do traço, com a régua das origens: 3 até 13 campeões, 4 de 14 a 17, 5 de 18 a 29, 6 de 30 em diante. Tabela no design
  (seção Traços) e contas em resultado.md, seção 6c. Decisões minhas: as escadas guardam os degraus de antes quando dá,
  e nesses degraus o efeito é o mesmo (Tanque +22% e +23% no 6, medido antes e depois), então quem já fechava segue igual; só
  Criaturinha Bizarra e Safada começam no 3; Terra e Gelo (11) ficam em 2/3/4; os efeitos extras ficaram na mesma
  contagem de antes, menos Dragão e Atirador (topo 7 em vez de 6) e Temporais (topo 5 em vez de 6, o traço só tem 17). O
  degrau mais alto é 10, e todo último degrau cabe (limite = nível). Os números dos degraus novos são meus: interpolei
  entre os de antes e estiquei o topo, conferindo no playtest.

- **Posição do Yu-Gi-Oh!:** **[você] mais intuitiva e visual.** Selo sempre visível na carta (espada laranja em ataque,
  escudo ciano em defesa), aro ciano na carta em defesa, e clicar no selo troca durante o planejamento. Decisão minha: a
  troca agora só vale no planejamento (antes dava pra trocar no meio da luta pelo painel). **Pra você ver:** as cores
  do selo e do aro (o ciano foi pra não confundir com as cores de custo).

## Pra você decidir

- **Origens que sobraram fora do meio** (time cheio, equilibrio.md, seção "Origens"): Yu-Gi-Oh! vai a 98% no 10 ★2 (do
  degrau de 7 em diante as cartas ganham as duas posições) e Sujimon fica entre 73% e 89%. Na outra ponta, Deadlock (3% a
  32%), Overwatch no 10 ★3 (22%) e LoL no 6 ★2 (33%); os dois primeiros e o Sujimon agem também fora da luta, e isso não
  entra na conta. Você não pediu pra mexer: quer um ajuste nelas?
- **"Escalonamento" de Pokémon e Digimon:** li como ganho ao evoluir. Se era a escada do traço, dá pra trocar.

- **Visual da tela nova:** tons do gramado, metade do adversário em oliva, cores das classes, ícones de perto/longe e
  dos degraus, a apresentação "VS" e o lugar do painel de dano. E os sons, que ninguém ouviu ainda.
- **Símbolos dos componentes:** usei os símbolos clássicos dos atributos (SVG da Bakugan Wiki). Os de facção mais
  novos não têm o do Subterra.

## Habilidades que eu reescrevi (código em src/autobatalha/conteudo)

As que você escreveu curtas viraram habilidades com números, mantendo a ideia:

- **Luxray**, Descarga Paralisante: raio em linha até a borda, 130/195/290%, atordoa 1/1,25/1,5 s.
- **Serperior**, Tempestade de Folhas: 3 folhas num leque de 3 casas, 120/180/270% cada.
- **Reuniclus**, Sacrifício Celular: se o aliado mais ferido está abaixo de 50%, morre, cura 50/75/100% dele e passa
  a vida que tinha como escudo; senão, dá escudo de 20/30/45%.
- **Aegislash**, Lâmina Real: alvo e vizinhos na mesma fila, 150/225/340% e sangramento por 4 s.
- **Vikavolt**, Zap Canhão: os 3 mais perto num leque, 120/180/270% e atordoa 1,5 s.
- **Tsareena**, Charme da Rainha: o mais próximo leva 200/300/450%, fica encantado 2,5 s e vulnerável a +25%.
- **Solgaleo**, Explosão Solar: todos os inimigos queimam 3 s (4/6/8% por s), e o alvo leva 150/225/340%.
- **Lunala**, Raio Fantasma Lunar: −30/40/50% de resistência em todos por 6 s, e 200/300/450% no alvo.
- **Mega Mewtwo X**, Onda Psíquica: raio de 2 casas, 200/300/450%, atordoa 1,5/2/2,5 s.
- **Mega Banette**, Pavor: raio de 2 casas, 100/150/225%, medo 1,5/1,75/2 s e depois 25% menos dano.
- **Mega Lopunny**, Salto Alto: dash até o inimigo mais longe chutando a linha, fica ao lado dele com vel. de ataque a mais.
- **Sukamon**, Cocô: 150/225/340% e "nojo" (30% menos dano por 4 s).
- **Holy's Stand**, Vinhas da Maldição (interpretação: o Stand que está matando a própria Holy): por 4 s a unidade do
  Stand perde 2% da vida por segundo (sem morrer disso) e os inimigos a até 2 casas perdem o dobro e mais dano.
- Novas, pra Únicos sem texto: **Anubis** (Pesagem do Coração: bate no inimigo com mais vida e atordoa se ele ainda
  tiver mais vida que o Anubis), **Escapist** (Rota de Fuga: atordoa em volta, recua, fica intocável e se cura),
  **Baseball Diehard** (Taco Fanático: 2 tacadas, a 2ª empurra).

Simplificadas porque a mecânica original era complexa demais: Civil War (dobra se já lançou, em vez de "se já matou"),
D4C, Scary Monsters (cura se o alvo morrer, sem virar dinossauro), Boy II Man (rouba a mana, não a habilidade), Stray
Cat (bolha vira escudo), The Hand, Gold Experience (sapo vira devolver dano por 2 s), Gold Experience Requiem, The
World Over Heaven (o soco ignora escudo e defesa), Talking Head (sem cura, em vez de cura virar dano), Wonder of U,
Baba, Light Rod Stand, e as ults de classe Safada (encantado só fica parado) e Dragão (vulnerável a qualquer dano).

Números chutados que merecem revisão: mana de cada habilidade própria (60 a 110), The World Over Heaven, Star
Platinum e The World parando o tempo de todos os inimigos, Tusk na estrela 1 (10 × 30%), Solgaleo, Planta (até 24%
da vida de cada inimigo no degrau 4) e os efeitos dos 28 Bakugan. Revisados no playtest automático de 04/11/2026
(atributos, papéis, mana, ults, Stands, traços de classe e elemento, Bakugan): números, antes → depois e o que ainda
está fora no fim de [matematica/equilibrio.md](matematica/equilibrio.md).

## Pendente

- As 7 trocas de classe (Chikorita, Bayleef, Meganium, os dois Justimon, Bystial Magnamhut e Cironnup) foram feitas direto
  em `set1-escolhas-v5.json`. No Catálogo do seu navegador elas continuam como eram: troque lá antes de exportar de novo,
  senão a exportação nova traz as classes antigas de volta. O alcance fica no código e não depende disso.
- Quatro linhas sem nome no Catálogo ("Nova linha"): Pupitar → Tyranitar → Groudon, Dunsparce → Dudunsparce →
  Rayquaza, Agumon Hakase → Numemon…, Scary Monsters → The World. O jogo mostra o nome da 1ª forma.
- A linha do Roggenrola está no plano mas nenhuma forma está marcada: ficou fora.
- Linhas marcadas como não confirmadas no Catálogo (todas as da Persona e do Sujimon, Zygarde) entraram como estão.
- Classes fora da faixa de tamanho (resultado.md, seção 3): Temporais (faltam 6), Anjo (faltam 3), Assassino
  (faltam 3), Safada (sobram 4), Porradeiro (sobram 2), Criaturinha Bizarra e Fadinhas (sobra 1 cada). Dá pra mexer no
  Catálogo.
- Online: sem troca de anfitrião (se ele sair, a sala acaba) e sem espectador (quem chega com a partida rolando espera
  a próxima). Com PeerJS de verdade, testado só no mesmo computador (dois navegadores isolados): falta testar entre
  redes diferentes.
