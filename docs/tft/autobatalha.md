# Autobatalha: design do modo

O modo estilo TFT do site, com nome próprio. Inspirado no gênero (tabuleiro de casas hexagonais, loja, sinergias, luta
automática), com o nosso set, as nossas regras e visual próprio: nada de nome, arte ou marca da Riot. As decisões de
gosto vieram do doc "Modo estilo TFT: planejamento" (https://claude.ai/artifact/YZWHvKZY5tyVaJSqgz8Hx7); o que eu
decidi sozinho, e o que ficou pendente, está em [roadmap.md](roadmap.md). Os números são ponto de partida: mudar é
editar o arquivo citado.

## Arquivos

| Parte | Onde |
|---|---|
| Contrato (tipos), hexágonos, aleatório com semente, set carregado | `src/autobatalha/tipos.ts`, `hex.ts`, `rng.ts`, `dados.ts`, `api.ts` |
| Gerador do set | `autobatalha.mjs` → `public/autobatalha/set1.json` (lê `docs/tft/set1-escolhas-v5.json`) |
| Motor de combate e atributos | `src/autobatalha/combate/` |
| Habilidades, traços e itens | `src/autobatalha/conteudo/` |
| Partida: loja, economia, rodadas, bots, salvar | `src/autobatalha/partida/` e `src/autobatalha/controle.ts` |
| Online (jogar com amigos): sala, protocolo, visão de cada um, convidado | `src/autobatalha/online/` e `src/autobatalha/sessao.ts` |
| Tela | `src/modes/autobatalha/` |

## Set

- **Campeão** = o que a loja vende: uma linha evolutiva ou um personagem solto (`CampeaoDados`). Custo 1 a 5, o do
  Catálogo (todas as formas de uma linha têm o mesmo).
- **Estrelas 1 a 3.** 3 cópias iguais viram uma de estrela acima. Em linha evolutiva a estrela s é a forma do nível s
  (3 Squirtle = Wartortle); linha de 2 níveis repete o último na estrela 3. Solto (LoL, Overwatch, Deadlock,
  Yu-Gi-Oh!, quase todo JoJo) continua a mesma carta.
- **Alternativas:** nível com mais de uma forma (Gardevoir ou Gallade): ao evoluir, o jogador escolhe. Com `de`
  (Eevee), a forma do nível 3 é a que vem da do nível 2 (Jolteon → Raikou). No nível 1, cada cópia da loja já vem
  com uma das formas, e todas contam como cópias do mesmo campeão.
- **Digimon com 4 formas:** os níveis 1 a 3 são as estrelas; a 4ª forma é a ult (transformação) da forma de nível 3.
  Se a 4ª forma também tem ult (War Greymon → Omegamon), lançar de novo transforma de novo.
- **Ult e habilidade** (regra do doc, 28/10):
  - forma não final de Pokémon e Digimon não lança nada (só ataca), a não ser que tenha habilidade própria no
    Catálogo (Sukamon);
  - forma com ult de transformação (Mega, Gigantamax, Primal, Hisui, Paradox, 4ª forma do Digimon): a ult vira a
    outra forma e melhora todos os atributos (+40% de vida, dano, armadura e resistência, +15% de velocidade de
    ataque); depois disso não lança mais (salvo a cadeia do Digimon);
  - forma com habilidade própria (JoJo, Únicos e as que você escreveu no Catálogo): a própria;
  - o resto: a ult de uma das suas classes. O jogador escolhe qual no tooltip, e pode trocar em qualquer rodada.
- **Stands de JoJo:** comprados na loja como os outros. No tabuleiro ficam presos a uma unidade de outra origem (a
  casa ao lado), no máximo um por unidade. **A cada 3 níveis, um Stand não ocupa vaga** (1 no nível 3, 2 no 6, 3 no 9, 4
  no 12); os outros contam no limite como qualquer unidade. Se um morre, o outro morre junto. Stand sem usuário volta
  pro banco no começo da luta.

## Atributos (src/autobatalha/combate/atributos.ts)

Base da estrela 1 pelo custo; estrela multiplica vida (×1 / ×1,8 / ×3,24) e dano (×1 / ×1,5 / ×2,25). Números
calibrados no playtest automático ([matematica/equilibrio.md](matematica/equilibrio.md), com o antes → depois no fim).

| Custo | Vida | Dano | Armadura | Resist. | Vel. ataque |
|---|---|---|---|---|---|
| 1 | 450 | 42 | 20 | 20 | 0,65 |
| 2 | 600 | 50 | 25 | 25 | 0,70 |
| 3 | 720 | 61 | 30 | 30 | 0,75 |
| 4 | 850 | 75 | 40 | 40 | 0,80 |
| 5 | 1000 | 90 | 50 | 50 | 0,85 |

O **papel** vem da primeira classe da forma nesta ordem de prioridade e ajusta o base:

| Papel | Vida | Dano | Outros | Alcance | Mana |
|---|---|---|---|---|---|
| Tanque | ×1,25 | ×0,75 | +20 armadura e resist. | 1 | 70 |
| Porradeiro | ×1,15 | ×1,05 | | 1 | 70 |
| Assassino | ×1,00 | ×1,20 | +15% crítico | 1 | 60 |
| Atirador | ×0,75 | ×1,00 | vel. ataque ×1,10 | 4 | 80 |
| Dragão | ×1,05 | ×1,05 | | 2 | 80 |
| Robô | ×1,00 | ×1,00 | +15 armadura | 2 | 70 |
| Anjo | ×0,85 | ×1,00 | | 3 | 80 |
| Fadinhas | ×0,90 | ×0,95 | | 3 | 70 |
| Safada | ×1,00 | ×1,00 | | 2 | 70 |
| Temporais | ×0,90 | ×1,00 | | 3 | 90 |
| Demoníacos | ×1,00 | ×1,05 | | 2 | 80 |
| Criaturinha Bizarra | ×1,20 | ×1,05 | | 1 | 70 |
| Únicos | ×1,00 | ×1,00 | | 2 | 80 |
| Só elemento | Terra vida ×1,10; Vento vel. ×1,10 | | | Fogo, Água, Vento, Planta 2; Raio, Gelo 3; Terra 1 | 80 |

Forma que não lança nada (não final de Pokémon e Digimon) ganha +22% de vida e dano na estrela 1 e +28% na 2 e na 3, no
lugar da habilidade.

**Evoluir** (`BONUS_EVOLUCAO` em atributos.ts; pedido do usuário em 05/11/2026): nas linhas de Pokémon e Digimon, além da
estrela, a forma evoluída ganha vida e dano: Pokémon +5% na estrela 2 e +10% na 3, Digimon +12% e +30%. Solto da mesma
origem não ganha. Medido na seção "Origens" do equilibrio.md: evoluir de ★1 pra ★2 valia +84% no Pokémon e +78% no
Digimon, e agora +91% e +97%; de ★2 pra ★3, +84% e +59%, agora +91% e +84%.

**Quem luta de perto apesar do papel** (`CORPO_A_CORPO` em atributos.ts; pedido do usuário em 05/11/2026: gente demais
de longe). O alcance do papel é o padrão, e a tabela põe em alcance 1 quem na obra bate, morde ou corta no contato; quem
tem ataque de longe de verdade (sopro, tiro, magia) fica com o do papel. Eram 408 das 592 formas de longe; agora são
306. Sem o alcance a forma toma os golpes da frente, então a vida dela sobe pelo menos até a de um Porradeiro (×1,15, em
vez do multiplicador do papel; medido: sem isso, 128 campeões fora da faixa no rodízio; com isso, 74). Transformar troca
o alcance pelo da forma nova (War Greymon bate de perto, mesmo vindo do Metal Greymon).

Todos: 25% de chance de crítico (+40% de dano). **Mana:** +10 por ataque; golpe recebido (ataque ou habilidade) dá
mana pela fração da vida máxima que tirou: 40 × dano ÷ vida máxima, até 5 por golpe (quem tem mais vida enche mais
devagar apanhando, então tanque não lança mais rápido só por estar na frente). Ninguém começa com mana, a não ser por
item ou traço; a habilidade define o máximo. Ataque básico é físico (armadura); habilidade é mágica (resistência), a
não ser que diga outra coisa. Redução: dano × 100 / (100 + defesa).

**Passivas** (`src/autobatalha/conteudo/passivas.ts`): poucos campeões têm uma, que age como item. Hoje, o ouro no
chão: Harvest, Pro Pickpocket, Pseudotrash, a linha do Numemon e Rat King, ao lançar a habilidade e no golpe que
derruba um inimigo, têm 50% de chance de derrubar 1 de ouro no chão (até 2/3/4 por luta, pela estrela; o Numemon também
6% a cada ataque). A moeda fica no tabuleiro até o jogador passar o mouse em cima (dá ~1 de ouro por luta por campeão
desses).

## Luta (src/autobatalha/combate)

- Tabuleiro de 8 colunas × 8 linhas de hexágonos; cada jogador monta a sua metade (8 × 4, linha 0 = frente). Na luta
  o humano é o lado A (embaixo) e o adversário aparece espelhado em cima.
- Passo de 0,1 s, com semente (a mesma entrada dá a mesma luta). Cada lutador: se tem alvo no alcance, ataca no
  ritmo da velocidade; senão anda 1 casa pro inimigo mais perto (uma casa a cada 0,5 s, desviando de ocupadas).
  Mana cheia: lança a habilidade e zera. Assassinos saltam pra trás da linha inimiga no começo.
- Fim: um lado sem ninguém vivo, ou 30 s (ganha quem tiver mais vida somada em fração; empate se igual).
- O motor devolve `ResultadoLuta`: vencedor, sobreviventes, dano e abates por lutador, ouro achado e, se pedido, a
  gravação (estado inicial, um quadro por passo e eventos) que a tela reproduz.

## Traços (src/autobatalha/conteudo/tracos.ts)

Conta campeões diferentes no tabuleiro (duas cópias do mesmo campeão contam uma vez), pela forma atual. Únicos não é
traço. **Quantos degraus cada traço tem sai do tamanho dele** (pedido do usuário em 05/11/2026: Fogo com 2/3/4 tendo muito
mais gente): 3 até 13 campeões, 4 de 14 a 17, 5 de 18 a 29 e 6 de 30 em diante (`degrausPorTamanho`; contas e custo de
cada degrau em docs/tft/matematica/resultado.md, seção 6c). A escada guarda os degraus de antes quando dá, e todo último
degrau cabe no tabuleiro: com limite = nível, o degrau b fecha no nível b (o mais alto é 10).
Criaturinha Bizarra e Safada começam no 3 (pedido do usuário pra nem todo traço começar no 2). As origens têm 5 degraus (6
nas maiores), pedido do usuário em 04/11/2026, com as escadas da conta (seção 6b); o Pokémon, grande demais pra se igualar
com 6 degraus, ganhou 2/4/6/8/9/10 com efeito pequeno nos degraus de baixo.

| Traço | Campeões | Antes | Agora |
|---|---|---|---|
| Safada | 37 | 3/5/7 | 3/4/5/7/9/10 |
| Porradeiro | 35 | 2/4/6 | 2/3/4/6/8/10 |
| Criaturinha Bizarra | 34 | 3/5/7 | 3/4/5/7/9/10 |
| Fadinhas | 34 | 2/4/6 | 2/3/4/6/8/10 |
| Demoníacos | 32 | 2/4/6 | 2/3/4/6/8/10 |
| Tanque | 27 | 2/4/6 | 2/3/4/6/8 |
| Atirador | 24 | 2/4/6 | 2/3/4/5/7 |
| Dragão | 24 | 2/4/6 | 2/3/4/5/7 |
| Robô | 23 | 2/4/6 | 2/3/4/5/6 |
| Assassino | 20 | 2/4/6 | 2/3/4/5/6 |
| Anjo | 20 | 2/4/6 | 2/3/4/5/6 |
| Fogo | 20 | 2/3/4 | 2/3/4/5/6 |
| Vento | 19 | 2/3/4 | 2/3/4/5/6 |
| Água | 18 | 2/3/4 | 2/3/4/5/6 |
| Temporais | 17 | 2/4/6 | 2/3/4/5 |
| Planta | 16 | 2/3/4 | 2/3/4/5 |
| Raio | 15 | 2/3/4 | 2/3/4/5 |
| Terra | 11 | 2/3/4 | 2/3/4 |
| Gelo | 11 | 2/3/4 | 2/3/4 |

**Classes**

| Classe | Efeito |
|---|---|
| Tanque (2/3/4/6/8) | +20 / 30 / 40 / 70 / 100% de armadura e resistência; (4) começam com escudo de 15% da vida; (6) no começo provocam os inimigos em volta por 3 s |
| Porradeiro (2/3/4/6/8/10) | +15 / 22 / 30 / 50 / 65 / 80% de vida; (4) abaixo de metade da vida causam 20% a mais; (6) o resto do time ganha +10% de vida |
| Assassino (2/3/4/5/6) | saltam pra trás da linha inimiga. +15 / 22 / 30 / 37 / 45% de chance e de dano de crítico; (6) cada abate deixa 1 s sem poder ser alvo |
| Demoníacos (2/3/4/6/8/10) | 10 / 15 / 20 / 25 / 27 / 30% de roubo de vida, e quando um Demoníaco morre os outros ganham o mesmo em dano |
| Criaturinha Bizarra (3/4/5/7/9/10) | no começo, cada uma ganha um bônus sorteado (escudo de 15% da vida, +15% de vel. ataque, +15% de dano ou cura de 2% da vida por segundo), que vale 1 / 1,5 / 2 / 2,5 / 3 / 3,5 vezes isso; (7) dois bônus |
| Fadinhas (2/3/4/6/8/10) | a cada 4 s, cada Fadinha cura o aliado com menos vida em 4 / 6 / 8 / 14 / 18 / 22% da vida máxima dele |
| Safada (3/4/5/7/9/10) | os ataques têm 15 / 21 / 27 / 40 / 55 / 70% de chance de encantar o alvo por 1,5 s (atordoado) |
| Atirador (2/3/4/5/7) | +1 de alcance; cada ataque dá +3 / 4,5 / 6 / 7 / 9% de vel. ataque (até 15 vezes) |
| Anjo (2/3/4/5/6) | (2) o primeiro Anjo que morrer renasce com 40% da vida; (3) com 45%; (4) todos renascem uma vez com 50%; (5) 65%; (6) 80% |
| Robô (2/3/4/5/6) | +25 / 38 / 50 / 70 / 90% de armadura e escudo de 10 / 15 / 20 / 27 / 35% da vida no começo; (6) imunes a atordoar nos primeiros 5 s |
| Dragão (2/3/4/5/7) | +10 / 15 / 20 / 26 / 36% de vida e dano; (7) o time inteiro ganha +5% de dano |
| Temporais (2/3/4/5) | a cada 5 s, o time ganha +6 / 9 / 12 / 18% de vel. ataque até o fim da luta (acumula); (5) uma vez por luta, o aliado que cairia abaixo de 20% da vida cura 40% |
| Fogo (2/3/4/5/6) | ataques queimam (1 / 2 / 3 / 3,5 / 4% da vida máxima por s, 3 s, e 33% menos cura); (4) quem morre queimando passa o fogo pro inimigo mais perto |
| Água (2/3/4/5/6) | recuperam 1,5 / 3 / 4,5 / 5,5 / 6,5% da vida por segundo; (4) a cada 4 s se livram dos efeitos ruins |
| Terra (2/3/4) | +30 / 60 / 100% de armadura e resistência; (4) a cada 4 s um tremor atordoa por 0,5 s os inimigos em volta |
| Vento (2/3/4/5/6) | +15 / 30 / 45 / 55 / 65% de vel. ataque; desviam de 0 / 10 / 15 / 18 / 20% dos ataques |
| Raio (2/3/4/5) | a cada 3 ataques, um raio pula do alvo pra 1 / 2 / 3 / 4 inimigos (60% do dano); (4) atordoa 0,5 s |
| Gelo (2/3/4) | o alvo fica 15 / 25 / 35% mais lento; (4) o 5º ataque seguido no mesmo alvo congela 1 s |
| Planta (2/3/4/5) | o 1º ataque em cada inimigo planta uma semente que suga 2 / 3,5 / 4,5 / 5,5% da vida dele por segundo, por 4 s, e cura quem plantou; (4) a cura vai também pro aliado mais perto |

**Origens**

| Origem | Escada | Efeito |
|---|---|---|
| Pokémon | 2/4/6/8/9/10 | cada Pokémon ganha +1 / 1,5 / 2 / 2,5 / 3 / 3,5% de vida e dano por Pokémon no tabuleiro |
| Digimon | 2/3/4/5/6 | Parceiro: Digimon com aliado de outra origem do lado ganha +8 / 12 / 18 / 25 / 35% de vida e dano; (3) o parceiro ganha metade; (5) o Digimon com parceiro começa com a mana cheia |
| SMT | 2/3/4/6/8 | Invocadores: no começo, cada demônio invoca um monstro do Final Fantasy (sorteado) ao lado, com 20 / 25 / 32 / 45 / 60% dos atributos dele |
| Persona | 1/2/3/4/5 | cada Persona dá aos aliados em volta +8 / 14 / 20 / 28 / 38% de um atributo, pela 1ª classe dela (dano: Atirador, Assassino, Porradeiro, Fogo, Raio; vida: Tanque, Terra, Anjo, Água; vel. ataque: Vento, Safada, Temporais; armadura e resist.: Robô, Gelo, Planta; poder de habilidade: Fadinhas, Demoníacos, Dragão, Criaturinha Bizarra) |
| JoJo | 2/3/4/5/6/8 | Stands e seus usuários ganham +6 / 10 / 13 / 16 / 18 / 28% de dano e vida; (8) os Stands lançam com 25% menos mana |
| Yu-Gi-Oh! | 2/3/5/7/9/10 | cada carta fica em ataque (+10 / 15 / 22 / 30 / 40 / 50% de dano) ou em defesa (o mesmo em vida e armadura, e provoca os inimigos em volta por 2 s no começo); (7) ganham os dois |
| LoL | 2/3/5/7/9/10 | +10 / 15 / 22 / 30 / 40 / 50% de poder de habilidade. Regra da franquia, com ou sem traço: na estrela 3, a cada 2 lançamentos a habilidade sai duas vezes (a "ultimate") |
| Overwatch | 2/3/4/5/7 | +6 / 10 / 15 / 20 / 28% de vel. ataque. Jogada da Partida: depois de cada luta, o herói que mais causou dano ganha +2 / 3 / 5 / 7 / 10% de dano e vida pro resto da partida |
| Deadlock | 2/3/4/5/6 | abates de heróis do Deadlock rendem almas (×2 a partir do 5). A cada 10 almas: +1 de ouro, e os heróis ganham +1,5 / 2 / 2,5 / 3 / 4% de dano e vida por 10 almas juntadas na partida |
| Sujimon | 2/3/4/5/6 | +10 / 15 / 22 / 30 / 40% de vida e dano; vencer rodada de monstros traz um Sujimon de graça pro banco com 0 / 30 / 50 / 75 / 100% de chance |

## Itens: Bakugan (src/autobatalha/conteudo/itens.ts)

7 componentes (os atributos) e 28 completos (2 componentes; receitas de docs/tft/base/receitas-bakugan.json). Cada
unidade carrega até 3; dois componentes na mesma unidade viram o completo na hora. Vendeu a unidade, os itens voltam.

| Componente | Bônus |
|---|---|
| Pyrus | +12% de dano |
| Aquos | +20 de mana inicial |
| Haos | +25% de resistência e escudo de 10% da vida no começo |
| Darkus | 12% de roubo de vida |
| Subterra | +35% de armadura |
| Ventus | +10% de vel. ataque |
| Aurelus | +12% de vida |

O completo soma os dois componentes ×1,5 e ganha um efeito próprio (lista no arquivo).

## Partida (src/autobatalha/partida)

- **8 jogadores**: você e 7 bots (online: as pessoas da sala e bots nas vagas que sobram; seção "Online"), 100 de
  vida cada. Acaba quando sobra um; a colocação é a ordem de eliminação.
- **Rodadas:** estágio 1 = 1-1, 1-2, 1-3 contra monstros. Do estágio 2 em diante: x-1 a x-6 contra jogadores e x-7
  contra monstros (2-7 monstros comuns; 3-7 em diante um **chefe** do Final Fantasy, categoria Chefe, com escolta).
  Monstros e chefes sorteados a cada partida.
- **Carrossel** (`src/autobatalha/partida/carrossel.ts`): no começo de cada estágio a partir do 2, antes do
  planejamento da x-1, uma fase própria. 9 campeões de estrela 1 saem do pool (forma de nível 1 com alternativas:
  sorteada, como na loja), cada um segurando um item: componente nos estágios 2 a 4, Bakugan completo do 5 em
  diante. Custos pelo estágio: 2 → 1 e 2; 3 → 2 e 3; 4 → 3 e 4; 5+ → 3, 4 e 5 (tabela `CUSTOS_DO_CARROSSEL`), sem
  repetir campeão enquanto der. Os vivos são liberados em duplas, da menor vida pra maior (empate sorteado): a 1ª
  dupla aos 3 s e uma nova a cada 3 s. O bot pega na hora em que é liberado (prefere campeão que já tem, que fecha
  evolução ou que dá traço que ele monta; senão o componente que fecha um completo com um solto; o custo desempata).
  Você, depois de liberado, clica em qualquer opção que sobrou; sem pegar até o fim (4 s depois da última dupla),
  leva uma ao acaso. Quando todos já pegaram, fecha 1,5 s depois. Quem pega leva o campeão pro banco (vale a evolução
  por 3 cópias; banco cheio: o campeão é vendido na hora pelo custo e o item fica, a não ser que feche uma evolução,
  como na loja) e o item pros itens soltos. Os que ninguém pegou voltam pro pool. A renda, o XP e a loja nova da x-1
  vêm junto com o carrossel (dá pra comprar, vender e atualizar enquanto ele roda; o tabuleiro só muda no
  planejamento), e os bots jogam o planejamento depois dele.
- **Adversário:** sorteado entre os vivos, evitando os 2 últimos; com número ímpar, um enfrenta um fantasma (cópia do
  tabuleiro de outro), e o fantasma não perde vida.
- **Dano na derrota:** base do estágio (2: 2, 3: 3, 4: 4, 5: 6, 6: 8, 7+: 11) + metade, arredondada pra cima, de (1
  por inimigo vivo + 1 por estrela acima da 1ª desses vivos). Contra monstros só a base (estágio 1 não tira vida). Com
  isso, partidas de 8 bots vão até o estágio 6 ou 7 (~35 rodadas; medido em src/autobatalha/integracao.test.ts).
- **Ouro** (mais generoso que o do gênero, porque o set tem muito mais campeões; pedido do usuário em 04/11): começa
  com 1. No começo de cada planejamento: 1-2 e 1-3 dão 2; do 2-1 em diante, 6 + juros (1 a cada 10, até 5) + sequência
  (2 seguidas: +1; 3: +2; 4: +3; 5 ou mais: +4, de vitórias ou de derrotas). Vencer contra jogador: +2.
- **Ouro no chão:** alguns campeões derrubam moedas na luta (passiva no conteúdo). As do humano caem na metade dele do
  tabuleiro e só viram ouro quando ele passa o mouse em cima (ficam de uma rodada pra outra); os bots recebem direto.
- **Monstros:** vencer dá 1 componente + 1 de ouro (chefe: 2 componentes + 2 de ouro); perder dá 1 de ouro.
- **Nível:** começa no 1; +2 de XP por rodada (a partir da 1-2); 4 de ouro = 4 XP. XP pro próximo nível: 2, 2, 4, 8,
  14, 24, 36, 56, 76, 96, 120 (máximo 12; mais barata nos níveis baixos e médios). O limite de unidades no tabuleiro é
  o nível: 1 no nível 1, até 12 (Stands: seção Set). No começo da luta, quem passar do limite volta pro banco (o mais
  fraco primeiro), e vaga sobrando é preenchida com o banco.
- **Loja:** 7 vagas, a última é a **vaga do time** (só campeões do custo sorteado que dividem origem ou classe com o
  seu tabuleiro). O custo de cada vaga sai da tabela do nível; dentro do custo, campeão que você já tem pesa 4 e os
  outros 1 (conta da loja em docs/tft/matematica). Atualizar: 2 de ouro; travar a loja; atualização grátis a cada
  rodada (se não estiver travada). Começa com um campeão de custo 1 de graça.

| Nível | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| 1–2 | 100% | | | | |
| 3 | 75% | 25% | | | |
| 4 | 55% | 30% | 15% | | |
| 5 | 45% | 33% | 20% | 2% | |
| 6 | 30% | 40% | 25% | 5% | |
| 7 | 19% | 30% | 40% | 10% | 1% |
| 8 | 18% | 25% | 32% | 22% | 3% |
| 9 | 15% | 20% | 25% | 30% | 10% |
| 10 | 5% | 10% | 20% | 40% | 25% |
| 11 | 3% | 7% | 15% | 40% | 35% |
| 12 | 2% | 5% | 13% | 35% | 45% |

- **Pool compartilhado:** cópias de cada campeão por custo: 22, 20, 17, 10, 9. Vender devolve as cópias.
- **Vender:** custo × cópias (1, 3, 9), menos 1 na estrela 2 ou 3 se o custo for 2 ou mais.
- **Banco:** 9 vagas. Comprar com o banco cheio só se a compra fechar uma evolução.
- **Dificuldade** (configuração, vale pra partida nova; padrão Fácil): no Fácil os bots sobem de nível um ponto
  depois, rolam no máximo 2 vezes por rodada, às vezes compram ao acaso ou esquecem uma carta, posicionam e equipam
  ao acaso; no Difícil sobem um nível antes e rolam até 20 vezes. Medido com 16 partidas cada: um jogador que joga
  como o bot normal termina em média em 2,9º contra bots fáceis, 4,9º contra normais e 5,0º contra difíceis.
- **Bots:** escolhem 1 ou 2 traços pelas primeiras unidades, compram o que encaixa ou evolui, sobem de nível em
  pontos fixos (no normal: 4 no 2-1, 5 no 2-5, 6 no 3-2, 7 no 4-1, 8 no 5-1, 9 no 6-1, 10 no 7-1), guardam 50 de ouro pelos juros e depois rolam;
  tanques na frente, alcance atrás; itens no mais forte; Stand preso a um aliado qualquer (além dos que não ocupam vaga,
  um Stand só entra na vaga que sobrar ou no lugar da pior titular, se tiver nota melhor).
- **Salvar:** a partida é salva no localStorage (`pdx-autobatalha-v1`) no começo de cada planejamento (depois do
  carrossel: fechar a página no meio dele volta pro último planejamento salvo); os planos do planejador em
  `pdx-autobatalha-planos`; a configuração (regras da sala, as suas escolhas no lobby e as preferências) em
  `pdx-autobatalha-config` (config antiga, sem os campos do lobby, ganha os padrões). Chaves novas; as antigas do
  site não mudam. A partida online não é salva (nem apaga a solo salva).
- **Jogadores e estilos:** cada jogador tem um ícone (`Jogador.avatar`, a imagem de uma forma) e um **estilo de
  tabuleiro** (`Jogador.estilo`, id de `src/autobatalha/estilos.ts`; partida salva antes disto = o padrão, o
  gramado). O humano leva o nome, o ícone e o estilo escolhidos no lobby (`novaPartida(semente, escolhas,
  dificuldade)`); os bots sorteiam o ícone (no 1º sorteio da partida, como sempre) e o estilo (num gerador à parte,
  pra não mudar o resto da partida). `lugaresDaSala(semente, escolhas)` dá os 8 como vão estar na partida, e o lobby
  mostra isso antes de começar.

## Tela (src/modes/autobatalha)

- Aba **Autobatalha** no site. Só monta o conteúdo com a aba aberta; o jogo carrega só quando a aba abre (import com
  lazy). Pensada pra computador, de 1280 a 2560 px.
- **Lobby** (Lobby.tsx, no lugar da tela inicial): a sala antes da partida. À esquerda, os **8 jogadores**: você,
  com a marca de **anfitrião** (coroa), e os 7 bots com o ícone, a dificuldade e uma prévia do tabuleiro que vão ter
  na partida (a sala guarda a semente da próxima partida; começar sem semente usa ela, e depois a sala sorteia outra).
  À direita: **Você** (o que os outros veem: nome opcional, padrão "Você", até 16 letras; o **ícone**, botão "Trocar
  ícone" e "Sortear" pra voltar ao sorteado; o **tabuleiro**, 8 estilos com prévia), as **Regras da sala** (relógio,
  segundos de planejamento e dificuldade dos bots: só o anfitrião muda, e a tela diz isso) e as **Suas preferências**
  (velocidade da luta e volume, só da sua tela). Embaixo: Planejador de times, "Continuar a partida salva" (se houver)
  e **Começar partida**, e o "Como jogar".
- **Sala × jogador**: o contrato separa as `RegrasSala` (do anfitrião), as `EscolhasJogador` (nome, ícone,
  estilo; tipos.ts) e as `Preferencias`; `EstadoTela.sala` tem a semente, o anfitrião, você e os 8 `LugarSala`.
  Ações: `mudarRegras` (ignorada se você não for o anfitrião), `escolher` e `configurar` (tudo salvo em
  `pdx-autobatalha-config`). No solo você é o anfitrião; online, quem criou a sala (seção "Online").
- **Ícone** (Icones.tsx; lista e filtros em `src/autobatalha/icones.ts`): janela com a grade de todos os personagens
  do set (cada forma uma vez, inclusive as de transformação), retratos redondos com a arte inteira, borda da cor do
  custo; filtros por nome (sem acento), origem (botões nas cores das franquias) e custo. Clicar escolhe e fecha. O
  ícone aparece na lista do lobby, na lista de jogadores da partida, na apresentação "VS", no carrossel e no fim.
- **Estilos do tabuleiro** (só cores e fundo, em variáveis CSS por `[data-estilo]` no autobatalha.css, claro e
  escuro): Gramado (o verde de sempre, padrão), Deserto, Neve, Vulcão, Oceano, Noite estrelada, Floresta e Roxo
  arcano. Cada um define as faixas do chão, um desenho por cima (estrelas, neve, brasas, brilhos, dunas, ondas,
  manchas de luz), as casas (miolo, brilho, aro) e um tom pras casas do adversário. A partida usa o seu; olhando o
  tabuleiro de outro jogador, o dele; na luta, a metade de cima (chão e casas) é do adversário (do dono, contra
  fantasma; contra monstros, a sua), e quando os dois têm o mesmo estilo as casas de cima ficam no tom "deles".
- **A partida ocupa a janela inteira**, abaixo das abas do site (o cabeçalho some e as abas ficam numa faixa fina).
  Tudo escala com a janela: a tela põe `--k` no `#autobatalha` (1 = 1280×720, até 2,4) e o CSS mede tudo em
  `calc(N * var(--u))` (`--u` = 1px × k); o tabuleiro mede o espaço que sobra (ResizeObserver) e escolhe o maior
  tamanho de casa que cabe. As casas são um pouco achatadas (altura = largura; na luta, 0,8), como uma câmera inclinada.
- Em cima: estágio e rodada (ícones das rodadas do estágio), fase, relógio, a **votação do Pronto** (placar e
  botão), **Informações**, Planejador, mudo, **configuração** (engrenagem) e Sair. À esquerda: os traços. Depois, a
  **bolsa** (itens soltos) numa coluna à esquerda do tabuleiro. No meio: o tabuleiro (só a sua metade no
  planejamento; o inteiro na luta) e o banco embaixo (encolhe na luta). À direita: os 8 jogadores com vida (clique pra
  olhar o tabuleiro de outro; no planejamento, um ✓ verde no ícone de quem já votou Pronto) e, depois de cada luta, o **dano por unidade** (causado, do motor, e recebido, somado dos eventos; seu lado ou o deles). Embaixo: ouro
  com **juros** (+1 a cada 10) e **sequência** de vitórias ou derrotas, nível e XP, chances da loja, XP, Atualizar,
  travar e as 7 cartas.
- **Tabuleiro:** no estilo padrão, um gramado (faixas de grama, vinheta) com casas hexagonais de grama de aro claro;
  na luta a metade do adversário tem o estilo dele (mesmo estilo: o tom "deles", oliva no gramado) e a linha do meio
  é tracejada com um círculo central; no planejamento a
  linha tracejada fica em cima da sua metade (o adversário vem de cima). Em cima da área: **unidades x/y** (limite da
  partida, sem número fixo na tela; pisca quando sobra vaga; "+N Stands" quando já há Stand fora da vaga) e a **contagem grande** dos segundos até a luta, que fica
  vermelha e pulsa nos últimos 5.
- **Unidade no tabuleiro:** foto redonda com borda da cor do custo (cinza, verde, azul, roxo, dourado), estrelas em
  cima, barras de vida e mana, itens embaixo e o ícone do **alcance** (espada vermelha = de perto; arco azul = de
  longe). Ao lançar a habilidade, a foto dá um pulinho com tremida.
- **Imagens inteiras:** retratos, cartas, carrossel, planejador e dica com `object-fit: contain` sobre um fundo da cor
  do custo (o redondo ainda pode cortar a pontinha de uma arte quadrada cheia).
- **Cartas da loja:** retrato inteiro, nome e custo, **todos os traços em etiquetas coloridas** (origem na cor da
  franquia; cada classe e elemento com a sua cor, `COR_TRACO` em comum.tsx), as **cópias que você já tem** (bolinhas
  até 3, e ★★/★★★ se já tem estrela 2 ou 3), a marca **★★/★★★ que brilha quando a compra evolui**, o alcance, "plano"
  e "time". As etiquetas ficam numa área de **duas linhas** (a mesma altura em toda carta, pra elas ficarem
  alinhadas; a carta cresceu um pouco pra isso): a origem primeiro e os nomes compridos (mais de 12 letras, hoje só
  Criaturinha Bizarra) no fim, que sozinhos numa linha quebram melhor. Medido com o CSS de verdade: toda forma de
  nível 1 do set cabe em duas linhas. Se um dia não couber, a carta troca os compridos pelo nome curto
  (`nomeCurtoTraco`: "Criat. Bizarra"), com o inteiro no title. Só a loja usa essas etiquetas (o carrossel e o
  planejador mostram foto e nome; a dica lista os traços sem limite de altura).
- **Campeão que você já tem na loja** (banco ou tabuleiro, qualquer estrela): um **anel dourado pulsando** em volta
  da carta (atrás dela, `data-destaque="tem"` no item da lista). Se a compra **fecha uma evolução** (já tem 2 cópias
  da mesma estrela), o destaque fica mais forte: um anel que gira com brilho intenso (★★: dourado, branco e laranja;
  ★★★: prisma; `data-destaque="evolui2"` ou `"evolui3"`) e o ★★/★★★ no meio da arte. Com
  `prefers-reduced-motion` o anel fica parado, com o brilho aceso. Visual próprio (anel em CSS, sem arte do TFT).
- **Traços:** hexágono com a forma do degrau (bronze, prata, ouro e prisma no último degrau das escadas longas) e a
  cor do traço no meio, nome, contagem e próximo degrau, a escada com o atual em destaque e uma barra até o próximo.
  Passar o mouse destaca no tabuleiro e no banco as unidades do traço (as outras apagam); o botão de lista abre os
  campeões do traço (retrato, custo; os seus marcados, no tabuleiro mais forte) com "Detalhes" pras Informações.
- **Tooltip.** Passar o mouse mostra só o essencial (pedido do usuário): nome, imagem, custo, estrelas, alcance, os
  traços, a habilidade com os números da estrela atual, o nome da passiva, os itens e, na luta, vida e mana atuais. O
  **botão direito** fixa o tooltip completo: nome,
  imagem, alcance, origem, classes (com o que cada traço faz), custo, estrelas, passiva (se tiver), atributos (vida,
  dano, armadura, resistência, vel. ataque, alcance, mana, crítico), habilidade com os números da estrela atual em
  destaque, linha evolutiva (imagens de cada nível, alternativas, a forma atual marcada, a transformação da ult),
  informações do Catálogo e itens. **Botão direito** em qualquer retrato ou carta fixa o tooltip (o esquerdo continua
  comprando e arrastando); clicar numa unidade sua também fixa, com os botões de escolher a ult e a posição do
  Yu-Gi-Oh!. Fixo, clicar na imagem abre a arte grande. Fecha com Esc ou clique fora.
- **Informações** (botão no topo; Info.tsx): todos os traços com degraus, efeitos e os campeões de cada um; a grade de
  receitas dos Bakugan (componente × componente); as chances da loja por nível até o máximo da partida, com XP e
  limite do tabuleiro; e as regras de ouro, juros, sequência, venda e dano, montadas das constantes da partida.
- **Configuração** (lobby e engrenagem na partida): regras da sala (relógio e segundos, dificuldade dos bots, que vale
  pra partida nova; só o anfitrião) e preferências (velocidade e volume com mudo).
- **Planejador de time:** escolher até 10 campeões (busca, filtro por origem, classe e custo), ver os traços que
  ativam, salvar planos; na loja, campeão do plano ganha marca. Abre durante a partida e fora dela.
- Arrastar e soltar: banco, tabuleiro, vender na loja (o valor de venda vai junto com o mouse e aparece na loja), item
  na unidade, e **um componente solto em cima de outro** junta no Bakugan completo (`juntarItens`). Componente =
  o símbolo do atributo; completo = a imagem do Bakugan. Atalhos: D atualiza, F compra XP, E vende e **W** manda a
  unidade sob o mouse do banco pro tabuleiro (primeira casa livre: de perto na frente, de longe atrás, do meio pras
  pontas) ou do tabuleiro pro banco.
- **Ouro no chão:** moedas que caíram na luta ficam douradas na casa (canto de baixo) até você passar o mouse em
  cima: o ouro entra e um "+N" sobe. Na luta, a moeda cai na casa na hora.
- Luta: antes, a **apresentação** (~1,5 s, `MS_CLASH` no controle, que segura o tempo da luta): o seu avatar contra o
  do adversário (ou o monstro, ou o chefe) com um "VS". Depois as unidades andam entre casas, barras mudam, números de
  dano sobem, nome da habilidade aparece, efeitos simples nas casas atingidas. Velocidade 1×/2×/4× e "Pular luta".
- **Sons** (som.ts, Web Audio gerado na hora, sem arquivos; sons.ts decide quando, comparando os estados da tela):
  comprar, vender, atualizar, XP, nível, evoluir (★2 e ★3), posicionar, equipar, juntar, apresentação, começo da luta,
  golpe (baixinho, com limite por segundo), crítico, habilidade (pelo efeito), morte, vitória, derrota, carrossel,
  relógio nos últimos segundos, moeda, aviso e clique. O áudio só começa no primeiro gesto; volume 0 não toca nada.
- **Votação do "Pronto"** (pedido do usuário): o "Pronto" do planejamento é um voto. Cada jogador vivo vota que
  está pronto e, quando **todos** votam, o planejamento acaba na hora (com ou sem relógio; sem todos, o relógio fecha
  como sempre). Os bots votam assim que jogam o planejamento deles (no solo, logo no começo), então no solo o seu voto
  fecha a votação. No topo, o placar **"Prontos 7/8"** com um ponto por jogador vivo; o botão vira **"✓ Pronto"**
  (verde) depois do seu voto e clicar de novo **desfaz** enquanto o planejamento corre; na lista de jogadores, um ✓
  em quem já votou. Pensando no online, o voto fica na partida: `Jogador.pronto` (tipos.ts; regras em
  `partida/votacao.ts`: `votarPronto`, `votarBots`, `todosProntos`, `limparVotos`; o fim do planejamento limpa
  tudo) e vai junto no salvo; a tela lê `EstadoTela.votacao` (`prontos`, ids de quem votou; `total`, os vivos;
  `voce`) e chama `acoes.votarPronto()` (alterna) ou `acoes.pronto()` (vota, sem alternar). Partida salva antes da
  votação: os bots votam ao carregar.
- Escolha da forma da evolução em janelinha (fica pra depois do carrossel); sem resposta no fim do relógio, sorteia.
- **Carrossel** no lugar do tabuleiro: as 9 opções num círculo que gira devagar (para com o mouse em cima), cada uma
  com a foto redonda da cor do custo e o ícone do item; a dica mostra o campeão e o item que vem junto. Quem pegou
  aparece com o avatar em cima da opção, que fica apagada. Ao lado, a ordem de escolha em duplas, com a vez atual, o
  tempo até cada dupla e o que cada um pegou. No meio, a sua situação ("Sua vez em 3 s", "Sua vez: clique num
  campeão", "Você pegou…") e quanto falta pra fechar.

## Online (jogar com amigos; src/autobatalha/online)

Pedido do usuário (prioridade): jogar com amigos, cada um no seu navegador. O solo continua igual, sem rede.

- **Anfitrião autoritativo.** O navegador de quem cria a sala roda a partida de verdade: o mesmo controle do solo
  (`controle.ts`, com os ganchos de `online/anfitriao.ts`), com o relógio, os bots nas vagas vazias, as lutas, o
  carrossel e a votação do Pronto. Os convidados só mostram a visão deles e mandam ações. A tela fala com a sessão
  (`sessao.ts`), que escolhe a fonte: o controle (solo e anfitrião) ou o convidado (`online/convidado.ts`).
- **Rede.** O transporte da aba Online (`src/online/transport`): PeerJS no site e BroadcastChannel com
  `?transporte=local` nos testes. O código da sala tem 4 letras; no transporte vira `ab-ABCD` (o id no PeerJS fica
  `qvp-sala-ab-ABCD`), pra não bater com as salas da aba Online. O link é `?autobatalha=ABCD` (o `?sala=` continua
  sendo da aba Online): abrir o link abre a aba Autobatalha e entra sozinho. Cada mensagem vai como texto JSON
  (o empacotamento binário do PeerJS trocaria `undefined` por `null`, e a luta reproduzida tem de ver a mesma entrada).
- **Lobby.** "Criar sala online" (bloco **Jogar com amigos**) mostra o código, o link (copiar, ou "Convidar" no
  celular) e "Fechar a sala". Quem abre o link entra no primeiro lugar livre (o anfitrião é o `h1`, os convidados
  `h2` a `h8`; até 8 pessoas), escolhe nome (vazio = "Jogador N"), ícone e tabuleiro, e todos veem. Só o anfitrião
  muda as regras (relógio, segundos, dificuldade dos bots), tira alguém da sala (botão "Tirar", dois cliques) e
  começa; as vagas que sobram até 8 viram bots. A partida em andamento não aceita gente nova (só quem volta).
- **Versão.** O "ola" leva a versão do jogo: a do protocolo, a do código (carimbo do build, `__VERSAO_CODIGO__` no
  vite.config.ts) e um hash do set1.json. Diferente = recusado com o aviso pra recarregar (os dois).
- **Ações.** O convidado manda cada ação (comprar, vender, atualizar, XP, travar, mover, equipar, juntar itens, forma
  da evolução, carrossel, moeda, ult, posição do Yu-Gi-Oh!, voto de pronto) sem dizer de quem é: o anfitrião aplica
  no Jogador da conexão (`partida/acao.ts` confere a fase; as partes da partida conferem o resto) e manda o aviso
  ("Ouro insuficiente") só pra ele. Olhar o tabuleiro dos outros é local.
- **Visão de cada um** (`online/visao.ts`). O próprio Jogador inteiro; dos outros, o público (nome, ícone, estilo,
  vida, nível, ouro, sequência, tabuleiro, banco e itens soltos), sem a loja e as escolhas de evolução. A partida vai
  sem o pool e sem a semente (no lugar, um id da partida: com a semente dava pra prever a loja). O anfitrião junta as
  mudanças de ~40 ms e manda só o que mudou pra cada um: a parte comum da partida, se mudou, e os jogadores que
  mudaram.
- **Tempo.** O relógio é do anfitrião: cada mensagem leva quanto falta do planejamento e o tempo do carrossel, e o
  convidado conta daí (a rede atrasa uns milissegundos; quem decide o fim é o anfitrião). A votação do Pronto é a
  mesma do solo: cada humano vota da sua tela, os bots votam ao jogar, todos os vivos prontos = a luta começa.
- **Luta.** O anfitrião simula todas sem gravar e manda a cada humano só `{ entradaA, entradaB, semente }` da luta
  dele; o navegador do convidado roda o mesmo motor gravando e mostra (mesmo código e mesmo set = a mesma luta;
  `online/luta.test.ts` confere com o set de verdade, pela rede, dos dois lados). Quem está no lado B vê a luta
  espelhada: giro de 180° no tabuleiro e lados trocados, com o time dele embaixo como sempre. Cada um vê na
  velocidade dele e avisa quando terminou (ou pulou); a rodada segue quando todos os humanos viram, ou no limite (a
  luta mais longa em 1× + a apresentação + 4 s).
- **Queda.** O convidado que cai (ou fecha a aba) fica **fora do ar** (`Jogador.ausente`, uma marca "bot" na lista
  de jogadores): um bot joga o planejamento dele, vota pronto, pega no carrossel e a luta não espera por ele. Ele
  volta pro mesmo lugar abrindo o link de novo no mesmo aparelho (a senha do aparelho fica em
  `pdx-autobatalha-aparelho`; só ele e o anfitrião sabem) ou, de outro aparelho, com o mesmo nome que tinha na
  partida. A conexão tem ping (4 s; cai sem notícia em 12 s) e o convidado tenta voltar sozinho por uns 50 s. No
  lobby, quem cai sai da sala.
- **Anfitrião.** Se a página do anfitrião fechar, a sala acaba e todos veem o aviso (não há troca de anfitrião). Ele
  deve deixar a aba aberta (de preferência visível: aba escondida tem os relógios do navegador mais lentos) até o
  fim, mesmo eliminado: a tela de colocação avisa isso. "Sair" na partida, pro anfitrião, acaba a partida pra todos e
  volta pra sala; pro convidado, sai da sala (um bot fica no lugar). No fim, o anfitrião joga de novo com a mesma
  sala ou volta pro lobby. Eliminado, cada um vê a colocação e o placar ao vivo até a partida acabar.
- **Testes.** Vitest em `src/autobatalha/online/` (protocolo, visão, sala de ponta a ponta com um transporte de
  mentira: ação só do dono, voto, luta igual nos dois lados, limite da luta, queda e volta, tirar, fechar, relógio e
  carrossel) e Playwright em `tests/autobatalha-online.spec.ts` (3 abas com o transporte local).
