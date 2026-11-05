# Equilíbrio: playtest automático

Gerado em 2026-11-05 por `src/autobatalha/equilibrio/equilibrio.playtest.ts` com o set, o motor e o conteúdo de verdade. Semente base 2026: a mesma semente e o mesmo código dão os mesmos números. Como rodar e o que cada medida quer dizer: [README.md](README.md), seção "Playtest". Não edite a parte gerada à mão: rode de novo.

## Curva por custo

Times de 5 campeões sorteados (sem Stands) de um custo e estrela contra os de outro, 160 cenários jogados dos dois lados. Alvo: custo de cima ganha da mesma estrela; uma estrela a mais briga com 1 e 2 custos acima (★2 de custo 1 contra ★1 de custo 2 e 3, e assim por diante).

| Time | Contra | Vitórias | Alvo |
|---|---|---|---|
| ★1 custo 2 | ★1 custo 1 | 100% | 75%–100% |
| ★1 custo 3 | ★1 custo 2 | 100% | 75%–100% |
| ★1 custo 4 | ★1 custo 3 | 100% | 75%–100% |
| ★1 custo 5 | ★1 custo 4 | 100% | 75%–100% |
| ★2 custo 2 | ★2 custo 1 | 100% | 75%–100% |
| ★2 custo 3 | ★2 custo 2 | 99% | 75%–100% |
| ★2 custo 4 | ★2 custo 3 | 100% | 75%–100% |
| ★2 custo 5 | ★2 custo 4 | 100% | 75%–100% |
| ★2 custo 1 | ★1 custo 1 | 100% | – |
| ★2 custo 1 | ★1 custo 2 | 100% | 60%–100% |
| ★2 custo 1 | ★1 custo 3 | 63% | 35%–65% |
| ★2 custo 2 | ★1 custo 3 | 100% | 60%–100% |
| ★2 custo 2 | ★1 custo 4 | 72% | 35%–65% |
| ★2 custo 3 | ★1 custo 4 | 100% | 60%–100% |
| ★2 custo 3 | ★1 custo 5 | 77% | 35%–65% |
| ★3 custo 1 | ★2 custo 2 | 100% | 60%–100% |
| ★3 custo 1 | ★2 custo 3 | 71% | 35%–65% |
| ★3 custo 2 | ★2 custo 4 | 77% | 35%–65% |

**Fora do alvo:** ★2 custo 2 contra ★1 custo 4: 72% (alvo 35%–65%); ★2 custo 3 contra ★1 custo 5: 77% (alvo 35%–65%); ★3 custo 1 contra ★2 custo 3: 71% (alvo 35%–65%); ★3 custo 2 contra ★2 custo 4: 77% (alvo 35%–65%).

## Mana e lançamentos

Alvo: 1º lançamento entre 4 e 10 s pra maioria; tanque não lança antes dos papéis de dano (Porradeiro, Assassino, Atirador, Dragão, Demoníacos); ninguém lança mais de 1 vez a cada 3 s vivo. Tabelas das partidas de bots (tabuleiros de verdade, com itens e traços) e, nas duas últimas colunas, da curva por custo (5 contra 5, sem itens). "Mana de apanhar" = golpes recebidos; "de efeitos" = habilidades, traços e itens que dão mana. Só unidades com habilidade.

| Papel | Unidades-luta | 1º lanç. (s) | Antes de 3 s | 3–10 s | Depois de 10 s | Não lançou | Lanç./10 s vivo | Mana de atacar | de apanhar | de efeitos | 1º lanç. 5×5 (s) | Lanç./10 s 5×5 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Assassino | 1374 | 6,3 | 6% | 76% | 6% | 12% | 1,37 | 59% | 21% | 20% | 6,2 | 1,26 |
| Planta | 130 | 7,4 | 15% | 49% | 31% | 5% | 0,93 | 82% | 12% | 6% | 11,2 | 0,52 |
| Porradeiro | 1591 | 7,8 | 3% | 63% | 15% | 19% | 0,86 | 72% | 26% | 3% | 7,6 | 0,91 |
| Tanque | 1903 | 8,0 | 4% | 64% | 16% | 16% | 0,91 | 70% | 27% | 3% | 7,7 | 0,94 |
| Atirador | 3027 | 8,1 | 2% | 73% | 10% | 14% | 0,97 | 88% | 11% | 2% | 9,3 | 0,84 |
| Anjo | 419 | 8,3 | 6% | 60% | 24% | 10% | 0,91 | 81% | 15% | 4% | 9,4 | 0,80 |
| Robô | 533 | 8,5 | 1% | 62% | 24% | 13% | 0,91 | 75% | 25% | 0% | 7,8 | 0,99 |
| Safada | 2172 | 8,5 | 3% | 54% | 26% | 17% | 0,83 | 79% | 16% | 5% | 8,5 | 0,87 |
| Vento | 339 | 8,6 | 5% | 74% | 9% | 12% | 0,85 | 88% | 11% | 1% | 8,8 | 0,89 |
| Criaturinha Bizarra | 3861 | 8,6 | 2% | 52% | 22% | 24% | 0,76 | 74% | 25% | 2% | 7,9 | 0,88 |
| Demoníacos | 1092 | 8,6 | 2% | 60% | 26% | 12% | 0,81 | 80% | 18% | 1% | 7,8 | 0,94 |
| Fadinhas | 2718 | 8,7 | 2% | 63% | 25% | 10% | 0,90 | 80% | 19% | 1% | 9,1 | 0,84 |
| Dragão | 1017 | 9,0 | 2% | 51% | 36% | 10% | 0,80 | 79% | 19% | 2% | 9,1 | 0,81 |
| Terra | 102 | 9,2 | 0% | 47% | 31% | 22% | 0,71 | 77% | 23% | 0% | – | – |
| Água | 452 | 9,3 | 0% | 69% | 17% | 14% | 0,79 | 85% | 15% | 0% | 8,2 | 0,81 |
| Temporais | 648 | 9,4 | 4% | 34% | 50% | 11% | 0,77 | 84% | 12% | 4% | 10,0 | 0,72 |
| Fogo | 107 | 9,7 | 0% | 35% | 61% | 5% | 0,81 | 82% | 17% | 1% | 9,9 | 0,58 |
| Raio | 181 | 10,0 | 0% | 17% | 77% | 6% | 0,76 | 88% | 12% | 0% | 10,6 | 0,67 |
| Únicos | 991 | 10,2 | 0% | 27% | 30% | 43% | 0,52 | 78% | 22% | 0% | 9,4 | 0,71 |
| Gelo | 52 | 10,3 | 0% | 6% | 90% | 4% | 0,70 | 91% | 9% | 0% | – | – |
| **Todos** | 22709 | 8,4 | 3% | 59% | 22% | 16% | 0,87 | 78% | 19% | 3% | 8,5 | 0,88 |

| Custo | 1º lanç. ★1 (s) | ★2 | ★3 | Lanç./10 s ★1 | ★2 | ★3 |
|---|---|---|---|---|---|---|
| 1 | 9,0 | 8,6 | 6,3 | 0,75 | 0,82 | 1,23 |
| 2 | 8,7 | 8,0 | 5,4 | 0,86 | 0,94 | 1,49 |
| 3 | 8,9 | 7,5 | – | 0,85 | 0,99 | – |
| 4 | 8,0 | 6,1 | – | 0,92 | 1,20 | – |
| 5 | 8,5 | – | – | 0,89 | – | – |

- Tanque: 1º lançamento em 8,0 s; papéis de dano: 7,9 s.
- Rodízio (seção seguinte, 4 contra 4 com bonecos): 1º lançamento dentro de 4–10 s em 85% dos campeões (mediana 8,8 s).
- Lançam mais de 1 vez a cada 3 s vivo no rodízio: ninguém.
- Lançam em menos de 50% das lutas do rodízio (fora transformação): ninguém.

## Força por campeão

Cada campeão (forma da estrela, ult padrão) com 3 bonecos do custo dele (atributos base, sem habilidade nem traço) contra cada outro do mesmo custo e estrela com os mesmos bonecos, em 3 disposições e dos dois lados (rodízio). Os Stands formam um grupo à parte, presos ao mesmo usuário. Faixa: 35% a 65% de vitórias. "Valor/lanç." = dano + cura + escudo da habilidade por lançamento, em múltiplos do dano de ataque.

| Custo | Estrela | Campeões | Vitórias (mín–máx) | 10% | 90% | Fora da faixa |
|---|---|---|---|---|---|---|
| 1 | ★1 | 60 | 17%–75% | 40% | 61% | 7 |
| 1 | ★2 | 60 | 20%–91% | 32% | 74% | 18 |
| 2 | ★1 | 48 | 33%–66% | 37% | 63% | 5 |
| 2 | ★2 | 48 | 15%–91% | 33% | 79% | 19 |
| 3 | ★1 | 50 | 24%–67% | 38% | 62% | 5 |
| 3 | ★2 | 50 | 27%–90% | 34% | 75% | 15 |
| 4 | ★1 | 44 | 24%–71% | 35% | 65% | 9 |
| 4 | ★2 | 44 | 24%–93% | 31% | 72% | 17 |
| 5 | ★1 | 35 | 32%–70% | 37% | 64% | 5 |
| 5 | ★2 | 35 | 33%–72% | 39% | 64% | 5 |

**Fora da faixa** (mais forte primeiro):

| Campeão | Custo | ★ | Papel | Habilidade | Vitórias | Dano/luta | Vivo no fim | 1º lanç. (s) | Lanç./10 s | Valor/lanç. |
|---|---|---|---|---|---|---|---|---|---|---|
| Numemon | 4 | ★2 | Criaturinha Bizarra | (só ataca) | 93% | 2071 | 16% | – | 0,0 | – |
| Garurumon | 2 | ★2 | Porradeiro | (só ataca) | 91% | 1404 | 16% | – | 0,0 | – |
| Vegimon | 1 | ★2 | Criaturinha Bizarra | (só ataca) | 91% | 1103 | 18% | – | 0,0 | – |
| Devimon | 3 | ★2 | Demoníacos | (só ataca) | 90% | 1711 | 15% | – | 0,0 | – |
| Togemon | 2 | ★2 | Porradeiro | (só ataca) | 88% | 1415 | 16% | – | 0,0 | – |
| Leomon | 1 | ★2 | Porradeiro | (só ataca) | 86% | 1059 | 12% | – | 0,0 | – |
| Tailmon | 4 | ★2 | Gelo | (só ataca) | 84% | 1893 | 9% | – | 0,0 | – |
| Greymon | 2 | ★2 | Dragão | (só ataca) | 84% | 1493 | 39% | – | 0,0 | – |
| Hagurumon | 3 | ★2 | Robô | (só ataca) | 84% | 1805 | 40% | – | 0,0 | – |
| Vanillish | 2 | ★2 | Criaturinha Bizarra | (só ataca) | 82% | 1277 | 11% | – | 0,0 | – |
| Wizarmon | 4 | ★2 | Demoníacos | (só ataca) | 81% | 2151 | 33% | – | 0,0 | – |
| Corvisquire | 3 | ★2 | Vento | (só ataca) | 80% | 1587 | 9% | – | 0,0 | – |
| Doublade | 2 | ★2 | Criaturinha Bizarra | (só ataca) | 79% | 1285 | 11% | – | 0,0 | – |
| Bakemon | 4 | ★2 | Demoníacos | (só ataca) | 79% | 2166 | 34% | – | 0,0 | – |
| Duosion | 2 | ★2 | Criaturinha Bizarra | (só ataca) | 79% | 1278 | 11% | – | 0,0 | – |
| Machoke | 3 | ★2 | Porradeiro | (só ataca) | 78% | 1511 | 7% | – | 0,0 | – |
| Boldore | 1 | ★2 | Criaturinha Bizarra | (só ataca) | 78% | 963 | 5% | – | 0,0 | – |
| Bayleef | 2 | ★2 | Tanque | (só ataca) | 78% | 1041 | 11% | – | 0,0 | – |
| Charjabug | 1 | ★2 | Criaturinha Bizarra | (só ataca) | 77% | 962 | 5% | – | 0,0 | – |
| Shellmon | 1 | ★2 | Água | (só ataca) | 76% | 1044 | 31% | – | 0,0 | – |
| Grotle | 1 | ★2 | Tanque | (só ataca) | 76% | 796 | 7% | – | 0,0 | – |
| Dragonair | 3 | ★2 | Dragão | (só ataca) | 76% | 1512 | 7% | – | 0,0 | – |
| Sunflowmon | 3 | ★2 | Planta | (só ataca) | 75% | 1707 | 36% | – | 0,0 | – |
| Escapist | 1 | ★1 | Únicos | Vira Escapist | 75% | 623 | 98% | 8,6 | 0,8 | 2,5 |
| Wailord | 4 | ★2 | Tanque | (só ataca) | 74% | 1464 | 8% | – | 0,0 | – |
| Sukamon | 1 | ★2 | Criaturinha Bizarra | Vira Sukamon | 73% | 1002 | 4% | 9,5 | 0,8 | 2,5 |
| Dudunsparce | 5 | ★2 | Dragão | (só ataca) | 72% | 2008 | 3% | – | 0,0 | – |
| Mercy | 4 | ★1 | Anjo | Pó de Fada | 71% | 1192 | 59% | 8,6 | 1,1 | 2,7 |
| Revolmon | 5 | ★2 | Atirador | (só ataca) | 71% | 3646 | 88% | – | 0,0 | – |
| McGinnis | 2 | ★2 | Tanque | Bateria de Mísseis | 70% | 1087 | 12% | 9,1 | 1,0 | 5,7 |
| Agumon Hakase | 4 | ★1 | Criaturinha Bizarra | (só ataca) | 70% | 862 | 3% | – | 0,0 | – |
| Monferno | 1 | ★2 | Porradeiro | (só ataca) | 70% | 926 | 5% | – | 0,0 | – |
| Steenee | 3 | ★2 | Safada | (só ataca) | 70% | 1434 | 7% | – | 0,0 | – |
| Gurdurr | 2 | ★2 | Porradeiro | (só ataca) | 70% | 1241 | 9% | – | 0,0 | – |
| Magearna | 5 | ★1 | Fadinhas | Vira Mega Magearna | 70% | 1803 | 66% | 9,3 | 0,4 | 0,0 |
| Sharpedo | 3 | ★2 | Água | (só ataca) | 69% | 1436 | 8% | – | 0,0 | – |
| Roggenrola | 1 | ★1 | Criaturinha Bizarra | (só ataca) | 69% | 452 | 2% | – | 0,0 | – |
| Kabuterimon | 2 | ★2 | Planta | (só ataca) | 68% | 1380 | 37% | – | 0,0 | – |
| Blitzcrank | 5 | ★2 | Robô | Bateria de Mísseis | 68% | 2069 | 6% | 7,9 | 1,1 | 4,2 |
| Zweilous | 4 | ★2 | Demoníacos | (só ataca) | 68% | 1760 | 6% | – | 0,0 | – |
| Zoe | 5 | ★1 | Anjo | Pó de Fada | 68% | 1385 | 65% | 8,3 | 1,2 | 2,7 |
| Terriermon | 4 | ★1 | Vento | (só ataca) | 68% | 984 | 23% | – | 0,0 | – |
| Tyranitar | 4 | ★2 | Tanque | (só ataca) | 67% | 1459 | 7% | – | 0,0 | – |
| Pignite | 1 | ★2 | Porradeiro | (só ataca) | 67% | 923 | 3% | – | 0,0 | – |
| Guardromon | 3 | ★1 | Criaturinha Bizarra | (só ataca) | 67% | 732 | 3% | – | 0,0 | – |
| Barong | 3 | ★1 | Raio | Corrente Elétrica | 67% | 1243 | 61% | 10,5 | 0,8 | 2,2 |
| Grubbin | 1 | ★1 | Criaturinha Bizarra | (só ataca) | 67% | 450 | 2% | – | 0,0 | – |
| Gabite | 4 | ★2 | Dragão | (só ataca) | 67% | 1760 | 6% | – | 0,0 | – |
| Nami | 5 | ★1 | Fadinhas | Pó de Fada | 67% | 1340 | 66% | 8,3 | 1,2 | 2,9 |
| Doctrine | 2 | ★1 | Anjo | Pacto Sombrio | 66% | 1071 | 70% | 9,7 | 1,0 | 2,6 |
| Labrynth Cooclock | 4 | ★1 | Temporais | Parar o Tempo | 66% | 1342 | 60% | 9,8 | 0,9 | 0,8 |
| Doctrine | 2 | ★2 | Anjo | Pacto Sombrio | 66% | 2026 | 79% | 9,8 | 1,0 | 3,9 |
| Tynamo | 4 | ★1 | Raio | (só ataca) | 65% | 1435 | 57% | – | 0,0 | – |
| Kuriboh | 1 | ★2 | Fadinhas | Pó de Fada | 35% | 644 | 6% | 9,3 | 0,9 | 4,3 |
| Mei | 5 | ★2 | Safada | Charme | 35% | 2001 | 18% | 7,7 | 1,1 | 2,3 |
| Warhead | 3 | ★2 | Demoníacos | Pacto Sombrio | 35% | 1448 | 7% | 8,5 | 0,9 | 3,5 |
| Knight of the Cask | 1 | ★2 | Porradeiro | Pancadão | 34% | 853 | 1% | 9,4 | 0,8 | 3,9 |
| Masked Demonling | 2 | ★1 | Demoníacos | Pacto Sombrio | 34% | 582 | 2% | 8,7 | 0,8 | 2,6 |
| Jinx | 2 | ★2 | Atirador | Tiro Perfurante | 34% | 2033 | 78% | 10,1 | 0,9 | 3,2 |
| Gwen | 3 | ★1 | Assassino | Charme | 34% | 780 | 13% | 6,6 | 1,0 | 1,9 |
| Rem | 4 | ★1 | Fadinhas | Coisa Esquisita | 34% | 1194 | 35% | 8,7 | 1,1 | 1,4 |
| Black Luster Soldier - Soldier of Chaos | 3 | ★2 | Assassino | Golpe Fatal | 34% | 1379 | 0% | 5,9 | 1,5 | 3,2 |
| Vyper | 2 | ★1 | Atirador | Coisa Esquisita | 34% | 1019 | 65% | 8,9 | 1,0 | 1,2 |
| Vanadis | 3 | ★2 | Safada | Charme | 34% | 1480 | 28% | 8,5 | 1,0 | 2,6 |
| Mercurius | 2 | ★2 | Assassino | Golpe Fatal | 34% | 1144 | 0% | 6,2 | 1,5 | 3,2 |
| Ahri | 2 | ★1 | Safada | Charme | 33% | 645 | 25% | 8,7 | 0,9 | 1,9 |
| Mina | 5 | ★2 | Safada | Charme | 33% | 2045 | 21% | 7,8 | 1,0 | 2,3 |
| Kodama | 2 | ★2 | Vento | Tornado | 33% | 1293 | 17% | 9,5 | 0,9 | 2,8 |
| Drifter | 4 | ★2 | Assassino | Golpe Fatal | 33% | 1613 | 0% | 5,6 | 1,6 | 3,1 |
| Ekko | 3 | ★1 | Temporais | Parar o Tempo | 33% | 577 | 0% | 9,0 | 0,7 | 0,9 |
| Chernobog | 2 | ★1 | Fogo | Bola de Fogo | 33% | 688 | 22% | 9,5 | 0,8 | 2,0 |
| Ahri | 2 | ★2 | Safada | Charme | 33% | 1254 | 30% | 9,0 | 0,9 | 2,8 |
| Dark Magician Girl | 1 | ★2 | Safada | Charme | 32% | 920 | 28% | 9,3 | 0,8 | 2,9 |
| Izanagi | 5 | ★1 | Assassino | Golpe Fatal | 32% | 908 | 2% | 4,8 | 1,5 | 1,9 |
| Mina | 5 | ★1 | Safada | Charme | 32% | 1045 | 21% | 7,4 | 1,1 | 1,6 |
| Profaner Demon | 2 | ★2 | Demoníacos | Pacto Sombrio | 32% | 1172 | 5% | 8,9 | 0,9 | 3,6 |
| Kassadin | 4 | ★2 | Assassino | Golpe Fatal | 32% | 1595 | 0% | 5,6 | 1,5 | 3,1 |
| Bugs | 1 | ★2 | Demoníacos | Pacto Sombrio | 32% | 855 | 1% | 9,3 | 0,8 | 3,8 |
| Widowmaker | 2 | ★2 | Atirador | Tiro Perfurante | 32% | 2032 | 76% | 10,1 | 0,9 | 3,2 |
| Armageddon Knight | 4 | ★2 | Assassino | Golpe Fatal | 32% | 1576 | 0% | 5,6 | 1,5 | 3,0 |
| Loup-garou | 4 | ★2 | Assassino | Golpe Fatal | 31% | 1590 | 2% | 5,6 | 1,5 | 3,1 |
| Kadabra | 3 | ★2 | Fadinhas | (só ataca) | 31% | 1990 | 72% | – | 0,0 | – |
| Kirlia | 3 | ★2 | Fadinhas | (só ataca) | 31% | 1984 | 74% | – | 0,0 | – |
| Apollo | 4 | ★2 | Assassino | Pacto Sombrio | 31% | 1825 | 16% | 6,3 | 1,1 | 2,8 |
| Mandrake | 1 | ★1 | Fadinhas | Coisa Esquisita | 30% | 624 | 38% | 10,3 | 0,9 | 1,5 |
| Baba | 1 | ★1 | Únicos | Vira Baba | 30% | 413 | 1% | 9,5 | 0,8 | 3,0 |
| Hecate | 1 | ★2 | Safada | Charme | 30% | 912 | 23% | 9,3 | 0,8 | 2,9 |
| Aatrox | 4 | ★2 | Demoníacos | Pacto Sombrio | 30% | 1642 | 5% | 8,1 | 1,0 | 3,1 |
| Ishtar | 1 | ★2 | Safada | Charme | 30% | 909 | 23% | 9,2 | 0,8 | 3,0 |
| Gwen | 3 | ★2 | Assassino | Charme | 29% | 1566 | 16% | 6,7 | 1,0 | 2,7 |
| Ekko | 3 | ★2 | Temporais | Parar o Tempo | 27% | 1104 | 0% | 9,6 | 0,8 | 1,2 |
| Rem | 4 | ★2 | Fadinhas | Coisa Esquisita | 27% | 2010 | 53% | 8,7 | 1,1 | 2,1 |
| Aatrox | 4 | ★1 | Demoníacos | Pacto Sombrio | 26% | 803 | 2% | 7,8 | 1,0 | 2,2 |
| Abrams | 4 | ★1 | Tanque | Pacto Sombrio | 26% | 645 | 1% | 7,8 | 1,0 | 2,1 |
| Clockwork Knight | 4 | ★2 | Temporais | Parar o Tempo | 26% | 1290 | 2% | 9,0 | 0,8 | 1,1 |
| Abaddon | 3 | ★1 | Anjo | Pacto Sombrio | 24% | 661 | 1% | 8,3 | 0,9 | 2,5 |
| Apollo | 4 | ★1 | Assassino | Pacto Sombrio | 24% | 871 | 12% | 6,2 | 1,0 | 1,9 |
| Abrams | 4 | ★2 | Tanque | Pacto Sombrio | 24% | 1316 | 2% | 8,2 | 1,0 | 3,1 |
| Akali | 1 | ★1 | Safada | Charme | 23% | 381 | 0% | 8,6 | 0,8 | 2,1 |
| Baba | 1 | ★2 | Únicos | Vira Baba | 22% | 807 | 0% | 10,2 | 0,7 | 4,5 |
| Massacre Mascot | 1 | ★2 | Únicos | Vira Massacre Mascot | 21% | 778 | 1% | 9,3 | 0,7 | 3,8 |
| Vyper | 2 | ★2 | Atirador | Coisa Esquisita | 21% | 1629 | 84% | 8,8 | 1,0 | 1,6 |
| Akali | 1 | ★2 | Safada | Charme | 20% | 779 | 1% | 9,3 | 0,8 | 3,0 |
| Baseball Diehard | 1 | ★1 | Únicos | Vira Baseball Diehard | 17% | 377 | 0% | 8,6 | 0,8 | 2,5 |
| Anubis | 2 | ★2 | Únicos | Vira Anubis | 15% | 1175 | 7% | 10,1 | 0,7 | 3,2 |

**Stands fora da faixa** (entre Stands do mesmo custo):

| Campeão | Custo | ★ | Papel | Habilidade | Vitórias | Dano/luta | Vivo no fim | 1º lanç. (s) | Lanç./10 s | Valor/lanç. |
|---|---|---|---|---|---|---|---|---|---|---|
| Tusk | 2 | ★2 | Atirador | Vira Tusk | 93% | 1772 | 87% | 10,6 | 0,8 | 3,8 |
| Ball Breaker | 2 | ★1 | Atirador | Vira Ball Breaker | 83% | 835 | 73% | 10,7 | 0,8 | 1,2 |
| Tusk | 2 | ★1 | Atirador | Vira Tusk | 77% | 906 | 77% | 10,7 | 0,8 | 1,7 |
| Ball Breaker | 2 | ★2 | Atirador | Vira Ball Breaker | 77% | 1519 | 83% | 10,5 | 0,7 | 1,7 |
| The World (Steel Ball Run) | 5 | ★2 | Porradeiro | Vira The World (Steel Ball Run) | 75% | 1291 | 17% | 10,8 | 0,5 | 2,5 |
| Strength | 1 | ★1 | Únicos | Vira Strength | 67% | 386 | 28% | 9,8 | 0,5 | 2,5 |
| Holy's Stand | 1 | ★2 | Safada | Vira Holy's Stand | 33% | 662 | 14% | 9,5 | 0,8 | 3,3 |
| The Hand | 4 | ★1 | Porradeiro | Vira The Hand | 33% | 852 | 17% | 8,0 | 0,9 | 2,9 |
| The Hand | 4 | ★2 | Porradeiro | Vira The Hand | 33% | 1687 | 17% | 8,3 | 0,9 | 4,3 |
| Wonder of U | 5 | ★2 | Demoníacos | Vira Wonder of U | 29% | 1328 | 13% | 10,2 | 0,5 | 4,1 |
| Holy's Stand | 1 | ★1 | Safada | Vira Holy's Stand | 28% | 309 | 11% | 8,8 | 0,7 | 1,4 |
| Foo Fighters (Stand) | 2 | ★2 | Água | Vira Foo Fighters (Stand) | 27% | 1257 | 17% | 10,0 | 0,9 | 4,1 |
| Echoes | 2 | ★1 | Vento | Vira Echoes | 23% | 611 | 17% | 8,9 | 1,0 | 1,6 |
| Echoes | 2 | ★2 | Vento | Vira Echoes | 23% | 1517 | 17% | 9,3 | 1,0 | 4,5 |
| Metallica | 2 | ★2 | Únicos | Vira Metallica | 20% | 1208 | 20% | 11,1 | 0,7 | 3,2 |
| Metallica | 2 | ★1 | Únicos | Vira Metallica | 13% | 565 | 10% | 10,6 | 0,7 | 1,9 |

<details><summary>Todos os campeões</summary>

| Campeão | Custo | ★ | Papel | Habilidade | Vitórias | Dano/luta | Vivo no fim | 1º lanç. (s) | Lanç./10 s | Valor/lanç. | Stand |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Escapist | 1 | ★1 | Únicos | Vira Escapist | 75% | 623 | 98% | 8,6 | 0,8 | 2,5 |  |
| Roggenrola | 1 | ★1 | Criaturinha Bizarra | (só ataca) | 69% | 452 | 2% | – | 0,0 | – |  |
| Grubbin | 1 | ★1 | Criaturinha Bizarra | (só ataca) | 67% | 450 | 2% | – | 0,0 | – |  |
| Squirtle | 1 | ★1 | Atirador | (só ataca) | 65% | 879 | 68% | – | 0,0 | – |  |
| Orianna | 1 | ★1 | Robô | Bateria de Mísseis | 64% | 533 | 31% | 9,0 | 0,9 | 3,3 |  |
| Elecmon | 1 | ★1 | Raio | (só ataca) | 62% | 747 | 64% | – | 0,0 | – |  |
| Pichu | 1 | ★1 | Raio | (só ataca) | 61% | 745 | 62% | – | 0,0 | – |  |
| Predaplant Verte Anaconda | 1 | ★1 | Dragão | Sopro de Dragão | 58% | 528 | 22% | 9,7 | 0,8 | 2,5 |  |
| Jinzo | 1 | ★1 | Robô | Bateria de Mísseis | 58% | 529 | 29% | 9,0 | 0,9 | 3,3 |  |
| Bystial Magnamhut | 1 | ★1 | Dragão | Sopro de Dragão | 57% | 528 | 22% | 9,7 | 0,8 | 2,5 |  |
| Sona | 1 | ★1 | Fadinhas | Pó de Fada | 57% | 595 | 65% | 10,3 | 0,9 | 2,7 |  |
| Pro Pickpocket | 1 | ★1 | Assassino | Golpe Fatal | 57% | 512 | 12% | 6,1 | 1,4 | 2,2 |  |
| Captain Kidd | 1 | ★1 | Atirador | Tiro Perfurante | 56% | 870 | 49% | 10,8 | 0,8 | 2,1 |  |
| Tepig | 1 | ★1 | Fogo | (só ataca) | 55% | 408 | 1% | – | 0,0 | – |  |
| Snivy | 1 | ★1 | Planta | (só ataca) | 54% | 491 | 26% | – | 0,0 | – |  |
| Kiriko | 1 | ★1 | Fadinhas | Pó de Fada | 54% | 598 | 66% | 10,3 | 0,9 | 2,7 |  |
| Popplio | 1 | ★1 | Água | (só ataca) | 54% | 490 | 25% | – | 0,0 | – |  |
| Yuumi | 1 | ★1 | Fadinhas | Pó de Fada | 54% | 595 | 63% | 10,4 | 0,9 | 2,7 |  |
| Ana | 1 | ★1 | Atirador | Tiro Perfurante | 54% | 871 | 47% | 10,8 | 0,8 | 2,1 |  |
| Torchic | 1 | ★1 | Fogo | (só ataca) | 53% | 405 | 1% | – | 0,0 | – |  |
| Oshawott | 1 | ★1 | Água | (só ataca) | 53% | 408 | 1% | – | 0,0 | – |  |
| Chimchar | 1 | ★1 | Fogo | (só ataca) | 52% | 411 | 1% | – | 0,0 | – |  |
| Shion | 1 | ★1 | Atirador | Tiro Perfurante | 52% | 874 | 49% | 10,8 | 0,8 | 2,1 |  |
| Mudkip | 1 | ★1 | Água | (só ataca) | 52% | 408 | 1% | – | 0,0 | – |  |
| Treecko | 1 | ★1 | Planta | (só ataca) | 52% | 412 | 1% | – | 0,0 | – |  |
| Bulbasaur | 1 | ★1 | Planta | (só ataca) | 52% | 484 | 26% | – | 0,0 | – |  |
| Dark Magician | 1 | ★1 | Demoníacos | Pacto Sombrio | 52% | 536 | 31% | 8,8 | 0,8 | 2,4 |  |
| Shakomon | 1 | ★1 | Água | (só ataca) | 51% | 492 | 27% | – | 0,0 | – |  |
| Piplup | 1 | ★1 | Água | (só ataca) | 51% | 406 | 1% | – | 0,0 | – |  |
| Turtwig | 1 | ★1 | Planta | (só ataca) | 51% | 408 | 1% | – | 0,0 | – |  |
| Pixie | 1 | ★1 | Fadinhas | Pó de Fada | 51% | 599 | 65% | 10,3 | 0,9 | 2,7 |  |
| Wraith | 1 | ★1 | Atirador | Tiro Perfurante | 51% | 876 | 45% | 10,8 | 0,8 | 2,2 |  |
| Chespin | 1 | ★1 | Planta | (só ataca) | 50% | 409 | 1% | – | 0,0 | – |  |
| Idun | 1 | ★1 | Fadinhas | Pó de Fada | 50% | 598 | 63% | 10,3 | 0,9 | 2,7 |  |
| Whismur | 1 | ★1 | Únicos | (só ataca) | 50% | 480 | 25% | – | 0,0 | – |  |
| Tracer | 1 | ★1 | Atirador | Tiro Perfurante | 50% | 867 | 41% | 10,8 | 0,8 | 2,1 |  |
| Charmander | 1 | ★1 | Fogo | (só ataca) | 50% | 486 | 26% | – | 0,0 | – |  |
| Punimon | 1 | ★1 | Únicos | (só ataca) | 49% | 410 | 2% | – | 0,0 | – |  |
| Lash | 1 | ★1 | Porradeiro | Pancadão | 48% | 440 | 2% | 8,6 | 0,8 | 3,3 |  |
| Fennekin | 1 | ★1 | Fogo | (só ataca) | 48% | 486 | 27% | – | 0,0 | – |  |
| Kai'Sa | 1 | ★1 | Atirador | Tiro Perfurante | 48% | 871 | 45% | 10,8 | 0,8 | 2,1 |  |
| Caitlyn | 1 | ★1 | Atirador | Tiro Perfurante | 48% | 871 | 46% | 10,8 | 0,8 | 2,1 |  |
| Hammered Man | 1 | ★1 | Porradeiro | Pancadão | 48% | 441 | 2% | 8,7 | 0,8 | 3,3 |  |
| Carmen | 1 | ★1 | Safada | Charme | 47% | 488 | 26% | 8,8 | 0,8 | 2,0 |  |
| Cait Sith | 1 | ★1 | Criaturinha Bizarra | Coisa Esquisita | 46% | 404 | 4% | 8,7 | 0,8 | 2,3 |  |
| Ukobach | 1 | ★1 | Criaturinha Bizarra | Coisa Esquisita | 46% | 399 | 4% | 8,7 | 0,8 | 2,3 |  |
| Rat King | 1 | ★1 | Criaturinha Bizarra | Coisa Esquisita | 44% | 400 | 4% | 8,7 | 0,8 | 2,3 |  |
| Palladion | 1 | ★1 | Anjo | Luz Divina | 44% | 739 | 33% | 11,8 | 0,7 | 2,6 |  |
| Black Ooze | 1 | ★1 | Criaturinha Bizarra | Coisa Esquisita | 44% | 402 | 4% | 8,8 | 0,8 | 2,2 |  |
| Wild Hog | 1 | ★1 | Tanque | Muralha | 43% | 296 | 2% | 9,1 | 0,9 | 2,9 |  |
| Poppy | 1 | ★1 | Criaturinha Bizarra | Coisa Esquisita | 43% | 399 | 2% | 8,8 | 0,8 | 2,1 |  |
| Yamato | 1 | ★1 | Tanque | Muralha | 41% | 293 | 4% | 9,1 | 0,9 | 2,9 |  |
| Tyumon | 1 | ★1 | Terra | (só ataca) | 41% | 393 | 1% | – | 0,0 | – |  |
| Dark Magician Girl | 1 | ★1 | Safada | Charme | 40% | 482 | 24% | 8,8 | 0,8 | 1,9 |  |
| Roadhog | 1 | ★1 | Tanque | Muralha | 40% | 295 | 3% | 9,1 | 0,9 | 2,9 |  |
| Kuriboh | 1 | ★1 | Fadinhas | Pó de Fada | 39% | 341 | 2% | 8,7 | 0,9 | 3,4 |  |
| Mandrake | 1 | ★1 | Fadinhas | Coisa Esquisita | 30% | 624 | 38% | 10,3 | 0,9 | 1,5 |  |
| Baba | 1 | ★1 | Únicos | Vira Baba | 30% | 413 | 1% | 9,5 | 0,8 | 3,0 |  |
| Akali | 1 | ★1 | Safada | Charme | 23% | 381 | 0% | 8,6 | 0,8 | 2,1 |  |
| Baseball Diehard | 1 | ★1 | Únicos | Vira Baseball Diehard | 17% | 377 | 0% | 8,6 | 0,8 | 2,5 |  |
| Strength | 1 | ★1 | Únicos | Vira Strength | 67% | 386 | 28% | 9,8 | 0,5 | 2,5 | sim |
| Tubular Bells | 1 | ★1 | Criaturinha Bizarra | Vira Tubular Bells | 58% | 466 | 31% | 9,0 | 0,7 | 3,4 | sim |
| Hey Ya! | 1 | ★1 | Criaturinha Bizarra | Vira Hey Ya! | 56% | 319 | 19% | 8,0 | 0,9 | 0,0 | sim |
| Boy II Man | 1 | ★1 | Tanque | Vira Boy II Man | 56% | 243 | 25% | 8,6 | 1,0 | 0,0 | sim |
| Talking Head | 1 | ★1 | Tanque | Vira Talking Head | 50% | 254 | 31% | 8,5 | 0,9 | 2,1 | sim |
| Baby Face | 1 | ★1 | Safada | Vira Baby Face | 36% | 318 | 14% | 8,9 | 0,6 | 1,7 | sim |
| Holy's Stand | 1 | ★1 | Safada | Vira Holy's Stand | 28% | 309 | 11% | 8,8 | 0,7 | 1,4 | sim |
| Vegimon | 1 | ★2 | Criaturinha Bizarra | (só ataca) | 91% | 1103 | 18% | – | 0,0 | – |  |
| Leomon | 1 | ★2 | Porradeiro | (só ataca) | 86% | 1059 | 12% | – | 0,0 | – |  |
| Boldore | 1 | ★2 | Criaturinha Bizarra | (só ataca) | 78% | 963 | 5% | – | 0,0 | – |  |
| Charjabug | 1 | ★2 | Criaturinha Bizarra | (só ataca) | 77% | 962 | 5% | – | 0,0 | – |  |
| Shellmon | 1 | ★2 | Água | (só ataca) | 76% | 1044 | 31% | – | 0,0 | – |  |
| Grotle | 1 | ★2 | Tanque | (só ataca) | 76% | 796 | 7% | – | 0,0 | – |  |
| Sukamon | 1 | ★2 | Criaturinha Bizarra | Vira Sukamon | 73% | 1002 | 4% | 9,5 | 0,8 | 2,5 |  |
| Monferno | 1 | ★2 | Porradeiro | (só ataca) | 70% | 926 | 5% | – | 0,0 | – |  |
| Pignite | 1 | ★2 | Porradeiro | (só ataca) | 67% | 923 | 3% | – | 0,0 | – |  |
| Marshtomp | 1 | ★2 | Água | (só ataca) | 63% | 879 | 1% | – | 0,0 | – |  |
| Prinplup | 1 | ★2 | Água | (só ataca) | 63% | 875 | 3% | – | 0,0 | – |  |
| Combusken | 1 | ★2 | Fogo | (só ataca) | 62% | 873 | 3% | – | 0,0 | – |  |
| Grovyle | 1 | ★2 | Planta | (só ataca) | 61% | 883 | 4% | – | 0,0 | – |  |
| Dewott | 1 | ★2 | Água | (só ataca) | 59% | 879 | 4% | – | 0,0 | – |  |
| Quilladin | 1 | ★2 | Planta | (só ataca) | 59% | 881 | 3% | – | 0,0 | – |  |
| Ivysaur | 1 | ★2 | Planta | (só ataca) | 58% | 939 | 27% | – | 0,0 | – |  |
| Pikachu | 1 | ★2 | Raio | (só ataca) | 56% | 1353 | 82% | – | 0,0 | – |  |
| Orianna | 1 | ★2 | Robô | Bateria de Mísseis | 54% | 1027 | 31% | 9,3 | 0,9 | 4,5 |  |
| Braixen | 1 | ★2 | Safada | (só ataca) | 53% | 931 | 28% | – | 0,0 | – |  |
| Loudred | 1 | ★2 | Únicos | (só ataca) | 53% | 937 | 28% | – | 0,0 | – |  |
| Wartortle | 1 | ★2 | Atirador | (só ataca) | 53% | 1534 | 88% | – | 0,0 | – |  |
| Servine | 1 | ★2 | Planta | (só ataca) | 52% | 934 | 27% | – | 0,0 | – |  |
| Brionne | 1 | ★2 | Água | (só ataca) | 52% | 936 | 27% | – | 0,0 | – |  |
| Charmeleon | 1 | ★2 | Fogo | (só ataca) | 52% | 929 | 27% | – | 0,0 | – |  |
| Ana | 1 | ★2 | Atirador | Tiro Perfurante | 51% | 1609 | 64% | 10,8 | 0,8 | 3,4 |  |
| Break-and-Entryman | 1 | ★2 | Assassino | Golpe Fatal | 51% | 934 | 3% | 6,2 | 1,5 | 3,4 |  |
| Agathion | 1 | ★2 | Criaturinha Bizarra | Coisa Esquisita | 50% | 837 | 14% | 9,4 | 0,9 | 3,7 |  |
| Feral Felon | 1 | ★2 | Assassino | Golpe Fatal | 50% | 934 | 2% | 6,2 | 1,5 | 3,4 |  |
| Jinzo | 1 | ★2 | Robô | Bateria de Mísseis | 48% | 1027 | 29% | 9,4 | 0,9 | 4,4 |  |
| Yamato | 1 | ★2 | Tanque | Muralha | 48% | 581 | 15% | 9,4 | 0,9 | 3,9 |  |
| Tracer | 1 | ★2 | Atirador | Tiro Perfurante | 48% | 1614 | 64% | 10,8 | 0,8 | 3,4 |  |
| Wraith | 1 | ★2 | Atirador | Tiro Perfurante | 47% | 1626 | 67% | 10,8 | 0,8 | 3,4 |  |
| Caitlyn | 1 | ★2 | Atirador | Tiro Perfurante | 47% | 1606 | 65% | 10,8 | 0,8 | 3,3 |  |
| Bystial Magnamhut | 1 | ★2 | Dragão | Sopro de Dragão | 47% | 1016 | 25% | 10,3 | 0,7 | 3,9 |  |
| Shion | 1 | ★2 | Atirador | Tiro Perfurante | 46% | 1614 | 64% | 10,8 | 0,8 | 3,4 |  |
| Poppy | 1 | ★2 | Criaturinha Bizarra | Coisa Esquisita | 46% | 828 | 14% | 9,4 | 0,9 | 3,5 |  |
| Kai'Sa | 1 | ★2 | Atirador | Tiro Perfurante | 45% | 1610 | 63% | 10,8 | 0,8 | 3,4 |  |
| Athena | 1 | ★2 | Anjo | Luz Divina | 45% | 1393 | 49% | 11,9 | 0,7 | 4,5 |  |
| Roadhog | 1 | ★2 | Tanque | Muralha | 45% | 578 | 15% | 9,4 | 0,9 | 3,9 |  |
| Feast 'n Flyer | 1 | ★2 | Tanque | Muralha | 45% | 586 | 14% | 9,4 | 0,9 | 3,9 |  |
| Predaplant Verte Anaconda | 1 | ★2 | Dragão | Sopro de Dragão | 44% | 999 | 23% | 10,3 | 0,7 | 3,9 |  |
| Rat King | 1 | ★2 | Criaturinha Bizarra | Coisa Esquisita | 44% | 813 | 14% | 9,4 | 0,9 | 3,5 |  |
| Koropokguru | 1 | ★2 | Criaturinha Bizarra | Coisa Esquisita | 43% | 805 | 10% | 9,4 | 0,9 | 3,3 |  |
| Dark Magician | 1 | ★2 | Demoníacos | Pacto Sombrio | 40% | 1018 | 29% | 9,3 | 0,8 | 3,5 |  |
| Hua Po | 1 | ★2 | Fadinhas | Pó de Fada | 40% | 961 | 72% | 10,6 | 0,9 | 3,6 |  |
| Neko Shogun | 1 | ★2 | Criaturinha Bizarra | Coisa Esquisita | 40% | 803 | 10% | 9,4 | 0,9 | 3,4 |  |
| Yuumi | 1 | ★2 | Fadinhas | Pó de Fada | 39% | 959 | 73% | 10,6 | 0,9 | 3,6 |  |
| Lash | 1 | ★2 | Porradeiro | Pancadão | 38% | 863 | 2% | 9,4 | 0,8 | 3,9 |  |
| Seiten Taisei - P5 | 1 | ★2 | Porradeiro | Pancadão | 38% | 861 | 2% | 9,4 | 0,8 | 3,9 |  |
| Sona | 1 | ★2 | Fadinhas | Pó de Fada | 37% | 956 | 73% | 10,6 | 0,9 | 3,6 |  |
| Kiriko | 1 | ★2 | Fadinhas | Pó de Fada | 37% | 957 | 75% | 10,6 | 0,9 | 3,6 |  |
| Kuriboh | 1 | ★2 | Fadinhas | Pó de Fada | 35% | 644 | 6% | 9,3 | 0,9 | 4,3 |  |
| Knight of the Cask | 1 | ★2 | Porradeiro | Pancadão | 34% | 853 | 1% | 9,4 | 0,8 | 3,9 |  |
| Dark Magician Girl | 1 | ★2 | Safada | Charme | 32% | 920 | 28% | 9,3 | 0,8 | 2,9 |  |
| Bugs | 1 | ★2 | Demoníacos | Pacto Sombrio | 32% | 855 | 1% | 9,3 | 0,8 | 3,8 |  |
| Hecate | 1 | ★2 | Safada | Charme | 30% | 912 | 23% | 9,3 | 0,8 | 2,9 |  |
| Ishtar | 1 | ★2 | Safada | Charme | 30% | 909 | 23% | 9,2 | 0,8 | 3,0 |  |
| Baba | 1 | ★2 | Únicos | Vira Baba | 22% | 807 | 0% | 10,2 | 0,7 | 4,5 |  |
| Massacre Mascot | 1 | ★2 | Únicos | Vira Massacre Mascot | 21% | 778 | 1% | 9,3 | 0,7 | 3,8 |  |
| Akali | 1 | ★2 | Safada | Charme | 20% | 779 | 1% | 9,3 | 0,8 | 3,0 |  |
| Tubular Bells | 1 | ★2 | Criaturinha Bizarra | Vira Tubular Bells | 64% | 972 | 39% | 9,5 | 0,8 | 4,9 | sim |
| Boy II Man | 1 | ★2 | Tanque | Vira Boy II Man | 61% | 453 | 39% | 8,8 | 0,9 | 0,0 | sim |
| Strength | 1 | ★2 | Únicos | Vira Strength | 56% | 744 | 25% | 10,5 | 0,6 | 3,6 | sim |
| Talking Head | 1 | ★2 | Tanque | Vira Talking Head | 50% | 448 | 28% | 8,7 | 0,9 | 2,6 | sim |
| Hey Ya! | 1 | ★2 | Criaturinha Bizarra | Vira Hey Ya! | 47% | 579 | 28% | 8,5 | 0,9 | 0,0 | sim |
| Baby Face | 1 | ★2 | Safada | Vira Baby Face | 39% | 659 | 17% | 9,6 | 0,8 | 2,7 | sim |
| Holy's Stand | 1 | ★2 | Safada | Vira Holy's Stand | 33% | 662 | 14% | 9,5 | 0,8 | 3,3 | sim |
| Doctrine | 2 | ★1 | Anjo | Pacto Sombrio | 66% | 1071 | 70% | 9,7 | 1,0 | 2,6 |  |
| Honedge | 2 | ★1 | Criaturinha Bizarra | (só ataca) | 65% | 605 | 2% | – | 0,0 | – |  |
| Solosis | 2 | ★1 | Criaturinha Bizarra | (só ataca) | 65% | 607 | 4% | – | 0,0 | – |  |
| Vanillite | 2 | ★1 | Criaturinha Bizarra | (só ataca) | 64% | 609 | 4% | – | 0,0 | – |  |
| Chikorita | 2 | ★1 | Tanque | (só ataca) | 64% | 503 | 3% | – | 0,0 | – |  |
| McGinnis | 2 | ★1 | Tanque | Bateria de Mísseis | 63% | 528 | 6% | 8,8 | 0,9 | 4,3 |  |
| Lava Golem | 2 | ★1 | Tanque | Muralha | 62% | 427 | 6% | 8,8 | 1,0 | 3,2 |  |
| Dine-and-Dasher | 2 | ★1 | Tanque | Muralha | 60% | 429 | 6% | 8,8 | 1,0 | 3,2 |  |
| Reinhardt | 2 | ★1 | Tanque | Muralha | 59% | 421 | 6% | 8,8 | 1,0 | 3,2 |  |
| Gabumon | 2 | ★1 | Porradeiro | (só ataca) | 57% | 585 | 2% | – | 0,0 | – |  |
| Himiko | 2 | ★1 | Temporais | Parar o Tempo | 56% | 887 | 60% | 11,0 | 0,8 | 0,9 |  |
| Lulu | 2 | ★1 | Fadinhas | Pó de Fada | 56% | 754 | 69% | 9,7 | 1,0 | 3,1 |  |
| Agumon | 2 | ★1 | Dragão | (só ataca) | 55% | 690 | 28% | – | 0,0 | – |  |
| Black Metal Dragon | 2 | ★1 | Dragão | Bateria de Mísseis | 55% | 734 | 35% | 8,8 | 0,9 | 3,3 |  |
| Gate Guardian | 2 | ★1 | Tanque | Muralha | 55% | 424 | 5% | 8,8 | 1,0 | 3,2 |  |
| Mermaid | 2 | ★1 | Fadinhas | Pó de Fada | 55% | 749 | 69% | 9,7 | 1,0 | 3,1 |  |
| Juno | 2 | ★1 | Fadinhas | Pó de Fada | 54% | 758 | 71% | 9,7 | 1,0 | 3,1 |  |
| Time Thief Redoer | 2 | ★1 | Temporais | Parar o Tempo | 54% | 886 | 57% | 11,0 | 0,8 | 0,9 |  |
| Widowmaker | 2 | ★1 | Atirador | Tiro Perfurante | 54% | 1151 | 58% | 10,2 | 0,9 | 2,1 |  |
| Ivy | 2 | ★1 | Fadinhas | Pó de Fada | 54% | 748 | 69% | 9,7 | 1,0 | 3,1 |  |
| Seraphine | 2 | ★1 | Fadinhas | Pó de Fada | 52% | 746 | 67% | 9,8 | 1,0 | 3,1 |  |
| Timburr | 2 | ★1 | Porradeiro | (só ataca) | 52% | 585 | 3% | – | 0,0 | – |  |
| Zilean | 2 | ★1 | Temporais | Parar o Tempo | 52% | 888 | 59% | 11,0 | 0,8 | 0,9 |  |
| Jinx | 2 | ★1 | Atirador | Tiro Perfurante | 52% | 1154 | 60% | 10,2 | 0,9 | 2,1 |  |
| Zorro | 2 | ★1 | Assassino | Golpe Fatal | 51% | 617 | 6% | 5,8 | 1,6 | 2,1 |  |
| Jetpack Cat | 2 | ★1 | Fadinhas | Pó de Fada | 51% | 746 | 67% | 9,7 | 1,0 | 3,1 |  |
| Time Wizard | 2 | ★1 | Temporais | Parar o Tempo | 49% | 884 | 57% | 11,0 | 0,8 | 0,9 |  |
| Jack Frost | 2 | ★1 | Criaturinha Bizarra | Coisa Esquisita | 48% | 550 | 5% | 8,8 | 0,9 | 2,2 |  |
| Litten | 2 | ★1 | Fogo | (só ataca) | 48% | 554 | 1% | – | 0,0 | – |  |
| Warwick | 2 | ★1 | Porradeiro | Pancadão | 48% | 598 | 3% | 8,7 | 0,8 | 2,9 |  |
| Vindicta | 2 | ★1 | Atirador | Tiro Perfurante | 48% | 1138 | 54% | 10,2 | 0,9 | 2,0 |  |
| Shinx | 2 | ★1 | Raio | (só ataca) | 47% | 551 | 1% | – | 0,0 | – |  |
| Crabby Sentinel | 2 | ★1 | Porradeiro | Pancadão | 45% | 595 | 2% | 8,7 | 0,8 | 3,0 |  |
| Rowlet | 2 | ★1 | Planta | (só ataca) | 45% | 636 | 23% | – | 0,0 | – |  |
| Totodile | 2 | ★1 | Água | (só ataca) | 45% | 555 | 1% | – | 0,0 | – |  |
| Kazejin | 2 | ★1 | Vento | Tornado | 43% | 676 | 17% | 9,1 | 0,8 | 1,9 |  |
| Patamon | 2 | ★1 | Anjo | (só ataca) | 43% | 948 | 47% | – | 0,0 | – |  |
| Froakie | 2 | ★1 | Água | (só ataca) | 41% | 646 | 21% | – | 0,0 | – |  |
| Cyndaquil | 2 | ★1 | Fogo | (só ataca) | 40% | 640 | 21% | – | 0,0 | – |  |
| Sham Man Shaman | 2 | ★1 | Vento | Tornado | 40% | 670 | 15% | 9,1 | 0,9 | 2,0 |  |
| Palmon | 2 | ★1 | Planta | (só ataca) | 40% | 640 | 22% | – | 0,0 | – |  |
| Sudama | 2 | ★1 | Vento | Tornado | 39% | 673 | 18% | 9,1 | 0,9 | 1,9 |  |
| Hatenna | 2 | ★1 | Safada | (só ataca) | 38% | 638 | 22% | – | 0,0 | – |  |
| Tentomon | 2 | ★1 | Planta | (só ataca) | 37% | 632 | 20% | – | 0,0 | – |  |
| Masked Demonling | 2 | ★1 | Demoníacos | Pacto Sombrio | 34% | 582 | 2% | 8,7 | 0,8 | 2,6 |  |
| Vyper | 2 | ★1 | Atirador | Coisa Esquisita | 34% | 1019 | 65% | 8,9 | 1,0 | 1,2 |  |
| Ahri | 2 | ★1 | Safada | Charme | 33% | 645 | 25% | 8,7 | 0,9 | 1,9 |  |
| Chernobog | 2 | ★1 | Fogo | Bola de Fogo | 33% | 688 | 22% | 9,5 | 0,8 | 2,0 |  |
| Ball Breaker | 2 | ★1 | Atirador | Vira Ball Breaker | 83% | 835 | 73% | 10,7 | 0,8 | 1,2 | sim |
| Tusk | 2 | ★1 | Atirador | Vira Tusk | 77% | 906 | 77% | 10,7 | 0,8 | 1,7 | sim |
| Red Hot Chili Pepper | 2 | ★1 | Safada | Vira Red Hot Chili Pepper | 53% | 847 | 30% | 9,4 | 1,3 | 3,6 | sim |
| Foo Fighters (Stand) | 2 | ★1 | Água | Vira Foo Fighters (Stand) | 50% | 611 | 30% | 9,4 | 0,8 | 2,3 | sim |
| Echoes | 2 | ★1 | Vento | Vira Echoes | 23% | 611 | 17% | 8,9 | 1,0 | 1,6 | sim |
| Metallica | 2 | ★1 | Únicos | Vira Metallica | 13% | 565 | 10% | 10,6 | 0,7 | 1,9 | sim |
| Garurumon | 2 | ★2 | Porradeiro | (só ataca) | 91% | 1404 | 16% | – | 0,0 | – |  |
| Togemon | 2 | ★2 | Porradeiro | (só ataca) | 88% | 1415 | 16% | – | 0,0 | – |  |
| Greymon | 2 | ★2 | Dragão | (só ataca) | 84% | 1493 | 39% | – | 0,0 | – |  |
| Vanillish | 2 | ★2 | Criaturinha Bizarra | (só ataca) | 82% | 1277 | 11% | – | 0,0 | – |  |
| Doublade | 2 | ★2 | Criaturinha Bizarra | (só ataca) | 79% | 1285 | 11% | – | 0,0 | – |  |
| Duosion | 2 | ★2 | Criaturinha Bizarra | (só ataca) | 79% | 1278 | 11% | – | 0,0 | – |  |
| Bayleef | 2 | ★2 | Tanque | (só ataca) | 78% | 1041 | 11% | – | 0,0 | – |  |
| McGinnis | 2 | ★2 | Tanque | Bateria de Mísseis | 70% | 1087 | 12% | 9,1 | 1,0 | 5,7 |  |
| Gurdurr | 2 | ★2 | Porradeiro | (só ataca) | 70% | 1241 | 9% | – | 0,0 | – |  |
| Kabuterimon | 2 | ★2 | Planta | (só ataca) | 68% | 1380 | 37% | – | 0,0 | – |  |
| Doctrine | 2 | ★2 | Anjo | Pacto Sombrio | 66% | 2026 | 79% | 9,8 | 1,0 | 3,9 |  |
| Luxio | 2 | ★2 | Raio | (só ataca) | 62% | 1177 | 6% | – | 0,0 | – |  |
| Torracat | 2 | ★2 | Fogo | (só ataca) | 62% | 1174 | 7% | – | 0,0 | – |  |
| Croconaw | 2 | ★2 | Água | (só ataca) | 61% | 1171 | 7% | – | 0,0 | – |  |
| Black Metal Dragon | 2 | ★2 | Dragão | Bateria de Mísseis | 54% | 1417 | 35% | 9,1 | 1,0 | 4,5 |  |
| Chomp-and-Charger | 2 | ★2 | Tanque | Muralha | 53% | 783 | 27% | 9,2 | 1,0 | 4,3 |  |
| Dartrix | 2 | ★2 | Planta | (só ataca) | 50% | 1276 | 34% | – | 0,0 | – |  |
| Gate Guardian | 2 | ★2 | Tanque | Muralha | 50% | 780 | 26% | 9,1 | 1,0 | 4,3 |  |
| Reinhardt | 2 | ★2 | Tanque | Muralha | 49% | 781 | 26% | 9,2 | 1,0 | 4,3 |  |
| Angemon | 2 | ★2 | Anjo | (só ataca) | 48% | 1765 | 79% | – | 0,0 | – |  |
| Lava Golem | 2 | ★2 | Tanque | Muralha | 48% | 779 | 26% | 9,1 | 1,0 | 4,3 |  |
| Frogadier | 2 | ★2 | Água | (só ataca) | 47% | 1269 | 35% | – | 0,0 | – |  |
| Hattrem | 2 | ★2 | Safada | (só ataca) | 46% | 1261 | 32% | – | 0,0 | – |  |
| Quilava | 2 | ★2 | Fogo | (só ataca) | 46% | 1266 | 33% | – | 0,0 | – |  |
| Warwick | 2 | ★2 | Porradeiro | Pancadão | 44% | 1201 | 4% | 8,9 | 0,8 | 3,8 |  |
| Pier Reviewer | 2 | ★2 | Porradeiro | Pancadão | 43% | 1192 | 5% | 8,9 | 0,9 | 3,8 |  |
| Juno | 2 | ★2 | Fadinhas | Pó de Fada | 43% | 1208 | 90% | 9,8 | 0,9 | 4,1 |  |
| Black Frost | 2 | ★2 | Demoníacos | Pacto Sombrio | 42% | 1405 | 34% | 9,1 | 0,9 | 3,5 |  |
| Ivy | 2 | ★2 | Fadinhas | Pó de Fada | 42% | 1203 | 87% | 9,8 | 0,9 | 4,1 |  |
| Lulu | 2 | ★2 | Fadinhas | Pó de Fada | 41% | 1203 | 86% | 9,8 | 1,0 | 4,1 |  |
| Mermaid | 2 | ★2 | Fadinhas | Pó de Fada | 40% | 1192 | 85% | 9,8 | 0,9 | 4,1 |  |
| Seraphine | 2 | ★2 | Fadinhas | Pó de Fada | 40% | 1207 | 89% | 9,8 | 0,9 | 4,1 |  |
| Kazejin | 2 | ★2 | Vento | Tornado | 39% | 1311 | 17% | 9,5 | 0,9 | 2,8 |  |
| Kanzeon | 2 | ★2 | Temporais | Parar o Tempo | 38% | 1503 | 76% | 11,3 | 0,7 | 1,4 |  |
| Time Wizard | 2 | ★2 | Temporais | Parar o Tempo | 38% | 1506 | 75% | 11,3 | 0,7 | 1,4 |  |
| Jetpack Cat | 2 | ★2 | Fadinhas | Pó de Fada | 38% | 1204 | 88% | 9,8 | 1,0 | 4,0 |  |
| Zilean | 2 | ★2 | Temporais | Parar o Tempo | 38% | 1509 | 77% | 11,4 | 0,7 | 1,4 |  |
| Time Thief Redoer | 2 | ★2 | Temporais | Parar o Tempo | 37% | 1505 | 76% | 11,3 | 0,7 | 1,4 |  |
| Vindicta | 2 | ★2 | Atirador | Tiro Perfurante | 35% | 2014 | 73% | 10,1 | 0,9 | 3,2 |  |
| False Prophet | 2 | ★2 | Vento | Tornado | 35% | 1321 | 18% | 9,5 | 0,9 | 2,9 |  |
| Jinx | 2 | ★2 | Atirador | Tiro Perfurante | 34% | 2033 | 78% | 10,1 | 0,9 | 3,2 |  |
| Mercurius | 2 | ★2 | Assassino | Golpe Fatal | 34% | 1144 | 0% | 6,2 | 1,5 | 3,2 |  |
| Kodama | 2 | ★2 | Vento | Tornado | 33% | 1293 | 17% | 9,5 | 0,9 | 2,8 |  |
| Ahri | 2 | ★2 | Safada | Charme | 33% | 1254 | 30% | 9,0 | 0,9 | 2,8 |  |
| Profaner Demon | 2 | ★2 | Demoníacos | Pacto Sombrio | 32% | 1172 | 5% | 8,9 | 0,9 | 3,6 |  |
| Widowmaker | 2 | ★2 | Atirador | Tiro Perfurante | 32% | 2032 | 76% | 10,1 | 0,9 | 3,2 |  |
| Vyper | 2 | ★2 | Atirador | Coisa Esquisita | 21% | 1629 | 84% | 8,8 | 1,0 | 1,6 |  |
| Anubis | 2 | ★2 | Únicos | Vira Anubis | 15% | 1175 | 7% | 10,1 | 0,7 | 3,2 |  |
| Tusk | 2 | ★2 | Atirador | Vira Tusk | 93% | 1772 | 87% | 10,6 | 0,8 | 3,8 | sim |
| Ball Breaker | 2 | ★2 | Atirador | Vira Ball Breaker | 77% | 1519 | 83% | 10,5 | 0,7 | 1,7 | sim |
| Red Hot Chili Pepper | 2 | ★2 | Safada | Vira Red Hot Chili Pepper | 60% | 1899 | 47% | 9,9 | 1,3 | 5,8 | sim |
| Foo Fighters (Stand) | 2 | ★2 | Água | Vira Foo Fighters (Stand) | 27% | 1257 | 17% | 10,0 | 0,9 | 4,1 | sim |
| Echoes | 2 | ★2 | Vento | Vira Echoes | 23% | 1517 | 17% | 9,3 | 1,0 | 4,5 | sim |
| Metallica | 2 | ★2 | Únicos | Vira Metallica | 20% | 1208 | 20% | 11,1 | 0,7 | 3,2 | sim |
| Guardromon | 3 | ★1 | Criaturinha Bizarra | (só ataca) | 67% | 732 | 3% | – | 0,0 | – |  |
| Barong | 3 | ★1 | Raio | Corrente Elétrica | 67% | 1243 | 61% | 10,5 | 0,8 | 2,2 |  |
| Lifeweaver | 3 | ★1 | Anjo | Pó de Fada | 65% | 973 | 68% | 9,1 | 1,0 | 2,9 |  |
| Rookidee | 3 | ★1 | Vento | (só ataca) | 64% | 756 | 2% | – | 0,0 | – |  |
| Big Shield Gardna | 3 | ★1 | Tanque | Muralha | 64% | 519 | 4% | 8,3 | 1,1 | 3,1 |  |
| Machop | 3 | ★1 | Porradeiro | (só ataca) | 62% | 714 | 2% | – | 0,0 | – |  |
| Garen | 3 | ★1 | Tanque | Muralha | 61% | 514 | 3% | 8,3 | 1,1 | 3,1 |  |
| Sukuna-Hikona - P4 | 3 | ★1 | Fadinhas | Pó de Fada | 60% | 936 | 66% | 9,2 | 1,0 | 3,1 |  |
| Orisa | 3 | ★1 | Robô | Bateria de Mísseis | 60% | 870 | 33% | 8,4 | 1,0 | 3,2 |  |
| Lillia | 3 | ★1 | Fadinhas | Pó de Fada | 60% | 930 | 66% | 9,2 | 1,0 | 3,1 |  |
| Soraka | 3 | ★1 | Anjo | Pó de Fada | 60% | 960 | 63% | 9,1 | 1,0 | 2,8 |  |
| D.Mon | 3 | ★1 | Robô | Bateria de Mísseis | 59% | 863 | 35% | 8,4 | 1,0 | 3,2 |  |
| Milio | 3 | ★1 | Fadinhas | Pó de Fada | 58% | 937 | 66% | 9,2 | 1,0 | 3,1 |  |
| Demeter | 3 | ★1 | Fadinhas | Pó de Fada | 57% | 932 | 66% | 9,2 | 1,0 | 3,1 |  |
| Aurora | 3 | ★1 | Fadinhas | Pó de Fada | 57% | 933 | 67% | 9,2 | 1,0 | 3,1 |  |
| Tornado Dragon | 3 | ★1 | Dragão | Sopro de Dragão | 57% | 868 | 27% | 9,2 | 0,8 | 2,5 |  |
| Venture | 3 | ★1 | Criaturinha Bizarra | Coisa Esquisita | 56% | 691 | 10% | 8,3 | 1,0 | 2,3 |  |
| Hydra | 3 | ★1 | Dragão | Sopro de Dragão | 56% | 866 | 26% | 9,1 | 0,8 | 2,5 |  |
| Michion, the Timelord | 3 | ★1 | Temporais | Parar o Tempo | 55% | 1099 | 62% | 10,4 | 0,9 | 0,8 |  |
| Paige | 3 | ★1 | Fadinhas | Pó de Fada | 55% | 931 | 63% | 9,2 | 1,0 | 3,1 |  |
| Pico Devimon | 3 | ★1 | Demoníacos | (só ataca) | 54% | 832 | 26% | – | 0,0 | – |  |
| Dratini | 3 | ★1 | Dragão | (só ataca) | 54% | 707 | 2% | – | 0,0 | – |  |
| Pseudotrash | 3 | ★1 | Criaturinha Bizarra | Coisa Esquisita | 53% | 695 | 8% | 8,3 | 1,0 | 2,4 |  |
| Venator | 3 | ★1 | Atirador | Tiro Perfurante | 52% | 1373 | 50% | 9,5 | 1,0 | 2,0 |  |
| City Slicker | 3 | ★1 | Água | Jato d'Água | 51% | 709 | 5% | 8,3 | 1,0 | 3,6 |  |
| Shuppet | 3 | ★1 | Demoníacos | (só ataca) | 51% | 810 | 26% | – | 0,0 | – |  |
| Carvanha | 3 | ★1 | Água | (só ataca) | 49% | 677 | 1% | – | 0,0 | – |  |
| Black Luster Soldier - Soldier of Chaos | 3 | ★1 | Assassino | Golpe Fatal | 48% | 713 | 6% | 5,4 | 1,7 | 2,1 |  |
| Paradox | 3 | ★1 | Atirador | Tiro Perfurante | 47% | 1378 | 47% | 9,5 | 1,0 | 2,0 |  |
| Bounsweet | 3 | ★1 | Safada | (só ataca) | 47% | 666 | 2% | – | 0,0 | – |  |
| Evilswarm Exciton Knight | 3 | ★1 | Porradeiro | Pancadão | 47% | 716 | 4% | 8,3 | 0,9 | 2,8 |  |
| Gurr | 3 | ★1 | Porradeiro | Pancadão | 47% | 712 | 2% | 8,3 | 0,9 | 2,8 |  |
| Lalamon | 3 | ★1 | Planta | (só ataca) | 45% | 791 | 21% | – | 0,0 | – |  |
| Orpheus | 3 | ★1 | Anjo | Luz Divina | 44% | 1175 | 41% | 10,4 | 0,9 | 2,6 |  |
| Graves | 3 | ★1 | Demoníacos | Pacto Sombrio | 44% | 855 | 32% | 8,4 | 0,9 | 2,4 |  |
| Shaman | 3 | ★1 | Anjo | Luz Divina | 43% | 1169 | 35% | 10,4 | 0,9 | 2,6 |  |
| Niddhoggr | 3 | ★1 | Dragão | Sopro de Dragão | 42% | 703 | 1% | 9,0 | 0,8 | 2,7 |  |
| Genji | 3 | ★1 | Assassino | Golpe Fatal | 41% | 699 | 4% | 5,4 | 1,7 | 2,0 |  |
| Ralts | 3 | ★1 | Fadinhas | (só ataca) | 40% | 1103 | 47% | – | 0,0 | – |  |
| Aron | 3 | ★1 | Terra | (só ataca) | 40% | 641 | 0% | – | 0,0 | – |  |
| Chucklehead | 3 | ★1 | Demoníacos | Pacto Sombrio | 40% | 699 | 3% | 8,3 | 0,9 | 2,5 |  |
| Abra | 3 | ★1 | Fadinhas | (só ataca) | 40% | 1103 | 45% | – | 0,0 | – |  |
| La Jinn the Mystical Genie of the Lamp | 3 | ★1 | Vento | Tornado | 39% | 808 | 16% | 8,7 | 0,9 | 1,9 |  |
| Sandile | 3 | ★1 | Terra | (só ataca) | 39% | 641 | 1% | – | 0,0 | – |  |
| Cendrillon | 3 | ★1 | Safada | Charme | 38% | 784 | 25% | 8,3 | 0,9 | 1,9 |  |
| Lamia | 3 | ★1 | Safada | Charme | 38% | 789 | 26% | 8,3 | 0,9 | 1,9 |  |
| Violet | 3 | ★1 | Safada | Charme | 37% | 790 | 27% | 8,3 | 0,9 | 1,9 |  |
| Gwen | 3 | ★1 | Assassino | Charme | 34% | 780 | 13% | 6,6 | 1,0 | 1,9 |  |
| Ekko | 3 | ★1 | Temporais | Parar o Tempo | 33% | 577 | 0% | 9,0 | 0,7 | 0,9 |  |
| Abaddon | 3 | ★1 | Anjo | Pacto Sombrio | 24% | 661 | 1% | 8,3 | 0,9 | 2,5 |  |
| Silver Chariot | 3 | ★1 | Porradeiro | Vira Silver Chariot | 61% | 600 | 19% | 8,2 | 1,0 | 1,9 | sim |
| Stray Cat | 3 | ★1 | Criaturinha Bizarra | Vira Stray Cat | 58% | 611 | 22% | 8,9 | 0,7 | 5,5 | sim |
| Sex Pistols | 3 | ★1 | Atirador | Vira Sex Pistols | 58% | 630 | 19% | 8,0 | 0,7 | 2,5 | sim |
| Bad Company | 3 | ★1 | Atirador | Vira Bad Company | 47% | 646 | 17% | 9,2 | 0,5 | 3,7 | sim |
| Civil War | 3 | ★1 | Atirador | Vira Civil War | 44% | 590 | 22% | 9,2 | 0,5 | 1,7 | sim |
| Light Rod Stand | 3 | ★1 | Únicos | Vira Light Rod Stand | 44% | 533 | 17% | 10,2 | 0,5 | 3,0 | sim |
| Pearl Jam | 3 | ★1 | Fadinhas | Vira Pearl Jam | 36% | 465 | 14% | 9,0 | 0,6 | 3,5 | sim |
| Devimon | 3 | ★2 | Demoníacos | (só ataca) | 90% | 1711 | 15% | – | 0,0 | – |  |
| Hagurumon | 3 | ★2 | Robô | (só ataca) | 84% | 1805 | 40% | – | 0,0 | – |  |
| Corvisquire | 3 | ★2 | Vento | (só ataca) | 80% | 1587 | 9% | – | 0,0 | – |  |
| Machoke | 3 | ★2 | Porradeiro | (só ataca) | 78% | 1511 | 7% | – | 0,0 | – |  |
| Dragonair | 3 | ★2 | Dragão | (só ataca) | 76% | 1512 | 7% | – | 0,0 | – |  |
| Sunflowmon | 3 | ★2 | Planta | (só ataca) | 75% | 1707 | 36% | – | 0,0 | – |  |
| Steenee | 3 | ★2 | Safada | (só ataca) | 70% | 1434 | 7% | – | 0,0 | – |  |
| Sharpedo | 3 | ★2 | Água | (só ataca) | 69% | 1436 | 8% | – | 0,0 | – |  |
| Banette | 3 | ★2 | Demoníacos | (só ataca) | 60% | 1621 | 33% | – | 0,0 | – |  |
| D.Mon | 3 | ★2 | Robô | Bateria de Mísseis | 60% | 1680 | 36% | 8,7 | 1,0 | 4,4 |  |
| Orisa | 3 | ★2 | Robô | Bateria de Mísseis | 60% | 1680 | 34% | 8,7 | 1,0 | 4,4 |  |
| Krokorok | 3 | ★2 | Terra | (só ataca) | 59% | 1375 | 6% | – | 0,0 | – |  |
| Garen | 3 | ★2 | Tanque | Muralha | 57% | 947 | 21% | 8,7 | 1,0 | 4,2 |  |
| Lairon | 3 | ★2 | Terra | (só ataca) | 56% | 1370 | 3% | – | 0,0 | – |  |
| Grease Monk | 3 | ★2 | Água | Jato d'Água | 55% | 1417 | 8% | 8,5 | 1,0 | 4,7 |  |
| Big Shield Gardna | 3 | ★2 | Tanque | Muralha | 54% | 952 | 24% | 8,7 | 1,0 | 4,2 |  |
| Venture | 3 | ★2 | Criaturinha Bizarra | Coisa Esquisita | 53% | 1326 | 16% | 8,6 | 1,0 | 3,3 |  |
| Hecatoncheires | 3 | ★2 | Tanque | Muralha | 53% | 948 | 22% | 8,7 | 1,0 | 4,2 |  |
| Gifted Gatherer | 3 | ★2 | Criaturinha Bizarra | Coisa Esquisita | 51% | 1332 | 20% | 8,6 | 1,0 | 3,5 |  |
| Evilswarm Exciton Knight | 3 | ★2 | Porradeiro | Pancadão | 49% | 1459 | 5% | 8,5 | 0,9 | 3,6 |  |
| Soraka | 3 | ★2 | Anjo | Pó de Fada | 49% | 1572 | 81% | 9,3 | 1,0 | 3,7 |  |
| Lifeweaver | 3 | ★2 | Anjo | Pó de Fada | 49% | 1566 | 81% | 9,3 | 1,0 | 3,7 |  |
| Venator | 3 | ★2 | Atirador | Tiro Perfurante | 47% | 2540 | 72% | 9,4 | 1,0 | 3,1 |  |
| Messiah | 3 | ★2 | Anjo | Luz Divina | 47% | 2200 | 55% | 10,7 | 0,9 | 4,1 |  |
| Michion, the Timelord | 3 | ★2 | Temporais | Parar o Tempo | 47% | 1893 | 80% | 10,6 | 0,9 | 1,3 |  |
| Graves | 3 | ★2 | Demoníacos | Pacto Sombrio | 47% | 1695 | 34% | 8,6 | 1,0 | 3,4 |  |
| Flauros | 3 | ★2 | Porradeiro | Pancadão | 46% | 1474 | 6% | 8,5 | 0,9 | 3,7 |  |
| Kohryu | 3 | ★2 | Dragão | Sopro de Dragão | 46% | 1671 | 29% | 9,7 | 0,8 | 3,8 |  |
| Tornado Dragon | 3 | ★2 | Dragão | Sopro de Dragão | 45% | 1675 | 28% | 9,6 | 0,8 | 3,8 |  |
| Abdiel | 3 | ★2 | Anjo | Luz Divina | 44% | 2219 | 54% | 10,6 | 0,9 | 4,2 |  |
| Aurora | 3 | ★2 | Fadinhas | Pó de Fada | 44% | 1491 | 80% | 9,2 | 1,0 | 4,0 |  |
| Paige | 3 | ★2 | Fadinhas | Pó de Fada | 44% | 1500 | 81% | 9,2 | 1,0 | 4,0 |  |
| High Necromancer | 3 | ★2 | Anjo | Luz Divina | 44% | 2214 | 56% | 10,6 | 0,9 | 4,2 |  |
| Paradox | 3 | ★2 | Atirador | Tiro Perfurante | 43% | 2529 | 72% | 9,4 | 1,0 | 3,1 |  |
| Milio | 3 | ★2 | Fadinhas | Pó de Fada | 43% | 1503 | 83% | 9,3 | 1,0 | 4,0 |  |
| Yamato-Takeru | 3 | ★2 | Fadinhas | Pó de Fada | 42% | 1495 | 81% | 9,3 | 1,0 | 4,0 |  |
| Genji | 3 | ★2 | Assassino | Golpe Fatal | 41% | 1406 | 1% | 5,9 | 1,5 | 3,2 |  |
| Lillia | 3 | ★2 | Fadinhas | Pó de Fada | 40% | 1502 | 84% | 9,2 | 1,0 | 4,0 |  |
| Cybele | 3 | ★2 | Safada | Charme | 39% | 1494 | 29% | 8,6 | 1,0 | 2,7 |  |
| Mother Harlot | 3 | ★2 | Safada | Charme | 38% | 1488 | 26% | 8,6 | 1,0 | 2,7 |  |
| La Jinn the Mystical Genie of the Lamp | 3 | ★2 | Vento | Tornado | 36% | 1547 | 13% | 9,1 | 1,0 | 2,8 |  |
| Violet | 3 | ★2 | Safada | Charme | 36% | 1483 | 27% | 8,6 | 1,0 | 2,6 |  |
| Nuwa | 3 | ★2 | Safada | Charme | 35% | 1507 | 29% | 8,6 | 1,0 | 2,6 |  |
| Warhead | 3 | ★2 | Demoníacos | Pacto Sombrio | 35% | 1448 | 7% | 8,5 | 0,9 | 3,5 |  |
| Black Luster Soldier - Soldier of Chaos | 3 | ★2 | Assassino | Golpe Fatal | 34% | 1379 | 0% | 5,9 | 1,5 | 3,2 |  |
| Vanadis | 3 | ★2 | Safada | Charme | 34% | 1480 | 28% | 8,5 | 1,0 | 2,6 |  |
| Kadabra | 3 | ★2 | Fadinhas | (só ataca) | 31% | 1990 | 72% | – | 0,0 | – |  |
| Kirlia | 3 | ★2 | Fadinhas | (só ataca) | 31% | 1984 | 74% | – | 0,0 | – |  |
| Gwen | 3 | ★2 | Assassino | Charme | 29% | 1566 | 16% | 6,7 | 1,0 | 2,7 |  |
| Ekko | 3 | ★2 | Temporais | Parar o Tempo | 27% | 1104 | 0% | 9,6 | 0,8 | 1,2 |  |
| Pearl Jam | 3 | ★2 | Fadinhas | Vira Pearl Jam | 58% | 857 | 31% | 8,9 | 0,8 | 5,7 | sim |
| Sex Pistols | 3 | ★2 | Atirador | Vira Sex Pistols | 56% | 1314 | 22% | 8,0 | 1,0 | 3,7 | sim |
| Chariot Requiem | 3 | ★2 | Porradeiro | Vira Chariot Requiem | 53% | 743 | 19% | 11,4 | 0,5 | 0,0 | sim |
| Stray Cat | 3 | ★2 | Criaturinha Bizarra | Vira Stray Cat | 53% | 1171 | 8% | 9,5 | 0,8 | 7,5 | sim |
| Bad Company | 3 | ★2 | Atirador | Vira Bad Company | 47% | 1279 | 25% | 9,2 | 0,7 | 5,6 | sim |
| Light Rod Stand | 3 | ★2 | Únicos | Vira Light Rod Stand | 44% | 1092 | 25% | 10,7 | 0,5 | 5,4 | sim |
| Civil War | 3 | ★2 | Atirador | Vira Civil War | 39% | 1156 | 19% | 9,2 | 0,7 | 2,8 | sim |
| Mercy | 4 | ★1 | Anjo | Pó de Fada | 71% | 1192 | 59% | 8,6 | 1,1 | 2,7 |  |
| Agumon Hakase | 4 | ★1 | Criaturinha Bizarra | (só ataca) | 70% | 862 | 3% | – | 0,0 | – |  |
| Terriermon | 4 | ★1 | Vento | (só ataca) | 68% | 984 | 23% | – | 0,0 | – |  |
| Labrynth Cooclock | 4 | ★1 | Temporais | Parar o Tempo | 66% | 1342 | 60% | 9,8 | 0,9 | 0,8 |  |
| Tynamo | 4 | ★1 | Raio | (só ataca) | 65% | 1435 | 57% | – | 0,0 | – |  |
| Heavy Machinery | 4 | ★1 | Robô | Bateria de Mísseis | 64% | 893 | 4% | 7,8 | 1,0 | 3,3 |  |
| Tyrant of the Tides | 4 | ★1 | Dragão | Sopro de Dragão | 63% | 993 | 23% | 8,6 | 0,9 | 2,3 |  |
| Red-Eyes Black Dragon | 4 | ★1 | Dragão | Sopro de Dragão | 62% | 993 | 22% | 8,6 | 0,9 | 2,3 |  |
| Sojimaru Flying Beta Max | 4 | ★1 | Dragão | Bateria de Mísseis | 62% | 1010 | 28% | 7,7 | 1,1 | 3,0 |  |
| Winston | 4 | ★1 | Tanque | Muralha | 61% | 597 | 3% | 7,8 | 1,1 | 3,0 |  |
| Cyber Dragon Nova | 4 | ★1 | Dragão | Bateria de Mísseis | 59% | 1004 | 29% | 7,8 | 1,1 | 3,0 |  |
| Bastion | 4 | ★1 | Atirador | Tiro Perfurante | 59% | 1663 | 47% | 8,9 | 1,1 | 1,9 |  |
| Impmon | 4 | ★1 | Demoníacos | (só ataca) | 59% | 947 | 22% | – | 0,0 | – |  |
| D.Va | 4 | ★1 | Robô | Charme | 59% | 951 | 29% | 7,7 | 1,0 | 1,7 |  |
| Deino | 4 | ★1 | Demoníacos | (só ataca) | 57% | 831 | 2% | – | 0,0 | – |  |
| Volibear | 4 | ★1 | Tanque | Muralha | 57% | 596 | 3% | 7,8 | 1,1 | 3,0 |  |
| Twitch | 4 | ★1 | Atirador | Tiro Perfurante | 56% | 1666 | 44% | 8,9 | 1,1 | 1,9 |  |
| Gible | 4 | ★1 | Dragão | (só ataca) | 54% | 827 | 2% | – | 0,0 | – |  |
| Candmon | 4 | ★1 | Demoníacos | (só ataca) | 52% | 933 | 20% | – | 0,0 | – |  |
| Larvesta | 4 | ★1 | Fogo | (só ataca) | 50% | 901 | 21% | – | 0,0 | – |  |
| Mothman | 4 | ★1 | Criaturinha Bizarra | Coisa Esquisita | 50% | 797 | 6% | 7,8 | 1,0 | 2,2 |  |
| Beach Baller | 4 | ★1 | Criaturinha Bizarra | Coisa Esquisita | 50% | 796 | 3% | 7,8 | 1,1 | 2,1 |  |
| Kintoki-Douji | 4 | ★1 | Criaturinha Bizarra | Coisa Esquisita | 49% | 794 | 3% | 7,9 | 1,1 | 2,0 |  |
| Malzahar | 4 | ★1 | Demoníacos | Pacto Sombrio | 49% | 978 | 28% | 7,7 | 1,0 | 2,1 |  |
| Eevee | 4 | ★1 | Únicos | (só ataca) | 49% | 785 | 2% | – | 0,0 | – |  |
| Baal Zebul | 4 | ★1 | Demoníacos | Pacto Sombrio | 48% | 977 | 28% | 7,7 | 1,0 | 2,1 |  |
| Angel | 4 | ★1 | Anjo | Luz Divina | 46% | 1394 | 32% | 9,7 | 0,9 | 2,6 |  |
| Buneary | 4 | ★1 | Safada | (só ataca) | 46% | 779 | 2% | – | 0,0 | – |  |
| Gragas | 4 | ★1 | Porradeiro | Pancadão | 45% | 841 | 1% | 7,8 | 0,9 | 2,5 |  |
| Dominion | 4 | ★1 | Anjo | Luz Divina | 45% | 1397 | 33% | 9,7 | 0,9 | 2,6 |  |
| Hanuman | 4 | ★1 | Porradeiro | Pancadão | 45% | 850 | 2% | 7,8 | 0,9 | 2,6 |  |
| Wailmer | 4 | ★1 | Água | (só ataca) | 45% | 781 | 2% | – | 0,0 | – |  |
| Vendetta | 4 | ★1 | Porradeiro | Pancadão | 45% | 840 | 1% | 7,8 | 0,9 | 2,6 |  |
| Swordsman of Landstar | 4 | ★1 | Porradeiro | Pancadão | 42% | 845 | 1% | 7,8 | 0,9 | 2,5 |  |
| Plotmon | 4 | ★1 | Fadinhas | (só ataca) | 39% | 746 | 0% | – | 0,0 | – |  |
| Pupitar | 4 | ★1 | Terra | (só ataca) | 39% | 756 | 1% | – | 0,0 | – |  |
| Kassadin | 4 | ★1 | Assassino | Golpe Fatal | 38% | 801 | 2% | 5,1 | 1,4 | 2,2 |  |
| Armageddon Knight | 4 | ★1 | Assassino | Golpe Fatal | 36% | 793 | 3% | 5,1 | 1,4 | 2,2 |  |
| Drifter | 4 | ★1 | Assassino | Golpe Fatal | 35% | 792 | 3% | 5,1 | 1,4 | 2,2 |  |
| Clockwork Knight | 4 | ★1 | Temporais | Parar o Tempo | 35% | 679 | 2% | 8,5 | 0,8 | 0,8 |  |
| Rem | 4 | ★1 | Fadinhas | Coisa Esquisita | 34% | 1194 | 35% | 8,7 | 1,1 | 1,4 |  |
| Aatrox | 4 | ★1 | Demoníacos | Pacto Sombrio | 26% | 803 | 2% | 7,8 | 1,0 | 2,2 |  |
| Abrams | 4 | ★1 | Tanque | Pacto Sombrio | 26% | 645 | 1% | 7,8 | 1,0 | 2,1 |  |
| Apollo | 4 | ★1 | Assassino | Pacto Sombrio | 24% | 871 | 12% | 6,2 | 1,0 | 1,9 |  |
| Crazy Diamond | 4 | ★1 | Porradeiro | Vira Crazy Diamond | 63% | 789 | 17% | 8,0 | 1,0 | 3,4 | sim |
| November Rain | 4 | ★1 | Criaturinha Bizarra | Vira November Rain | 60% | 912 | 20% | 9,1 | 0,8 | 2,6 | sim |
| Harvest | 4 | ★1 | Criaturinha Bizarra | Vira Harvest | 53% | 886 | 23% | 9,0 | 0,9 | 2,2 | sim |
| Soft & Wet | 4 | ★1 | Porradeiro | Vira Soft & Wet | 50% | 783 | 27% | 8,0 | 0,9 | 1,3 | sim |
| Star Platinum | 4 | ★1 | Porradeiro | Vira Star Platinum | 40% | 752 | 17% | 10,8 | 0,5 | 1,7 | sim |
| The Hand | 4 | ★1 | Porradeiro | Vira The Hand | 33% | 852 | 17% | 8,0 | 0,9 | 2,9 | sim |
| Numemon | 4 | ★2 | Criaturinha Bizarra | (só ataca) | 93% | 2071 | 16% | – | 0,0 | – |  |
| Tailmon | 4 | ★2 | Gelo | (só ataca) | 84% | 1893 | 9% | – | 0,0 | – |  |
| Wizarmon | 4 | ★2 | Demoníacos | (só ataca) | 81% | 2151 | 33% | – | 0,0 | – |  |
| Bakemon | 4 | ★2 | Demoníacos | (só ataca) | 79% | 2166 | 34% | – | 0,0 | – |  |
| Wailord | 4 | ★2 | Tanque | (só ataca) | 74% | 1464 | 8% | – | 0,0 | – |  |
| Zweilous | 4 | ★2 | Demoníacos | (só ataca) | 68% | 1760 | 6% | – | 0,0 | – |  |
| Tyranitar | 4 | ★2 | Tanque | (só ataca) | 67% | 1459 | 7% | – | 0,0 | – |  |
| Gabite | 4 | ★2 | Dragão | (só ataca) | 67% | 1760 | 6% | – | 0,0 | – |  |
| Heavy Machinery | 4 | ★2 | Robô | Bateria de Mísseis | 64% | 1819 | 10% | 8,1 | 1,1 | 4,4 |  |
| Galgomon | 4 | ★2 | Atirador | (só ataca) | 64% | 3069 | 94% | – | 0,0 | – |  |
| Lopunny | 4 | ★2 | Safada | (só ataca) | 62% | 1665 | 4% | – | 0,0 | – |  |
| Labrynth Cooclock | 4 | ★2 | Temporais | Parar o Tempo | 54% | 2305 | 72% | 9,9 | 0,9 | 1,2 |  |
| Eelektrik | 4 | ★2 | Raio | (só ataca) | 54% | 2573 | 76% | – | 0,0 | – |  |
| Jolteon | 4 | ★2 | Raio | (só ataca) | 53% | 2562 | 74% | – | 0,0 | – |  |
| Volcarona | 4 | ★2 | Fogo | (só ataca) | 52% | 1830 | 27% | – | 0,0 | – |  |
| Kamui | 4 | ★2 | Criaturinha Bizarra | Coisa Esquisita | 51% | 1541 | 16% | 8,1 | 1,1 | 3,0 |  |
| Volibear | 4 | ★2 | Tanque | Muralha | 51% | 1117 | 18% | 8,2 | 1,1 | 4,1 |  |
| Sojimaru Flying Beta Max | 4 | ★2 | Dragão | Bateria de Mísseis | 50% | 1981 | 29% | 8,1 | 1,1 | 4,2 |  |
| Basket Case | 4 | ★2 | Criaturinha Bizarra | Coisa Esquisita | 50% | 1570 | 17% | 8,1 | 1,1 | 3,1 |  |
| Sandalphon | 4 | ★2 | Anjo | Luz Divina | 50% | 2676 | 47% | 9,9 | 1,0 | 4,1 |  |
| Mercy | 4 | ★2 | Anjo | Pó de Fada | 49% | 1886 | 76% | 8,7 | 1,1 | 3,5 |  |
| Cyber Dragon Nova | 4 | ★2 | Dragão | Bateria de Mísseis | 48% | 1987 | 29% | 8,1 | 1,1 | 4,2 |  |
| Winston | 4 | ★2 | Tanque | Muralha | 48% | 1120 | 16% | 8,2 | 1,1 | 4,1 |  |
| Vendetta | 4 | ★2 | Porradeiro | Pancadão | 47% | 1679 | 5% | 8,1 | 1,0 | 3,3 |  |
| Camael | 4 | ★2 | Anjo | Luz Divina | 46% | 2675 | 49% | 9,9 | 0,9 | 4,2 |  |
| Twitch | 4 | ★2 | Atirador | Tiro Perfurante | 45% | 3023 | 59% | 8,9 | 1,0 | 2,9 |  |
| Bastion | 4 | ★2 | Atirador | Tiro Perfurante | 45% | 3045 | 62% | 8,9 | 1,0 | 2,9 |  |
| Seiten Taisei | 4 | ★2 | Porradeiro | Pancadão | 43% | 1696 | 6% | 8,1 | 1,0 | 3,4 |  |
| Red-Eyes Black Dragon | 4 | ★2 | Dragão | Sopro de Dragão | 43% | 1949 | 24% | 9,1 | 0,9 | 3,5 |  |
| Baal | 4 | ★2 | Demoníacos | Pacto Sombrio | 43% | 1953 | 30% | 8,1 | 1,0 | 3,2 |  |
| Swordsman of Landstar | 4 | ★2 | Porradeiro | Pancadão | 43% | 1705 | 6% | 8,1 | 1,0 | 3,4 |  |
| D.Va | 4 | ★2 | Robô | Charme | 43% | 1808 | 27% | 8,1 | 1,0 | 2,5 |  |
| Tyrant of the Tides | 4 | ★2 | Dragão | Sopro de Dragão | 42% | 1954 | 23% | 9,1 | 0,9 | 3,6 |  |
| Malzahar | 4 | ★2 | Demoníacos | Pacto Sombrio | 42% | 1917 | 29% | 8,1 | 1,0 | 3,1 |  |
| Gragas | 4 | ★2 | Porradeiro | Pancadão | 39% | 1673 | 7% | 8,1 | 1,0 | 3,3 |  |
| Drifter | 4 | ★2 | Assassino | Golpe Fatal | 33% | 1613 | 0% | 5,6 | 1,6 | 3,1 |  |
| Kassadin | 4 | ★2 | Assassino | Golpe Fatal | 32% | 1595 | 0% | 5,6 | 1,5 | 3,1 |  |
| Armageddon Knight | 4 | ★2 | Assassino | Golpe Fatal | 32% | 1576 | 0% | 5,6 | 1,5 | 3,0 |  |
| Loup-garou | 4 | ★2 | Assassino | Golpe Fatal | 31% | 1590 | 2% | 5,6 | 1,5 | 3,1 |  |
| Apollo | 4 | ★2 | Assassino | Pacto Sombrio | 31% | 1825 | 16% | 6,3 | 1,1 | 2,8 |  |
| Aatrox | 4 | ★2 | Demoníacos | Pacto Sombrio | 30% | 1642 | 5% | 8,1 | 1,0 | 3,1 |  |
| Rem | 4 | ★2 | Fadinhas | Coisa Esquisita | 27% | 2010 | 53% | 8,7 | 1,1 | 2,1 |  |
| Clockwork Knight | 4 | ★2 | Temporais | Parar o Tempo | 26% | 1290 | 2% | 9,0 | 0,8 | 1,1 |  |
| Abrams | 4 | ★2 | Tanque | Pacto Sombrio | 24% | 1316 | 2% | 8,2 | 1,0 | 3,1 |  |
| Star Platinum | 4 | ★2 | Porradeiro | Vira Star Platinum | 57% | 1543 | 27% | 11,4 | 0,6 | 2,6 | sim |
| Crazy Diamond | 4 | ★2 | Porradeiro | Vira Crazy Diamond | 57% | 1425 | 20% | 8,4 | 0,9 | 5,1 | sim |
| Soft & Wet | 4 | ★2 | Porradeiro | Vira Soft & Wet | 53% | 1517 | 37% | 8,3 | 0,9 | 1,8 | sim |
| Harvest | 4 | ★2 | Criaturinha Bizarra | Vira Harvest | 50% | 1574 | 27% | 9,2 | 0,8 | 3,1 | sim |
| November Rain | 4 | ★2 | Criaturinha Bizarra | Vira November Rain | 50% | 1707 | 33% | 9,2 | 0,8 | 3,5 | sim |
| The Hand | 4 | ★2 | Porradeiro | Vira The Hand | 33% | 1687 | 17% | 8,3 | 0,9 | 4,3 | sim |
| Magearna | 5 | ★1 | Fadinhas | Vira Mega Magearna | 70% | 1803 | 66% | 9,3 | 0,4 | 0,0 |  |
| Zoe | 5 | ★1 | Anjo | Pó de Fada | 68% | 1385 | 65% | 8,3 | 1,2 | 2,7 |  |
| Nami | 5 | ★1 | Fadinhas | Pó de Fada | 67% | 1340 | 66% | 8,3 | 1,2 | 2,9 |  |
| Timestar Magician | 5 | ★1 | Temporais | Parar o Tempo | 65% | 1587 | 57% | 9,3 | 1,0 | 0,7 |  |
| Zygarde (10%) | 5 | ★1 | Vento | (só ataca) | 64% | 1011 | 1% | – | 0,0 | – |  |
| Darkrai | 5 | ★1 | Demoníacos | Vira Mega Darkrai | 63% | 1158 | 34% | 8,3 | 0,6 | 0,0 |  |
| Blitzcrank | 5 | ★1 | Robô | Bateria de Mísseis | 61% | 1016 | 3% | 7,5 | 1,1 | 3,1 |  |
| Toy Agumon | 5 | ★1 | Criaturinha Bizarra | (só ataca) | 61% | 985 | 1% | – | 0,0 | – |  |
| Seven | 5 | ★1 | Robô | Bateria de Mísseis | 60% | 1155 | 30% | 7,5 | 1,1 | 2,9 |  |
| Legendary Excavators ft. Lam-chan & Lun-chan | 5 | ★1 | Robô | Bateria de Mísseis | 60% | 1015 | 4% | 7,5 | 1,1 | 3,1 |  |
| Slifer the Sky Dragon | 5 | ★1 | Dragão | Sopro de Dragão | 56% | 1204 | 23% | 8,4 | 0,9 | 2,4 |  |
| Blessed Leviathan | 5 | ★1 | Dragão | Sopro de Dragão | 54% | 1186 | 18% | 8,3 | 0,9 | 2,4 |  |
| The Winged Dragon of Ra | 5 | ★1 | Dragão | Sopro de Dragão | 53% | 1194 | 22% | 8,3 | 0,9 | 2,4 |  |
| Echo | 5 | ★1 | Robô | Bateria de Mísseis | 53% | 1181 | 29% | 7,5 | 1,1 | 2,9 |  |
| Obelisk the Tormentor | 5 | ★1 | Tanque | Muralha | 52% | 667 | 1% | 7,5 | 1,2 | 3,0 |  |
| Mauga | 5 | ★1 | Tanque | Muralha | 50% | 666 | 1% | 7,5 | 1,2 | 3,0 |  |
| Blue-Eyes White Dragon | 5 | ★1 | Dragão | Sopro de Dragão | 49% | 1173 | 21% | 8,3 | 0,9 | 2,4 |  |
| Dunsparce | 5 | ★1 | Dragão | (só ataca) | 48% | 963 | 2% | – | 0,0 | – |  |
| Orpheus Picaro | 5 | ★1 | Anjo | Luz Divina | 48% | 1616 | 38% | 9,3 | 1,0 | 2,4 |  |
| Sojimaru v2.1 | 5 | ★1 | Robô | Pacto Sombrio | 48% | 1155 | 28% | 7,5 | 1,1 | 2,1 |  |
| The Doorman | 5 | ★1 | Anjo | Luz Divina | 46% | 1618 | 34% | 9,4 | 1,0 | 2,4 |  |
| Fiddlesticks | 5 | ★1 | Demoníacos | Pacto Sombrio | 44% | 1183 | 30% | 7,5 | 1,1 | 2,1 |  |
| Ramattra | 5 | ★1 | Robô | Pacto Sombrio | 44% | 1167 | 28% | 7,5 | 1,1 | 2,1 |  |
| Daemon | 5 | ★1 | Demoníacos | Pacto Sombrio | 44% | 1173 | 28% | 7,5 | 1,1 | 2,1 |  |
| Maria | 5 | ★1 | Anjo | Luz Divina | 44% | 1595 | 34% | 9,3 | 1,0 | 2,5 |  |
| Arsène | 5 | ★1 | Demoníacos | Pacto Sombrio | 44% | 1150 | 29% | 7,4 | 1,1 | 2,1 |  |
| Cupimon | 5 | ★1 | Anjo | (só ataca) | 43% | 1586 | 28% | – | 0,0 | – |  |
| Cosmog | 5 | ★1 | Fadinhas | (só ataca) | 40% | 1521 | 29% | – | 0,0 | – |  |
| Mara | 5 | ★1 | Safada | Charme | 39% | 1064 | 22% | 7,4 | 1,1 | 1,6 |  |
| Incubus | 5 | ★1 | Safada | Pacto Sombrio | 38% | 1117 | 24% | 7,5 | 1,1 | 2,1 |  |
| Vel'Koz | 5 | ★1 | Únicos | Vira Vel'Koz | 37% | 1117 | 15% | 8,9 | 0,9 | 3,0 |  |
| Mew | 5 | ★1 | Fadinhas | (só ataca) | 37% | 1541 | 27% | – | 0,0 | – |  |
| Mei | 5 | ★1 | Safada | Charme | 36% | 1052 | 22% | 7,4 | 1,1 | 1,6 |  |
| Izanagi | 5 | ★1 | Assassino | Golpe Fatal | 32% | 908 | 2% | 4,8 | 1,5 | 1,9 |  |
| Mina | 5 | ★1 | Safada | Charme | 32% | 1045 | 21% | 7,4 | 1,1 | 1,6 |  |
| Gold Experience | 5 | ★1 | Temporais | Vira Gold Experience | 63% | 545 | 8% | 7,8 | 0,8 | 1,1 | sim |
| Scary Monsters | 5 | ★1 | Criaturinha Bizarra | Vira Scary Monsters | 58% | 631 | 13% | 8,8 | 0,7 | 2,0 | sim |
| Wonder of U | 5 | ★1 | Demoníacos | Vira Wonder of U | 46% | 757 | 8% | 10,2 | 0,5 | 2,5 | sim |
| Dirty Deeds Done Dirt Cheap | 5 | ★1 | Porradeiro | Vira Dirty Deeds Done Dirt Cheap | 42% | 562 | 0% | 8,4 | 0,7 | 1,2 | sim |
| Whitesnake | 5 | ★1 | Porradeiro | Vira Whitesnake | 42% | 569 | 8% | 8,4 | 0,7 | 0,9 | sim |
| Dudunsparce | 5 | ★2 | Dragão | (só ataca) | 72% | 2008 | 3% | – | 0,0 | – |  |
| Revolmon | 5 | ★2 | Atirador | (só ataca) | 71% | 3646 | 88% | – | 0,0 | – |  |
| Blitzcrank | 5 | ★2 | Robô | Bateria de Mísseis | 68% | 2069 | 6% | 7,9 | 1,1 | 4,2 |  |
| Legendary Excavators ft. Lam-chan & Lun-chan | 5 | ★2 | Robô | Bateria de Mísseis | 64% | 2092 | 9% | 7,9 | 1,1 | 4,2 |  |
| Zygarde (50%) | 5 | ★2 | Dragão | (só ataca) | 63% | 2264 | 28% | – | 0,0 | – |  |
| Timestar Magician | 5 | ★2 | Temporais | Parar o Tempo | 62% | 2698 | 72% | 9,4 | 1,0 | 1,1 |  |
| Lucemon | 5 | ★2 | Anjo | (só ataca) | 60% | 3176 | 73% | – | 0,0 | – |  |
| Zoe | 5 | ★2 | Anjo | Pó de Fada | 57% | 2239 | 78% | 8,3 | 1,2 | 3,4 |  |
| Echo | 5 | ★2 | Robô | Bateria de Mísseis | 53% | 2271 | 28% | 7,8 | 1,2 | 4,0 |  |
| Darkrai | 5 | ★2 | Demoníacos | Vira Mega Darkrai | 52% | 2187 | 28% | 8,6 | 0,5 | 0,0 |  |
| Izanagi-no-Okami | 5 | ★2 | Assassino | Golpe Fatal | 52% | 1927 | 0% | 5,2 | 1,7 | 3,0 |  |
| Sojimaru v2.1 | 5 | ★2 | Robô | Pacto Sombrio | 51% | 2311 | 32% | 7,9 | 1,1 | 3,1 |  |
| Mauga | 5 | ★2 | Tanque | Muralha | 51% | 1222 | 16% | 8,0 | 1,2 | 4,0 |  |
| Slifer the Sky Dragon | 5 | ★2 | Dragão | Sopro de Dragão | 50% | 2304 | 23% | 8,7 | 0,9 | 3,4 |  |
| Seven | 5 | ★2 | Robô | Bateria de Mísseis | 50% | 2317 | 32% | 7,9 | 1,2 | 3,9 |  |
| Blessed Leviathan | 5 | ★2 | Dragão | Sopro de Dragão | 50% | 2330 | 24% | 8,7 | 0,9 | 3,4 |  |
| The Winged Dragon of Ra | 5 | ★2 | Dragão | Sopro de Dragão | 49% | 2321 | 21% | 8,7 | 0,9 | 3,4 |  |
| Blue-Eyes White Dragon | 5 | ★2 | Dragão | Sopro de Dragão | 49% | 2365 | 26% | 8,7 | 0,9 | 3,4 |  |
| Magearna | 5 | ★2 | Fadinhas | Vira Mega Magearna | 49% | 3011 | 76% | 9,4 | 0,4 | 0,0 |  |
| Nami | 5 | ★2 | Fadinhas | Pó de Fada | 49% | 2147 | 83% | 8,3 | 1,2 | 3,7 |  |
| Satanael | 5 | ★2 | Demoníacos | Pacto Sombrio | 46% | 2307 | 29% | 7,8 | 1,1 | 3,0 |  |
| Obelisk the Tormentor | 5 | ★2 | Tanque | Muralha | 46% | 1211 | 15% | 7,9 | 1,2 | 4,0 |  |
| Lucifer | 5 | ★2 | Demoníacos | Pacto Sombrio | 46% | 2350 | 34% | 7,8 | 1,1 | 3,0 |  |
| Ramattra | 5 | ★2 | Robô | Pacto Sombrio | 46% | 2237 | 28% | 7,9 | 1,1 | 3,1 |  |
| The Doorman | 5 | ★2 | Anjo | Luz Divina | 46% | 3066 | 47% | 9,4 | 1,0 | 3,9 |  |
| Maria | 5 | ★2 | Anjo | Luz Divina | 45% | 3048 | 49% | 9,4 | 1,0 | 3,8 |  |
| Fiddlesticks | 5 | ★2 | Demoníacos | Pacto Sombrio | 43% | 2280 | 29% | 7,8 | 1,1 | 3,0 |  |
| Mewtwo | 5 | ★2 | Únicos | (só ataca) | 43% | 2095 | 21% | – | 0,0 | – |  |
| Belial | 5 | ★2 | Demoníacos | Pacto Sombrio | 42% | 2276 | 30% | 7,8 | 1,1 | 3,1 |  |
| Vel'Koz | 5 | ★2 | Únicos | Vira Vel'Koz | 42% | 2242 | 16% | 9,4 | 0,8 | 4,9 |  |
| Thanatos | 5 | ★2 | Demoníacos | Pacto Sombrio | 41% | 2226 | 25% | 7,8 | 1,1 | 3,1 |  |
| Cosmoem | 5 | ★2 | Fadinhas | (só ataca) | 38% | 2831 | 66% | – | 0,0 | – |  |
| Arioch | 5 | ★2 | Safada | Pacto Sombrio | 37% | 2167 | 27% | 7,8 | 1,0 | 3,1 |  |
| Mei | 5 | ★2 | Safada | Charme | 35% | 2001 | 18% | 7,7 | 1,1 | 2,3 |  |
| Mina | 5 | ★2 | Safada | Charme | 33% | 2045 | 21% | 7,8 | 1,0 | 2,3 |  |
| The World (Steel Ball Run) | 5 | ★2 | Porradeiro | Vira The World (Steel Ball Run) | 75% | 1291 | 17% | 10,8 | 0,5 | 2,5 | sim |
| Gold Experience Requiem | 5 | ★2 | Temporais | Vira Gold Experience Requiem | 50% | 881 | 0% | 9,9 | 0,6 | 0,5 | sim |
| Dirty Deeds Done Dirt Cheap | 5 | ★2 | Porradeiro | Vira Dirty Deeds Done Dirt Cheap | 48% | 1104 | 4% | 9,5 | 0,6 | 2,0 | sim |
| C-MOON | 5 | ★2 | Porradeiro | Vira C-MOON | 48% | 1136 | 4% | 9,5 | 0,7 | 2,1 | sim |
| Wonder of U | 5 | ★2 | Demoníacos | Vira Wonder of U | 29% | 1328 | 13% | 10,2 | 0,5 | 4,1 | sim |

</details>

## Habilidades

Ult de classe pela média de quem a usa como padrão (todas as estrelas e custos medidos):

| Ult | Classe | Campeões (★1 e ★2) | Vitórias (média) | Valor/lanç. (mediana) | Lanç./10 s |
|---|---|---|---|---|---|
| Corrente Elétrica | Raio | 1 | 67% | 2,24 | 0,8 |
| Bateria de Mísseis | Robô | 26 | 59% | 3,95 | 1,1 |
| Jato d'Água | Água | 2 | 53% | 4,15 | 1,0 |
| Muralha | Tanque | 27 | 52% | 3,86 | 1,0 |
| Sopro de Dragão | Dragão | 21 | 51% | 2,65 | 0,9 |
| Pó de Fada | Fadinhas | 44 | 50% | 3,25 | 1,0 |
| Tiro Perfurante | Atirador | 27 | 48% | 2,15 | 0,9 |
| Parar o Tempo | Temporais | 18 | 46% | 1,01 | 0,8 |
| Luz Divina | Anjo | 16 | 45% | 3,22 | 0,9 |
| Coisa Esquisita | Criaturinha Bizarra | 25 | 44% | 2,30 | 1,0 |
| Pancadão | Porradeiro | 21 | 44% | 3,32 | 0,9 |
| Pacto Sombrio | Demoníacos | 37 | 41% | 2,99 | 1,0 |
| Golpe Fatal | Assassino | 18 | 41% | 3,01 | 1,5 |
| Tornado | Vento | 8 | 38% | 2,36 | 0,9 |
| Charme | Safada | 26 | 36% | 2,31 | 1,0 |
| Bola de Fogo | Fogo | 1 | 33% | 1,99 | 0,8 |

Valor por lançamento (em múltiplos do dano de ataque) mais de 2,0× acima ou abaixo da mediana do custo e estrela (transformações fora). Abaixo nem sempre é fraco: controle (atordoar, provocar) e buff não entram no valor; olhe as vitórias.

| Campeão | Custo | ★ | Habilidade | Valor/lanç. | Mediana do grupo | Onde | Vitórias |
|---|---|---|---|---|---|---|---|
| Himiko | 2 | ★1 | Parar o Tempo | 0,89 | 2,59 | abaixo | 56% |
| Time Thief Redoer | 2 | ★1 | Parar o Tempo | 0,89 | 2,59 | abaixo | 54% |
| Time Wizard | 2 | ★1 | Parar o Tempo | 0,89 | 2,59 | abaixo | 49% |
| Zilean | 2 | ★1 | Parar o Tempo | 0,88 | 2,59 | abaixo | 52% |
| Vyper | 2 | ★1 | Coisa Esquisita | 1,23 | 2,59 | abaixo | 34% |
| Kanzeon | 2 | ★2 | Parar o Tempo | 1,42 | 3,72 | abaixo | 38% |
| Time Thief Redoer | 2 | ★2 | Parar o Tempo | 1,42 | 3,72 | abaixo | 37% |
| Time Wizard | 2 | ★2 | Parar o Tempo | 1,43 | 3,72 | abaixo | 38% |
| Zilean | 2 | ★2 | Parar o Tempo | 1,41 | 3,72 | abaixo | 38% |
| Vyper | 2 | ★2 | Coisa Esquisita | 1,62 | 3,72 | abaixo | 21% |
| Michion, the Timelord | 3 | ★1 | Parar o Tempo | 0,83 | 2,54 | abaixo | 55% |
| Ekko | 3 | ★1 | Parar o Tempo | 0,87 | 2,54 | abaixo | 33% |
| Michion, the Timelord | 3 | ★2 | Parar o Tempo | 1,30 | 3,69 | abaixo | 47% |
| Ekko | 3 | ★2 | Parar o Tempo | 1,24 | 3,69 | abaixo | 27% |
| Clockwork Knight | 4 | ★1 | Parar o Tempo | 0,80 | 2,23 | abaixo | 35% |
| Labrynth Cooclock | 4 | ★1 | Parar o Tempo | 0,76 | 2,23 | abaixo | 66% |
| Clockwork Knight | 4 | ★2 | Parar o Tempo | 1,12 | 3,14 | abaixo | 26% |
| Labrynth Cooclock | 4 | ★2 | Parar o Tempo | 1,19 | 3,14 | abaixo | 54% |
| Timestar Magician | 5 | ★1 | Parar o Tempo | 0,72 | 2,39 | abaixo | 65% |
| Timestar Magician | 5 | ★2 | Parar o Tempo | 1,12 | 3,36 | abaixo | 62% |

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

### Classes

| Traço | Degraus | Degrau 1 | Degrau 2 | Degrau 3 | Degrau 4 | Degrau 5 | Degrau 6 |
|---|---|---|---|---|---|---|---|
| Tanque | 2/3/4/6/8 | +3% | +3% | +12% | +23% | +28% | – |
| Porradeiro | 2/3/4/6/8/10 | +3% | +8% | +11% | +20% | +25% | +33% |
| Assassino | 2/3/4/5/6 | +3% | +6% | +9% | +14% | +23% | – |
| Demoníacos | 2/3/4/6/8/10 | +3% | +8% | +17% | +30% | +44% | +62% |
| Criaturinha Bizarra | 3/4/5/7/9/10 | +6% | +8% | +12% | +33% | +40% | +47% |
| Fadinhas | 2/3/4/6/8/10 | +6% | +12% | +14% | +26% | +34% | +44% |
| Safada | 3/4/5/7/9/10 | +8% | +9% | +14% | +17% | +23% | +25% |
| Atirador | 2/3/4/5/7 | +8% | +12% | +20% | +22% | +30% | – |
| Anjo | 2/3/4/5/6 | +5% | +3% | +11% | +14% | +19% | – |
| Robô | 2/3/4/5/6 | +5% | +8% | +12% | +17% | +22% | – |
| Dragão | 2/3/4/5/7 | +5% | +11% | +14% | +20% | +33% | – |
| Temporais | 2/3/4/5 | +6% | +8% | +9% | +22% | – | – |
| **Mediana** |  | +5% | +8% | +12% | +21% | +28% | +44% |

Todos perto da mediana do degrau.

### Elementos

| Traço | Degraus | Degrau 1 | Degrau 2 | Degrau 3 | Degrau 4 | Degrau 5 |
|---|---|---|---|---|---|---|
| Fogo | 2/3/4/5/6 | +6% | +14% | +20% | +25% | +26% |
| Água | 2/3/4/5/6 | +5% | +9% | +19% | +22% | +25% |
| Terra | 2/3/4 | +3% | +5% | +12% | – | – |
| Vento | 2/3/4/5/6 | +5% | +14% | +25% | +33% | +36% |
| Raio | 2/3/4/5 | +3% | +8% | +22% | +31% | – |
| Gelo | 2/3/4 | +5% | +8% | +11% | – | – |
| Planta | 2/3/4/5 | +6% | +11% | +22% | +30% | – |
| **Mediana** |  | +5% | +9% | +20% | +30% | +26% |

Todos perto da mediana do degrau.

### Origens

| Traço | Degraus | Degrau 1 | Degrau 2 | Degrau 3 | Degrau 4 | Degrau 5 | Degrau 6 |
|---|---|---|---|---|---|---|---|
| Pokémon | 2/4/6/8/9/10 | +1% | +5% | +9% | +15% | +22% | +30% |
| Digimon | 2/3/4/5/6 | +3% | +5% | +8% | +12% | +14% | – |
| SMT | 2/3/4/6/8 | +5% | +6% | +11% | +15% | +19% | – |
| Persona | 1/2/3/4/5 | 0% | +1% | +3% | +8% | +11% | – |
| JoJo | 2/3/4/5/6/8 | +6% | +9% | +12% | +17% | +17% | +30% |
| Yu-Gi-Oh! | 2/3/5/7/9/10 | +1% | +5% | +8% | +26% | +36% | +45% |
| LoL | 2/3/5/7/9/10 | 0% | +3% | +3% | +8% | +9% | +11% |
| Overwatch | 2/3/4/5/7 | +3% | +3% | +6% | +9% | +15% | – |
| Deadlock | 2/3/4/5/6 | 0% | 0% | 0% | 0% | 0% | – |
| Sujimon | 2/3/4/5/6 | +5% | +9% | +14% | +22% | +31% | – |



## Origens

Time cheio de cada origem contra os times cheios das outras (20 cenários por par, dos dois lados), com os custos da loja daquele nível e os traços valendo. JoJo: usuários de outras origens mais os Stands que a regra deixa. Digimon: um terço do time de fora, pro Parceiro. Overwatch, Deadlock e Sujimon agem também fora da luta, e isso não entra aqui. Sem itens.

| Origem | 4 no tabuleiro, ★1 | 6 no tabuleiro, ★2 | 8 no tabuleiro, ★2 | 10 no tabuleiro, ★2 | 10 no tabuleiro, ★3 |
|---|---|---|---|---|---|
| Pokémon | 53% | 48% | 38% | 56% | 59% |
| Digimon | 39% | 46% | 40% | 41% | 46% |
| SMT | 69% | 61% | 63% | 54% | 48% |
| Persona | 36% | 44% | 43% | 49% | 54% |
| JoJo | 49% | 59% | 50% | 49% | 48% |
| Yu-Gi-Oh! | 52% | 44% | 78% | 98% | 95% |
| LoL | 36% | 33% | 35% | 30% | 53% |
| Overwatch | 55% | 50% | 55% | 40% | 22% |
| Deadlock | 32% | 26% | 20% | 5% | 3% |
| Sujimon | 80% | 89% | 79% | 78% | 73% |

### Quanto vale evoluir

Os mesmos campeões numa estrela a mais: bônus de vida e dano no time da estrela de baixo que empata (40 cenários, tabuleiro de 6). Pokémon, Digimon, SMT, Persona e Sujimon: só as linhas evolutivas.

| Origem | ★1 → ★2 | ★2 → ★3 |
|---|---|---|
| Pokémon (linhas) | +91% | +91% |
| Digimon (linhas) | +97% | +84% |
| SMT (linhas) | +66% | +84% |
| Persona (linhas) | +78% | +91% |
| Yu-Gi-Oh! | +84% | +84% |
| LoL | +72% | +97% |
| Overwatch | +72% | +78% |
| Deadlock | +72% | +78% |
| Sujimon (linhas) | +109% | +109% |

## Stands

Quanto valem k Stands em cima de um time cheio (★2, 40 cenários): o bônus de vida e dano no time sem Stands que empata.

| Tabuleiro | 1 Stand | 2 Stands | 3 Stands | 5 Stands | 8 Stands |
|---|---|---|---|---|---|
| 4 | +14% | +34% | +54% | – | – |
| 6 | +11% | +24% | +37% | +74% | – |
| 8 | +8% | +18% | +28% | +51% | +103% |
| 10 | +8% | +11% | +21% | +41% | +74% |

### Regras dos Stands comparadas

Cada regra medida com o time cheio de JoJo contra as outras origens (vitórias) e com 48 partidas de bots. "Colocação" é a média de quem mais usou JoJo do estágio 3 em diante (média geral: 4,5). "Em campo" é a média, nos níveis 8 ou mais.

| Regra | JoJo, 4 ★1 | JoJo, 6 ★2 | JoJo, 8 ★2 | JoJo, 10 ★2 | JoJo, 10 ★3 | Colocação | Jogadores | Geral | Em campo | Stands | Máximo |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Sem limite (o pedido original) | 99% | 100% | 99% | 100% | 97% | 2,60 | 65 | 4,50 | 10,4 | 2,3 | 18 |
| Todo Stand ocupa vaga | 8% | 12% | 11% | 13% | 13% | 7,53 | 15 | 4,50 | 8,2 | 0,2 | 9 |
| Até 1 fora da vaga | 49% | 35% | 28% | 19% | 23% | 6,13 | 16 | 4,50 | 8,8 | 0,8 | 10 |
| Até 2 fora da vaga | 80% | 59% | 50% | 34% | 34% | 4,50 | 24 | 4,50 | 9,2 | 1,2 | 11 |
| Até 3 fora da vaga | 96% | 78% | 59% | 49% | 48% | 2,89 | 46 | 4,50 | 9,7 | 1,6 | 12 |
| Um fora da vaga a cada 3 níveis | 49% | 59% | 50% | 49% | 48% | 4,44 | 27 | 4,50 | 9,3 | 1,2 | 12 |
| Um fora da vaga a cada 4 níveis | 49% | 35% | 50% | 34% | 34% | 6,73 | 15 | 4,50 | 9,1 | 1,0 | 11 |
| Sem limite, Stand 40% mais fraco | 95% | 94% | 96% | 98% | 94% | 3,37 | 57 | 4,50 | 10,1 | 1,9 | 17 |

## Itens

Um portador sorteado (custo 2 a 4, ★2, sem Stands) com 3 bonecos; o outro lado é o mesmo time sem o item. "Vale" = bônus de vida e dano só no portador que empata (90 cenários). Em negrito: mais de 1,6× longe da mediana do grupo.

### Componentes (mediana +5%)

| Item | Id | Vitórias | Vale |
|---|---|---|---|
| Ventus | ventus | 73% | +7% |
| Pyrus | pyrus | 76% | +5% |
| Haos | haos | 69% | +5% |
| Subterra | subterra | 66% | +5% |
| Aurelus | aurelus | 71% | +5% |
| Darkus | darkus | 64% | +3% |
| Aquos | aquos | 57% | +1% |

### Completos (mediana +21%)

| Item | Id | Vitórias | Vale |
|---|---|---|---|
| Pyravian | pyrus+aurelus | 97% | +36% |
| Drago | pyrus+pyrus | 99% | +34% |
| Skyress | ventus+ventus | 98% | +34% |
| Falconeer | pyrus+ventus | 99% | +32% |
| Nobilious | aurelus+aurelus | 96% | +32% |
| Griffon | pyrus+haos | 99% | +30% |
| Saurus | pyrus+subterra | 99% | +28% |
| Tigrerra | haos+haos | 96% | +28% |
| Pegatrix X Aurelus | haos+aurelus | 97% | +28% |
| Gargonoid | darkus+ventus | 98% | +28% |
| Fear Ripper | pyrus+darkus | 97% | +27% |
| Monarus | haos+ventus | 98% | +27% |
| Hammersaur | haos+darkus | 96% | +25% |
| Jelldon | aquos+haos | 94% | +21% |
| Limulus | aquos+darkus | 88% | +21% |
| Gorem | subterra+subterra | 91% | +21% |
| Tayghen | aquos+ventus | 96% | +19% |
| Hydorous X Aurelus | aquos+aurelus | 92% | +19% |
| Hydranoid | darkus+darkus | 93% | +19% |
| Dragonoid X Darkus | darkus+aurelus | 91% | +19% |
| El Condor | subterra+ventus | 94% | +19% |
| Howlkor X Aurelus | ventus+aurelus | 95% | +18% |
| Preyas | aquos+aquos | 79% | +16% |
| Serpenoid | aquos+subterra | 93% | +16% |
| Hynoid | haos+subterra | 89% | +16% |
| Goreene | subterra+aurelus | 87% | +16% |
| Siege | pyrus+aquos | 87% | +14% |
| Wormquake | darkus+subterra | 88% | +14% |

Todos perto da mediana.

## Ouro no chão (passivas)

Regra: ao lançar a habilidade (50%) e no golpe que derruba um inimigo (50%), chance de derrubar 1 de ouro, até 2/3/4 por luta. Alvo: perto de 1 de ouro por luta por campeão desses. Rodízio = lutas da força por campeão; partidas = por unidade-luta nas partidas de bots (com dois no mesmo lado, o ouro do lado é dividido).

| Campeão | Passiva | Ouro/luta rodízio ★1 | ★2 | Lutas nas partidas | Ouro/luta partidas |
|---|---|---|---|---|---|
| Harvest | Achados | 0,80 | 1,03 | 20 | 0,71 |
| Pro Pickpocket | Mão Leve | 1,25 | 1,32 | 180 | 1,35 |
| Pseudotrash | Catador | 1,05 | 1,41 | 67 | 1,01 |
| Agumon Hakase | Ouro de Numemon | 0,90 | 1,49 | 44 | 0,77 |
| Rat King | Tesouro do Rei Rato | 0,90 | 1,15 | 429 | 0,86 |

## Partidas de bots

24 partidas de 8 bots (sementes 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24); duram 34,7 rodadas em média e acabam no estágio 6,0. 14% das lutas entre jogadores vão até os 30 s. As taxas misturam o efeito do traço/item com a força do tabuleiro de quem o tem (sinal, não medida isolada; essa é a das seções acima).

### Vitórias com o traço ativo (degrau mais alto atingido; 30 lutas ou mais)

| Traço | Degrau | Lutas | Vitórias |
|---|---|---|---|
| Deadlock | 6 | 56 | 98% |
| Yu-Gi-Oh! | 7 | 46 | 87% |
| Demoníacos | 2 | 87 | 82% |
| Gelo | 2 | 52 | 77% |
| Água | 5 | 35 | 74% |
| Sujimon | 6 | 31 | 74% |
| Água | 6 | 53 | 70% |
| Fogo | 4 | 73 | 67% |
| Vento | 2 | 45 | 67% |
| Robô | 2 | 48 | 67% |
| Criaturinha Bizarra | 7 | 92 | 66% |
| Digimon | 2 | 200 | 65% |
| Sujimon | 2 | 93 | 62% |
| Overwatch | 3 | 47 | 62% |
| Planta | 3 | 173 | 61% |
| Persona | 2 | 40 | 60% |
| Porradeiro | 3 | 62 | 60% |
| Criaturinha Bizarra | 3 | 170 | 59% |
| Yu-Gi-Oh! | 5 | 98 | 58% |
| Tanque | 2 | 232 | 58% |
| Criaturinha Bizarra | 5 | 269 | 58% |
| Água | 4 | 68 | 57% |
| Assassino | 3 | 83 | 57% |
| Atirador | 3 | 89 | 56% |
| Assassino | 4 | 59 | 56% |
| SMT | 4 | 34 | 56% |
| Planta | 4 | 45 | 56% |
| Atirador | 5 | 108 | 55% |
| Safada | 5 | 59 | 54% |
| Terra | 2 | 82 | 54% |
| Pokémon | 2 | 1005 | 54% |
| Assassino | 2 | 121 | 52% |
| JoJo | 2 | 641 | 52% |
| Porradeiro | 4 | 83 | 51% |
| Persona | 1 | 637 | 51% |
| SMT | 2 | 302 | 50% |
| SMT | 3 | 70 | 50% |
| Fadinhas | 3 | 120 | 50% |
| Fadinhas | 4 | 84 | 50% |
| Criaturinha Bizarra | 4 | 129 | 49% |
| Safada | 4 | 62 | 48% |
| Atirador | 4 | 75 | 48% |
| Fogo | 3 | 100 | 48% |
| Yu-Gi-Oh! | 3 | 167 | 47% |
| Deadlock | 2 | 120 | 47% |
| Pokémon | 8 | 82 | 45% |
| Fadinhas | 2 | 205 | 45% |
| Planta | 2 | 468 | 45% |
| Pokémon | 4 | 748 | 45% |
| Overwatch | 2 | 153 | 44% |
| Atirador | 2 | 194 | 44% |
| Sujimon | 4 | 32 | 44% |
| Porradeiro | 2 | 215 | 44% |
| Água | 2 | 387 | 43% |
| Dragão | 2 | 103 | 43% |
| Yu-Gi-Oh! | 2 | 82 | 43% |
| Água | 3 | 94 | 43% |
| Pokémon | 6 | 445 | 42% |
| Deadlock | 3 | 75 | 41% |
| LoL | 3 | 175 | 41% |
| Raio | 2 | 159 | 41% |
| JoJo | 3 | 64 | 41% |
| LoL | 5 | 74 | 41% |
| LoL | 2 | 162 | 40% |
| Fogo | 2 | 435 | 39% |
| Fadinhas | 6 | 49 | 37% |
| JoJo | 4 | 33 | 36% |
| Safada | 3 | 121 | 36% |

### Vitórias com o item em alguém do time (30 lutas ou mais)

| Item | Lutas | Vitórias |
|---|---|---|
| Preyas | 256 | 59% |
| Nobilious | 285 | 59% |
| Serpenoid | 350 | 59% |
| Pyravian | 507 | 59% |
| Dragonoid X Darkus | 585 | 58% |
| Hammersaur | 430 | 57% |
| Aquos | 706 | 57% |
| Tayghen | 605 | 56% |
| Hydorous X Aurelus | 434 | 56% |
| Tigrerra | 271 | 55% |
| Limulus | 344 | 53% |
| Gorem | 280 | 52% |
| Jelldon | 453 | 52% |
| Griffon | 460 | 52% |
| Skyress | 138 | 51% |
| Hynoid | 418 | 51% |
| Falconeer | 324 | 51% |
| Drago | 250 | 51% |
| Monarus | 444 | 51% |
| El Condor | 414 | 51% |
| Pegatrix X Aurelus | 379 | 51% |
| Gargonoid | 336 | 51% |
| Subterra | 752 | 50% |
| Pyrus | 611 | 50% |
| Saurus | 432 | 50% |
| Goreene | 377 | 50% |
| Wormquake | 473 | 49% |
| Siege | 386 | 49% |
| Ventus | 709 | 49% |
| Hydranoid | 251 | 48% |
| Fear Ripper | 372 | 47% |
| Howlkor X Aurelus | 441 | 46% |
| Aurelus | 620 | 45% |
| Haos | 637 | 45% |
| Darkus | 524 | 44% |

### Rodadas de monstros (vitórias dos jogadores)

| Rodada | Lutas | Vitórias |
|---|---|---|
| 1-1 | 192 | 98% |
| 1-2 | 192 | 99% |
| 1-3 | 192 | 100% |
| 2-7 | 192 | 99% |
| 3-7 | 192 | 59% |
| 4-7 | 147 | 31% |
| 5-7 | 70 | 36% |
| 6-7 | 2 | 0% |

### Colocação pela origem mais usada (do estágio 3 em diante)

| Origem | Jogadores | Colocação média | Entre os 4 primeiros |
|---|---|---|---|
| Overwatch | 4 | 3,00 | 75% |
| Digimon | 7 | 3,29 | 71% |
| SMT | 9 | 3,67 | 67% |
| Deadlock | 11 | 3,73 | 64% |
| Yu-Gi-Oh! | 18 | 3,83 | 56% |
| Persona | 4 | 4,00 | 75% |
| Sujimon | 6 | 4,17 | 33% |
| JoJo | 15 | 4,47 | 53% |
| Pokémon | 102 | 4,80 | 45% |
| LoL | 16 | 5,50 | 38% |

### Em campo por nível

| Nível | Jogador-rodadas | Unidades em média | Stands em média | Máximo |
|---|---|---|---|---|
| 1 | 192 | 1,0 | 0,0 | 1 |
| 2 | 192 | 2,0 | 0,0 | 2 |
| 3 | 192 | 3,3 | 0,4 | 4 |
| 4 | 576 | 4,4 | 0,5 | 5 |
| 5 | 960 | 5,5 | 0,6 | 6 |
| 6 | 1152 | 6,8 | 0,9 | 8 |
| 7 | 1238 | 7,9 | 1,0 | 9 |
| 8 | 802 | 9,0 | 1,1 | 10 |
| 9 | 126 | 10,3 | 1,3 | 12 |

<!-- histórico: daqui pra baixo é escrito à mão; o playtest mantém -->


## Histórico de ajustes

### 05/11/2026: depois de jogar

Feedback do usuário: começar com dois campeões não foi boa ideia; gente demais de longe; JoJo forte demais porque o
tabuleiro passa do limite; vale um buff no escalonamento de Pokémon e Digimon; traços grandes merecem mais degraus. O
"antes" é o código do começo desta rodada, com as mesmas sementes. Mudanças, em `combate/atributos.ts`,
`partida/consultas.ts`, `partida/monstros.ts` e `conteudo/tracos.ts`; decisões e motivos no roadmap.

| Medida | Antes | Depois |
|---|---|---|
| Limite do tabuleiro | nível + 1 | nível |
| Máximo de unidades em campo nas partidas de bots | 19 | 12 |
| Formas de longe | 408 de 592 (69%) | 306 de 592 (52%) |
| Time cheio de JoJo (4 ★1, 6 ★2, 8 ★2, 10 ★2, 10 ★3) | 99 / 99 / 99 / 99 / 99% | 49 / 59 / 50 / 49 / 48% |
| Colocação de quem mais usa JoJo | 2,79 | 4,47 |
| Time cheio de Pokémon | 46 / 38 / 31 / 42 / 39% | 53 / 48 / 38 / 56 / 59% |
| Time cheio de Digimon | 34 / 30 / 28 / 26 / 16% | 39 / 46 / 40 / 41 / 46% |
| Evoluir no Pokémon (★1 → ★2, ★2 → ★3) | +84%, +84% | +91%, +91% |
| Evoluir no Digimon | +78%, +53% | +97%, +84% |
| Chefe na 3-7, 4-7 e 5-7 (vitória dos jogadores) | 64 / 31 / 37% | 59 / 31 / 36% |
| Duração | 33,6 rodadas | 34,7 rodadas |
| Campeões fora de 35%–65% no rodízio | 54 de 474 | 105 de 474 |

Parte da subida de Pokémon e Digimon vem do JoJo parar de ganhar de todo mundo. Só o buff de evoluir, com o resto
igual: Pokémon 53 / 41 / 33 / 48 / 45% → 53 / 48 / 39 / 57 / 59%; Digimon 40 / 31 / 29 / 29 / 19% → 40 / 46 / 41 / 41 / 48%.

Quem virou corpo a corpo ganha vida até o multiplicador do Porradeiro (`VIDA_DE_PERTO`, ×1,15). Varredura no rodízio,
campeões fora da faixa: sem bônus 128; ×1,10 81; **×1,15 74**; ×1,20 84; ×1,25 99. Um bônus fixo por cima do papel ficou
pior (+15% de vida: 80; +25%: 113), porque Anjo e Fadinhas têm papel de vida baixa e Dragão, alta. Chefe: com vida 4000 e
dano 260 e o tabuleiro menor, 3-7 caiu pra 38%; vida 3400 e dano 220 volta pro que era (3000 e 200 passava: 73%).

Escadas novas: nos degraus que já existiam o valor não mudou (Tanque +22% e +23% no 6, Porradeiro +20% e +20%, Fadinhas
+28% e +26%). Dois topos saíram da mediana na primeira tentativa e foram corrigidos: Demoníacos 35% → 30% no 10 (+75% →
+62%) e Safada 55% → 70% no 10 (+22% → +25%).

#### O que continua fora e por quê

- **Rodízio de 54 pra 105 fora da faixa.** 20 vêm do alcance e o resto do buff de evoluir: as formas que só atacam na ★2
  somam os dois bônus (Digimon: +12% e +28%) e ganham de quem tem habilidade nesse teste, que é uma peça com bonecos.
  No time cheio o Digimon continua abaixo do meio.
- **Estrela contra custo:** ★2 de custo 3 contra ★1 de custo 5, 77%; ★3 de custo 2 contra ★2 de custo 4, 77% (alvo até
  65%). As duas já estavam fora, e o buff de evoluir aumentou.
- **Yu-Gi-Oh! e Sujimon** no topo do time cheio, Deadlock embaixo (só conta o que acontece na luta). Não foi pedido mexer:
  está no roadmap.

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
