# Autobatalha: pendências pra revisar juntos

O que eu decidi sozinho enquanto você dormia, e o que ficou em aberto. O design completo está em
[autobatalha.md](autobatalha.md). Marque cada item como quiser (ok, mudar pra…, discutir).

## Decisões que tomei (dá pra mudar)

1. **Como a luta se resolve:** luta automática simulada (o doc sugeria pontuação de sinergia, mas o pedido de
   tabuleiro, habilidades e itens só faz sentido com luta). Passo de 0,1 s, 30 s no máximo.
2. **Escadas das origens:** as da conta refeita com o v5 (Pokémon 4/8/9, Digimon 2/3/4, SMT 2/4/6, Persona 1/2/3,
   JoJo 2/5/7, Yu-Gi-Oh! 2/5/7, LoL 2/5/7, Overwatch 2/4/5, Deadlock 2/3/5, Sujimon 2/3/4). Elementos 2/3/4, como a
   conta recomendava.
3. **Efeitos das classes sem número** (Demoníacos, Criaturinha Bizarra, Fadinhas, Safada, Atirador, Anjo, Robô,
   Dragão, Temporais): escrevi números a partir da sua ideia de cada uma. Dragão virou escada normal (2/4/6) com bônus
   de vida e dano; a ideia "só cabe um ativo" ficou de fora.
4. **Bônus das origens** que estavam "A definir" (Pokémon, SMT, Persona, LoL, Overwatch): seguem a mecânica que você
   escreveu; os números são meus. Persona: o atributo que cada Persona dá sai da 1ª classe dela.
5. **Digimon de 4 formas:** as 3 primeiras são as estrelas; a 4ª é a transformação da ult da 3ª. War Greymon →
   Omegamon vira uma segunda transformação.
6. **Formas alternativas no nível 1** (Jack Frost ou Jack-o'-Lantern, Daemon ou Succubus, Orpheus ou Orpheus F): a
   loja sorteia qual vem; todas contam como cópias do mesmo campeão.
7. **Custos que faltavam:** Clock Wyvern 2, Panther Warrior 1.
8. **No lugar do carrossel:** no começo dos estágios 2, 3 e 4, cada jogador escolhe 1 de 3 componentes.
9. **Atributos, economia e loja:** tabelas no design (base pelo custo, ajuste pelo papel da 1ª classe; renda, juros,
   XP e chances no padrão do gênero). Ponto de partida, sem calibragem fina.
10. **Bots:** 7, com os nomes dos atributos Bakugan (Pyrus, Aquos…). Jogam de forma simples.

11. **Zygarde:** o Zygarde (nível 2 da linha) tem ult Mega Zygarde no Catálogo, mas a regra "forma não final só
    ataca" ganhou: só o Zygarde (Complete) vira Mega Zygarde.
12. **Digimon com duas 4ª formas** (EBEmon ou EBEmon X, os dois Justimon, Saint Galgomon ou Rapidmon Armor): as duas
    viram opções da transformação; o jogador escolhe qual no tooltip.

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
da vida de cada inimigo no degrau 4) e os efeitos dos 28 Bakugan.

## Pendente

- Quatro linhas sem nome no Catálogo ("Nova linha"): Pupitar → Tyranitar → Groudon, Dunsparce → Dudunsparce →
  Rayquaza, Agumon Hakase → Numemon…, Scary Monsters → The World. O jogo mostra o nome da 1ª forma.
- A linha do Roggenrola está no plano mas nenhuma forma está marcada: ficou fora.
- Linhas marcadas como não confirmadas no Catálogo (todas as da Persona e do Sujimon, Zygarde) entraram como estão.
- Classes fora da faixa de tamanho (resultado.md, seção 3): Temporais (faltam 6), Anjo (faltam 3), Assassino
  (faltam 3), Safada (sobram 4), Porradeiro (sobram 2). Dá pra mexer no Catálogo.
- Modo online (jogar com amigos) ficou pra depois: só solo contra bots.
