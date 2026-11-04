# Equilíbrio: playtest automático

Gerado em 2026-11-04 por `src/autobatalha/equilibrio/equilibrio.playtest.ts` com o set, o motor e o conteúdo de verdade. Semente base 2026: a mesma semente e o mesmo código dão os mesmos números. Como rodar e o que cada medida quer dizer: [README.md](README.md), seção "Playtest". Não edite a parte gerada à mão: rode de novo.

## Curva por custo

Times de 5 campeões sorteados (sem Stands) de um custo e estrela contra os de outro, 160 cenários jogados dos dois lados. Alvo: custo de cima ganha da mesma estrela; uma estrela a mais briga com 1 e 2 custos acima (★2 de custo 1 contra ★1 de custo 2 e 3, e assim por diante).

| Time | Contra | Vitórias | Alvo |
|---|---|---|---|
| ★1 custo 2 | ★1 custo 1 | 100% | 75%–100% |
| ★1 custo 3 | ★1 custo 2 | 100% | 75%–100% |
| ★1 custo 4 | ★1 custo 3 | 100% | 75%–100% |
| ★1 custo 5 | ★1 custo 4 | 100% | 75%–100% |
| ★2 custo 2 | ★2 custo 1 | 100% | 75%–100% |
| ★2 custo 3 | ★2 custo 2 | 100% | 75%–100% |
| ★2 custo 4 | ★2 custo 3 | 100% | 75%–100% |
| ★2 custo 5 | ★2 custo 4 | 100% | 75%–100% |
| ★2 custo 1 | ★1 custo 1 | 100% | – |
| ★2 custo 1 | ★1 custo 2 | 100% | 60%–100% |
| ★2 custo 1 | ★1 custo 3 | 57% | 35%–65% |
| ★2 custo 2 | ★1 custo 3 | 100% | 60%–100% |
| ★2 custo 2 | ★1 custo 4 | 63% | 35%–65% |
| ★2 custo 3 | ★1 custo 4 | 100% | 60%–100% |
| ★2 custo 3 | ★1 custo 5 | 66% | 35%–65% |
| ★3 custo 1 | ★2 custo 2 | 100% | 60%–100% |
| ★3 custo 1 | ★2 custo 3 | 64% | 35%–65% |
| ★3 custo 2 | ★2 custo 4 | 69% | 35%–65% |

**Fora do alvo:** ★2 custo 3 contra ★1 custo 5: 66% (alvo 35%–65%); ★3 custo 2 contra ★2 custo 4: 69% (alvo 35%–65%).

## Mana e lançamentos

Alvo: 1º lançamento entre 4 e 10 s pra maioria; tanque não lança antes dos papéis de dano (Porradeiro, Assassino, Atirador, Dragão, Demoníacos); ninguém lança mais de 1 vez a cada 3 s vivo. Tabelas das partidas de bots (tabuleiros de verdade, com itens e traços) e, nas duas últimas colunas, da curva por custo (5 contra 5, sem itens). "Mana de apanhar" = golpes recebidos; "de efeitos" = habilidades, traços e itens que dão mana. Só unidades com habilidade.

| Papel | Unidades-luta | 1º lanç. (s) | Antes de 3 s | 3–10 s | Depois de 10 s | Não lançou | Lanç./10 s vivo | Mana de atacar | de apanhar | de efeitos | 1º lanç. 5×5 (s) | Lanç./10 s 5×5 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Assassino | 1044 | 6,1 | 5% | 73% | 5% | 17% | 1,32 | 55% | 25% | 20% | 5,9 | 1,28 |
| Planta | 133 | 7,8 | 13% | 35% | 35% | 17% | 0,89 | 74% | 20% | 5% | 10,7 | 0,54 |
| Porradeiro | 2086 | 7,9 | 3% | 54% | 14% | 29% | 0,77 | 69% | 29% | 2% | 7,3 | 0,90 |
| Atirador | 5152 | 7,9 | 2% | 77% | 7% | 14% | 1,01 | 90% | 8% | 2% | 9,1 | 0,85 |
| Robô | 605 | 8,2 | 0% | 69% | 14% | 16% | 0,91 | 76% | 24% | 0% | 7,8 | 1,00 |
| Terra | 83 | 8,3 | 0% | 53% | 12% | 35% | 0,71 | 67% | 33% | 0% | – | – |
| Tanque | 2784 | 8,4 | 2% | 54% | 15% | 30% | 0,77 | 68% | 30% | 2% | 7,6 | 0,93 |
| Dragão | 719 | 8,4 | 8% | 45% | 31% | 16% | 0,84 | 76% | 20% | 4% | 8,9 | 0,80 |
| Criaturinha Bizarra | 4402 | 8,6 | 1% | 49% | 18% | 32% | 0,73 | 70% | 29% | 1% | 7,5 | 0,91 |
| Vento | 299 | 8,6 | 0% | 67% | 17% | 16% | 0,81 | 81% | 19% | 0% | 8,6 | 0,88 |
| Água | 343 | 8,7 | 2% | 68% | 12% | 18% | 0,81 | 80% | 20% | 0% | 8,8 | 0,80 |
| Safada | 2724 | 8,8 | 1% | 49% | 27% | 22% | 0,79 | 78% | 17% | 5% | 8,4 | 0,87 |
| Demoníacos | 1064 | 8,9 | 0% | 61% | 28% | 10% | 0,80 | 82% | 18% | 0% | 7,9 | 0,92 |
| Fadinhas | 3126 | 9,1 | 1% | 58% | 31% | 10% | 0,86 | 82% | 17% | 1% | 9,3 | 0,83 |
| Fogo | 104 | 9,4 | 8% | 24% | 61% | 8% | 0,77 | 81% | 19% | 0% | 9,9 | 0,58 |
| Anjo | 547 | 9,7 | 0% | 43% | 48% | 9% | 0,74 | 88% | 11% | 1% | 9,5 | 0,80 |
| Temporais | 670 | 10,0 | 3% | 28% | 60% | 9% | 0,76 | 85% | 11% | 4% | 10,3 | 0,71 |
| Gelo | 80 | 10,0 | 0% | 14% | 85% | 1% | 0,76 | 88% | 12% | 0% | – | – |
| Raio | 186 | 10,3 | 0% | 13% | 75% | 12% | 0,68 | 90% | 10% | 0% | 10,9 | 0,67 |
| Únicos | 1451 | 10,5 | 0% | 23% | 41% | 36% | 0,56 | 85% | 13% | 1% | 9,9 | 0,71 |
| **Todos** | 27602 | 8,5 | 2% | 56% | 21% | 21% | 0,83 | 79% | 19% | 3% | 8,4 | 0,88 |

| Custo | 1º lanç. ★1 (s) | ★2 | ★3 | Lanç./10 s ★1 | ★2 | ★3 |
|---|---|---|---|---|---|---|
| 1 | 9,3 | 8,7 | 7,5 | 0,68 | 0,81 | 0,79 |
| 2 | 8,3 | 8,2 | 4,7 | 0,89 | 0,92 | 1,11 |
| 3 | 8,7 | 7,7 | – | 0,86 | 0,96 | – |
| 4 | 7,8 | 6,3 | – | 0,86 | 1,23 | – |
| 5 | 7,9 | – | – | 0,94 | – | – |

- Tanque: 1º lançamento em 8,4 s; papéis de dano: 7,8 s.
- Rodízio (seção seguinte, 4 contra 4 com bonecos): 1º lançamento dentro de 4–10 s em 85% dos campeões (mediana 8,9 s).
- Lançam mais de 1 vez a cada 3 s vivo no rodízio: ninguém.
- Lançam em menos de 50% das lutas do rodízio (fora transformação): ninguém.

## Força por campeão

Cada campeão (forma da estrela, ult padrão) com 3 bonecos do custo dele (atributos base, sem habilidade nem traço) contra cada outro do mesmo custo e estrela com os mesmos bonecos, em 3 disposições e dos dois lados (rodízio). Os Stands formam um grupo à parte, presos ao mesmo usuário. Faixa: 35% a 65% de vitórias. "Valor/lanç." = dano + cura + escudo da habilidade por lançamento, em múltiplos do dano de ataque.

| Custo | Estrela | Campeões | Vitórias (mín–máx) | 10% | 90% | Fora da faixa |
|---|---|---|---|---|---|---|
| 1 | ★1 | 60 | 31%–82% | 42% | 61% | 4 |
| 1 | ★2 | 60 | 34%–83% | 37% | 63% | 8 |
| 2 | ★1 | 48 | 32%–78% | 36% | 61% | 6 |
| 2 | ★2 | 48 | 18%–85% | 30% | 67% | 21 |
| 3 | ★1 | 50 | 28%–71% | 37% | 60% | 4 |
| 3 | ★2 | 50 | 22%–71% | 36% | 61% | 7 |
| 4 | ★1 | 44 | 26%–71% | 38% | 62% | 6 |
| 4 | ★2 | 44 | 34%–66% | 37% | 63% | 6 |
| 5 | ★1 | 35 | 33%–71% | 38% | 66% | 6 |
| 5 | ★2 | 35 | 27%–66% | 35% | 61% | 5 |

**Fora da faixa** (mais forte primeiro):

| Campeão | Custo | ★ | Papel | Habilidade | Vitórias | Dano/luta | Vivo no fim | 1º lanç. (s) | Lanç./10 s | Valor/lanç. |
|---|---|---|---|---|---|---|---|---|---|---|
| McGinnis | 2 | ★2 | Tanque | Bateria de Mísseis | 85% | 1093 | 15% | 9,1 | 1,0 | 5,7 |
| Tracer | 1 | ★2 | Atirador | Charme | 83% | 1641 | 92% | 9,4 | 1,0 | 2,8 |
| Tracer | 1 | ★1 | Atirador | Charme | 82% | 891 | 80% | 9,4 | 1,0 | 1,9 |
| Kai'Sa | 1 | ★2 | Atirador | Charme | 82% | 1648 | 91% | 9,4 | 1,0 | 2,9 |
| Kai'Sa | 1 | ★1 | Atirador | Charme | 82% | 893 | 80% | 9,4 | 1,0 | 1,9 |
| Widowmaker | 2 | ★1 | Atirador | Charme | 78% | 1168 | 80% | 8,9 | 1,0 | 1,9 |
| Doctrine | 2 | ★2 | Anjo | Pacto Sombrio | 78% | 2071 | 85% | 9,9 | 1,0 | 4,1 |
| Widowmaker | 2 | ★2 | Atirador | Charme | 77% | 2022 | 89% | 8,8 | 1,0 | 2,8 |
| Abaddon | 3 | ★1 | Anjo | Pacto Sombrio | 71% | 1321 | 70% | 9,1 | 1,0 | 2,7 |
| Clockwork Knight | 4 | ★1 | Temporais | Parar o Tempo | 71% | 1334 | 60% | 9,8 | 0,9 | 0,8 |
| Orisa | 3 | ★2 | Robô | Bateria de Mísseis | 71% | 1666 | 35% | 8,7 | 1,0 | 4,4 |
| Magearna | 5 | ★1 | Fadinhas | Vira Mega Magearna | 71% | 1796 | 68% | 9,3 | 0,4 | 0,0 |
| Mercy | 4 | ★1 | Anjo | Pó de Fada | 71% | 1181 | 63% | 8,7 | 1,1 | 2,7 |
| Chomp-and-Charger | 2 | ★2 | Tanque | Muralha | 70% | 774 | 29% | 9,2 | 1,0 | 4,3 |
| D.Mon | 3 | ★2 | Robô | Bateria de Mísseis | 69% | 1676 | 38% | 8,7 | 1,0 | 4,4 |
| Nami | 5 | ★1 | Fadinhas | Pó de Fada | 69% | 1346 | 68% | 8,3 | 1,2 | 2,9 |
| Timestar Magician | 5 | ★1 | Temporais | Parar o Tempo | 68% | 1588 | 61% | 9,3 | 1,0 | 0,7 |
| Doctrine | 2 | ★1 | Anjo | Pacto Sombrio | 68% | 1072 | 71% | 9,7 | 1,0 | 2,7 |
| Barong | 3 | ★1 | Raio | Corrente Elétrica | 68% | 1239 | 64% | 10,5 | 0,8 | 2,2 |
| Zoe | 5 | ★1 | Anjo | Pó de Fada | 68% | 1377 | 63% | 8,3 | 1,2 | 2,7 |
| Reinhardt | 2 | ★2 | Tanque | Muralha | 67% | 778 | 27% | 9,2 | 1,0 | 4,3 |
| Duosion | 2 | ★2 | Criaturinha Bizarra | (só ataca) | 67% | 1120 | 6% | – | 0,0 | – |
| Labrynth Cooclock | 4 | ★1 | Temporais | Parar o Tempo | 66% | 1334 | 60% | 9,8 | 0,9 | 0,8 |
| Timestar Magician | 5 | ★2 | Temporais | Parar o Tempo | 66% | 2681 | 73% | 9,4 | 1,0 | 1,1 |
| Grotle | 1 | ★2 | Tanque | (só ataca) | 66% | 675 | 4% | – | 0,0 | – |
| Labrynth Cooclock | 4 | ★2 | Temporais | Parar o Tempo | 66% | 2309 | 77% | 9,9 | 0,9 | 1,2 |
| Gate Guardian | 2 | ★2 | Tanque | Muralha | 66% | 774 | 26% | 9,2 | 1,0 | 4,3 |
| Bystial Magnamhut | 1 | ★2 | Atirador | Tiro Perfurante | 66% | 1604 | 74% | 10,8 | 0,8 | 3,2 |
| Clockwork Knight | 4 | ★2 | Temporais | Parar o Tempo | 66% | 2279 | 73% | 9,9 | 0,9 | 1,2 |
| Heavy Machinery | 4 | ★2 | Robô | Bateria de Mísseis | 66% | 1946 | 32% | 8,2 | 1,1 | 4,2 |
| Tyrant of the Tides | 4 | ★1 | Dragão | Sopro de Dragão | 65% | 990 | 23% | 8,6 | 0,9 | 2,5 |
| Garen | 3 | ★2 | Tanque | Muralha | 65% | 936 | 24% | 8,7 | 1,0 | 4,2 |
| Boldore | 1 | ★2 | Criaturinha Bizarra | (só ataca) | 65% | 828 | 2% | – | 0,0 | – |
| Lava Golem | 2 | ★2 | Tanque | Muralha | 65% | 778 | 28% | 9,2 | 1,0 | 4,3 |
| Black Metal Dragon | 2 | ★2 | Dragão | Bateria de Mísseis | 65% | 1431 | 39% | 9,1 | 1,0 | 4,5 |
| Tentomon | 2 | ★1 | Planta | (só ataca) | 35% | 614 | 18% | – | 0,0 | – |
| Croconaw | 2 | ★2 | Água | (só ataca) | 35% | 1128 | 29% | – | 0,0 | – |
| Revolmon | 5 | ★2 | Atirador | (só ataca) | 35% | 3190 | 60% | – | 0,0 | – |
| Ahri | 2 | ★1 | Safada | Charme | 35% | 640 | 25% | 8,7 | 0,8 | 1,9 |
| Dewott | 1 | ★2 | Água | (só ataca) | 34% | 840 | 25% | – | 0,0 | – |
| Sukamon | 1 | ★2 | Criaturinha Bizarra | Vira Sukamon | 34% | 813 | 1% | 9,4 | 0,8 | 2,7 |
| Mina | 5 | ★2 | Safada | Charme | 34% | 2024 | 20% | 7,8 | 1,0 | 2,3 |
| Galgomon | 4 | ★2 | Atirador | (só ataca) | 34% | 2643 | 71% | – | 0,0 | – |
| Cosmoem | 5 | ★2 | Fadinhas | (só ataca) | 34% | 2604 | 56% | – | 0,0 | – |
| Rem | 4 | ★2 | Fadinhas | Coisa Esquisita | 34% | 2011 | 58% | 8,7 | 1,1 | 2,1 |
| Prinplup | 1 | ★2 | Água | (só ataca) | 34% | 840 | 23% | – | 0,0 | – |
| Izanagi | 5 | ★1 | Assassino | Golpe Fatal | 34% | 911 | 2% | 4,8 | 1,5 | 1,9 |
| Volcarona | 4 | ★2 | Fogo | (só ataca) | 34% | 1627 | 23% | – | 0,0 | – |
| Hatenna | 2 | ★1 | Safada | (só ataca) | 33% | 622 | 21% | – | 0,0 | – |
| Baseball Diehard | 1 | ★1 | Únicos | Vira Baseball Diehard | 33% | 468 | 14% | 8,8 | 0,9 | 2,4 |
| Sandile | 3 | ★1 | Terra | (só ataca) | 33% | 617 | 1% | – | 0,0 | – |
| Quilava | 2 | ★2 | Fogo | (só ataca) | 33% | 1128 | 30% | – | 0,0 | – |
| Mina | 5 | ★1 | Safada | Charme | 33% | 1046 | 20% | 7,4 | 1,1 | 1,6 |
| Steenee | 3 | ★2 | Safada | (só ataca) | 33% | 1399 | 27% | – | 0,0 | – |
| Apollo | 4 | ★1 | Assassino | Pacto Sombrio | 32% | 895 | 17% | 6,2 | 1,1 | 1,9 |
| Litten | 2 | ★1 | Fogo | (só ataca) | 32% | 625 | 19% | – | 0,0 | – |
| Krokorok | 3 | ★2 | Terra | (só ataca) | 32% | 1179 | 2% | – | 0,0 | – |
| Hattrem | 2 | ★2 | Safada | (só ataca) | 32% | 1129 | 32% | – | 0,0 | – |
| Bayleef | 2 | ★2 | Atirador | (só ataca) | 31% | 1782 | 90% | – | 0,0 | – |
| Dartrix | 2 | ★2 | Planta | (só ataca) | 31% | 1130 | 33% | – | 0,0 | – |
| Torracat | 2 | ★2 | Fogo | (só ataca) | 31% | 1137 | 30% | – | 0,0 | – |
| Vyper | 2 | ★2 | Atirador | Coisa Esquisita | 31% | 1636 | 89% | 8,8 | 1,0 | 1,6 |
| Mandrake | 1 | ★1 | Fadinhas | Coisa Esquisita | 31% | 625 | 36% | 10,3 | 0,9 | 1,5 |
| Luxio | 2 | ★2 | Raio | (só ataca) | 29% | 1565 | 77% | – | 0,0 | – |
| Kabuterimon | 2 | ★2 | Planta | (só ataca) | 28% | 1134 | 30% | – | 0,0 | – |
| Aron | 3 | ★1 | Terra | (só ataca) | 28% | 614 | 1% | – | 0,0 | – |
| Frogadier | 2 | ★2 | Água | (só ataca) | 27% | 1135 | 30% | – | 0,0 | – |
| Mewtwo | 5 | ★2 | Únicos | (só ataca) | 27% | 1849 | 14% | – | 0,0 | – |
| Abrams | 4 | ★1 | Tanque | Pacto Sombrio | 26% | 646 | 2% | 7,8 | 1,0 | 2,2 |
| Kirlia | 3 | ★2 | Fadinhas | (só ataca) | 25% | 1841 | 67% | – | 0,0 | – |
| Kadabra | 3 | ★2 | Fadinhas | (só ataca) | 22% | 1843 | 69% | – | 0,0 | – |
| Angemon | 2 | ★2 | Anjo | (só ataca) | 21% | 1512 | 67% | – | 0,0 | – |
| Anubis | 2 | ★2 | Únicos | Vira Anubis | 18% | 1176 | 10% | 10,1 | 0,7 | 3,2 |

**Stands fora da faixa** (entre Stands do mesmo custo):

| Campeão | Custo | ★ | Papel | Habilidade | Vitórias | Dano/luta | Vivo no fim | 1º lanç. (s) | Lanç./10 s | Valor/lanç. |
|---|---|---|---|---|---|---|---|---|---|---|
| Tusk | 2 | ★2 | Atirador | Vira Tusk | 93% | 1772 | 87% | 10,6 | 0,8 | 3,8 |
| Ball Breaker | 2 | ★1 | Atirador | Vira Ball Breaker | 83% | 835 | 73% | 10,7 | 0,8 | 1,2 |
| Tusk | 2 | ★1 | Atirador | Vira Tusk | 77% | 906 | 77% | 10,7 | 0,8 | 1,7 |
| Ball Breaker | 2 | ★2 | Atirador | Vira Ball Breaker | 77% | 1519 | 83% | 10,5 | 0,7 | 1,7 |
| The World (Steel Ball Run) | 5 | ★2 | Porradeiro | Vira The World (Steel Ball Run) | 75% | 1308 | 25% | 11,0 | 0,5 | 2,3 |
| Boy II Man | 1 | ★2 | Tanque | Vira Boy II Man | 67% | 364 | 19% | 8,7 | 1,0 | 0,0 |
| Talking Head | 1 | ★2 | Tanque | Vira Talking Head | 65% | 386 | 17% | 8,6 | 0,9 | 2,6 |
| The Hand | 4 | ★1 | Porradeiro | Vira The Hand | 33% | 852 | 17% | 8,0 | 0,9 | 2,9 |
| The Hand | 4 | ★2 | Porradeiro | Vira The Hand | 33% | 1687 | 17% | 8,3 | 0,9 | 4,3 |
| Wonder of U | 5 | ★2 | Demoníacos | Vira Wonder of U | 29% | 1323 | 13% | 10,5 | 0,4 | 3,9 |
| Foo Fighters (Stand) | 2 | ★2 | Água | Vira Foo Fighters (Stand) | 27% | 1257 | 17% | 10,0 | 0,9 | 4,1 |
| Hey Ya! | 1 | ★2 | Criaturinha Bizarra | Vira Hey Ya! | 25% | 449 | 8% | 8,6 | 0,9 | 0,0 |
| Gold Experience Requiem | 5 | ★2 | Temporais | Vira Gold Experience Requiem | 25% | 1316 | 17% | 10,2 | 0,6 | 0,8 |
| Echoes | 2 | ★1 | Vento | Vira Echoes | 23% | 611 | 17% | 8,9 | 1,0 | 1,6 |
| Echoes | 2 | ★2 | Vento | Vira Echoes | 23% | 1517 | 17% | 9,3 | 1,0 | 4,5 |
| Metallica | 2 | ★2 | Únicos | Vira Metallica | 20% | 1208 | 20% | 11,1 | 0,7 | 3,2 |
| Metallica | 2 | ★1 | Únicos | Vira Metallica | 13% | 565 | 10% | 10,6 | 0,7 | 1,9 |

<details><summary>Todos os campeões</summary>

| Campeão | Custo | ★ | Papel | Habilidade | Vitórias | Dano/luta | Vivo no fim | 1º lanç. (s) | Lanç./10 s | Valor/lanç. | Stand |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Tracer | 1 | ★1 | Atirador | Charme | 82% | 891 | 80% | 9,4 | 1,0 | 1,9 |  |
| Kai'Sa | 1 | ★1 | Atirador | Charme | 82% | 893 | 80% | 9,4 | 1,0 | 1,9 |  |
| Orianna | 1 | ★1 | Robô | Bateria de Mísseis | 64% | 517 | 30% | 9,0 | 0,9 | 3,3 |  |
| Jinzo | 1 | ★1 | Robô | Bateria de Mísseis | 63% | 518 | 29% | 9,0 | 0,9 | 3,3 |  |
| Predaplant Verte Anaconda | 1 | ★1 | Dragão | Sopro de Dragão | 62% | 528 | 23% | 9,7 | 0,8 | 2,7 |  |
| Grubbin | 1 | ★1 | Criaturinha Bizarra | (só ataca) | 61% | 425 | 2% | – | 0,0 | – |  |
| Roggenrola | 1 | ★1 | Criaturinha Bizarra | (só ataca) | 61% | 423 | 1% | – | 0,0 | – |  |
| Pro Pickpocket | 1 | ★1 | Assassino | Golpe Fatal | 60% | 522 | 16% | 6,1 | 1,4 | 2,1 |  |
| Escapist | 1 | ★1 | Únicos | Vira Escapist | 60% | 632 | 85% | 8,8 | 0,9 | 2,1 |  |
| Squirtle | 1 | ★1 | Atirador | (só ataca) | 58% | 858 | 61% | – | 0,0 | – |  |
| Captain Kidd | 1 | ★1 | Atirador | Tiro Perfurante | 57% | 855 | 49% | 10,8 | 0,8 | 2,0 |  |
| Dark Magician | 1 | ★1 | Demoníacos | Pacto Sombrio | 57% | 540 | 30% | 8,8 | 0,9 | 2,6 |  |
| Sona | 1 | ★1 | Fadinhas | Pó de Fada | 57% | 598 | 65% | 10,3 | 0,9 | 2,7 |  |
| Wraith | 1 | ★1 | Atirador | Tiro Perfurante | 56% | 859 | 46% | 10,8 | 0,8 | 2,0 |  |
| Pichu | 1 | ★1 | Raio | (só ataca) | 56% | 729 | 58% | – | 0,0 | – |  |
| Shion | 1 | ★1 | Atirador | Tiro Perfurante | 55% | 856 | 49% | 10,8 | 0,8 | 2,0 |  |
| Elecmon | 1 | ★1 | Raio | (só ataca) | 55% | 733 | 60% | – | 0,0 | – |  |
| Kuriboh | 1 | ★1 | Fadinhas | Pó de Fada | 54% | 600 | 65% | 10,3 | 0,9 | 2,7 |  |
| Kiriko | 1 | ★1 | Fadinhas | Pó de Fada | 54% | 600 | 66% | 10,3 | 0,9 | 2,7 |  |
| Ana | 1 | ★1 | Atirador | Tiro Perfurante | 53% | 854 | 46% | 10,8 | 0,8 | 2,0 |  |
| Caitlyn | 1 | ★1 | Atirador | Tiro Perfurante | 53% | 858 | 47% | 10,8 | 0,8 | 2,0 |  |
| Yuumi | 1 | ★1 | Fadinhas | Pó de Fada | 53% | 596 | 63% | 10,3 | 0,9 | 2,7 |  |
| Pixie | 1 | ★1 | Fadinhas | Pó de Fada | 52% | 597 | 66% | 10,3 | 0,9 | 2,7 |  |
| Bystial Magnamhut | 1 | ★1 | Atirador | Tiro Perfurante | 52% | 841 | 42% | 10,8 | 0,8 | 2,0 |  |
| Idun | 1 | ★1 | Fadinhas | Pó de Fada | 51% | 600 | 64% | 10,4 | 0,9 | 2,7 |  |
| Lash | 1 | ★1 | Porradeiro | Pancadão | 49% | 434 | 3% | 8,6 | 0,8 | 3,3 |  |
| Chimchar | 1 | ★1 | Fogo | (só ataca) | 49% | 461 | 22% | – | 0,0 | – |  |
| Hammered Man | 1 | ★1 | Porradeiro | Pancadão | 48% | 437 | 2% | 8,6 | 0,8 | 3,3 |  |
| Carmen | 1 | ★1 | Safada | Charme | 48% | 480 | 25% | 8,7 | 0,8 | 2,0 |  |
| Baba | 1 | ★1 | Únicos | Vira Baba | 48% | 507 | 23% | 9,7 | 0,8 | 2,8 |  |
| Poppy | 1 | ★1 | Criaturinha Bizarra | Coisa Esquisita | 48% | 392 | 2% | 8,8 | 0,8 | 2,2 |  |
| Torchic | 1 | ★1 | Fogo | (só ataca) | 47% | 459 | 21% | – | 0,0 | – |  |
| Treecko | 1 | ★1 | Planta | (só ataca) | 47% | 463 | 21% | – | 0,0 | – |  |
| Snivy | 1 | ★1 | Planta | (só ataca) | 47% | 467 | 22% | – | 0,0 | – |  |
| Turtwig | 1 | ★1 | Planta | (só ataca) | 47% | 466 | 24% | – | 0,0 | – |  |
| Ukobach | 1 | ★1 | Criaturinha Bizarra | Coisa Esquisita | 47% | 392 | 4% | 8,7 | 0,8 | 2,3 |  |
| Oshawott | 1 | ★1 | Água | (só ataca) | 46% | 469 | 23% | – | 0,0 | – |  |
| Popplio | 1 | ★1 | Água | (só ataca) | 46% | 465 | 23% | – | 0,0 | – |  |
| Bulbasaur | 1 | ★1 | Planta | (só ataca) | 46% | 459 | 20% | – | 0,0 | – |  |
| Palladion | 1 | ★1 | Anjo | Luz Divina | 46% | 744 | 34% | 11,8 | 0,7 | 2,5 |  |
| Black Ooze | 1 | ★1 | Criaturinha Bizarra | Coisa Esquisita | 45% | 393 | 5% | 8,7 | 0,8 | 2,2 |  |
| Cait Sith | 1 | ★1 | Criaturinha Bizarra | Coisa Esquisita | 45% | 392 | 4% | 8,7 | 0,8 | 2,2 |  |
| Charmander | 1 | ★1 | Fogo | (só ataca) | 44% | 466 | 21% | – | 0,0 | – |  |
| Punimon | 1 | ★1 | Únicos | (só ataca) | 44% | 460 | 23% | – | 0,0 | – |  |
| Mudkip | 1 | ★1 | Água | (só ataca) | 44% | 461 | 24% | – | 0,0 | – |  |
| Whismur | 1 | ★1 | Únicos | (só ataca) | 44% | 461 | 21% | – | 0,0 | – |  |
| Piplup | 1 | ★1 | Água | (só ataca) | 44% | 461 | 20% | – | 0,0 | – |  |
| Shakomon | 1 | ★1 | Água | (só ataca) | 44% | 465 | 22% | – | 0,0 | – |  |
| Dark Magician Girl | 1 | ★1 | Safada | Charme | 44% | 479 | 23% | 8,8 | 0,8 | 1,9 |  |
| Tepig | 1 | ★1 | Fogo | (só ataca) | 43% | 463 | 21% | – | 0,0 | – |  |
| Chespin | 1 | ★1 | Planta | (só ataca) | 43% | 454 | 21% | – | 0,0 | – |  |
| Rat King | 1 | ★1 | Criaturinha Bizarra | Coisa Esquisita | 43% | 390 | 4% | 8,7 | 0,8 | 2,3 |  |
| Fennekin | 1 | ★1 | Fogo | (só ataca) | 42% | 465 | 22% | – | 0,0 | – |  |
| Akali | 1 | ★1 | Safada | Charme | 42% | 476 | 22% | 8,8 | 0,8 | 2,0 |  |
| Wild Hog | 1 | ★1 | Tanque | Muralha | 41% | 286 | 2% | 9,0 | 0,8 | 2,9 |  |
| Roadhog | 1 | ★1 | Tanque | Muralha | 38% | 284 | 3% | 9,0 | 0,8 | 2,9 |  |
| Yamato | 1 | ★1 | Tanque | Muralha | 36% | 283 | 4% | 9,0 | 0,8 | 2,9 |  |
| Tyumon | 1 | ★1 | Terra | (só ataca) | 36% | 372 | 0% | – | 0,0 | – |  |
| Baseball Diehard | 1 | ★1 | Únicos | Vira Baseball Diehard | 33% | 468 | 14% | 8,8 | 0,9 | 2,4 |  |
| Mandrake | 1 | ★1 | Fadinhas | Coisa Esquisita | 31% | 625 | 36% | 10,3 | 0,9 | 1,5 |  |
| Talking Head | 1 | ★1 | Tanque | Vira Talking Head | 61% | 243 | 14% | 8,3 | 0,9 | 2,1 | sim |
| Tubular Bells | 1 | ★1 | Criaturinha Bizarra | Vira Tubular Bells | 58% | 406 | 8% | 8,9 | 0,7 | 3,6 | sim |
| Boy II Man | 1 | ★1 | Tanque | Vira Boy II Man | 58% | 215 | 14% | 8,3 | 0,8 | 0,0 | sim |
| Strength | 1 | ★1 | Únicos | Vira Strength | 50% | 327 | 11% | 11,2 | 0,3 | 2,1 | sim |
| Hey Ya! | 1 | ★1 | Criaturinha Bizarra | Vira Hey Ya! | 44% | 255 | 8% | 8,0 | 0,8 | 0,0 | sim |
| Holy's Stand | 1 | ★1 | Safada | Vira Holy's Stand | 42% | 341 | 14% | 10,0 | 0,6 | 2,5 | sim |
| Baby Face | 1 | ★1 | Safada | Vira Baby Face | 36% | 323 | 11% | 10,0 | 0,5 | 1,5 | sim |
| Tracer | 1 | ★2 | Atirador | Charme | 83% | 1641 | 92% | 9,4 | 1,0 | 2,8 |  |
| Kai'Sa | 1 | ★2 | Atirador | Charme | 82% | 1648 | 91% | 9,4 | 1,0 | 2,9 |  |
| Grotle | 1 | ★2 | Tanque | (só ataca) | 66% | 675 | 4% | – | 0,0 | – |  |
| Bystial Magnamhut | 1 | ★2 | Atirador | Tiro Perfurante | 66% | 1604 | 74% | 10,8 | 0,8 | 3,2 |  |
| Boldore | 1 | ★2 | Criaturinha Bizarra | (só ataca) | 65% | 828 | 2% | – | 0,0 | – |  |
| Charjabug | 1 | ★2 | Criaturinha Bizarra | (só ataca) | 65% | 828 | 2% | – | 0,0 | – |  |
| Ana | 1 | ★2 | Atirador | Tiro Perfurante | 63% | 1596 | 74% | 10,8 | 0,8 | 3,2 |  |
| Orianna | 1 | ★2 | Robô | Bateria de Mísseis | 62% | 1003 | 33% | 9,4 | 0,9 | 4,4 |  |
| Caitlyn | 1 | ★2 | Atirador | Tiro Perfurante | 61% | 1592 | 71% | 10,8 | 0,8 | 3,2 |  |
| Predaplant Verte Anaconda | 1 | ★2 | Dragão | Sopro de Dragão | 60% | 1007 | 25% | 10,3 | 0,7 | 4,0 |  |
| Yamato | 1 | ★2 | Tanque | Muralha | 60% | 576 | 18% | 9,4 | 0,9 | 3,9 |  |
| Jinzo | 1 | ★2 | Robô | Bateria de Mísseis | 60% | 1006 | 30% | 9,5 | 0,9 | 4,4 |  |
| Vegimon | 1 | ★2 | Criaturinha Bizarra | (só ataca) | 60% | 822 | 3% | – | 0,0 | – |  |
| Feast 'n Flyer | 1 | ★2 | Tanque | Muralha | 60% | 575 | 18% | 9,4 | 0,9 | 3,9 |  |
| Shion | 1 | ★2 | Atirador | Tiro Perfurante | 59% | 1596 | 71% | 10,8 | 0,8 | 3,2 |  |
| Wraith | 1 | ★2 | Atirador | Tiro Perfurante | 59% | 1606 | 73% | 10,8 | 0,8 | 3,3 |  |
| Roadhog | 1 | ★2 | Tanque | Muralha | 58% | 570 | 17% | 9,5 | 0,9 | 3,9 |  |
| Break-and-Entryman | 1 | ★2 | Assassino | Golpe Fatal | 57% | 913 | 1% | 6,2 | 1,5 | 3,3 |  |
| Bugs | 1 | ★2 | Demoníacos | Pacto Sombrio | 56% | 1012 | 29% | 9,4 | 0,8 | 3,8 |  |
| Feral Felon | 1 | ★2 | Assassino | Golpe Fatal | 55% | 911 | 1% | 6,2 | 1,5 | 3,3 |  |
| Agathion | 1 | ★2 | Criaturinha Bizarra | Coisa Esquisita | 54% | 828 | 16% | 9,4 | 0,9 | 3,7 |  |
| Dark Magician | 1 | ★2 | Demoníacos | Pacto Sombrio | 54% | 1022 | 29% | 9,3 | 0,8 | 3,8 |  |
| Athena | 1 | ★2 | Anjo | Luz Divina | 53% | 1395 | 56% | 11,9 | 0,7 | 4,4 |  |
| Hua Po | 1 | ★2 | Fadinhas | Pó de Fada | 53% | 958 | 74% | 10,6 | 0,9 | 3,6 |  |
| Kiriko | 1 | ★2 | Fadinhas | Pó de Fada | 52% | 957 | 77% | 10,6 | 0,9 | 3,6 |  |
| Poppy | 1 | ★2 | Criaturinha Bizarra | Coisa Esquisita | 52% | 825 | 13% | 9,4 | 0,9 | 3,5 |  |
| Leomon | 1 | ★2 | Porradeiro | (só ataca) | 52% | 794 | 2% | – | 0,0 | – |  |
| Monferno | 1 | ★2 | Porradeiro | (só ataca) | 51% | 794 | 1% | – | 0,0 | – |  |
| Yuumi | 1 | ★2 | Fadinhas | Pó de Fada | 50% | 957 | 75% | 10,6 | 0,9 | 3,6 |  |
| Kuriboh | 1 | ★2 | Fadinhas | Pó de Fada | 50% | 961 | 76% | 10,6 | 0,9 | 3,6 |  |
| Rat King | 1 | ★2 | Criaturinha Bizarra | Coisa Esquisita | 50% | 808 | 12% | 9,4 | 0,9 | 3,5 |  |
| Pignite | 1 | ★2 | Porradeiro | (só ataca) | 48% | 788 | 2% | – | 0,0 | – |  |
| Sona | 1 | ★2 | Fadinhas | Pó de Fada | 48% | 954 | 74% | 10,6 | 0,9 | 3,6 |  |
| Neko Shogun | 1 | ★2 | Criaturinha Bizarra | Coisa Esquisita | 47% | 808 | 12% | 9,5 | 0,9 | 3,5 |  |
| Koropokguru | 1 | ★2 | Criaturinha Bizarra | Coisa Esquisita | 47% | 794 | 10% | 9,4 | 0,9 | 3,3 |  |
| Pikachu | 1 | ★2 | Raio | (só ataca) | 46% | 1256 | 73% | – | 0,0 | – |  |
| Lash | 1 | ★2 | Porradeiro | Pancadão | 46% | 863 | 3% | 9,4 | 0,8 | 4,0 |  |
| Seiten Taisei - P5 | 1 | ★2 | Porradeiro | Pancadão | 45% | 869 | 2% | 9,4 | 0,8 | 4,0 |  |
| Knight of the Cask | 1 | ★2 | Porradeiro | Pancadão | 45% | 863 | 3% | 9,4 | 0,8 | 4,0 |  |
| Baba | 1 | ★2 | Únicos | Vira Baba | 44% | 961 | 27% | 10,2 | 0,7 | 4,3 |  |
| Grovyle | 1 | ★2 | Planta | (só ataca) | 42% | 851 | 25% | – | 0,0 | – |  |
| Wartortle | 1 | ★2 | Atirador | (só ataca) | 41% | 1424 | 83% | – | 0,0 | – |  |
| Ivysaur | 1 | ★2 | Planta | (só ataca) | 41% | 838 | 25% | – | 0,0 | – |  |
| Ishtar | 1 | ★2 | Safada | Charme | 40% | 904 | 26% | 9,3 | 0,8 | 2,9 |  |
| Shellmon | 1 | ★2 | Água | (só ataca) | 39% | 843 | 24% | – | 0,0 | – |  |
| Marshtomp | 1 | ★2 | Água | (só ataca) | 39% | 840 | 23% | – | 0,0 | – |  |
| Combusken | 1 | ★2 | Fogo | (só ataca) | 39% | 837 | 24% | – | 0,0 | – |  |
| Quilladin | 1 | ★2 | Planta | (só ataca) | 38% | 841 | 24% | – | 0,0 | – |  |
| Braixen | 1 | ★2 | Safada | (só ataca) | 38% | 839 | 25% | – | 0,0 | – |  |
| Hecate | 1 | ★2 | Safada | Charme | 38% | 894 | 23% | 9,3 | 0,8 | 2,9 |  |
| Dark Magician Girl | 1 | ★2 | Safada | Charme | 38% | 907 | 27% | 9,3 | 0,8 | 2,9 |  |
| Servine | 1 | ★2 | Planta | (só ataca) | 38% | 836 | 25% | – | 0,0 | – |  |
| Akali | 1 | ★2 | Safada | Charme | 37% | 897 | 23% | 9,3 | 0,8 | 2,9 |  |
| Brionne | 1 | ★2 | Água | (só ataca) | 37% | 841 | 22% | – | 0,0 | – |  |
| Loudred | 1 | ★2 | Únicos | (só ataca) | 37% | 840 | 25% | – | 0,0 | – |  |
| Massacre Mascot | 1 | ★2 | Únicos | Vira Massacre Mascot | 36% | 912 | 9% | 9,3 | 0,8 | 3,8 |  |
| Charmeleon | 1 | ★2 | Fogo | (só ataca) | 36% | 832 | 25% | – | 0,0 | – |  |
| Dewott | 1 | ★2 | Água | (só ataca) | 34% | 840 | 25% | – | 0,0 | – |  |
| Sukamon | 1 | ★2 | Criaturinha Bizarra | Vira Sukamon | 34% | 813 | 1% | 9,4 | 0,8 | 2,7 |  |
| Prinplup | 1 | ★2 | Água | (só ataca) | 34% | 840 | 23% | – | 0,0 | – |  |
| Boy II Man | 1 | ★2 | Tanque | Vira Boy II Man | 67% | 364 | 19% | 8,7 | 1,0 | 0,0 | sim |
| Talking Head | 1 | ★2 | Tanque | Vira Talking Head | 65% | 386 | 17% | 8,6 | 0,9 | 2,6 | sim |
| Holy's Stand | 1 | ★2 | Safada | Vira Holy's Stand | 56% | 654 | 14% | 10,1 | 0,6 | 3,5 | sim |
| Tubular Bells | 1 | ★2 | Criaturinha Bizarra | Vira Tubular Bells | 50% | 787 | 11% | 9,5 | 0,7 | 5,4 | sim |
| Baby Face | 1 | ★2 | Safada | Vira Baby Face | 49% | 603 | 8% | 10,3 | 0,7 | 2,4 | sim |
| Strength | 1 | ★2 | Únicos | Vira Strength | 39% | 582 | 8% | 11,5 | 0,4 | 3,1 | sim |
| Hey Ya! | 1 | ★2 | Criaturinha Bizarra | Vira Hey Ya! | 25% | 449 | 8% | 8,6 | 0,9 | 0,0 | sim |
| Widowmaker | 2 | ★1 | Atirador | Charme | 78% | 1168 | 80% | 8,9 | 1,0 | 1,9 |  |
| Doctrine | 2 | ★1 | Anjo | Pacto Sombrio | 68% | 1072 | 71% | 9,7 | 1,0 | 2,7 |  |
| McGinnis | 2 | ★1 | Tanque | Bateria de Mísseis | 64% | 527 | 6% | 8,8 | 1,0 | 4,3 |  |
| Lava Golem | 2 | ★1 | Tanque | Muralha | 63% | 423 | 7% | 8,8 | 1,0 | 3,2 |  |
| Reinhardt | 2 | ★1 | Tanque | Muralha | 62% | 418 | 6% | 8,8 | 1,0 | 3,2 |  |
| Dine-and-Dasher | 2 | ★1 | Tanque | Muralha | 61% | 425 | 6% | 8,8 | 1,0 | 3,2 |  |
| Vanillite | 2 | ★1 | Criaturinha Bizarra | (só ataca) | 60% | 585 | 3% | – | 0,0 | – |  |
| Solosis | 2 | ★1 | Criaturinha Bizarra | (só ataca) | 59% | 580 | 3% | – | 0,0 | – |  |
| Himiko | 2 | ★1 | Temporais | Parar o Tempo | 59% | 886 | 62% | 11,0 | 0,8 | 0,9 |  |
| Lulu | 2 | ★1 | Fadinhas | Pó de Fada | 58% | 754 | 68% | 9,7 | 1,0 | 3,1 |  |
| Gate Guardian | 2 | ★1 | Tanque | Muralha | 58% | 420 | 5% | 8,8 | 1,0 | 3,2 |  |
| Honedge | 2 | ★1 | Criaturinha Bizarra | (só ataca) | 57% | 578 | 2% | – | 0,0 | – |  |
| Black Metal Dragon | 2 | ★1 | Dragão | Bateria de Mísseis | 57% | 725 | 37% | 8,8 | 0,9 | 3,3 |  |
| Ivy | 2 | ★1 | Fadinhas | Pó de Fada | 56% | 745 | 70% | 9,7 | 1,0 | 3,1 |  |
| Mermaid | 2 | ★1 | Fadinhas | Pó de Fada | 55% | 747 | 69% | 9,7 | 1,0 | 3,1 |  |
| Time Thief Redoer | 2 | ★1 | Temporais | Parar o Tempo | 55% | 883 | 58% | 11,0 | 0,8 | 0,9 |  |
| Juno | 2 | ★1 | Fadinhas | Pó de Fada | 55% | 754 | 72% | 9,7 | 1,0 | 3,1 |  |
| Jinx | 2 | ★1 | Atirador | Tiro Perfurante | 55% | 1143 | 61% | 10,2 | 0,9 | 2,1 |  |
| Seraphine | 2 | ★1 | Fadinhas | Pó de Fada | 54% | 746 | 69% | 9,8 | 1,0 | 3,1 |  |
| Shinx | 2 | ★1 | Raio | (só ataca) | 53% | 953 | 64% | – | 0,0 | – |  |
| Agumon | 2 | ★1 | Dragão | (só ataca) | 53% | 670 | 26% | – | 0,0 | – |  |
| Zilean | 2 | ★1 | Temporais | Parar o Tempo | 53% | 882 | 57% | 11,0 | 0,8 | 0,9 |  |
| Jetpack Cat | 2 | ★1 | Fadinhas | Pó de Fada | 52% | 743 | 67% | 9,7 | 1,0 | 3,1 |  |
| Zorro | 2 | ★1 | Assassino | Golpe Fatal | 52% | 616 | 7% | 5,8 | 1,6 | 2,1 |  |
| Vindicta | 2 | ★1 | Atirador | Tiro Perfurante | 51% | 1133 | 55% | 10,2 | 0,9 | 2,0 |  |
| Jack Frost | 2 | ★1 | Criaturinha Bizarra | Coisa Esquisita | 50% | 549 | 6% | 8,8 | 0,9 | 2,2 |  |
| Time Wizard | 2 | ★1 | Temporais | Parar o Tempo | 50% | 882 | 60% | 11,0 | 0,8 | 0,9 |  |
| Gabumon | 2 | ★1 | Porradeiro | (só ataca) | 48% | 560 | 1% | – | 0,0 | – |  |
| Kazejin | 2 | ★1 | Vento | Tornado | 47% | 679 | 17% | 9,1 | 0,8 | 2,0 |  |
| Warwick | 2 | ★1 | Porradeiro | Pancadão | 47% | 593 | 4% | 8,7 | 0,8 | 3,0 |  |
| Timburr | 2 | ★1 | Porradeiro | (só ataca) | 47% | 560 | 2% | – | 0,0 | – |  |
| Masked Demonling | 2 | ★1 | Demoníacos | Pacto Sombrio | 47% | 715 | 34% | 8,7 | 0,9 | 2,5 |  |
| Crabby Sentinel | 2 | ★1 | Porradeiro | Pancadão | 45% | 590 | 3% | 8,7 | 0,8 | 3,0 |  |
| Sham Man Shaman | 2 | ★1 | Vento | Tornado | 44% | 672 | 16% | 9,1 | 0,9 | 2,0 |  |
| Sudama | 2 | ★1 | Vento | Tornado | 44% | 676 | 19% | 9,1 | 0,9 | 2,0 |  |
| Patamon | 2 | ★1 | Anjo | (só ataca) | 43% | 931 | 48% | – | 0,0 | – |  |
| Chikorita | 2 | ★1 | Atirador | (só ataca) | 43% | 1086 | 70% | – | 0,0 | – |  |
| Palmon | 2 | ★1 | Planta | (só ataca) | 41% | 624 | 20% | – | 0,0 | – |  |
| Rowlet | 2 | ★1 | Planta | (só ataca) | 41% | 620 | 22% | – | 0,0 | – |  |
| Cyndaquil | 2 | ★1 | Fogo | (só ataca) | 38% | 621 | 18% | – | 0,0 | – |  |
| Chernobog | 2 | ★1 | Fogo | Bola de Fogo | 37% | 694 | 22% | 9,5 | 0,8 | 2,1 |  |
| Froakie | 2 | ★1 | Água | (só ataca) | 36% | 626 | 19% | – | 0,0 | – |  |
| Totodile | 2 | ★1 | Água | (só ataca) | 36% | 619 | 21% | – | 0,0 | – |  |
| Vyper | 2 | ★1 | Atirador | Coisa Esquisita | 36% | 1012 | 67% | 8,9 | 1,0 | 1,2 |  |
| Tentomon | 2 | ★1 | Planta | (só ataca) | 35% | 614 | 18% | – | 0,0 | – |  |
| Ahri | 2 | ★1 | Safada | Charme | 35% | 640 | 25% | 8,7 | 0,8 | 1,9 |  |
| Hatenna | 2 | ★1 | Safada | (só ataca) | 33% | 622 | 21% | – | 0,0 | – |  |
| Litten | 2 | ★1 | Fogo | (só ataca) | 32% | 625 | 19% | – | 0,0 | – |  |
| Ball Breaker | 2 | ★1 | Atirador | Vira Ball Breaker | 83% | 835 | 73% | 10,7 | 0,8 | 1,2 | sim |
| Tusk | 2 | ★1 | Atirador | Vira Tusk | 77% | 906 | 77% | 10,7 | 0,8 | 1,7 | sim |
| Red Hot Chili Pepper | 2 | ★1 | Safada | Vira Red Hot Chili Pepper | 53% | 847 | 30% | 9,4 | 1,3 | 3,6 | sim |
| Foo Fighters (Stand) | 2 | ★1 | Água | Vira Foo Fighters (Stand) | 50% | 611 | 30% | 9,4 | 0,8 | 2,3 | sim |
| Echoes | 2 | ★1 | Vento | Vira Echoes | 23% | 611 | 17% | 8,9 | 1,0 | 1,6 | sim |
| Metallica | 2 | ★1 | Únicos | Vira Metallica | 13% | 565 | 10% | 10,6 | 0,7 | 1,9 | sim |
| McGinnis | 2 | ★2 | Tanque | Bateria de Mísseis | 85% | 1093 | 15% | 9,1 | 1,0 | 5,7 |  |
| Doctrine | 2 | ★2 | Anjo | Pacto Sombrio | 78% | 2071 | 85% | 9,9 | 1,0 | 4,1 |  |
| Widowmaker | 2 | ★2 | Atirador | Charme | 77% | 2022 | 89% | 8,8 | 1,0 | 2,8 |  |
| Chomp-and-Charger | 2 | ★2 | Tanque | Muralha | 70% | 774 | 29% | 9,2 | 1,0 | 4,3 |  |
| Reinhardt | 2 | ★2 | Tanque | Muralha | 67% | 778 | 27% | 9,2 | 1,0 | 4,3 |  |
| Duosion | 2 | ★2 | Criaturinha Bizarra | (só ataca) | 67% | 1120 | 6% | – | 0,0 | – |  |
| Gate Guardian | 2 | ★2 | Tanque | Muralha | 66% | 774 | 26% | 9,2 | 1,0 | 4,3 |  |
| Lava Golem | 2 | ★2 | Tanque | Muralha | 65% | 778 | 28% | 9,2 | 1,0 | 4,3 |  |
| Black Metal Dragon | 2 | ★2 | Dragão | Bateria de Mísseis | 65% | 1431 | 39% | 9,1 | 1,0 | 4,5 |  |
| Doublade | 2 | ★2 | Criaturinha Bizarra | (só ataca) | 65% | 1126 | 7% | – | 0,0 | – |  |
| Vanillish | 2 | ★2 | Criaturinha Bizarra | (só ataca) | 61% | 1113 | 6% | – | 0,0 | – |  |
| Juno | 2 | ★2 | Fadinhas | Pó de Fada | 58% | 1204 | 92% | 9,8 | 0,9 | 4,1 |  |
| Garurumon | 2 | ★2 | Porradeiro | (só ataca) | 57% | 1085 | 6% | – | 0,0 | – |  |
| Ivy | 2 | ★2 | Fadinhas | Pó de Fada | 57% | 1198 | 90% | 9,9 | 0,9 | 4,1 |  |
| Mermaid | 2 | ★2 | Fadinhas | Pó de Fada | 57% | 1194 | 88% | 9,8 | 0,9 | 4,1 |  |
| Seraphine | 2 | ★2 | Fadinhas | Pó de Fada | 56% | 1207 | 90% | 9,8 | 0,9 | 4,1 |  |
| Lulu | 2 | ★2 | Fadinhas | Pó de Fada | 55% | 1199 | 88% | 9,9 | 0,9 | 4,1 |  |
| Black Frost | 2 | ★2 | Demoníacos | Pacto Sombrio | 55% | 1437 | 38% | 9,1 | 0,9 | 3,6 |  |
| Jinx | 2 | ★2 | Atirador | Tiro Perfurante | 54% | 2005 | 84% | 10,1 | 0,9 | 3,1 |  |
| Jetpack Cat | 2 | ★2 | Fadinhas | Pó de Fada | 54% | 1208 | 89% | 9,8 | 0,9 | 4,1 |  |
| Profaner Demon | 2 | ★2 | Demoníacos | Pacto Sombrio | 53% | 1401 | 35% | 9,1 | 0,9 | 3,5 |  |
| Gurdurr | 2 | ★2 | Porradeiro | (só ataca) | 52% | 1090 | 6% | – | 0,0 | – |  |
| Togemon | 2 | ★2 | Porradeiro | (só ataca) | 52% | 1088 | 5% | – | 0,0 | – |  |
| Zilean | 2 | ★2 | Temporais | Parar o Tempo | 52% | 1509 | 79% | 11,4 | 0,7 | 1,4 |  |
| Greymon | 2 | ★2 | Dragão | (só ataca) | 51% | 1241 | 34% | – | 0,0 | – |  |
| Kanzeon | 2 | ★2 | Temporais | Parar o Tempo | 51% | 1504 | 79% | 11,4 | 0,7 | 1,4 |  |
| Time Wizard | 2 | ★2 | Temporais | Parar o Tempo | 51% | 1506 | 79% | 11,4 | 0,7 | 1,4 |  |
| Time Thief Redoer | 2 | ★2 | Temporais | Parar o Tempo | 51% | 1504 | 78% | 11,4 | 0,7 | 1,4 |  |
| Vindicta | 2 | ★2 | Atirador | Tiro Perfurante | 50% | 2001 | 81% | 10,1 | 0,9 | 3,1 |  |
| Pier Reviewer | 2 | ★2 | Porradeiro | Pancadão | 50% | 1192 | 7% | 8,9 | 0,8 | 3,8 |  |
| Warwick | 2 | ★2 | Porradeiro | Pancadão | 50% | 1191 | 5% | 9,0 | 0,8 | 3,8 |  |
| False Prophet | 2 | ★2 | Vento | Tornado | 48% | 1340 | 22% | 9,6 | 0,9 | 2,9 |  |
| Kazejin | 2 | ★2 | Vento | Tornado | 45% | 1318 | 17% | 9,6 | 0,9 | 2,9 |  |
| Ahri | 2 | ★2 | Safada | Charme | 43% | 1262 | 33% | 9,1 | 0,9 | 2,8 |  |
| Kodama | 2 | ★2 | Vento | Tornado | 42% | 1294 | 19% | 9,6 | 0,9 | 2,9 |  |
| Mercurius | 2 | ★2 | Assassino | Golpe Fatal | 41% | 1141 | 0% | 6,1 | 1,5 | 3,2 |  |
| Croconaw | 2 | ★2 | Água | (só ataca) | 35% | 1128 | 29% | – | 0,0 | – |  |
| Quilava | 2 | ★2 | Fogo | (só ataca) | 33% | 1128 | 30% | – | 0,0 | – |  |
| Hattrem | 2 | ★2 | Safada | (só ataca) | 32% | 1129 | 32% | – | 0,0 | – |  |
| Bayleef | 2 | ★2 | Atirador | (só ataca) | 31% | 1782 | 90% | – | 0,0 | – |  |
| Dartrix | 2 | ★2 | Planta | (só ataca) | 31% | 1130 | 33% | – | 0,0 | – |  |
| Torracat | 2 | ★2 | Fogo | (só ataca) | 31% | 1137 | 30% | – | 0,0 | – |  |
| Vyper | 2 | ★2 | Atirador | Coisa Esquisita | 31% | 1636 | 89% | 8,8 | 1,0 | 1,6 |  |
| Luxio | 2 | ★2 | Raio | (só ataca) | 29% | 1565 | 77% | – | 0,0 | – |  |
| Kabuterimon | 2 | ★2 | Planta | (só ataca) | 28% | 1134 | 30% | – | 0,0 | – |  |
| Frogadier | 2 | ★2 | Água | (só ataca) | 27% | 1135 | 30% | – | 0,0 | – |  |
| Angemon | 2 | ★2 | Anjo | (só ataca) | 21% | 1512 | 67% | – | 0,0 | – |  |
| Anubis | 2 | ★2 | Únicos | Vira Anubis | 18% | 1176 | 10% | 10,1 | 0,7 | 3,2 |  |
| Tusk | 2 | ★2 | Atirador | Vira Tusk | 93% | 1772 | 87% | 10,6 | 0,8 | 3,8 | sim |
| Ball Breaker | 2 | ★2 | Atirador | Vira Ball Breaker | 77% | 1519 | 83% | 10,5 | 0,7 | 1,7 | sim |
| Red Hot Chili Pepper | 2 | ★2 | Safada | Vira Red Hot Chili Pepper | 60% | 1899 | 47% | 9,9 | 1,3 | 5,8 | sim |
| Foo Fighters (Stand) | 2 | ★2 | Água | Vira Foo Fighters (Stand) | 27% | 1257 | 17% | 10,0 | 0,9 | 4,1 | sim |
| Echoes | 2 | ★2 | Vento | Vira Echoes | 23% | 1517 | 17% | 9,3 | 1,0 | 4,5 | sim |
| Metallica | 2 | ★2 | Únicos | Vira Metallica | 20% | 1208 | 20% | 11,1 | 0,7 | 3,2 | sim |
| Abaddon | 3 | ★1 | Anjo | Pacto Sombrio | 71% | 1321 | 70% | 9,1 | 1,0 | 2,7 |  |
| Barong | 3 | ★1 | Raio | Corrente Elétrica | 68% | 1239 | 64% | 10,5 | 0,8 | 2,2 |  |
| Lifeweaver | 3 | ★1 | Anjo | Pó de Fada | 62% | 961 | 67% | 9,1 | 1,0 | 2,9 |  |
| Tornado Dragon | 3 | ★1 | Dragão | Sopro de Dragão | 61% | 872 | 28% | 9,2 | 0,8 | 2,7 |  |
| Sukuna-Hikona - P4 | 3 | ★1 | Fadinhas | Pó de Fada | 60% | 927 | 67% | 9,2 | 1,0 | 3,1 |  |
| Big Shield Gardna | 3 | ★1 | Tanque | Muralha | 60% | 511 | 4% | 8,3 | 1,1 | 3,1 |  |
| Soraka | 3 | ★1 | Anjo | Pó de Fada | 60% | 955 | 63% | 9,2 | 1,0 | 2,8 |  |
| Milio | 3 | ★1 | Fadinhas | Pó de Fada | 59% | 932 | 67% | 9,2 | 1,0 | 3,1 |  |
| Lillia | 3 | ★1 | Fadinhas | Pó de Fada | 59% | 920 | 66% | 9,2 | 1,0 | 3,1 |  |
| Guardromon | 3 | ★1 | Criaturinha Bizarra | (só ataca) | 59% | 699 | 2% | – | 0,0 | – |  |
| Demeter | 3 | ★1 | Fadinhas | Pó de Fada | 59% | 926 | 66% | 9,2 | 1,0 | 3,1 |  |
| Garen | 3 | ★1 | Tanque | Muralha | 58% | 503 | 3% | 8,3 | 1,1 | 3,1 |  |
| Venture | 3 | ★1 | Criaturinha Bizarra | Coisa Esquisita | 57% | 684 | 10% | 8,3 | 1,0 | 2,3 |  |
| Hydra | 3 | ★1 | Dragão | Sopro de Dragão | 57% | 869 | 25% | 9,1 | 0,8 | 2,6 |  |
| Aurora | 3 | ★1 | Fadinhas | Pó de Fada | 57% | 930 | 65% | 9,2 | 1,0 | 3,1 |  |
| Orisa | 3 | ★1 | Robô | Bateria de Mísseis | 57% | 851 | 33% | 8,4 | 1,0 | 3,2 |  |
| Paige | 3 | ★1 | Fadinhas | Pó de Fada | 56% | 924 | 64% | 9,2 | 1,0 | 3,1 |  |
| Michion, the Timelord | 3 | ★1 | Temporais | Parar o Tempo | 56% | 1096 | 63% | 10,4 | 0,9 | 0,8 |  |
| D.Mon | 3 | ★1 | Robô | Bateria de Mísseis | 56% | 852 | 34% | 8,4 | 1,0 | 3,2 |  |
| Ekko | 3 | ★1 | Temporais | Parar o Tempo | 55% | 1089 | 61% | 10,4 | 0,9 | 0,8 |  |
| Niddhoggr | 3 | ★1 | Dragão | Sopro de Dragão | 54% | 874 | 27% | 9,2 | 0,8 | 2,7 |  |
| Rookidee | 3 | ★1 | Vento | (só ataca) | 53% | 821 | 21% | – | 0,0 | – |  |
| Machop | 3 | ★1 | Porradeiro | (só ataca) | 52% | 683 | 2% | – | 0,0 | – |  |
| Dratini | 3 | ★1 | Dragão | (só ataca) | 51% | 809 | 24% | – | 0,0 | – |  |
| Pseudotrash | 3 | ★1 | Criaturinha Bizarra | Coisa Esquisita | 51% | 681 | 8% | 8,3 | 1,0 | 2,3 |  |
| Venator | 3 | ★1 | Atirador | Tiro Perfurante | 51% | 1361 | 48% | 9,5 | 1,0 | 2,0 |  |
| City Slicker | 3 | ★1 | Água | Jato d'Água | 51% | 809 | 32% | 8,4 | 1,0 | 3,3 |  |
| Paradox | 3 | ★1 | Atirador | Tiro Perfurante | 49% | 1362 | 49% | 9,5 | 1,0 | 1,9 |  |
| Black Luster Soldier - Soldier of Chaos | 3 | ★1 | Assassino | Golpe Fatal | 48% | 716 | 8% | 5,4 | 1,7 | 2,0 |  |
| Gurr | 3 | ★1 | Porradeiro | Pancadão | 48% | 703 | 3% | 8,2 | 0,8 | 2,8 |  |
| Chucklehead | 3 | ★1 | Demoníacos | Pacto Sombrio | 47% | 849 | 28% | 8,4 | 1,0 | 2,5 |  |
| Evilswarm Exciton Knight | 3 | ★1 | Porradeiro | Pancadão | 46% | 712 | 4% | 8,2 | 0,9 | 2,8 |  |
| Pico Devimon | 3 | ★1 | Demoníacos | (só ataca) | 46% | 794 | 22% | – | 0,0 | – |  |
| Orpheus | 3 | ★1 | Anjo | Luz Divina | 46% | 1165 | 41% | 10,3 | 0,9 | 2,6 |  |
| Shaman | 3 | ★1 | Anjo | Luz Divina | 45% | 1173 | 38% | 10,4 | 0,8 | 2,6 |  |
| Shuppet | 3 | ★1 | Demoníacos | (só ataca) | 45% | 779 | 23% | – | 0,0 | – |  |
| Graves | 3 | ★1 | Demoníacos | Pacto Sombrio | 45% | 861 | 31% | 8,4 | 1,0 | 2,4 |  |
| La Jinn the Mystical Genie of the Lamp | 3 | ★1 | Vento | Tornado | 42% | 813 | 17% | 8,6 | 0,9 | 2,0 |  |
| Genji | 3 | ★1 | Assassino | Golpe Fatal | 42% | 703 | 5% | 5,4 | 1,7 | 2,0 |  |
| Cendrillon | 3 | ★1 | Safada | Charme | 40% | 780 | 24% | 8,4 | 0,9 | 1,9 |  |
| Carvanha | 3 | ★1 | Água | (só ataca) | 39% | 755 | 20% | – | 0,0 | – |  |
| Gwen | 3 | ★1 | Assassino | Charme | 39% | 784 | 14% | 6,5 | 1,0 | 1,9 |  |
| Bounsweet | 3 | ★1 | Safada | (só ataca) | 38% | 741 | 18% | – | 0,0 | – |  |
| Ralts | 3 | ★1 | Fadinhas | (só ataca) | 38% | 1080 | 42% | – | 0,0 | – |  |
| Violet | 3 | ★1 | Safada | Charme | 37% | 788 | 25% | 8,4 | 0,9 | 1,8 |  |
| Abra | 3 | ★1 | Fadinhas | (só ataca) | 37% | 1083 | 40% | – | 0,0 | – |  |
| Lamia | 3 | ★1 | Safada | Charme | 36% | 779 | 23% | 8,4 | 0,9 | 1,9 |  |
| Lalamon | 3 | ★1 | Planta | (só ataca) | 36% | 758 | 16% | – | 0,0 | – |  |
| Sandile | 3 | ★1 | Terra | (só ataca) | 33% | 617 | 1% | – | 0,0 | – |  |
| Aron | 3 | ★1 | Terra | (só ataca) | 28% | 614 | 1% | – | 0,0 | – |  |
| Silver Chariot | 3 | ★1 | Porradeiro | Vira Silver Chariot | 61% | 600 | 19% | 8,2 | 1,0 | 1,9 | sim |
| Stray Cat | 3 | ★1 | Criaturinha Bizarra | Vira Stray Cat | 58% | 611 | 22% | 8,9 | 0,7 | 5,5 | sim |
| Sex Pistols | 3 | ★1 | Atirador | Vira Sex Pistols | 58% | 630 | 19% | 8,0 | 0,7 | 2,5 | sim |
| Bad Company | 3 | ★1 | Atirador | Vira Bad Company | 47% | 646 | 17% | 9,2 | 0,5 | 3,7 | sim |
| Civil War | 3 | ★1 | Atirador | Vira Civil War | 44% | 590 | 22% | 9,2 | 0,5 | 1,7 | sim |
| Light Rod Stand | 3 | ★1 | Únicos | Vira Light Rod Stand | 44% | 533 | 17% | 10,2 | 0,5 | 3,0 | sim |
| Pearl Jam | 3 | ★1 | Fadinhas | Vira Pearl Jam | 36% | 465 | 14% | 9,0 | 0,6 | 3,5 | sim |
| Orisa | 3 | ★2 | Robô | Bateria de Mísseis | 71% | 1666 | 35% | 8,7 | 1,0 | 4,4 |  |
| D.Mon | 3 | ★2 | Robô | Bateria de Mísseis | 69% | 1676 | 38% | 8,7 | 1,0 | 4,4 |  |
| Garen | 3 | ★2 | Tanque | Muralha | 65% | 936 | 24% | 8,7 | 1,0 | 4,2 |  |
| Big Shield Gardna | 3 | ★2 | Tanque | Muralha | 65% | 935 | 24% | 8,7 | 1,0 | 4,2 |  |
| Lifeweaver | 3 | ★2 | Anjo | Pó de Fada | 62% | 1564 | 82% | 9,3 | 1,0 | 3,7 |  |
| Hecatoncheires | 3 | ★2 | Tanque | Muralha | 61% | 932 | 23% | 8,7 | 1,0 | 4,2 |  |
| Machoke | 3 | ★2 | Porradeiro | (só ataca) | 60% | 1311 | 3% | – | 0,0 | – |  |
| Soraka | 3 | ★2 | Anjo | Pó de Fada | 60% | 1562 | 81% | 9,3 | 1,0 | 3,7 |  |
| Paige | 3 | ★2 | Fadinhas | Pó de Fada | 60% | 1496 | 82% | 9,3 | 1,0 | 4,0 |  |
| Milio | 3 | ★2 | Fadinhas | Pó de Fada | 59% | 1497 | 86% | 9,3 | 1,0 | 4,0 |  |
| Michion, the Timelord | 3 | ★2 | Temporais | Parar o Tempo | 59% | 1890 | 80% | 10,7 | 0,8 | 1,3 |  |
| Aurora | 3 | ★2 | Fadinhas | Pó de Fada | 58% | 1486 | 82% | 9,3 | 1,0 | 4,0 |  |
| Kohryu | 3 | ★2 | Dragão | Sopro de Dragão | 58% | 1694 | 30% | 9,7 | 0,8 | 3,9 |  |
| Venator | 3 | ★2 | Atirador | Tiro Perfurante | 57% | 2513 | 74% | 9,5 | 1,0 | 3,0 |  |
| Warhead | 3 | ★2 | Demoníacos | Pacto Sombrio | 57% | 1696 | 36% | 8,7 | 1,0 | 3,5 |  |
| Ekko | 3 | ★2 | Temporais | Parar o Tempo | 57% | 1894 | 81% | 10,7 | 0,8 | 1,3 |  |
| Yamato-Takeru | 3 | ★2 | Fadinhas | Pó de Fada | 56% | 1493 | 83% | 9,3 | 1,0 | 4,0 |  |
| Tornado Dragon | 3 | ★2 | Dragão | Sopro de Dragão | 56% | 1682 | 30% | 9,7 | 0,8 | 4,0 |  |
| Venture | 3 | ★2 | Criaturinha Bizarra | Coisa Esquisita | 56% | 1313 | 19% | 8,6 | 1,0 | 3,4 |  |
| Graves | 3 | ★2 | Demoníacos | Pacto Sombrio | 56% | 1710 | 35% | 8,6 | 1,0 | 3,6 |  |
| Paradox | 3 | ★2 | Atirador | Tiro Perfurante | 55% | 2502 | 72% | 9,5 | 1,0 | 3,0 |  |
| Lillia | 3 | ★2 | Fadinhas | Pó de Fada | 55% | 1497 | 84% | 9,3 | 1,0 | 4,0 |  |
| Grease Monk | 3 | ★2 | Água | Jato d'Água | 54% | 1528 | 33% | 8,6 | 1,0 | 4,3 |  |
| Gifted Gatherer | 3 | ★2 | Criaturinha Bizarra | Coisa Esquisita | 53% | 1312 | 19% | 8,6 | 1,0 | 3,3 |  |
| Messiah | 3 | ★2 | Anjo | Luz Divina | 53% | 2198 | 57% | 10,7 | 0,9 | 4,0 |  |
| Flauros | 3 | ★2 | Porradeiro | Pancadão | 52% | 1471 | 8% | 8,6 | 0,9 | 3,7 |  |
| Corvisquire | 3 | ★2 | Vento | (só ataca) | 51% | 1530 | 30% | – | 0,0 | – |  |
| Evilswarm Exciton Knight | 3 | ★2 | Porradeiro | Pancadão | 51% | 1452 | 7% | 8,6 | 0,9 | 3,7 |  |
| Abdiel | 3 | ★2 | Anjo | Luz Divina | 51% | 2218 | 55% | 10,6 | 0,9 | 4,1 |  |
| High Necromancer | 3 | ★2 | Anjo | Luz Divina | 51% | 2211 | 59% | 10,6 | 0,9 | 4,0 |  |
| Hagurumon | 3 | ★2 | Robô | (só ataca) | 49% | 1441 | 30% | – | 0,0 | – |  |
| Dragonair | 3 | ★2 | Dragão | (só ataca) | 48% | 1508 | 32% | – | 0,0 | – |  |
| Genji | 3 | ★2 | Assassino | Golpe Fatal | 45% | 1412 | 1% | 5,9 | 1,5 | 3,2 |  |
| Devimon | 3 | ★2 | Demoníacos | (só ataca) | 45% | 1458 | 27% | – | 0,0 | – |  |
| La Jinn the Mystical Genie of the Lamp | 3 | ★2 | Vento | Tornado | 44% | 1564 | 16% | 9,1 | 1,0 | 2,8 |  |
| Mother Harlot | 3 | ★2 | Safada | Charme | 43% | 1498 | 27% | 8,6 | 1,0 | 2,7 |  |
| Cybele | 3 | ★2 | Safada | Charme | 42% | 1495 | 30% | 8,6 | 1,0 | 2,7 |  |
| Banette | 3 | ★2 | Demoníacos | (só ataca) | 41% | 1462 | 28% | – | 0,0 | – |  |
| Nuwa | 3 | ★2 | Safada | Charme | 41% | 1526 | 31% | 8,7 | 1,0 | 2,7 |  |
| Black Luster Soldier - Soldier of Chaos | 3 | ★2 | Assassino | Golpe Fatal | 39% | 1383 | 0% | 5,9 | 1,5 | 3,2 |  |
| Violet | 3 | ★2 | Safada | Charme | 39% | 1485 | 29% | 8,6 | 1,0 | 2,7 |  |
| Vanadis | 3 | ★2 | Safada | Charme | 38% | 1486 | 27% | 8,6 | 1,0 | 2,6 |  |
| Gwen | 3 | ★2 | Assassino | Charme | 38% | 1575 | 19% | 6,7 | 1,0 | 2,7 |  |
| Lairon | 3 | ★2 | Terra | (só ataca) | 36% | 1174 | 2% | – | 0,0 | – |  |
| Sharpedo | 3 | ★2 | Água | (só ataca) | 36% | 1405 | 26% | – | 0,0 | – |  |
| Sunflowmon | 3 | ★2 | Planta | (só ataca) | 36% | 1389 | 28% | – | 0,0 | – |  |
| Steenee | 3 | ★2 | Safada | (só ataca) | 33% | 1399 | 27% | – | 0,0 | – |  |
| Krokorok | 3 | ★2 | Terra | (só ataca) | 32% | 1179 | 2% | – | 0,0 | – |  |
| Kirlia | 3 | ★2 | Fadinhas | (só ataca) | 25% | 1841 | 67% | – | 0,0 | – |  |
| Kadabra | 3 | ★2 | Fadinhas | (só ataca) | 22% | 1843 | 69% | – | 0,0 | – |  |
| Pearl Jam | 3 | ★2 | Fadinhas | Vira Pearl Jam | 58% | 857 | 31% | 8,9 | 0,8 | 5,7 | sim |
| Sex Pistols | 3 | ★2 | Atirador | Vira Sex Pistols | 56% | 1314 | 22% | 8,0 | 1,0 | 3,7 | sim |
| Chariot Requiem | 3 | ★2 | Porradeiro | Vira Chariot Requiem | 53% | 743 | 19% | 11,4 | 0,5 | 0,0 | sim |
| Stray Cat | 3 | ★2 | Criaturinha Bizarra | Vira Stray Cat | 53% | 1171 | 8% | 9,5 | 0,8 | 7,5 | sim |
| Bad Company | 3 | ★2 | Atirador | Vira Bad Company | 47% | 1279 | 25% | 9,2 | 0,7 | 5,6 | sim |
| Light Rod Stand | 3 | ★2 | Únicos | Vira Light Rod Stand | 44% | 1092 | 25% | 10,7 | 0,5 | 5,4 | sim |
| Civil War | 3 | ★2 | Atirador | Vira Civil War | 39% | 1156 | 19% | 9,2 | 0,7 | 2,8 | sim |
| Clockwork Knight | 4 | ★1 | Temporais | Parar o Tempo | 71% | 1334 | 60% | 9,8 | 0,9 | 0,8 |  |
| Mercy | 4 | ★1 | Anjo | Pó de Fada | 71% | 1181 | 63% | 8,7 | 1,1 | 2,7 |  |
| Labrynth Cooclock | 4 | ★1 | Temporais | Parar o Tempo | 66% | 1334 | 60% | 9,8 | 0,9 | 0,8 |  |
| Tyrant of the Tides | 4 | ★1 | Dragão | Sopro de Dragão | 65% | 990 | 23% | 8,6 | 0,9 | 2,5 |  |
| Winston | 4 | ★1 | Tanque | Muralha | 62% | 586 | 4% | 7,8 | 1,1 | 3,0 |  |
| Bastion | 4 | ★1 | Atirador | Tiro Perfurante | 62% | 1647 | 51% | 8,9 | 1,0 | 1,9 |  |
| Twitch | 4 | ★1 | Atirador | Tiro Perfurante | 61% | 1655 | 50% | 8,9 | 1,0 | 1,9 |  |
| Red-Eyes Black Dragon | 4 | ★1 | Dragão | Sopro de Dragão | 60% | 988 | 21% | 8,6 | 0,9 | 2,5 |  |
| Heavy Machinery | 4 | ★1 | Robô | Bateria de Mísseis | 60% | 971 | 27% | 7,8 | 1,1 | 3,0 |  |
| Agumon Hakase | 4 | ★1 | Criaturinha Bizarra | (só ataca) | 59% | 817 | 3% | – | 0,0 | – |  |
| D.Va | 4 | ★1 | Robô | Charme | 59% | 934 | 29% | 7,8 | 1,0 | 1,7 |  |
| Tynamo | 4 | ★1 | Raio | (só ataca) | 59% | 1407 | 57% | – | 0,0 | – |  |
| Terriermon | 4 | ★1 | Vento | (só ataca) | 59% | 948 | 20% | – | 0,0 | – |  |
| Gible | 4 | ★1 | Dragão | (só ataca) | 59% | 935 | 22% | – | 0,0 | – |  |
| Sojimaru Flying Beta Max | 4 | ★1 | Dragão | Bateria de Mísseis | 57% | 980 | 28% | 7,8 | 1,1 | 3,0 |  |
| Cyber Dragon Nova | 4 | ★1 | Dragão | Bateria de Mísseis | 57% | 983 | 29% | 7,8 | 1,1 | 3,0 |  |
| Volibear | 4 | ★1 | Tanque | Muralha | 56% | 583 | 4% | 7,8 | 1,1 | 3,0 |  |
| Deino | 4 | ★1 | Demoníacos | (só ataca) | 55% | 898 | 21% | – | 0,0 | – |  |
| Impmon | 4 | ★1 | Demoníacos | (só ataca) | 51% | 900 | 20% | – | 0,0 | – |  |
| Mothman | 4 | ★1 | Criaturinha Bizarra | Coisa Esquisita | 50% | 792 | 7% | 7,8 | 1,1 | 2,2 |  |
| Baal Zebul | 4 | ★1 | Demoníacos | Pacto Sombrio | 49% | 981 | 29% | 7,7 | 1,0 | 2,2 |  |
| Kintoki-Douji | 4 | ★1 | Criaturinha Bizarra | Coisa Esquisita | 49% | 785 | 4% | 7,9 | 1,1 | 2,1 |  |
| Malzahar | 4 | ★1 | Demoníacos | Pacto Sombrio | 49% | 976 | 28% | 7,7 | 1,0 | 2,2 |  |
| Beach Baller | 4 | ★1 | Criaturinha Bizarra | Coisa Esquisita | 47% | 787 | 4% | 7,8 | 1,1 | 2,1 |  |
| Angel | 4 | ★1 | Anjo | Luz Divina | 47% | 1385 | 33% | 9,7 | 0,9 | 2,6 |  |
| Dominion | 4 | ★1 | Anjo | Luz Divina | 47% | 1380 | 33% | 9,7 | 0,9 | 2,6 |  |
| Candmon | 4 | ★1 | Demoníacos | (só ataca) | 46% | 892 | 17% | – | 0,0 | – |  |
| Gragas | 4 | ★1 | Porradeiro | Pancadão | 46% | 835 | 1% | 7,8 | 0,9 | 2,6 |  |
| Aatrox | 4 | ★1 | Demoníacos | Pacto Sombrio | 45% | 984 | 28% | 7,7 | 1,0 | 2,3 |  |
| Plotmon | 4 | ★1 | Fadinhas | (só ataca) | 44% | 1303 | 36% | – | 0,0 | – |  |
| Swordsman of Landstar | 4 | ★1 | Porradeiro | Pancadão | 43% | 832 | 1% | 7,8 | 0,9 | 2,6 |  |
| Hanuman | 4 | ★1 | Porradeiro | Pancadão | 43% | 836 | 2% | 7,8 | 0,9 | 2,6 |  |
| Buneary | 4 | ★1 | Safada | (só ataca) | 42% | 851 | 16% | – | 0,0 | – |  |
| Vendetta | 4 | ★1 | Porradeiro | Pancadão | 41% | 828 | 1% | 7,8 | 0,9 | 2,6 |  |
| Larvesta | 4 | ★1 | Fogo | (só ataca) | 41% | 862 | 17% | – | 0,0 | – |  |
| Kassadin | 4 | ★1 | Assassino | Golpe Fatal | 39% | 809 | 3% | 5,1 | 1,4 | 2,2 |  |
| Rem | 4 | ★1 | Fadinhas | Coisa Esquisita | 39% | 1202 | 38% | 8,7 | 1,1 | 1,5 |  |
| Wailmer | 4 | ★1 | Água | (só ataca) | 38% | 862 | 17% | – | 0,0 | – |  |
| Armageddon Knight | 4 | ★1 | Assassino | Golpe Fatal | 38% | 796 | 3% | 5,1 | 1,4 | 2,2 |  |
| Drifter | 4 | ★1 | Assassino | Golpe Fatal | 38% | 799 | 3% | 5,1 | 1,4 | 2,1 |  |
| Eevee | 4 | ★1 | Únicos | (só ataca) | 36% | 855 | 17% | – | 0,0 | – |  |
| Pupitar | 4 | ★1 | Terra | (só ataca) | 36% | 719 | 1% | – | 0,0 | – |  |
| Apollo | 4 | ★1 | Assassino | Pacto Sombrio | 32% | 895 | 17% | 6,2 | 1,1 | 1,9 |  |
| Abrams | 4 | ★1 | Tanque | Pacto Sombrio | 26% | 646 | 2% | 7,8 | 1,0 | 2,2 |  |
| Crazy Diamond | 4 | ★1 | Porradeiro | Vira Crazy Diamond | 63% | 789 | 17% | 8,0 | 1,0 | 3,4 | sim |
| November Rain | 4 | ★1 | Criaturinha Bizarra | Vira November Rain | 60% | 912 | 20% | 9,1 | 0,8 | 2,6 | sim |
| Harvest | 4 | ★1 | Criaturinha Bizarra | Vira Harvest | 53% | 886 | 23% | 9,0 | 0,9 | 2,2 | sim |
| Soft & Wet | 4 | ★1 | Porradeiro | Vira Soft & Wet | 50% | 783 | 27% | 8,0 | 0,9 | 1,3 | sim |
| Star Platinum | 4 | ★1 | Porradeiro | Vira Star Platinum | 40% | 752 | 17% | 10,8 | 0,5 | 1,7 | sim |
| The Hand | 4 | ★1 | Porradeiro | Vira The Hand | 33% | 852 | 17% | 8,0 | 0,9 | 2,9 | sim |
| Labrynth Cooclock | 4 | ★2 | Temporais | Parar o Tempo | 66% | 2309 | 77% | 9,9 | 0,9 | 1,2 |  |
| Clockwork Knight | 4 | ★2 | Temporais | Parar o Tempo | 66% | 2279 | 73% | 9,9 | 0,9 | 1,2 |  |
| Heavy Machinery | 4 | ★2 | Robô | Bateria de Mísseis | 66% | 1946 | 32% | 8,2 | 1,1 | 4,2 |  |
| Winston | 4 | ★2 | Tanque | Muralha | 64% | 1114 | 19% | 8,2 | 1,1 | 4,1 |  |
| Volibear | 4 | ★2 | Tanque | Muralha | 63% | 1109 | 19% | 8,3 | 1,1 | 4,1 |  |
| Sojimaru Flying Beta Max | 4 | ★2 | Dragão | Bateria de Mísseis | 63% | 1994 | 31% | 8,2 | 1,1 | 4,2 |  |
| Cyber Dragon Nova | 4 | ★2 | Dragão | Bateria de Mísseis | 62% | 1993 | 31% | 8,2 | 1,1 | 4,2 |  |
| Mercy | 4 | ★2 | Anjo | Pó de Fada | 60% | 1888 | 79% | 8,8 | 1,1 | 3,5 |  |
| Numemon | 4 | ★2 | Criaturinha Bizarra | (só ataca) | 59% | 1586 | 4% | – | 0,0 | – |  |
| Twitch | 4 | ★2 | Atirador | Tiro Perfurante | 58% | 3007 | 67% | 8,9 | 1,0 | 2,8 |  |
| Kamui | 4 | ★2 | Criaturinha Bizarra | Coisa Esquisita | 58% | 1542 | 18% | 8,1 | 1,1 | 3,0 |  |
| Tyranitar | 4 | ★2 | Tanque | (só ataca) | 58% | 1258 | 3% | – | 0,0 | – |  |
| Sandalphon | 4 | ★2 | Anjo | Luz Divina | 57% | 2658 | 55% | 9,9 | 1,0 | 3,9 |  |
| Wailord | 4 | ★2 | Tanque | (só ataca) | 56% | 1258 | 4% | – | 0,0 | – |  |
| Red-Eyes Black Dragon | 4 | ★2 | Dragão | Sopro de Dragão | 55% | 1969 | 25% | 9,1 | 0,9 | 3,7 |  |
| Basket Case | 4 | ★2 | Criaturinha Bizarra | Coisa Esquisita | 55% | 1560 | 15% | 8,2 | 1,1 | 3,1 |  |
| Tyrant of the Tides | 4 | ★2 | Dragão | Sopro de Dragão | 54% | 1978 | 24% | 9,1 | 0,9 | 3,7 |  |
| Camael | 4 | ★2 | Anjo | Luz Divina | 52% | 2667 | 54% | 9,9 | 1,0 | 3,9 |  |
| Bastion | 4 | ★2 | Atirador | Tiro Perfurante | 52% | 3010 | 67% | 8,9 | 1,0 | 2,8 |  |
| Vendetta | 4 | ★2 | Porradeiro | Pancadão | 52% | 1687 | 7% | 8,1 | 1,0 | 3,4 |  |
| Baal | 4 | ★2 | Demoníacos | Pacto Sombrio | 52% | 1960 | 31% | 8,1 | 1,0 | 3,3 |  |
| Gabite | 4 | ★2 | Dragão | (só ataca) | 51% | 1751 | 24% | – | 0,0 | – |  |
| Malzahar | 4 | ★2 | Demoníacos | Pacto Sombrio | 51% | 1913 | 30% | 8,1 | 1,0 | 3,2 |  |
| D.Va | 4 | ★2 | Robô | Charme | 50% | 1817 | 29% | 8,2 | 1,0 | 2,5 |  |
| Swordsman of Landstar | 4 | ★2 | Porradeiro | Pancadão | 50% | 1710 | 8% | 8,1 | 1,0 | 3,4 |  |
| Seiten Taisei | 4 | ★2 | Porradeiro | Pancadão | 49% | 1694 | 8% | 8,1 | 1,0 | 3,4 |  |
| Aatrox | 4 | ★2 | Demoníacos | Pacto Sombrio | 47% | 1917 | 29% | 8,1 | 1,0 | 3,2 |  |
| Zweilous | 4 | ★2 | Demoníacos | (só ataca) | 45% | 1725 | 23% | – | 0,0 | – |  |
| Gragas | 4 | ★2 | Porradeiro | Pancadão | 44% | 1667 | 8% | 8,1 | 1,0 | 3,3 |  |
| Jolteon | 4 | ★2 | Raio | (só ataca) | 43% | 2355 | 66% | – | 0,0 | – |  |
| Bakemon | 4 | ★2 | Demoníacos | (só ataca) | 43% | 1703 | 21% | – | 0,0 | – |  |
| Eelektrik | 4 | ★2 | Raio | (só ataca) | 42% | 2350 | 66% | – | 0,0 | – |  |
| Tailmon | 4 | ★2 | Gelo | (só ataca) | 42% | 2365 | 69% | – | 0,0 | – |  |
| Armageddon Knight | 4 | ★2 | Assassino | Golpe Fatal | 42% | 1595 | 0% | 5,5 | 1,5 | 3,1 |  |
| Wizarmon | 4 | ★2 | Demoníacos | (só ataca) | 41% | 1711 | 22% | – | 0,0 | – |  |
| Drifter | 4 | ★2 | Assassino | Golpe Fatal | 41% | 1611 | 0% | 5,6 | 1,5 | 3,1 |  |
| Kassadin | 4 | ★2 | Assassino | Golpe Fatal | 40% | 1601 | 0% | 5,5 | 1,5 | 3,1 |  |
| Loup-garou | 4 | ★2 | Assassino | Golpe Fatal | 39% | 1593 | 2% | 5,5 | 1,5 | 3,1 |  |
| Apollo | 4 | ★2 | Assassino | Pacto Sombrio | 39% | 1856 | 24% | 6,3 | 1,1 | 2,8 |  |
| Lopunny | 4 | ★2 | Safada | (só ataca) | 36% | 1613 | 21% | – | 0,0 | – |  |
| Abrams | 4 | ★2 | Tanque | Pacto Sombrio | 35% | 1360 | 2% | 8,3 | 1,0 | 3,3 |  |
| Galgomon | 4 | ★2 | Atirador | (só ataca) | 34% | 2643 | 71% | – | 0,0 | – |  |
| Rem | 4 | ★2 | Fadinhas | Coisa Esquisita | 34% | 2011 | 58% | 8,7 | 1,1 | 2,1 |  |
| Volcarona | 4 | ★2 | Fogo | (só ataca) | 34% | 1627 | 23% | – | 0,0 | – |  |
| Star Platinum | 4 | ★2 | Porradeiro | Vira Star Platinum | 57% | 1543 | 27% | 11,4 | 0,6 | 2,6 | sim |
| Crazy Diamond | 4 | ★2 | Porradeiro | Vira Crazy Diamond | 57% | 1425 | 20% | 8,4 | 0,9 | 5,1 | sim |
| Soft & Wet | 4 | ★2 | Porradeiro | Vira Soft & Wet | 53% | 1517 | 37% | 8,3 | 0,9 | 1,8 | sim |
| Harvest | 4 | ★2 | Criaturinha Bizarra | Vira Harvest | 50% | 1574 | 27% | 9,2 | 0,8 | 3,1 | sim |
| November Rain | 4 | ★2 | Criaturinha Bizarra | Vira November Rain | 50% | 1707 | 33% | 9,2 | 0,8 | 3,5 | sim |
| The Hand | 4 | ★2 | Porradeiro | Vira The Hand | 33% | 1687 | 17% | 8,3 | 0,9 | 4,3 | sim |
| Magearna | 5 | ★1 | Fadinhas | Vira Mega Magearna | 71% | 1796 | 68% | 9,3 | 0,4 | 0,0 |  |
| Nami | 5 | ★1 | Fadinhas | Pó de Fada | 69% | 1346 | 68% | 8,3 | 1,2 | 2,9 |  |
| Timestar Magician | 5 | ★1 | Temporais | Parar o Tempo | 68% | 1588 | 61% | 9,3 | 1,0 | 0,7 |  |
| Zoe | 5 | ★1 | Anjo | Pó de Fada | 68% | 1377 | 63% | 8,3 | 1,2 | 2,7 |  |
| Darkrai | 5 | ★1 | Demoníacos | Vira Mega Darkrai | 63% | 1133 | 34% | 8,3 | 0,6 | 0,0 |  |
| The Winged Dragon of Ra | 5 | ★1 | Dragão | Sopro de Dragão | 61% | 1192 | 23% | 8,3 | 0,9 | 2,5 |  |
| Slifer the Sky Dragon | 5 | ★1 | Dragão | Sopro de Dragão | 57% | 1199 | 23% | 8,4 | 0,9 | 2,4 |  |
| Seven | 5 | ★1 | Robô | Bateria de Mísseis | 57% | 1136 | 28% | 7,5 | 1,1 | 2,9 |  |
| Legendary Excavators ft. Lam-chan & Lun-chan | 5 | ★1 | Robô | Bateria de Mísseis | 56% | 1134 | 28% | 7,5 | 1,1 | 2,9 |  |
| Blessed Leviathan | 5 | ★1 | Dragão | Sopro de Dragão | 55% | 1186 | 17% | 8,3 | 0,9 | 2,5 |  |
| Echo | 5 | ★1 | Robô | Bateria de Mísseis | 55% | 1174 | 28% | 7,5 | 1,1 | 2,9 |  |
| Toy Agumon | 5 | ★1 | Criaturinha Bizarra | (só ataca) | 54% | 945 | 1% | – | 0,0 | – |  |
| Obelisk the Tormentor | 5 | ★1 | Tanque | Muralha | 53% | 660 | 1% | 7,5 | 1,2 | 3,0 |  |
| Zygarde (10%) | 5 | ★1 | Vento | (só ataca) | 53% | 1092 | 19% | – | 0,0 | – |  |
| Blue-Eyes White Dragon | 5 | ★1 | Dragão | Sopro de Dragão | 53% | 1181 | 21% | 8,4 | 0,9 | 2,5 |  |
| Blitzcrank | 5 | ★1 | Robô | Bateria de Mísseis | 52% | 1124 | 27% | 7,5 | 1,1 | 2,9 |  |
| Mauga | 5 | ★1 | Tanque | Muralha | 51% | 656 | 1% | 7,5 | 1,2 | 3,0 |  |
| Orpheus Picaro | 5 | ★1 | Anjo | Luz Divina | 51% | 1623 | 40% | 9,3 | 1,0 | 2,4 |  |
| Maria | 5 | ★1 | Anjo | Luz Divina | 49% | 1610 | 37% | 9,3 | 1,0 | 2,5 |  |
| Dunsparce | 5 | ★1 | Dragão | (só ataca) | 48% | 1077 | 18% | – | 0,0 | – |  |
| The Doorman | 5 | ★1 | Anjo | Luz Divina | 48% | 1626 | 37% | 9,4 | 1,0 | 2,4 |  |
| Sojimaru v2.1 | 5 | ★1 | Robô | Pacto Sombrio | 48% | 1150 | 28% | 7,5 | 1,1 | 2,1 |  |
| Ramattra | 5 | ★1 | Robô | Pacto Sombrio | 45% | 1156 | 26% | 7,5 | 1,1 | 2,1 |  |
| Cupimon | 5 | ★1 | Anjo | (só ataca) | 43% | 1563 | 25% | – | 0,0 | – |  |
| Daemon | 5 | ★1 | Demoníacos | Pacto Sombrio | 42% | 1157 | 27% | 7,5 | 1,1 | 2,1 |  |
| Cosmog | 5 | ★1 | Fadinhas | (só ataca) | 41% | 1498 | 27% | – | 0,0 | – |  |
| Arsène | 5 | ★1 | Demoníacos | Pacto Sombrio | 41% | 1145 | 28% | 7,4 | 1,1 | 2,1 |  |
| Fiddlesticks | 5 | ★1 | Demoníacos | Pacto Sombrio | 41% | 1177 | 27% | 7,5 | 1,1 | 2,2 |  |
| Vel'Koz | 5 | ★1 | Únicos | Vira Vel'Koz | 39% | 1115 | 14% | 8,9 | 0,9 | 3,1 |  |
| Incubus | 5 | ★1 | Safada | Pacto Sombrio | 38% | 1121 | 23% | 7,5 | 1,1 | 2,2 |  |
| Mew | 5 | ★1 | Fadinhas | (só ataca) | 38% | 1518 | 24% | – | 0,0 | – |  |
| Mara | 5 | ★1 | Safada | Charme | 38% | 1056 | 20% | 7,5 | 1,1 | 1,6 |  |
| Mei | 5 | ★1 | Safada | Charme | 36% | 1038 | 21% | 7,4 | 1,1 | 1,6 |  |
| Izanagi | 5 | ★1 | Assassino | Golpe Fatal | 34% | 911 | 2% | 4,8 | 1,5 | 1,9 |  |
| Mina | 5 | ★1 | Safada | Charme | 33% | 1046 | 20% | 7,4 | 1,1 | 1,6 |  |
| Gold Experience | 5 | ★1 | Temporais | Vira Gold Experience | 58% | 813 | 25% | 7,8 | 1,1 | 1,1 | sim |
| Scary Monsters | 5 | ★1 | Criaturinha Bizarra | Vira Scary Monsters | 54% | 630 | 8% | 8,9 | 0,7 | 2,0 | sim |
| Wonder of U | 5 | ★1 | Demoníacos | Vira Wonder of U | 50% | 751 | 13% | 10,5 | 0,5 | 2,3 | sim |
| Dirty Deeds Done Dirt Cheap | 5 | ★1 | Porradeiro | Vira Dirty Deeds Done Dirt Cheap | 46% | 589 | 8% | 8,6 | 0,6 | 1,2 | sim |
| Whitesnake | 5 | ★1 | Porradeiro | Vira Whitesnake | 42% | 579 | 8% | 8,6 | 0,7 | 1,0 | sim |
| Timestar Magician | 5 | ★2 | Temporais | Parar o Tempo | 66% | 2681 | 73% | 9,4 | 1,0 | 1,1 |  |
| Blitzcrank | 5 | ★2 | Robô | Bateria de Mísseis | 65% | 2326 | 30% | 7,9 | 1,2 | 4,0 |  |
| Zoe | 5 | ★2 | Anjo | Pó de Fada | 63% | 2242 | 79% | 8,3 | 1,2 | 3,4 |  |
| Echo | 5 | ★2 | Robô | Bateria de Mísseis | 62% | 2265 | 28% | 7,9 | 1,2 | 4,0 |  |
| Legendary Excavators ft. Lam-chan & Lun-chan | 5 | ★2 | Robô | Bateria de Mísseis | 58% | 2326 | 30% | 7,9 | 1,2 | 3,9 |  |
| Darkrai | 5 | ★2 | Demoníacos | Vira Mega Darkrai | 58% | 2161 | 29% | 8,6 | 0,5 | 0,0 |  |
| Mauga | 5 | ★2 | Tanque | Muralha | 58% | 1228 | 19% | 8,0 | 1,2 | 4,0 |  |
| Seven | 5 | ★2 | Robô | Bateria de Mísseis | 58% | 2313 | 32% | 7,9 | 1,2 | 3,9 |  |
| Nami | 5 | ★2 | Fadinhas | Pó de Fada | 57% | 2147 | 83% | 8,3 | 1,2 | 3,7 |  |
| Magearna | 5 | ★2 | Fadinhas | Vira Mega Magearna | 56% | 3028 | 79% | 9,5 | 0,3 | 0,0 |  |
| Blue-Eyes White Dragon | 5 | ★2 | Dragão | Sopro de Dragão | 56% | 2349 | 28% | 8,7 | 0,9 | 3,4 |  |
| Slifer the Sky Dragon | 5 | ★2 | Dragão | Sopro de Dragão | 56% | 2302 | 25% | 8,7 | 0,9 | 3,4 |  |
| Izanagi-no-Okami | 5 | ★2 | Assassino | Golpe Fatal | 56% | 1941 | 0% | 5,2 | 1,7 | 3,0 |  |
| Sojimaru v2.1 | 5 | ★2 | Robô | Pacto Sombrio | 56% | 2333 | 34% | 7,9 | 1,1 | 3,1 |  |
| The Winged Dragon of Ra | 5 | ★2 | Dragão | Sopro de Dragão | 55% | 2316 | 24% | 8,7 | 0,9 | 3,5 |  |
| Obelisk the Tormentor | 5 | ★2 | Tanque | Muralha | 55% | 1215 | 16% | 8,0 | 1,2 | 4,0 |  |
| Blessed Leviathan | 5 | ★2 | Dragão | Sopro de Dragão | 55% | 2323 | 23% | 8,7 | 0,9 | 3,5 |  |
| The Doorman | 5 | ★2 | Anjo | Luz Divina | 51% | 3055 | 50% | 9,4 | 1,0 | 3,7 |  |
| Ramattra | 5 | ★2 | Robô | Pacto Sombrio | 51% | 2272 | 29% | 7,9 | 1,1 | 3,1 |  |
| Lucifer | 5 | ★2 | Demoníacos | Pacto Sombrio | 50% | 2342 | 33% | 7,8 | 1,1 | 3,1 |  |
| Maria | 5 | ★2 | Anjo | Luz Divina | 50% | 3057 | 54% | 9,4 | 1,0 | 3,7 |  |
| Vel'Koz | 5 | ★2 | Únicos | Vira Vel'Koz | 48% | 2267 | 15% | 9,4 | 0,8 | 5,0 |  |
| Satanael | 5 | ★2 | Demoníacos | Pacto Sombrio | 46% | 2288 | 28% | 7,8 | 1,1 | 3,1 |  |
| Fiddlesticks | 5 | ★2 | Demoníacos | Pacto Sombrio | 46% | 2264 | 29% | 7,8 | 1,0 | 3,1 |  |
| Belial | 5 | ★2 | Demoníacos | Pacto Sombrio | 45% | 2271 | 31% | 7,8 | 1,0 | 3,1 |  |
| Thanatos | 5 | ★2 | Demoníacos | Pacto Sombrio | 45% | 2232 | 27% | 7,8 | 1,1 | 3,1 |  |
| Dudunsparce | 5 | ★2 | Dragão | (só ataca) | 41% | 2007 | 18% | – | 0,0 | – |  |
| Zygarde (50%) | 5 | ★2 | Dragão | (só ataca) | 41% | 2006 | 16% | – | 0,0 | – |  |
| Arioch | 5 | ★2 | Safada | Pacto Sombrio | 39% | 2171 | 27% | 7,8 | 1,0 | 3,2 |  |
| Lucemon | 5 | ★2 | Anjo | (só ataca) | 38% | 2687 | 51% | – | 0,0 | – |  |
| Mei | 5 | ★2 | Safada | Charme | 35% | 1987 | 19% | 7,8 | 1,0 | 2,3 |  |
| Revolmon | 5 | ★2 | Atirador | (só ataca) | 35% | 3190 | 60% | – | 0,0 | – |  |
| Mina | 5 | ★2 | Safada | Charme | 34% | 2024 | 20% | 7,8 | 1,0 | 2,3 |  |
| Cosmoem | 5 | ★2 | Fadinhas | (só ataca) | 34% | 2604 | 56% | – | 0,0 | – |  |
| Mewtwo | 5 | ★2 | Únicos | (só ataca) | 27% | 1849 | 14% | – | 0,0 | – |  |
| The World (Steel Ball Run) | 5 | ★2 | Porradeiro | Vira The World (Steel Ball Run) | 75% | 1308 | 25% | 11,0 | 0,5 | 2,3 | sim |
| Dirty Deeds Done Dirt Cheap | 5 | ★2 | Porradeiro | Vira Dirty Deeds Done Dirt Cheap | 60% | 1187 | 13% | 9,6 | 0,7 | 1,8 | sim |
| C-MOON | 5 | ★2 | Porradeiro | Vira C-MOON | 60% | 1195 | 8% | 9,5 | 0,7 | 2,0 | sim |
| Wonder of U | 5 | ★2 | Demoníacos | Vira Wonder of U | 29% | 1323 | 13% | 10,5 | 0,4 | 3,9 | sim |
| Gold Experience Requiem | 5 | ★2 | Temporais | Vira Gold Experience Requiem | 25% | 1316 | 17% | 10,2 | 0,6 | 0,8 | sim |

</details>

## Habilidades

Ult de classe pela média de quem a usa como padrão (todas as estrelas e custos medidos):

| Ult | Classe | Campeões (★1 e ★2) | Vitórias (média) | Valor/lanç. (mediana) | Lanç./10 s |
|---|---|---|---|---|---|
| Corrente Elétrica | Raio | 1 | 68% | 2,21 | 0,8 |
| Bateria de Mísseis | Robô | 26 | 62% | 3,95 | 1,1 |
| Muralha | Tanque | 27 | 58% | 3,86 | 1,0 |
| Parar o Tempo | Temporais | 18 | 58% | 1,01 | 0,8 |
| Sopro de Dragão | Dragão | 19 | 57% | 2,67 | 0,9 |
| Pó de Fada | Fadinhas | 44 | 57% | 3,13 | 1,0 |
| Tiro Perfurante | Atirador | 23 | 56% | 2,07 | 0,9 |
| Jato d'Água | Água | 2 | 52% | 3,79 | 1,0 |
| Luz Divina | Anjo | 16 | 50% | 3,17 | 0,9 |
| Pacto Sombrio | Demoníacos | 37 | 49% | 3,08 | 1,0 |
| Charme | Safada | 32 | 48% | 2,29 | 1,0 |
| Pancadão | Porradeiro | 21 | 47% | 3,30 | 0,9 |
| Coisa Esquisita | Criaturinha Bizarra | 25 | 47% | 2,31 | 1,0 |
| Golpe Fatal | Assassino | 18 | 45% | 3,02 | 1,5 |
| Tornado | Vento | 8 | 44% | 2,41 | 0,9 |
| Bola de Fogo | Fogo | 1 | 37% | 2,07 | 0,8 |

Valor por lançamento (em múltiplos do dano de ataque) mais de 2,0× acima ou abaixo da mediana do custo e estrela (transformações fora). Abaixo nem sempre é fraco: controle (atordoar, provocar) e buff não entram no valor; olhe as vitórias.

| Campeão | Custo | ★ | Habilidade | Valor/lanç. | Mediana do grupo | Onde | Vitórias |
|---|---|---|---|---|---|---|---|
| Himiko | 2 | ★1 | Parar o Tempo | 0,89 | 2,49 | abaixo | 59% |
| Time Thief Redoer | 2 | ★1 | Parar o Tempo | 0,90 | 2,49 | abaixo | 55% |
| Time Wizard | 2 | ★1 | Parar o Tempo | 0,89 | 2,49 | abaixo | 50% |
| Zilean | 2 | ★1 | Parar o Tempo | 0,88 | 2,49 | abaixo | 53% |
| Vyper | 2 | ★1 | Coisa Esquisita | 1,20 | 2,49 | abaixo | 36% |
| Kanzeon | 2 | ★2 | Parar o Tempo | 1,44 | 3,73 | abaixo | 51% |
| Time Thief Redoer | 2 | ★2 | Parar o Tempo | 1,43 | 3,73 | abaixo | 51% |
| Time Wizard | 2 | ★2 | Parar o Tempo | 1,45 | 3,73 | abaixo | 51% |
| Zilean | 2 | ★2 | Parar o Tempo | 1,42 | 3,73 | abaixo | 52% |
| Vyper | 2 | ★2 | Coisa Esquisita | 1,60 | 3,73 | abaixo | 31% |
| Michion, the Timelord | 3 | ★1 | Parar o Tempo | 0,84 | 2,63 | abaixo | 56% |
| Ekko | 3 | ★1 | Parar o Tempo | 0,84 | 2,63 | abaixo | 55% |
| Michion, the Timelord | 3 | ★2 | Parar o Tempo | 1,30 | 3,69 | abaixo | 59% |
| Ekko | 3 | ★2 | Parar o Tempo | 1,31 | 3,69 | abaixo | 57% |
| Clockwork Knight | 4 | ★1 | Parar o Tempo | 0,76 | 2,25 | abaixo | 71% |
| Labrynth Cooclock | 4 | ★1 | Parar o Tempo | 0,77 | 2,25 | abaixo | 66% |
| Clockwork Knight | 4 | ★2 | Parar o Tempo | 1,17 | 3,29 | abaixo | 66% |
| Labrynth Cooclock | 4 | ★2 | Parar o Tempo | 1,19 | 3,29 | abaixo | 66% |
| Timestar Magician | 5 | ★1 | Parar o Tempo | 0,73 | 2,43 | abaixo | 68% |
| Timestar Magician | 5 | ★2 | Parar o Tempo | 1,12 | 3,41 | abaixo | 66% |

## Pacote de cada classe (papel + ult)

Um campeão sintético de custo 3 só com a classe (os atributos do papel e a ult da classe) e 3 bonecos, contra o mesmo time com um boneco no lugar dele. 72 cenários. "Vale" = bônus de vida e dano no boneco que empata. É a régua dos papéis e das ults sem traço nem habilidade própria.

| Classe | Vitórias ★1 | Vale ★1 | Vitórias ★2 | Vale ★2 |
|---|---|---|---|---|
| Fadinhas | 92% | +17% | 100% | +44% |
| Temporais | 93% | +17% | 100% | +44% |
| Tanque | 100% | +36% | 100% | +44% |
| Gelo | 99% | +28% | 100% | +44% |
| Criaturinha Bizarra | 100% | +33% | 100% | +42% |
| Atirador | 99% | +22% | 100% | +42% |
| Robô | 99% | +28% | 100% | +42% |
| Raio | 98% | +22% | 100% | +39% |
| Dragão | 100% | +31% | 100% | +36% |
| Assassino | 94% | +42% | 98% | +36% |
| Demoníacos | 97% | +22% | 99% | +33% |
| Porradeiro | 100% | +31% | 100% | +33% |
| Água | 99% | +22% | 100% | +33% |
| Planta | 99% | +25% | 100% | +33% |
| Anjo | 88% | +9% | 95% | +31% |
| Fogo | 93% | +22% | 99% | +31% |
| Vento | 93% | +25% | 100% | +28% |
| Safada | 95% | +20% | 98% | +22% |
| Terra | 95% | +20% | 98% | +20% |
| Únicos | 89% | +20% | 98% | +20% |

Mediana ★2: +35%. Todas perto da mediana.

## Traços

O time tem exatamente os campeões do degrau com o traço (sorteados, ★2) e mais 2 sem ele (JoJo: um usuário pra cada Stand); o outro lado é o mesmo time com o traço desligado. "Vale" = bônus de vida e dano no time todo que empata (60 cenários). Em negrito: mais de 1,6× longe da mediana do mesmo degrau. Origens: só referência (as escadas e os números delas não mudam aqui); Overwatch, Deadlock e Sujimon agem também fora da luta, e isso não entra.

### Classes (2/4/6)

| Traço | Degraus | Degrau 1 | Degrau 2 | Degrau 3 |
|---|---|---|---|---|
| Tanque | 2/4/6 | +3% | +12% | +22% |
| Porradeiro | 2/4/6 | +5% | +12% | +20% |
| Assassino | 2/4/6 | +5% | +11% | +22% |
| Demoníacos | 2/4/6 | +5% | +17% | +30% |
| Criaturinha Bizarra | 2/4/6 | +5% | +11% | +31% |
| Fadinhas | 2/4/6 | +6% | +17% | +30% |
| Safada | 2/4/6 | +5% | +11% | +19% |
| Atirador | 2/4/6 | +9% | +17% | +26% |
| Anjo | 2/4/6 | +5% | +11% | +17% |
| Robô | 2/4/6 | +5% | +11% | +23% |
| Dragão | 2/4/6 | +6% | +15% | +28% |
| Temporais | 2/4/6 | +6% | +9% | +22% |
| **Mediana** |  | +5% | +12% | +23% |

Todos perto da mediana do degrau.

### Elementos (2/3/4)

| Traço | Degraus | Degrau 1 | Degrau 2 | Degrau 3 |
|---|---|---|---|---|
| Fogo | 2/3/4 | +6% | +12% | +19% |
| Água | 2/3/4 | +3% | +11% | +15% |
| Terra | 2/3/4 | +3% | +5% | +12% |
| Vento | 2/3/4 | +6% | +14% | +23% |
| Raio | 2/3/4 | +3% | +6% | +22% |
| Gelo | 2/3/4 | +3% | +6% | +12% |
| Planta | 2/3/4 | +5% | +11% | +20% |
| **Mediana** |  | +3% | +11% | +19% |

Todos perto da mediana do degrau.

### Origens

| Traço | Degraus | Degrau 1 | Degrau 2 | Degrau 3 | Degrau 4 | Degrau 5 | Degrau 6 |
|---|---|---|---|---|---|---|---|
| Pokémon | 2/4/6/8/9/10 | 0% | +3% | +9% | +15% | +22% | +28% |
| Digimon | 2/3/4/5/6 | +1% | +5% | +9% | +9% | +15% | – |
| SMT | 2/3/4/6/8 | +5% | +6% | +11% | +15% | +19% | – |
| Persona | 1/2/3/4/5 | 0% | +1% | +3% | +6% | +11% | – |
| JoJo | 2/3/5/7/9/10 | +6% | +9% | +15% | +33% | +36% | +45% |
| Yu-Gi-Oh! | 2/3/5/7/9/10 | +3% | +5% | +8% | +26% | +36% | +47% |
| LoL | 2/3/5/7/9/10 | +1% | +1% | +5% | +6% | +9% | +9% |
| Overwatch | 2/3/4/5/7 | +3% | +3% | +6% | +11% | +15% | – |
| Deadlock | 2/3/4/5/6 | 0% | 0% | 0% | 0% | 0% | – |
| Sujimon | 2/3/4/5/6 | +6% | +9% | +15% | +23% | +31% | – |



## Itens

Um portador sorteado (custo 2 a 4, ★2, sem Stands) com 3 bonecos; o outro lado é o mesmo time sem o item. "Vale" = bônus de vida e dano só no portador que empata (90 cenários). Em negrito: mais de 1,6× longe da mediana do grupo.

### Componentes (mediana +5%)

| Item | Id | Vitórias | Vale |
|---|---|---|---|
| Ventus | ventus | 73% | +7% |
| Pyrus | pyrus | 75% | +5% |
| Haos | haos | 69% | +5% |
| Aurelus | aurelus | 71% | +5% |
| Darkus | darkus | 63% | +3% |
| Subterra | subterra | 66% | +3% |
| Aquos | aquos | 56% | +1% |

### Completos (mediana +21%)

| Item | Id | Vitórias | Vale |
|---|---|---|---|
| Drago | pyrus+pyrus | 99% | +34% |
| Pyravian | pyrus+aurelus | 97% | +34% |
| Skyress | ventus+ventus | 97% | +34% |
| Griffon | pyrus+haos | 99% | +32% |
| Falconeer | pyrus+ventus | 99% | +32% |
| Nobilious | aurelus+aurelus | 94% | +32% |
| Saurus | pyrus+subterra | 99% | +30% |
| Tigrerra | haos+haos | 95% | +28% |
| Pegatrix X Aurelus | haos+aurelus | 97% | +28% |
| Fear Ripper | pyrus+darkus | 97% | +27% |
| Monarus | haos+ventus | 97% | +27% |
| Gargonoid | darkus+ventus | 98% | +27% |
| Hammersaur | haos+darkus | 96% | +25% |
| Jelldon | aquos+haos | 90% | +21% |
| Limulus | aquos+darkus | 85% | +21% |
| Hydranoid | darkus+darkus | 90% | +21% |
| Gorem | subterra+subterra | 89% | +21% |
| Tayghen | aquos+ventus | 93% | +19% |
| Hydorous X Aurelus | aquos+aurelus | 89% | +19% |
| Dragonoid X Darkus | darkus+aurelus | 89% | +19% |
| El Condor | subterra+ventus | 93% | +19% |
| Goreene | subterra+aurelus | 86% | +18% |
| Howlkor X Aurelus | ventus+aurelus | 94% | +18% |
| Serpenoid | aquos+subterra | 92% | +16% |
| Hynoid | haos+subterra | 88% | +16% |
| Wormquake | darkus+subterra | 86% | +16% |
| Siege | pyrus+aquos | 84% | +14% |
| Preyas | aquos+aquos | 78% | +14% |

Todos perto da mediana.

## Ouro no chão (passivas)

Regra: ao lançar a habilidade (50%) e no golpe que derruba um inimigo (50%), chance de derrubar 1 de ouro, até 2/3/4 por luta. Alvo: perto de 1 de ouro por luta por campeão desses. Rodízio = lutas da força por campeão; partidas = por unidade-luta nas partidas de bots (com dois no mesmo lado, o ouro do lado é dividido).

| Campeão | Passiva | Ouro/luta rodízio ★1 | ★2 | Lutas nas partidas | Ouro/luta partidas |
|---|---|---|---|---|---|
| Harvest | Achados | 0,80 | 1,03 | 4 | 0,00 |
| Pro Pickpocket | Mão Leve | 1,30 | 1,33 | 198 | 1,18 |
| Pseudotrash | Catador | 1,02 | 1,38 | 62 | 1,42 |
| Agumon Hakase | Ouro de Numemon | 0,86 | 1,16 | 120 | 0,94 |
| Rat King | Tesouro do Rei Rato | 0,90 | 1,13 | 370 | 0,70 |

## Partidas de bots

24 partidas de 8 bots (sementes 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24); duram 32,9 rodadas em média e acabam no estágio 5,8. 13% das lutas entre jogadores vão até os 30 s. As taxas misturam o efeito do traço/item com a força do tabuleiro de quem o tem (sinal, não medida isolada; essa é a das seções acima).

### Vitórias com o traço ativo (degrau mais alto atingido; 30 lutas ou mais)

| Traço | Degrau | Lutas | Vitórias |
|---|---|---|---|
| JoJo | 5 | 71 | 87% |
| Vento | 2 | 58 | 84% |
| Deadlock | 6 | 60 | 80% |
| Demoníacos | 2 | 80 | 71% |
| Yu-Gi-Oh! | 7 | 84 | 70% |
| Sujimon | 5 | 47 | 70% |
| Planta | 4 | 49 | 69% |
| Gelo | 2 | 39 | 69% |
| Atirador | 6 | 200 | 69% |
| Deadlock | 3 | 63 | 68% |
| JoJo | 3 | 374 | 67% |
| Porradeiro | 6 | 86 | 66% |
| Temporais | 2 | 70 | 66% |
| Atirador | 4 | 176 | 65% |
| Raio | 4 | 51 | 63% |
| Criaturinha Bizarra | 6 | 292 | 63% |
| Safada | 6 | 116 | 62% |
| SMT | 3 | 117 | 62% |
| Robô | 2 | 51 | 61% |
| Tanque | 2 | 313 | 60% |
| SMT | 4 | 52 | 60% |
| Deadlock | 2 | 151 | 58% |
| Planta | 3 | 117 | 58% |
| Fogo | 4 | 119 | 55% |
| Porradeiro | 4 | 58 | 55% |
| Fadinhas | 2 | 329 | 55% |
| LoL | 2 | 302 | 55% |
| Atirador | 2 | 391 | 54% |
| Safada | 4 | 95 | 54% |
| JoJo | 2 | 453 | 54% |
| Raio | 2 | 225 | 53% |
| Assassino | 2 | 196 | 53% |
| Deadlock | 5 | 34 | 53% |
| Pokémon | 2 | 1019 | 53% |
| Persona | 2 | 44 | 52% |
| Dragão | 2 | 93 | 52% |
| Sujimon | 2 | 86 | 51% |
| Safada | 2 | 579 | 51% |
| Yu-Gi-Oh! | 5 | 85 | 51% |
| Overwatch | 2 | 184 | 51% |
| Digimon | 2 | 212 | 50% |
| SMT | 2 | 331 | 50% |
| Criaturinha Bizarra | 4 | 187 | 50% |
| LoL | 3 | 171 | 49% |
| Persona | 1 | 608 | 49% |
| Água | 4 | 125 | 47% |
| Criaturinha Bizarra | 2 | 570 | 46% |
| Pokémon | 4 | 656 | 46% |
| Overwatch | 3 | 62 | 45% |
| Raio | 3 | 38 | 45% |
| Porradeiro | 2 | 299 | 43% |
| Pokémon | 6 | 452 | 43% |
| Fogo | 3 | 148 | 43% |
| Água | 2 | 406 | 42% |
| Terra | 2 | 95 | 42% |
| Planta | 2 | 479 | 42% |
| Fadinhas | 6 | 55 | 42% |
| LoL | 5 | 106 | 42% |
| Deadlock | 4 | 34 | 41% |
| Fadinhas | 4 | 145 | 41% |
| Fogo | 2 | 312 | 39% |
| Água | 3 | 188 | 37% |
| Pokémon | 8 | 195 | 34% |
| Yu-Gi-Oh! | 3 | 87 | 33% |
| Yu-Gi-Oh! | 2 | 52 | 33% |
| Pokémon | 9 | 46 | 30% |

### Vitórias com o item em alguém do time (30 lutas ou mais)

| Item | Lutas | Vitórias |
|---|---|---|
| Goreene | 335 | 59% |
| Saurus | 401 | 58% |
| Gorem | 250 | 58% |
| Preyas | 171 | 58% |
| Pegatrix X Aurelus | 340 | 56% |
| Tayghen | 430 | 55% |
| Hydorous X Aurelus | 510 | 55% |
| Subterra | 685 | 55% |
| Griffon | 335 | 55% |
| Gargonoid | 258 | 54% |
| Hammersaur | 319 | 54% |
| Hynoid | 441 | 54% |
| Jelldon | 441 | 54% |
| Dragonoid X Darkus | 509 | 53% |
| Serpenoid | 393 | 52% |
| Skyress | 217 | 52% |
| Limulus | 406 | 52% |
| Howlkor X Aurelus | 395 | 52% |
| Nobilious | 147 | 52% |
| Aquos | 668 | 52% |
| Wormquake | 389 | 51% |
| Ventus | 650 | 51% |
| Pyrus | 800 | 51% |
| Tigrerra | 337 | 50% |
| Drago | 154 | 50% |
| Falconeer | 338 | 50% |
| Haos | 723 | 49% |
| Monarus | 431 | 49% |
| Pyravian | 419 | 49% |
| Aurelus | 832 | 49% |
| Darkus | 663 | 48% |
| Fear Ripper | 336 | 48% |
| Hydranoid | 200 | 48% |
| El Condor | 490 | 45% |
| Siege | 256 | 42% |

### Rodadas de monstros (vitórias dos jogadores)

| Rodada | Lutas | Vitórias |
|---|---|---|
| 1-1 | 192 | 100% |
| 1-2 | 192 | 100% |
| 1-3 | 192 | 100% |
| 2-7 | 192 | 100% |
| 3-7 | 192 | 62% |
| 4-7 | 144 | 44% |
| 5-7 | 55 | 44% |

<!-- histórico: daqui pra baixo é escrito à mão; o playtest mantém -->


## Histórico de ajustes

### 04/11/2026: primeira rodada

Pedido do usuário depois de jogar: rever atributos e a matemática do jogo (habilidades, traços, itens); "vejo gente
ultando muito rápido… vi tanques ultando muito". Tudo medido com a semente 2026, antes (o código do começo desta
rodada) e depois. Os alvos estão em `FAIXAS` (`src/autobatalha/equilibrio/medidas.ts`):

- **Curva por custo:** o custo de cima ganha na mesma estrela (75% ou mais); uma estrela a mais ganha de 1 custo
  acima (60% ou mais) e briga com 2 custos acima (35% a 65%: ★2 de custo 1 contra ★1 de custo 3). Com a estrela
  valendo ~2,7× em vida × dano (padrão do gênero), "briga com 2 custos acima" obriga cada custo a valer ~1,65× o de
  baixo, e aí o custo de cima ganha quase sempre: 60%–85% pro degrau de custo não é possível junto com o resto.
- **Força por campeão:** 35% a 65% no rodízio do mesmo custo e estrela.
- **Mana:** 1º lançamento de 4 a 10 s pra maioria (média por volta de 8 s); tanque não antes dos papéis de dano;
  ninguém mais de 1 vez a cada 3 s. Era pra ser 3 a 6 s, mas isso pediria mana inicial pra todo mundo e o pedido do
  usuário foi o contrário (lançar menos); fica como decisão dele.
- **Traços, itens e pacotes:** cada um perto da mediana do seu grupo (até 1,6× pra cima ou pra baixo, ±3 pontos).

#### O que mudou

Motor (`combate/motor.ts`, `combate/chefe.ts`):

| Regra | Antes | Depois |
|---|---|---|
| Mana por golpe recebido (ataque ou habilidade) | +5 por golpe | 40 × dano ÷ vida máxima, até 5 por golpe (perder a vida toda daria 40) |
| Pancada do Chefe | 100 de mana | 30 (o chefe tem muita vida e quase não enchia apanhando) |

Atributos (`combate/atributos.ts`):

| | Antes | Depois |
|---|---|---|
| Base do custo 1 | vida 500, dano 45 | 450, 42 |
| Base do custo 3 | vida 700, dano 60 | 720, 61 |
| Tanque | vida ×1,3, dano ×0,8, mana 60 (começa com 20) | ×1,25, ×0,75, mana 70 (começa sem) |
| Assassino | vida ×0,85 | ×1 |
| Atirador | vida ×0,8, dano ×1,1 | ×0,75, ×1 |
| Anjo | vida ×0,95 | ×0,85 |
| Fadinhas | vida ×0,85, dano ×0,9 | ×0,9, ×0,95 |
| Safada | vida ×0,9 | ×1 |
| Criaturinha Bizarra | vida ×1, dano ×1 | ×1,2, ×1,05 |
| Forma que não lança (não final de Pokémon e Digimon) | nada | +20% (★1) / +25% (★2) de vida e dano |

Ults de classe (`conteudo/habilidades-classe.ts`, ★1/★2/★3):

| Ult | Antes | Depois |
|---|---|---|
| Muralha (Tanque) | escudo 30/45/70%, mana 60, começa com 20 | 16/18/22%, mana 70, começa sem |
| Bateria de Mísseis (Robô) | 4 × 100/150/225%, escudo 20% | 4 × 60/90/135%, escudo 12% |
| Pó de Fada (Fadinhas) | cura 20/30/45%, escudo 15% | 16/18/22%, escudo 10% |
| Tiro Perfurante (Atirador) | 220/330/500% | 180/270/400% |
| Nevasca (Gelo) | 180/270/400%, congela 1,5 s | 130/195/290%, 1 s |
| Charme (Safada) | 150/225/340%, encanta 2 s | 250/375/560%, 1,5 s |
| Pacto Sombrio (Demoníacos) | 200/300/450%, gasta 10% da vida, mana 80 | 260/390/590%, gasta 5% da vida, mana 70 |
| Coisa Esquisita (Criaturinha) | gosma 180/270/400%, cura 25/35/50%, berro 1,5 s | 300/450/675%, 35/50/70%, 2 s |
| Golpe Fatal (Assassino) | 250/375/560% | 300/450/675% |
| Pancadão (Porradeiro) | 180/270/400% + 8% da vida | 200/300/450% + 10% |
| Parar o Tempo (Temporais) | só atordoa; mana 90 | + 60/90/135% de dano; mana 80 |
| Bola de Fogo, Jato d'Água, Terremoto, Tornado | 170, 160, 140, 150% (★1) | 210, 190, 230, 240% (★1); Jato com mana 70 |
| Golpe (Únicos sem habilidade) | 200/300/450% | 300/450/675% |

Habilidades próprias (`conteudo/habilidades-proprias.ts`; ★1 → ★1): Sukamon 150 → 220%; Anubis 120 → 180%; Baseball
Diehard 2 × 100 → 2 × 140%; Massacre Mascot 200 → 260%. Stands: Tusk 10 × 30 → 10 × 22%; Ball Breaker 220 → 150%;
Sex Pistols 70 → 55%; Talking Head escudo 20% → 12% e sem a mana inicial de 20; The World (Steel Ball Run) para o tempo
1,5/2/2,5 → 1,5/1,75/2 s e 200 → 160%; Boy II Man vence 70/85/100% → 60/75/90%; C-MOON 220 → 200%; Civil War 180 →
220%; Hey Ya! crítico 30/45/70% e desvio 20% por 5 s → 40/60/90%, 30%, 6 s; Wonder of U 80 → 120%; Bad Company 10 × 40
→ 10 × 50%; The Hand 200 → 300%; Baby Face 180 → 220%; Metallica 120 → 200%; Light Rod 150 → 180%; Foo Fighters 3 × 60
→ 3 × 80%; Echoes 120/180/270 → 200/300/450%; Strength mana 90 → 80; Holy's Stand 80 → 70; Gold Experience Requiem
mana 100 → 90 e 250 → 300%. Harvest: o "acham 1 de ouro" saiu da habilidade e virou passiva (abaixo).

Traços de classe e elemento (`conteudo/tracos.ts`; as escadas e as origens não mudaram):

| Traço | Antes | Depois |
|---|---|---|
| Demoníacos | roubo e dano na morte 10/20/35% | 10/20/25% |
| Criaturinha Bizarra (6) | bônus ×3 | ×2,5 |
| Safada | 10/18/28% de encantar por 1 s | 15/27/40% por 1,5 s |
| Atirador | +3/6/10% de vel. por ataque | +3/6/8% |
| Anjo | renasce com 30/30/60% | 40/50/80% |
| Água | 1/2/3% da vida por s | 1,5/3/4,5% |
| Terra | +15/30/50% de armadura; tremor a cada 6 s | +30/60/100% de armadura e resistência; a cada 4 s |
| Vento | +15/30/50% de vel., desvio 0/10/20% | +15/30/45%, 0/10/15% |
| Planta | semente 2/4/6% por s | 2/3,5/4,5% |

Itens (`conteudo/itens.ts`): dano, vida e vel. ataque valiam o dobro dos outros componentes.

| Item | Antes | Depois |
|---|---|---|
| Componentes | Pyrus 15% dano, Aquos 15 mana, Haos 15% resist. + escudo 8%, Darkus 10% roubo, Subterra 25% armadura, Ventus 12% vel., Aurelus 15% vida | 12%, 20, 25% + 10%, 12%, 35%, 10%, 12% |
| Drago / Nobilious / Skyress | queima 2%/s; regenera 2%/s; +5% vel. a cada 2 s | 1,5%/s; 1,5%/s; +4% |
| Falconeer / Pyravian | rajada 100%; Fênix cura 40% | 80%; 30% |
| Siege / Hynoid / Wormquake | vapor 100%; escudo 10% nos vizinhos; atordoa 1 s | 150%; 15%; 1,5 s |
| Serpenoid | sem cura por 3 s | sem cura e 15% mais lento por 3 s |

Novo: **ouro no chão** (`conteudo/passivas.ts`, pedido do usuário): Harvest, Pro Pickpocket, Pseudotrash, a linha do
Numemon e Rat King têm uma passiva: ao lançar a habilidade e no golpe que derruba um inimigo, 50% de chance de derrubar
1 de ouro no chão, até 2/3/4 por luta (pela estrela); o Numemon (que só lança na estrela 3) tem também 6% a cada
ataque. Medido: ~0,7 a 1,4 de ouro por luta por campeão nas partidas de bots (média ~1).

#### Resultado (antes → depois)

| Medida | Antes | Depois |
|---|---|---|
| Campeões fora de 35%–65% no rodízio | 325 de 474 (69%) | 73 de 474 (15%) |
| Vitórias no rodízio, 10% mais fracos / 10% mais fortes | 16% / 86% | 36% / 63% |
| Stands fora da faixa (entre Stands) | 26 de 62 | 17 de 62 |
| ★2 de custo 1 contra ★1 de custo 3 | 83% | 57% |
| ★3 de custo 1 contra ★2 de custo 3 | 92% | 64% |
| ★2 de custo 3 contra ★1 de custo 5 | 52% | 66% |
| Pacote papel + ult ★2 (menor / maior) | +22% / +85% (Tanque) | +20% / +44% |
| Item completo (menor / mediana / maior) | +7% / +21% / +45% (Drago) | +14% / +21% / +34% |

Vitórias médias no rodízio de quem usa cada ult de classe: Muralha 97% → 58%, Bateria de Mísseis 88% → 62%, Tiro
Perfurante 80% → 56%, Pó de Fada 76% → 57%, Pancadão 67% → 47%, Pacto Sombrio 38% → 49%, Coisa Esquisita 38% → 47%,
formas que não lançam 20% → 44%.

Mana, nas partidas de bots (1º lançamento em s; lançamentos a cada 10 s vivo; parte da mana que vem de apanhar):

| Papel | 1º lançamento | Lançamentos/10 s | Mana de apanhar |
|---|---|---|---|
| Tanque | 4,9 → 8,4 | 1,73 → 0,77 | 51% → 30% |
| Assassino | 5,4 → 6,1 | 1,48 → 1,32 | 34% → 25% |
| Porradeiro | 6,0 → 7,9 | 1,20 → 0,77 | 47% → 29% |
| Robô | 6,6 → 8,2 | 1,26 → 0,91 | 36% → 24% |
| Atirador | 7,6 → 7,9 | 1,03 → 1,01 | 12% → 8% |
| Todos | 7,3 → 8,5 | 1,11 → 0,83 | 31% → 19% |

Traços medidos (vale, no degrau mais alto): Tanque +30% → +22%, Demoníacos +47% → +30%, Safada +8% → +19%, Anjo +11%
→ +17%, Terra +5% → +12%, Planta +26% → +20%. Partidas de bots: chefe 3-7 48% → 62% de vitória dos jogadores, 4-7 40%
→ 44%, 5-7 41% → 44%; duração 34,0 → 32,9 rodadas. Nas partidas, o "depois" já tem a economia, o nível 12 e a
dificuldade dos bots de outra tarefa (feitos ao mesmo tempo), então essa comparação mistura as duas coisas; a
calibragem dos monstros (`partida/monstros.ts`) continua perto do que era.

#### O que continua fora e por quê

- **Formas que não lançam na estrela 2** (Prinplup, Croconaw, Kadabra, Kirlia, Quilava…): 25%–34%. O bônus de vida e
  dano compensa na estrela 1, mas na 2 as habilidades dos outros crescem mais. Subir o bônus da ★2 pra 35% resolvia o
  rodízio, mas deixava o ★2 de custo 1 forte demais contra ★1 de custo 3 (80%): ficou 25%.
- **Atirador com a ult de Safada** (Kai'Sa, Tracer, Widowmaker): ~80%. Alcance 4 + encantar quem chega perto. É a
  combinação, não uma das peças: as duas sozinhas estão na faixa.
- **Tanques de custo 2 na estrela 2** e alguns Robôs ★2: 66%–75%. Bem melhor que antes (90%+); mais um corte na
  Muralha deixaria os tanques ★1 fracos.
- **Stands de custo 2**: Tusk e Ball Breaker (papel Atirador) 77%–93%, Echoes e Metallica (alcance 2) 13%–23%. Entre
  Stands do mesmo custo, quem fica longe ganha: é o papel, não a habilidade (mesmo depois de nerf/buff grandes).
- **Ult Golpe, pacote Safada e Terra**: abaixo da mediana dos pacotes; quase ninguém usa o Golpe, e Safada/Terra
  entram como papel de poucos.
- **Origens** (não mexi, como combinado): Deadlock vale 0 dentro da luta (o bônus é das almas, fora dela); LoL (+9% no
  10) e Persona (+11% no 5) valem pouco dentro da luta; JoJo (+45% no 10) e Yu-Gi-Oh! (+47% no 10) valem muito no
  topo. Mudaram um pouco sem mexer nelas porque os papéis e as ults mudaram (SMT +11% → +19% no 8: os invocados
  copiam os atributos de quem invoca).

#### Pra decidir

- 1º lançamento: alvo de 4 a 10 s (como ficou) ou 3 a 6 s (todo mundo começaria com mana)?
- Formas que não lançam: bônus maior na estrela 2 (mais justo entre elas, mas ★2 de custo 1 fica forte) ou dar uma ult
  simples às formas não finais?
- Atirador + Charme: tirar o Charme das opções de ult de quem é Atirador, ou baixar o alcance do Atirador pra 3?
