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
  casa ao lado), no máximo um por unidade, e **não contam no limite do tabuleiro**. Se um morre, o outro morre junto.
  Stand sem usuário volta pro banco no começo da luta.

## Atributos (src/autobatalha/combate/atributos.ts)

Base da estrela 1 pelo custo; estrela multiplica vida (×1 / ×1,8 / ×3,24) e dano (×1 / ×1,5 / ×2,25).

| Custo | Vida | Dano | Armadura | Resist. | Vel. ataque |
|---|---|---|---|---|---|
| 1 | 500 | 45 | 20 | 20 | 0,65 |
| 2 | 600 | 50 | 25 | 25 | 0,70 |
| 3 | 700 | 60 | 30 | 30 | 0,75 |
| 4 | 850 | 75 | 40 | 40 | 0,80 |
| 5 | 1000 | 90 | 50 | 50 | 0,85 |

O **papel** vem da primeira classe da forma nesta ordem de prioridade e ajusta o base:

| Papel | Vida | Dano | Outros | Alcance | Mana |
|---|---|---|---|---|---|
| Tanque | ×1,30 | ×0,80 | +20 armadura e resist. | 1 | 60 (começa com 20) |
| Porradeiro | ×1,15 | ×1,05 | | 1 | 70 |
| Assassino | ×0,85 | ×1,20 | +15% crítico | 1 | 60 |
| Atirador | ×0,80 | ×1,10 | vel. ataque ×1,10 | 4 | 80 |
| Dragão | ×1,05 | ×1,05 | | 2 | 80 |
| Robô | ×1,00 | ×1,00 | +15 armadura | 2 | 70 |
| Anjo | ×0,95 | ×1,00 | | 3 | 80 |
| Fadinhas | ×0,85 | ×0,90 | | 3 | 70 |
| Safada | ×0,90 | ×1,00 | | 2 | 70 |
| Temporais | ×0,90 | ×1,00 | | 3 | 90 |
| Demoníacos | ×1,00 | ×1,05 | | 2 | 80 |
| Criaturinha Bizarra, Únicos | ×1,00 | ×1,00 | | 1 / 2 | 70 / 80 |
| Só elemento | Terra vida ×1,10; Vento vel. ×1,10 | | | Fogo, Água, Vento, Planta 2; Raio, Gelo 3; Terra 1 | 80 |

Todos: 25% de chance de crítico (+40% de dano), mana +10 por ataque e +5 por golpe recebido (habilidades com mana
própria mudam o máximo). Ataque básico é físico (armadura); habilidade é mágica (resistência), a não ser que diga
outra coisa. Redução: dano × 100 / (100 + defesa).

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
traço. Escadas das classes 2/4/6 e dos elementos 2/3/4. As origens têm 5 degraus (6 nas maiores), pedido do usuário em
04/11/2026, com as escadas da conta (docs/tft/matematica/resultado.md, seção 6b); o Pokémon, grande demais pra se
igualar com 6 degraus, ganhou 2/4/6/8/9/10 com efeito pequeno nos degraus de baixo.

**Classes**

| Classe | Efeito |
|---|---|
| Tanque | (2) +20% de armadura e resistência; (4) +40%, e começam com escudo de 15% da vida; (6) +70%, e no começo provocam os inimigos em volta por 3 s |
| Porradeiro | (2) +15% de vida; (4) +30%, e abaixo de metade da vida causam 20% a mais; (6) +50%, e o resto do time ganha +10% de vida |
| Assassino | saltam pra trás da linha inimiga. (2) +15% de chance e +15% de dano de crítico; (4) +30% e +30%; (6) +45% e +45%, e cada abate deixa 1 s sem poder ser alvo |
| Demoníacos | (2) 10% de roubo de vida, e quando um Demoníaco morre os outros ganham 10% de dano; (4) 20% e 20%; (6) 35% e 35% |
| Criaturinha Bizarra | no começo, cada uma ganha um bônus sorteado (escudo de 15% da vida, +15% de vel. ataque, +15% de dano ou cura de 2% da vida por segundo); (4) o dobro; (6) o triplo e dois bônus |
| Fadinhas | a cada 4 s, cada Fadinha cura o aliado com menos vida em 4 / 8 / 14% da vida máxima dele |
| Safada | os ataques têm 10 / 18 / 28% de chance de encantar o alvo por 1 s (atordoado) |
| Atirador | +1 de alcance; cada ataque dá +3 / 6 / 10% de vel. ataque (até 15 vezes) |
| Anjo | (2) o primeiro Anjo que morrer renasce com 30% da vida; (4) todos renascem uma vez com 30%; (6) com 60% |
| Robô | +25 / 50 / 90% de armadura e escudo de 10 / 20 / 35% da vida no começo; (6) imunes a atordoar nos primeiros 5 s |
| Dragão | +10 / 20 / 32% de vida e dano; (6) o time inteiro ganha +5% de dano |
| Temporais | a cada 5 s, o time ganha +6 / 12 / 20% de vel. ataque até o fim da luta (acumula); (6) uma vez por luta, o aliado que cairia abaixo de 20% da vida cura 40% |
| Fogo (2/3/4) | ataques queimam (1 / 2 / 3% da vida máxima por s, 3 s, e 33% menos cura); (4) quem morre queimando passa o fogo pro inimigo mais perto |
| Água (2/3/4) | recuperam 1 / 2 / 3% da vida por segundo; (4) a cada 4 s se livram dos efeitos ruins |
| Terra (2/3/4) | +15 / 30 / 50% de armadura; (4) a cada 6 s um tremor atordoa por 0,5 s os inimigos em volta |
| Vento (2/3/4) | +15 / 30 / 50% de vel. ataque; (3) desviam de 10% dos ataques; (4) 20% |
| Raio (2/3/4) | a cada 3 ataques, um raio pula do alvo pra 1 / 2 / 3 inimigos (60% do dano); (4) atordoa 0,5 s |
| Gelo (2/3/4) | o alvo fica 15 / 25 / 35% mais lento; (4) o 5º ataque seguido no mesmo alvo congela 1 s |
| Planta (2/3/4) | o 1º ataque em cada inimigo planta uma semente que suga 2 / 4 / 6% da vida dele por 4 s e cura quem plantou; (4) a cura vai também pro aliado mais perto |

**Origens**

| Origem | Escada | Efeito |
|---|---|---|
| Pokémon | 2/4/6/8/9/10 | cada Pokémon ganha +1 / 1,5 / 2 / 2,5 / 3 / 3,5% de vida e dano por Pokémon no tabuleiro |
| Digimon | 2/3/4/5/6 | Parceiro: Digimon com aliado de outra origem do lado ganha +8 / 12 / 18 / 25 / 35% de vida e dano; (3) o parceiro ganha metade; (5) o Digimon com parceiro começa com a mana cheia |
| SMT | 2/3/4/6/8 | Invocadores: no começo, cada demônio invoca um monstro do Final Fantasy (sorteado) ao lado, com 20 / 25 / 32 / 45 / 60% dos atributos dele |
| Persona | 1/2/3/4/5 | cada Persona dá aos aliados em volta +8 / 14 / 20 / 28 / 38% de um atributo, pela 1ª classe dela (dano: Atirador, Assassino, Porradeiro, Fogo, Raio; vida: Tanque, Terra, Anjo, Água; vel. ataque: Vento, Safada, Temporais; armadura e resist.: Robô, Gelo, Planta; poder de habilidade: Fadinhas, Demoníacos, Dragão, Criaturinha Bizarra) |
| JoJo | 2/3/5/7/9/10 | Stands e seus usuários ganham +6 / 10 / 16 / 24 / 32 / 42% de dano e vida; (7) os Stands lançam com 25% menos mana |
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
| Pyrus | +15% de dano |
| Aquos | +15 de mana inicial |
| Haos | +15% de resistência e escudo de 8% da vida no começo |
| Darkus | 10% de roubo de vida |
| Subterra | +25% de armadura |
| Ventus | +12% de vel. ataque |
| Aurelus | +15% de vida |

O completo soma os dois componentes ×1,5 e ganha um efeito próprio (lista no arquivo).

## Partida (src/autobatalha/partida)

- **8 jogadores**: você e 7 bots, 100 de vida cada. Acaba quando sobra um; a colocação é a ordem de eliminação.
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
- **Ouro:** começa com 1. No começo de cada planejamento: 1-2 e 1-3 dão 2; do 2-1 em diante, 5 + juros (1 a cada 10,
  até 5) + sequência (2–3 seguidas: +1; 4: +2; 5 ou mais: +3, de vitórias ou de derrotas). Vencer contra jogador: +1.
- **Monstros:** vencer dá 1 componente + 1 de ouro (chefe: 2 componentes + 2 de ouro); perder dá 1 de ouro.
- **Nível:** começa no 1; +2 de XP por rodada (a partir da 1-2); 4 de ouro = 4 XP. XP pro próximo nível: 2, 2, 6, 10,
  20, 36, 48, 76, 84 (máximo 10). O nível é o limite de unidades no tabuleiro (Stands à parte). No começo da luta,
  quem passar do limite volta pro banco, e vaga sobrando é preenchida com o banco.
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

- **Pool compartilhado:** cópias de cada campeão por custo: 22, 20, 17, 10, 9. Vender devolve as cópias.
- **Vender:** custo × cópias (1, 3, 9), menos 1 na estrela 2 ou 3 se o custo for 2 ou mais.
- **Banco:** 9 vagas. Comprar com o banco cheio só se a compra fechar uma evolução.
- **Bots:** escolhem 1 ou 2 traços pelas primeiras unidades, compram o que encaixa ou evolui, sobem de nível em
  pontos fixos (4 no 2-1, 5 no 2-5, 6 no 3-2, 7 no 4-1, 8 no 5-1), guardam 50 de ouro pelos juros e depois rolam;
  tanques na frente, alcance atrás; itens no mais forte; Stand preso a um aliado qualquer.
- **Salvar:** a partida é salva no localStorage (`pdx-autobatalha-v1`) no começo de cada planejamento (depois do
  carrossel: fechar a página no meio dele volta pro último planejamento salvo); os planos do planejador em
  `pdx-autobatalha-planos`. Chaves novas; as antigas do site não mudam.

## Tela (src/modes/autobatalha)

- Aba **Autobatalha** no site. Só monta o conteúdo com a aba aberta. Pensada pra computador (1280 px).
- Em cima: estágio e rodada (ícones das rodadas do estágio), relógio. À esquerda: traços ativos com contagem e
  degraus. No meio: o tabuleiro de hexágonos (só a sua metade no planejamento; o inteiro na luta), o banco e os itens
  soltos. À direita: os 8 jogadores com vida (clique pra olhar o tabuleiro de outro). Embaixo: ouro, nível e XP,
  "Comprar XP", "Atualizar", travar e as 7 cartas da loja (retrato, nome, custo, origem e classes, borda da cor do custo).
- **Unidade no tabuleiro:** foto redonda com borda da cor do custo (cinza, verde, azul, roxo, dourado), estrelas em
  cima, barras de vida e mana, itens embaixo.
- **Tooltip** (passar o mouse em qualquer retrato: tabuleiro, banco, loja, planejador, inimigo na luta): nome,
  imagem, origem, classes (com o que cada traço faz), custo, estrelas, atributos (vida, dano, armadura, resistência,
  vel. ataque, alcance, mana, crítico), habilidade com os números da estrela atual em destaque, linha evolutiva
  (imagens de cada nível, alternativas, a forma atual marcada, a transformação da ult), informações do Catálogo e itens.
  Clicar numa unidade sua fixa o tooltip, com os botões de escolher a ult e a posição do Yu-Gi-Oh! (fecha com Esc ou
  clique fora). O jogo carrega só quando a aba abre (import com lazy).
- **Planejador de time:** escolher até 10 campeões (busca, filtro por origem, classe e custo), ver os traços que
  ativam, salvar planos; na loja, campeão do plano ganha marca. Abre durante a partida e fora dela.
- Arrastar e soltar (banco, tabuleiro, vender na loja, item na unidade). Atalhos: D atualiza, F compra XP, E vende o
  que está sob o mouse.
- Luta: unidades andam entre casas, barras mudam, números de dano sobem, nome da habilidade aparece, efeitos simples
  nas casas atingidas. Velocidade 1×/2×/4× e "Pular luta".
- Escolha da forma da evolução em janelinha (fica pra depois do carrossel); sem resposta no fim do relógio, sorteia.
- **Carrossel** no lugar do tabuleiro: as 9 opções num círculo que gira devagar (para com o mouse em cima), cada uma
  com a foto redonda da cor do custo e o ícone do item; a dica mostra o campeão e o item que vem junto. Quem pegou
  aparece com o avatar em cima da opção, que fica apagada. Ao lado, a ordem de escolha em duplas, com a vez atual, o
  tempo até cada dupla e o que cada um pegou. No meio, a sua situação ("Sua vez em 3 s", "Sua vez: clique num
  campeão", "Você pegou…") e quanto falta pra fechar.
