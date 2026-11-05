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
14. **Monstros:** calibrados com partidas de bots. Os comuns quase sempre perdem; o chefe ganha umas 35–40% das vezes.
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

## Pra você decidir

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

- Quatro linhas sem nome no Catálogo ("Nova linha"): Pupitar → Tyranitar → Groudon, Dunsparce → Dudunsparce →
  Rayquaza, Agumon Hakase → Numemon…, Scary Monsters → The World. O jogo mostra o nome da 1ª forma.
- A linha do Roggenrola está no plano mas nenhuma forma está marcada: ficou fora.
- Linhas marcadas como não confirmadas no Catálogo (todas as da Persona e do Sujimon, Zygarde) entraram como estão.
- Classes fora da faixa de tamanho (resultado.md, seção 3): Temporais (faltam 6), Anjo (faltam 3), Assassino
  (faltam 3), Safada (sobram 4), Porradeiro (sobram 2). Dá pra mexer no Catálogo.
- Online: sem troca de anfitrião (se ele sair, a sala acaba) e sem espectador (quem chega com a partida rolando espera
  a próxima). Com PeerJS de verdade, testado só no mesmo computador (dois navegadores isolados): falta testar entre
  redes diferentes.
