# Equilíbrio: playtest automático

Gerado em 2026-11-09 por `src/autobatalha/equilibrio/equilibrio.playtest.ts` com o set, o motor e o conteúdo de verdade. Semente base 2026: a mesma semente e o mesmo código dão os mesmos números. Como rodar e o que cada medida quer dizer: [README.md](README.md), seção "Playtest". Não edite a parte gerada à mão: rode de novo.

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
| ★2 custo 1 | ★1 custo 3 | 41% | 35%–65% |
| ★2 custo 2 | ★1 custo 3 | 100% | 60%–100% |
| ★2 custo 2 | ★1 custo 4 | 38% | 35%–65% |
| ★2 custo 3 | ★1 custo 4 | 100% | 60%–100% |
| ★2 custo 3 | ★1 custo 5 | 46% | 35%–65% |
| ★3 custo 1 | ★2 custo 2 | 100% | 60%–100% |
| ★3 custo 1 | ★2 custo 3 | 63% | 35%–65% |
| ★3 custo 2 | ★2 custo 4 | 63% | 35%–65% |

**Tudo dentro do alvo.**

## Mana e lançamentos

Alvo: 1º lançamento entre 4 e 10 s pra maioria; tanque não lança antes dos papéis de dano (Porradeiro, Assassino, Atirador, Dragão, Demoníacos); ninguém lança mais de 1 vez a cada 3 s vivo. Tabelas das partidas de bots (tabuleiros de verdade, com itens e traços) e, nas duas últimas colunas, da curva por custo (5 contra 5, sem itens). "Mana de apanhar" = golpes recebidos; "de efeitos" = habilidades, traços e itens que dão mana. Só unidades com habilidade.

| Papel | Unidades-luta | 1º lanç. (s) | Antes de 3 s | 3–10 s | Depois de 10 s | Não lançou | Lanç./10 s vivo | Mana de atacar | de apanhar | de efeitos | 1º lanç. 5×5 (s) | Lanç./10 s 5×5 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Assassino | 11470 | 6,8 | 6% | 76% | 7% | 11% | 1,26 | 61% | 20% | 19% | 6,2 | 1,28 |
| Água | 3660 | 7,6 | 8% | 73% | 9% | 10% | 0,96 | 80% | 17% | 3% | 8,2 | 0,83 |
| Porradeiro | 13412 | 7,7 | 4% | 60% | 15% | 21% | 0,86 | 71% | 28% | 2% | 7,6 | 0,90 |
| Atirador | 38694 | 7,7 | 3% | 80% | 8% | 9% | 1,11 | 88% | 10% | 2% | 9,2 | 0,86 |
| Criaturinha Bizarra | 28871 | 7,8 | 4% | 61% | 17% | 18% | 0,90 | 70% | 28% | 2% | 7,9 | 0,88 |
| Tanque | 16273 | 7,8 | 3% | 69% | 15% | 13% | 0,93 | 71% | 27% | 2% | 7,7 | 0,94 |
| Safada | 17580 | 7,9 | 4% | 62% | 19% | 15% | 0,93 | 74% | 22% | 4% | 8,5 | 0,87 |
| Demoníacos | 8622 | 7,9 | 5% | 66% | 15% | 14% | 0,92 | 74% | 23% | 3% | 7,8 | 0,92 |
| Vento | 4860 | 8,0 | 4% | 77% | 10% | 9% | 0,97 | 84% | 14% | 2% | 8,8 | 0,88 |
| Robô | 3994 | 8,1 | 3% | 67% | 23% | 8% | 0,95 | 76% | 22% | 2% | 7,8 | 0,99 |
| Fadinhas | 27184 | 8,5 | 3% | 68% | 23% | 6% | 0,93 | 82% | 17% | 1% | 9,1 | 0,84 |
| Únicos | 5024 | 8,6 | 2% | 57% | 22% | 19% | 0,78 | 77% | 21% | 1% | 9,2 | 0,74 |
| Anjo | 5868 | 8,8 | 3% | 57% | 33% | 7% | 0,84 | 85% | 14% | 1% | 9,4 | 0,80 |
| Terra | 830 | 8,9 | 0% | 50% | 27% | 22% | 0,72 | 74% | 26% | 0% | – | – |
| Fogo | 1182 | 9,0 | 4% | 40% | 50% | 5% | 0,80 | 83% | 16% | 2% | 9,9 | 0,60 |
| Dragão | 7901 | 9,1 | 4% | 45% | 41% | 11% | 0,79 | 78% | 20% | 2% | 9,1 | 0,81 |
| Planta | 962 | 9,4 | 3% | 32% | 62% | 3% | 0,82 | 83% | 15% | 2% | 11,2 | 0,51 |
| Temporais | 4800 | 9,5 | 3% | 34% | 52% | 11% | 0,76 | 85% | 13% | 2% | 10,0 | 0,72 |
| Raio | 1399 | 10,0 | 3% | 13% | 78% | 6% | 0,76 | 89% | 10% | 1% | 10,7 | 0,66 |
| Gelo | 870 | 10,2 | 1% | 15% | 82% | 2% | 0,76 | 90% | 10% | 0% | – | – |
| **Todos** | 203456 | 8,0 | 4% | 66% | 19% | 12% | 0,95 | 78% | 19% | 3% | 8,5 | 0,88 |

| Custo | 1º lanç. ★1 (s) | ★2 | ★3 | Lanç./10 s ★1 | ★2 | ★3 |
|---|---|---|---|---|---|---|
| 1 | 8,7 | 8,1 | 6,0 | 0,82 | 0,93 | 1,19 |
| 2 | 8,3 | 7,7 | 5,4 | 0,94 | 1,01 | 1,12 |
| 3 | 8,8 | 6,9 | 8,6 | 0,88 | 1,08 | 0,83 |
| 4 | 7,7 | 6,3 | – | 0,99 | 1,27 | – |
| 5 | 8,4 | – | – | 0,81 | – | – |

- Tanque: 1º lançamento em 7,8 s; papéis de dano: 7,7 s.
- Rodízio (seção seguinte, 4 contra 4 com bonecos): 1º lançamento dentro de 4–10 s em 85% dos campeões (mediana 8,8 s).
- Lançam mais de 1 vez a cada 3 s vivo no rodízio: ninguém.
- Lançam em menos de 50% das lutas do rodízio (fora transformação): ninguém.

## Força por campeão

Cada campeão (forma da estrela, ult padrão) com 3 bonecos do custo dele (atributos base, sem habilidade nem traço) contra cada outro do mesmo custo e estrela com os mesmos bonecos, em 3 disposições e dos dois lados (rodízio). Os Stands formam um grupo à parte, presos ao mesmo usuário. Faixa: 35% a 65% de vitórias. "Valor/lanç." = dano + cura + escudo da habilidade por lançamento, em múltiplos do dano de ataque.

| Custo | Estrela | Campeões | Vitórias (mín–máx) | 10% | 90% | Fora da faixa |
|---|---|---|---|---|---|---|
| 1 | ★1 | 60 | 24%–74% | 39% | 61% | 6 |
| 1 | ★2 | 60 | 28%–74% | 37% | 67% | 11 |
| 2 | ★1 | 48 | 34%–72% | 37% | 61% | 3 |
| 2 | ★2 | 48 | 26%–78% | 37% | 71% | 12 |
| 3 | ★1 | 50 | 30%–65% | 39% | 61% | 2 |
| 3 | ★2 | 50 | 23%–76% | 41% | 62% | 7 |
| 4 | ★1 | 44 | 28%–70% | 35% | 63% | 8 |
| 4 | ★2 | 44 | 28%–71% | 39% | 60% | 6 |
| 5 | ★1 | 35 | 33%–68% | 37% | 64% | 5 |
| 5 | ★2 | 35 | 35%–69% | 40% | 61% | 3 |

**Fora da faixa** (mais forte primeiro):

| Campeão | Custo | ★ | Papel | Habilidade | Vitórias | Dano/luta | Vivo no fim | 1º lanç. (s) | Lanç./10 s | Valor/lanç. |
|---|---|---|---|---|---|---|---|---|---|---|
| Doctrine | 2 | ★2 | Anjo | Pacto Sombrio | 78% | 2132 | 84% | 9,8 | 1,0 | 4,4 |
| Machoke | 3 | ★2 | Porradeiro | (só ataca) | 76% | 1556 | 6% | – | 0,0 | – |
| Togemon | 2 | ★2 | Porradeiro | (só ataca) | 75% | 1258 | 7% | – | 0,0 | – |
| McGinnis | 2 | ★2 | Tanque | Bateria de Mísseis | 75% | 1089 | 12% | 9,1 | 1,0 | 5,7 |
| Escapist | 1 | ★1 | Únicos | Vira Escapist | 74% | 623 | 98% | 8,6 | 0,8 | 2,5 |
| Charjabug | 1 | ★2 | Criaturinha Bizarra | (só ataca) | 74% | 898 | 2% | – | 0,0 | – |
| Vegimon | 1 | ★2 | Criaturinha Bizarra | (só ataca) | 73% | 918 | 3% | – | 0,0 | – |
| Garurumon | 2 | ★2 | Porradeiro | (só ataca) | 73% | 1255 | 9% | – | 0,0 | – |
| Boldore | 1 | ★2 | Criaturinha Bizarra | (só ataca) | 73% | 906 | 3% | – | 0,0 | – |
| Corvisquire | 3 | ★2 | Vento | (só ataca) | 72% | 1546 | 5% | – | 0,0 | – |
| Duosion | 2 | ★2 | Criaturinha Bizarra | (só ataca) | 72% | 1202 | 9% | – | 0,0 | – |
| Doctrine | 2 | ★1 | Anjo | Pacto Sombrio | 72% | 1105 | 72% | 9,7 | 1,0 | 3,0 |
| Numemon | 4 | ★2 | Criaturinha Bizarra | (só ataca) | 71% | 1860 | 5% | – | 0,0 | – |
| Bayleef | 2 | ★2 | Tanque | (só ataca) | 71% | 977 | 9% | – | 0,0 | – |
| Leomon | 1 | ★2 | Porradeiro | (só ataca) | 71% | 928 | 2% | – | 0,0 | – |
| Grotle | 1 | ★2 | Tanque | (só ataca) | 71% | 745 | 4% | – | 0,0 | – |
| Doublade | 2 | ★2 | Criaturinha Bizarra | (só ataca) | 70% | 1205 | 7% | – | 0,0 | – |
| Vanillish | 2 | ★2 | Criaturinha Bizarra | (só ataca) | 70% | 1207 | 9% | – | 0,0 | – |
| Labrynth Cooclock | 4 | ★1 | Temporais | Parar o Tempo | 70% | 1458 | 58% | 9,8 | 0,9 | 1,0 |
| Mercy | 4 | ★1 | Anjo | Pó de Fada | 69% | 1269 | 57% | 8,6 | 1,1 | 2,7 |
| Timestar Magician | 5 | ★2 | Temporais | Parar o Tempo | 69% | 3139 | 78% | 9,4 | 1,0 | 1,5 |
| Gurdurr | 2 | ★2 | Porradeiro | (só ataca) | 68% | 1235 | 7% | – | 0,0 | – |
| Magearna | 5 | ★1 | Fadinhas | Vira Mega Magearna | 68% | 1986 | 62% | 9,4 | 0,4 | 0,0 |
| Nami | 5 | ★1 | Fadinhas | Pó de Fada | 68% | 1478 | 69% | 8,3 | 1,2 | 2,9 |
| Squirtle | 1 | ★1 | Atirador | (só ataca) | 68% | 889 | 73% | – | 0,0 | – |
| Heavy Machinery | 4 | ★2 | Robô | Bateria de Mísseis | 67% | 1949 | 8% | 8,1 | 1,1 | 4,4 |
| Monferno | 1 | ★2 | Porradeiro | (só ataca) | 67% | 913 | 3% | – | 0,0 | – |
| Pignite | 1 | ★2 | Porradeiro | (só ataca) | 67% | 910 | 3% | – | 0,0 | – |
| Timestar Magician | 5 | ★1 | Temporais | Parar o Tempo | 66% | 1774 | 58% | 9,4 | 1,0 | 1,0 |
| Dragonair | 3 | ★2 | Dragão | (só ataca) | 66% | 1486 | 7% | – | 0,0 | – |
| Agumon Hakase | 4 | ★1 | Criaturinha Bizarra | (só ataca) | 66% | 911 | 3% | – | 0,0 | – |
| Devimon | 3 | ★2 | Demoníacos | (só ataca) | 66% | 1498 | 7% | – | 0,0 | – |
| Zoe | 5 | ★1 | Anjo | Pó de Fada | 66% | 1533 | 61% | 8,3 | 1,2 | 2,7 |
| Legendary Excavators ft. Lam-chan & Lun-chan | 5 | ★2 | Robô | Bateria de Mísseis | 65% | 2316 | 9% | 8,0 | 1,1 | 4,2 |
| Barong | 3 | ★1 | Raio | Corrente Elétrica | 65% | 1285 | 56% | 10,5 | 0,9 | 2,2 |
| Grubbin | 1 | ★1 | Criaturinha Bizarra | (só ataca) | 65% | 449 | 2% | – | 0,0 | – |
| Pupitar | 4 | ★1 | Terra | (só ataca) | 35% | 805 | 1% | – | 0,0 | – |
| Apollo | 4 | ★2 | Assassino | Pacto Sombrio | 35% | 2031 | 19% | 6,3 | 1,0 | 3,2 |
| Tentomon | 2 | ★1 | Planta | (só ataca) | 35% | 628 | 18% | – | 0,0 | – |
| Ishtar | 1 | ★2 | Safada | Charme | 35% | 943 | 24% | 9,2 | 0,8 | 3,4 |
| Mewtwo | 5 | ★2 | Únicos | (só ataca) | 35% | 2192 | 19% | – | 0,0 | – |
| Hattrem | 2 | ★2 | Safada | (só ataca) | 34% | 1198 | 30% | – | 0,0 | – |
| Chernobog | 2 | ★1 | Fogo | Bola de Fogo | 34% | 701 | 21% | 9,5 | 0,8 | 2,3 |
| Mew | 5 | ★1 | Fadinhas | (só ataca) | 33% | 1691 | 27% | – | 0,0 | – |
| Rem | 4 | ★1 | Fadinhas | Coisa Esquisita | 33% | 1285 | 35% | 8,7 | 1,1 | 1,5 |
| Baseball Diehard | 1 | ★1 | Únicos | Vira Baseball Diehard | 32% | 439 | 1% | 8,6 | 0,8 | 4,0 |
| Baba | 1 | ★2 | Únicos | Vira Baba | 31% | 905 | 1% | 10,2 | 0,7 | 6,0 |
| Ekko | 3 | ★2 | Temporais | Parar o Tempo | 31% | 1216 | 0% | 9,6 | 0,8 | 1,6 |
| Aatrox | 4 | ★1 | Demoníacos | Pacto Sombrio | 30% | 896 | 2% | 7,8 | 1,0 | 2,6 |
| Massacre Mascot | 1 | ★2 | Únicos | Vira Massacre Mascot | 30% | 838 | 1% | 9,4 | 0,7 | 4,6 |
| Mandrake | 1 | ★1 | Fadinhas | Coisa Esquisita | 30% | 628 | 37% | 10,3 | 0,9 | 1,6 |
| Clockwork Knight | 4 | ★2 | Temporais | Parar o Tempo | 30% | 1455 | 2% | 9,0 | 0,8 | 1,5 |
| Abaddon | 3 | ★1 | Anjo | Pacto Sombrio | 30% | 720 | 3% | 8,3 | 0,9 | 2,9 |
| Abrams | 4 | ★1 | Tanque | Pacto Sombrio | 29% | 721 | 1% | 7,8 | 1,0 | 2,4 |
| Rem | 4 | ★2 | Fadinhas | Coisa Esquisita | 29% | 2174 | 50% | 8,7 | 1,1 | 2,1 |
| Vyper | 2 | ★2 | Atirador | Coisa Esquisita | 29% | 1657 | 88% | 8,8 | 1,0 | 1,8 |
| Abrams | 4 | ★2 | Tanque | Pacto Sombrio | 28% | 1498 | 3% | 8,3 | 1,0 | 3,6 |
| Akali | 1 | ★2 | Safada | Charme | 28% | 822 | 1% | 9,3 | 0,8 | 3,6 |
| Apollo | 4 | ★1 | Assassino | Pacto Sombrio | 28% | 976 | 14% | 6,2 | 1,0 | 2,2 |
| Kirlia | 3 | ★2 | Fadinhas | (só ataca) | 27% | 1983 | 67% | – | 0,0 | – |
| Angemon | 2 | ★2 | Anjo | (só ataca) | 26% | 1591 | 70% | – | 0,0 | – |
| Akali | 1 | ★1 | Safada | Charme | 24% | 397 | 0% | 8,6 | 0,8 | 2,5 |
| Kadabra | 3 | ★2 | Fadinhas | (só ataca) | 23% | 1981 | 69% | – | 0,0 | – |

**Stands fora da faixa** (entre Stands do mesmo custo):

| Campeão | Custo | ★ | Papel | Habilidade | Vitórias | Dano/luta | Vivo no fim | 1º lanç. (s) | Lanç./10 s | Valor/lanç. |
|---|---|---|---|---|---|---|---|---|---|---|
| Tusk | 2 | ★1 | Atirador | Vira Tusk | 80% | 897 | 77% | 10,7 | 0,8 | 1,6 |
| Tusk | 2 | ★2 | Atirador | Vira Tusk | 77% | 1737 | 73% | 10,6 | 0,7 | 3,5 |
| Ball Breaker | 2 | ★1 | Atirador | Vira Ball Breaker | 70% | 808 | 67% | 10,7 | 0,7 | 1,1 |
| Strength | 1 | ★1 | Únicos | Vira Strength | 69% | 374 | 25% | 9,8 | 0,5 | 2,5 |
| Sex Pistols | 3 | ★1 | Atirador | Vira Sex Pistols | 68% | 659 | 22% | 8,0 | 0,8 | 2,5 |
| Ball Breaker | 2 | ★2 | Atirador | Vira Ball Breaker | 67% | 1499 | 73% | 10,5 | 0,7 | 1,6 |
| The World (Steel Ball Run) | 5 | ★2 | Porradeiro | Vira The World (Steel Ball Run) | 67% | 1337 | 4% | 10,9 | 0,5 | 2,5 |
| Holy's Stand | 1 | ★2 | Safada | Vira Holy's Stand | 33% | 686 | 14% | 9,5 | 0,8 | 3,8 |
| Foo Fighters (Stand) | 2 | ★2 | Água | Vira Foo Fighters (Stand) | 33% | 1471 | 20% | 10,0 | 0,9 | 5,6 |
| Light Rod Stand | 3 | ★1 | Únicos | Vira Light Rod Stand | 33% | 509 | 14% | 10,1 | 0,4 | 2,9 |
| The Hand | 4 | ★2 | Porradeiro | Vira The Hand | 33% | 2000 | 23% | 8,3 | 0,9 | 4,7 |
| Wonder of U | 5 | ★1 | Demoníacos | Vira Wonder of U | 33% | 877 | 4% | 10,2 | 0,5 | 3,3 |
| Holy's Stand | 1 | ★1 | Safada | Vira Holy's Stand | 31% | 310 | 17% | 8,8 | 0,6 | 1,9 |
| Baby Face | 1 | ★1 | Safada | Vira Baby Face | 31% | 313 | 14% | 8,8 | 0,6 | 1,7 |
| Civil War | 3 | ★2 | Atirador | Vira Civil War | 31% | 1168 | 17% | 9,2 | 0,6 | 2,9 |
| Metallica | 2 | ★1 | Únicos | Vira Metallica | 30% | 640 | 20% | 10,5 | 0,7 | 2,9 |
| Echoes | 2 | ★1 | Vento | Vira Echoes | 23% | 650 | 17% | 8,9 | 1,0 | 2,3 |
| Metallica | 2 | ★2 | Únicos | Vira Metallica | 20% | 1315 | 10% | 11,1 | 0,7 | 4,9 |

<details><summary>Todos os campeões</summary>

| Campeão | Custo | ★ | Papel | Habilidade | Vitórias | Dano/luta | Vivo no fim | 1º lanç. (s) | Lanç./10 s | Valor/lanç. | Stand |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Escapist | 1 | ★1 | Únicos | Vira Escapist | 74% | 623 | 98% | 8,6 | 0,8 | 2,5 |  |
| Squirtle | 1 | ★1 | Atirador | (só ataca) | 68% | 889 | 73% | – | 0,0 | – |  |
| Grubbin | 1 | ★1 | Criaturinha Bizarra | (só ataca) | 65% | 449 | 2% | – | 0,0 | – |  |
| Roggenrola | 1 | ★1 | Criaturinha Bizarra | (só ataca) | 65% | 451 | 2% | – | 0,0 | – |  |
| Shion | 1 | ★1 | Atirador | Tiro Perfurante | 62% | 885 | 56% | 10,8 | 0,8 | 2,1 |  |
| Orianna | 1 | ★1 | Robô | Bateria de Mísseis | 62% | 533 | 31% | 9,0 | 0,9 | 3,3 |  |
| Pro Pickpocket | 1 | ★1 | Assassino | Golpe Fatal | 61% | 536 | 15% | 6,1 | 1,4 | 2,3 |  |
| Ana | 1 | ★1 | Atirador | Tiro Perfurante | 60% | 880 | 53% | 10,8 | 0,8 | 2,1 |  |
| Elecmon | 1 | ★1 | Raio | (só ataca) | 60% | 746 | 62% | – | 0,0 | – |  |
| Captain Kidd | 1 | ★1 | Atirador | Tiro Perfurante | 59% | 882 | 55% | 10,8 | 0,8 | 2,1 |  |
| Pichu | 1 | ★1 | Raio | (só ataca) | 58% | 744 | 61% | – | 0,0 | – |  |
| Tracer | 1 | ★1 | Atirador | Tiro Perfurante | 58% | 882 | 52% | 10,8 | 0,8 | 2,1 |  |
| Caitlyn | 1 | ★1 | Atirador | Tiro Perfurante | 58% | 883 | 56% | 10,8 | 0,8 | 2,1 |  |
| Wraith | 1 | ★1 | Atirador | Tiro Perfurante | 58% | 887 | 51% | 10,8 | 0,8 | 2,2 |  |
| Predaplant Verte Anaconda | 1 | ★1 | Dragão | Sopro de Dragão | 57% | 528 | 22% | 9,7 | 0,8 | 2,5 |  |
| Jinzo | 1 | ★1 | Robô | Bateria de Mísseis | 57% | 530 | 29% | 9,0 | 0,9 | 3,3 |  |
| Dark Magician | 1 | ★1 | Demoníacos | Pacto Sombrio | 56% | 554 | 32% | 8,8 | 0,8 | 2,8 |  |
| Hammered Man | 1 | ★1 | Porradeiro | Pancadão | 56% | 479 | 4% | 8,7 | 0,8 | 3,5 |  |
| Lash | 1 | ★1 | Porradeiro | Pancadão | 56% | 476 | 3% | 8,6 | 0,8 | 3,5 |  |
| Kai'Sa | 1 | ★1 | Atirador | Tiro Perfurante | 56% | 882 | 54% | 10,8 | 0,8 | 2,1 |  |
| Sona | 1 | ★1 | Fadinhas | Pó de Fada | 55% | 594 | 64% | 10,3 | 0,9 | 2,7 |  |
| Bystial Magnamhut | 1 | ★1 | Dragão | Sopro de Dragão | 55% | 526 | 21% | 9,7 | 0,8 | 2,5 |  |
| Kiriko | 1 | ★1 | Fadinhas | Pó de Fada | 52% | 596 | 65% | 10,3 | 0,9 | 2,7 |  |
| Yuumi | 1 | ★1 | Fadinhas | Pó de Fada | 52% | 594 | 62% | 10,3 | 0,9 | 2,7 |  |
| Popplio | 1 | ★1 | Água | (só ataca) | 51% | 490 | 25% | – | 0,0 | – |  |
| Snivy | 1 | ★1 | Planta | (só ataca) | 51% | 490 | 25% | – | 0,0 | – |  |
| Chimchar | 1 | ★1 | Fogo | (só ataca) | 51% | 411 | 1% | – | 0,0 | – |  |
| Tepig | 1 | ★1 | Fogo | (só ataca) | 50% | 407 | 1% | – | 0,0 | – |  |
| Pixie | 1 | ★1 | Fadinhas | Pó de Fada | 50% | 599 | 65% | 10,3 | 0,9 | 2,7 |  |
| Torchic | 1 | ★1 | Fogo | (só ataca) | 49% | 404 | 1% | – | 0,0 | – |  |
| Oshawott | 1 | ★1 | Água | (só ataca) | 49% | 407 | 1% | – | 0,0 | – |  |
| Shakomon | 1 | ★1 | Água | (só ataca) | 49% | 491 | 26% | – | 0,0 | – |  |
| Charmander | 1 | ★1 | Fogo | (só ataca) | 48% | 487 | 25% | – | 0,0 | – |  |
| Piplup | 1 | ★1 | Água | (só ataca) | 48% | 405 | 1% | – | 0,0 | – |  |
| Bulbasaur | 1 | ★1 | Planta | (só ataca) | 48% | 484 | 25% | – | 0,0 | – |  |
| Treecko | 1 | ★1 | Planta | (só ataca) | 47% | 410 | 1% | – | 0,0 | – |  |
| Mudkip | 1 | ★1 | Água | (só ataca) | 47% | 407 | 1% | – | 0,0 | – |  |
| Whismur | 1 | ★1 | Únicos | (só ataca) | 47% | 480 | 24% | – | 0,0 | – |  |
| Idun | 1 | ★1 | Fadinhas | Pó de Fada | 47% | 596 | 62% | 10,3 | 0,9 | 2,7 |  |
| Chespin | 1 | ★1 | Planta | (só ataca) | 47% | 408 | 1% | – | 0,0 | – |  |
| Fennekin | 1 | ★1 | Fogo | (só ataca) | 46% | 485 | 26% | – | 0,0 | – |  |
| Carmen | 1 | ★1 | Safada | Charme | 46% | 502 | 27% | 8,8 | 0,8 | 2,3 |  |
| Turtwig | 1 | ★1 | Planta | (só ataca) | 45% | 407 | 1% | – | 0,0 | – |  |
| Dark Magician Girl | 1 | ★1 | Safada | Charme | 45% | 499 | 25% | 8,8 | 0,8 | 2,2 |  |
| Punimon | 1 | ★1 | Únicos | (só ataca) | 45% | 410 | 2% | – | 0,0 | – |  |
| Cait Sith | 1 | ★1 | Criaturinha Bizarra | Coisa Esquisita | 45% | 408 | 4% | 8,7 | 0,8 | 2,4 |  |
| Rat King | 1 | ★1 | Criaturinha Bizarra | Coisa Esquisita | 44% | 404 | 4% | 8,7 | 0,8 | 2,4 |  |
| Ukobach | 1 | ★1 | Criaturinha Bizarra | Coisa Esquisita | 43% | 404 | 3% | 8,7 | 0,8 | 2,4 |  |
| Palladion | 1 | ★1 | Anjo | Luz Divina | 43% | 738 | 32% | 11,8 | 0,7 | 2,6 |  |
| Poppy | 1 | ★1 | Criaturinha Bizarra | Coisa Esquisita | 43% | 403 | 2% | 8,8 | 0,8 | 2,2 |  |
| Black Ooze | 1 | ★1 | Criaturinha Bizarra | Coisa Esquisita | 42% | 406 | 4% | 8,8 | 0,8 | 2,3 |  |
| Wild Hog | 1 | ★1 | Tanque | Muralha | 40% | 295 | 2% | 9,1 | 0,9 | 2,9 |  |
| Baba | 1 | ★1 | Únicos | Vira Baba | 39% | 455 | 1% | 9,5 | 0,8 | 3,9 |  |
| Yamato | 1 | ★1 | Tanque | Muralha | 39% | 292 | 3% | 9,1 | 0,9 | 2,9 |  |
| Roadhog | 1 | ★1 | Tanque | Muralha | 38% | 294 | 3% | 9,1 | 0,9 | 2,9 |  |
| Tyumon | 1 | ★1 | Terra | (só ataca) | 36% | 392 | 1% | – | 0,0 | – |  |
| Kuriboh | 1 | ★1 | Fadinhas | Pó de Fada | 36% | 340 | 2% | 8,7 | 0,9 | 3,4 |  |
| Baseball Diehard | 1 | ★1 | Únicos | Vira Baseball Diehard | 32% | 439 | 1% | 8,6 | 0,8 | 4,0 |  |
| Mandrake | 1 | ★1 | Fadinhas | Coisa Esquisita | 30% | 628 | 37% | 10,3 | 0,9 | 1,6 |  |
| Akali | 1 | ★1 | Safada | Charme | 24% | 397 | 0% | 8,6 | 0,8 | 2,5 |  |
| Strength | 1 | ★1 | Únicos | Vira Strength | 69% | 374 | 25% | 9,8 | 0,5 | 2,5 | sim |
| Tubular Bells | 1 | ★1 | Criaturinha Bizarra | Vira Tubular Bells | 58% | 457 | 28% | 9,0 | 0,7 | 3,5 | sim |
| Boy II Man | 1 | ★1 | Tanque | Vira Boy II Man | 56% | 242 | 28% | 8,6 | 1,0 | 0,0 | sim |
| Hey Ya! | 1 | ★1 | Criaturinha Bizarra | Vira Hey Ya! | 53% | 321 | 28% | 8,0 | 0,9 | 0,0 | sim |
| Talking Head | 1 | ★1 | Tanque | Vira Talking Head | 53% | 253 | 36% | 8,5 | 0,9 | 2,1 | sim |
| Holy's Stand | 1 | ★1 | Safada | Vira Holy's Stand | 31% | 310 | 17% | 8,8 | 0,6 | 1,9 | sim |
| Baby Face | 1 | ★1 | Safada | Vira Baby Face | 31% | 313 | 14% | 8,8 | 0,6 | 1,7 | sim |
| Charjabug | 1 | ★2 | Criaturinha Bizarra | (só ataca) | 74% | 898 | 2% | – | 0,0 | – |  |
| Vegimon | 1 | ★2 | Criaturinha Bizarra | (só ataca) | 73% | 918 | 3% | – | 0,0 | – |  |
| Boldore | 1 | ★2 | Criaturinha Bizarra | (só ataca) | 73% | 906 | 3% | – | 0,0 | – |  |
| Leomon | 1 | ★2 | Porradeiro | (só ataca) | 71% | 928 | 2% | – | 0,0 | – |  |
| Grotle | 1 | ★2 | Tanque | (só ataca) | 71% | 745 | 4% | – | 0,0 | – |  |
| Monferno | 1 | ★2 | Porradeiro | (só ataca) | 67% | 913 | 3% | – | 0,0 | – |  |
| Pignite | 1 | ★2 | Porradeiro | (só ataca) | 67% | 910 | 3% | – | 0,0 | – |  |
| Break-and-Entryman | 1 | ★2 | Assassino | Golpe Fatal | 60% | 981 | 2% | 6,2 | 1,6 | 3,6 |  |
| Ana | 1 | ★2 | Atirador | Tiro Perfurante | 59% | 1645 | 80% | 10,8 | 0,8 | 3,3 |  |
| Shion | 1 | ★2 | Atirador | Tiro Perfurante | 59% | 1638 | 77% | 10,8 | 0,8 | 3,3 |  |
| Feral Felon | 1 | ★2 | Assassino | Golpe Fatal | 59% | 975 | 2% | 6,2 | 1,6 | 3,6 |  |
| Sukamon | 1 | ★2 | Criaturinha Bizarra | Vira Sukamon | 58% | 910 | 2% | 9,5 | 0,9 | 2,6 |  |
| Kai'Sa | 1 | ★2 | Atirador | Tiro Perfurante | 57% | 1642 | 80% | 10,8 | 0,8 | 3,3 |  |
| Caitlyn | 1 | ★2 | Atirador | Tiro Perfurante | 57% | 1627 | 77% | 10,8 | 0,8 | 3,3 |  |
| Tracer | 1 | ★2 | Atirador | Tiro Perfurante | 56% | 1648 | 78% | 10,8 | 0,8 | 3,4 |  |
| Wraith | 1 | ★2 | Atirador | Tiro Perfurante | 56% | 1653 | 81% | 10,8 | 0,8 | 3,3 |  |
| Dewott | 1 | ★2 | Água | (só ataca) | 54% | 825 | 3% | – | 0,0 | – |  |
| Orianna | 1 | ★2 | Robô | Bateria de Mísseis | 54% | 1024 | 31% | 9,4 | 0,9 | 4,5 |  |
| Agathion | 1 | ★2 | Criaturinha Bizarra | Coisa Esquisita | 53% | 853 | 15% | 9,4 | 0,9 | 3,9 |  |
| Marshtomp | 1 | ★2 | Água | (só ataca) | 53% | 828 | 2% | – | 0,0 | – |  |
| Grovyle | 1 | ★2 | Planta | (só ataca) | 52% | 825 | 2% | – | 0,0 | – |  |
| Dark Magician | 1 | ★2 | Demoníacos | Pacto Sombrio | 52% | 1058 | 29% | 9,3 | 0,8 | 4,0 |  |
| Quilladin | 1 | ★2 | Planta | (só ataca) | 51% | 823 | 2% | – | 0,0 | – |  |
| Seiten Taisei - P5 | 1 | ★2 | Porradeiro | Pancadão | 51% | 923 | 4% | 9,4 | 0,8 | 4,1 |  |
| Wartortle | 1 | ★2 | Atirador | (só ataca) | 51% | 1497 | 90% | – | 0,0 | – |  |
| Prinplup | 1 | ★2 | Água | (só ataca) | 51% | 820 | 1% | – | 0,0 | – |  |
| Knight of the Cask | 1 | ★2 | Porradeiro | Pancadão | 50% | 916 | 3% | 9,4 | 0,8 | 4,0 |  |
| Shellmon | 1 | ★2 | Água | (só ataca) | 50% | 909 | 26% | – | 0,0 | – |  |
| Jinzo | 1 | ★2 | Robô | Bateria de Mísseis | 50% | 1020 | 29% | 9,4 | 0,9 | 4,5 |  |
| Combusken | 1 | ★2 | Fogo | (só ataca) | 49% | 824 | 2% | – | 0,0 | – |  |
| Yamato | 1 | ★2 | Tanque | Muralha | 49% | 581 | 17% | 9,4 | 0,9 | 3,9 |  |
| Poppy | 1 | ★2 | Criaturinha Bizarra | Coisa Esquisita | 48% | 844 | 15% | 9,4 | 0,9 | 3,7 |  |
| Roadhog | 1 | ★2 | Tanque | Muralha | 48% | 581 | 18% | 9,4 | 0,9 | 3,9 |  |
| Athena | 1 | ★2 | Anjo | Luz Divina | 48% | 1399 | 52% | 11,9 | 0,7 | 4,5 |  |
| Feast 'n Flyer | 1 | ★2 | Tanque | Muralha | 48% | 587 | 17% | 9,4 | 0,9 | 3,9 |  |
| Pikachu | 1 | ★2 | Raio | (só ataca) | 48% | 1306 | 75% | – | 0,0 | – |  |
| Ivysaur | 1 | ★2 | Planta | (só ataca) | 48% | 892 | 26% | – | 0,0 | – |  |
| Bystial Magnamhut | 1 | ★2 | Dragão | Sopro de Dragão | 47% | 1011 | 26% | 10,3 | 0,7 | 3,9 |  |
| Lash | 1 | ★2 | Porradeiro | Pancadão | 47% | 923 | 3% | 9,4 | 0,8 | 4,0 |  |
| Rat King | 1 | ★2 | Criaturinha Bizarra | Coisa Esquisita | 46% | 827 | 13% | 9,4 | 0,9 | 3,6 |  |
| Predaplant Verte Anaconda | 1 | ★2 | Dragão | Sopro de Dragão | 45% | 997 | 24% | 10,3 | 0,7 | 3,8 |  |
| Servine | 1 | ★2 | Planta | (só ataca) | 44% | 889 | 25% | – | 0,0 | – |  |
| Koropokguru | 1 | ★2 | Criaturinha Bizarra | Coisa Esquisita | 44% | 818 | 11% | 9,4 | 0,9 | 3,4 |  |
| Charmeleon | 1 | ★2 | Fogo | (só ataca) | 44% | 887 | 26% | – | 0,0 | – |  |
| Neko Shogun | 1 | ★2 | Criaturinha Bizarra | Coisa Esquisita | 44% | 828 | 11% | 9,4 | 0,9 | 3,6 |  |
| Braixen | 1 | ★2 | Safada | (só ataca) | 43% | 886 | 25% | – | 0,0 | – |  |
| Loudred | 1 | ★2 | Únicos | (só ataca) | 43% | 894 | 27% | – | 0,0 | – |  |
| Brionne | 1 | ★2 | Água | (só ataca) | 43% | 889 | 27% | – | 0,0 | – |  |
| Yuumi | 1 | ★2 | Fadinhas | Pó de Fada | 42% | 962 | 73% | 10,6 | 0,9 | 3,6 |  |
| Bugs | 1 | ★2 | Demoníacos | Pacto Sombrio | 42% | 901 | 2% | 9,3 | 0,8 | 4,3 |  |
| Hua Po | 1 | ★2 | Fadinhas | Pó de Fada | 41% | 958 | 71% | 10,6 | 0,9 | 3,6 |  |
| Kiriko | 1 | ★2 | Fadinhas | Pó de Fada | 39% | 957 | 75% | 10,6 | 0,9 | 3,6 |  |
| Hecate | 1 | ★2 | Safada | Charme | 38% | 947 | 24% | 9,3 | 0,8 | 3,3 |  |
| Dark Magician Girl | 1 | ★2 | Safada | Charme | 37% | 948 | 27% | 9,3 | 0,8 | 3,3 |  |
| Sona | 1 | ★2 | Fadinhas | Pó de Fada | 37% | 954 | 71% | 10,6 | 0,9 | 3,6 |  |
| Kuriboh | 1 | ★2 | Fadinhas | Pó de Fada | 36% | 642 | 6% | 9,3 | 0,9 | 4,3 |  |
| Ishtar | 1 | ★2 | Safada | Charme | 35% | 943 | 24% | 9,2 | 0,8 | 3,4 |  |
| Baba | 1 | ★2 | Únicos | Vira Baba | 31% | 905 | 1% | 10,2 | 0,7 | 6,0 |  |
| Massacre Mascot | 1 | ★2 | Únicos | Vira Massacre Mascot | 30% | 838 | 1% | 9,4 | 0,7 | 4,6 |  |
| Akali | 1 | ★2 | Safada | Charme | 28% | 822 | 1% | 9,3 | 0,8 | 3,6 |  |
| Boy II Man | 1 | ★2 | Tanque | Vira Boy II Man | 64% | 456 | 44% | 8,8 | 0,9 | 0,0 | sim |
| Tubular Bells | 1 | ★2 | Criaturinha Bizarra | Vira Tubular Bells | 61% | 977 | 47% | 9,4 | 0,8 | 5,1 | sim |
| Strength | 1 | ★2 | Únicos | Vira Strength | 61% | 747 | 39% | 10,5 | 0,6 | 3,7 | sim |
| Talking Head | 1 | ★2 | Tanque | Vira Talking Head | 50% | 438 | 28% | 8,7 | 0,9 | 2,6 | sim |
| Hey Ya! | 1 | ★2 | Criaturinha Bizarra | Vira Hey Ya! | 42% | 575 | 19% | 8,4 | 0,9 | 0,0 | sim |
| Baby Face | 1 | ★2 | Safada | Vira Baby Face | 39% | 646 | 17% | 9,4 | 0,9 | 2,6 | sim |
| Holy's Stand | 1 | ★2 | Safada | Vira Holy's Stand | 33% | 686 | 14% | 9,5 | 0,8 | 3,8 | sim |
| Doctrine | 2 | ★1 | Anjo | Pacto Sombrio | 72% | 1105 | 72% | 9,7 | 1,0 | 3,0 |  |
| Solosis | 2 | ★1 | Criaturinha Bizarra | (só ataca) | 62% | 605 | 4% | – | 0,0 | – |  |
| McGinnis | 2 | ★1 | Tanque | Bateria de Mísseis | 62% | 526 | 6% | 8,8 | 0,9 | 4,3 |  |
| Vanillite | 2 | ★1 | Criaturinha Bizarra | (só ataca) | 62% | 607 | 4% | – | 0,0 | – |  |
| Honedge | 2 | ★1 | Criaturinha Bizarra | (só ataca) | 62% | 602 | 2% | – | 0,0 | – |  |
| Chikorita | 2 | ★1 | Tanque | (só ataca) | 61% | 502 | 3% | – | 0,0 | – |  |
| Lava Golem | 2 | ★1 | Tanque | Muralha | 60% | 426 | 6% | 8,8 | 1,0 | 3,2 |  |
| Timburr | 2 | ★1 | Porradeiro | (só ataca) | 58% | 613 | 4% | – | 0,0 | – |  |
| Himiko | 2 | ★1 | Temporais | Parar o Tempo | 58% | 915 | 61% | 11,1 | 0,8 | 1,2 |  |
| Dine-and-Dasher | 2 | ★1 | Tanque | Muralha | 58% | 427 | 6% | 8,8 | 1,0 | 3,2 |  |
| Gabumon | 2 | ★1 | Porradeiro | (só ataca) | 57% | 612 | 2% | – | 0,0 | – |  |
| Reinhardt | 2 | ★1 | Tanque | Muralha | 55% | 420 | 5% | 8,8 | 1,0 | 3,2 |  |
| Zilean | 2 | ★1 | Temporais | Parar o Tempo | 55% | 915 | 58% | 11,0 | 0,8 | 1,2 |  |
| Time Thief Redoer | 2 | ★1 | Temporais | Parar o Tempo | 55% | 910 | 56% | 11,0 | 0,8 | 1,2 |  |
| Zorro | 2 | ★1 | Assassino | Golpe Fatal | 55% | 644 | 7% | 5,8 | 1,6 | 2,3 |  |
| Jinx | 2 | ★1 | Atirador | Tiro Perfurante | 55% | 1168 | 67% | 10,2 | 0,9 | 2,1 |  |
| Juno | 2 | ★1 | Fadinhas | Pó de Fada | 55% | 756 | 68% | 9,7 | 1,0 | 3,1 |  |
| Crabby Sentinel | 2 | ★1 | Porradeiro | Pancadão | 54% | 637 | 4% | 8,7 | 0,8 | 3,1 |  |
| Gate Guardian | 2 | ★1 | Tanque | Muralha | 54% | 422 | 4% | 8,8 | 1,0 | 3,2 |  |
| Widowmaker | 2 | ★1 | Atirador | Tiro Perfurante | 54% | 1159 | 62% | 10,2 | 0,9 | 2,1 |  |
| Time Wizard | 2 | ★1 | Temporais | Parar o Tempo | 53% | 912 | 57% | 11,0 | 0,8 | 1,2 |  |
| Lulu | 2 | ★1 | Fadinhas | Pó de Fada | 53% | 752 | 67% | 9,7 | 1,0 | 3,1 |  |
| Agumon | 2 | ★1 | Dragão | (só ataca) | 53% | 686 | 27% | – | 0,0 | – |  |
| Warwick | 2 | ★1 | Porradeiro | Pancadão | 53% | 649 | 7% | 8,8 | 0,8 | 3,1 |  |
| Black Metal Dragon | 2 | ★1 | Dragão | Bateria de Mísseis | 52% | 733 | 34% | 8,8 | 0,9 | 3,3 |  |
| Mermaid | 2 | ★1 | Fadinhas | Pó de Fada | 52% | 747 | 67% | 9,7 | 1,0 | 3,1 |  |
| Vindicta | 2 | ★1 | Atirador | Tiro Perfurante | 52% | 1153 | 61% | 10,2 | 0,9 | 2,0 |  |
| Ivy | 2 | ★1 | Fadinhas | Pó de Fada | 51% | 747 | 68% | 9,7 | 1,0 | 3,1 |  |
| Seraphine | 2 | ★1 | Fadinhas | Pó de Fada | 49% | 743 | 65% | 9,8 | 1,0 | 3,1 |  |
| Jetpack Cat | 2 | ★1 | Fadinhas | Pó de Fada | 49% | 742 | 65% | 9,7 | 1,0 | 3,1 |  |
| Jack Frost | 2 | ★1 | Criaturinha Bizarra | Coisa Esquisita | 47% | 557 | 4% | 8,8 | 0,9 | 2,2 |  |
| Kazejin | 2 | ★1 | Vento | Tornado | 45% | 694 | 17% | 9,1 | 0,8 | 2,2 |  |
| Shinx | 2 | ★1 | Raio | (só ataca) | 45% | 550 | 1% | – | 0,0 | – |  |
| Litten | 2 | ★1 | Fogo | (só ataca) | 45% | 552 | 1% | – | 0,0 | – |  |
| Sham Man Shaman | 2 | ★1 | Vento | Tornado | 44% | 690 | 16% | 9,1 | 0,9 | 2,2 |  |
| Totodile | 2 | ★1 | Água | (só ataca) | 43% | 553 | 1% | – | 0,0 | – |  |
| Sudama | 2 | ★1 | Vento | Tornado | 42% | 691 | 20% | 9,1 | 0,9 | 2,2 |  |
| Rowlet | 2 | ★1 | Planta | (só ataca) | 42% | 633 | 21% | – | 0,0 | – |  |
| Froakie | 2 | ★1 | Água | (só ataca) | 39% | 644 | 20% | – | 0,0 | – |  |
| Patamon | 2 | ★1 | Anjo | (só ataca) | 39% | 946 | 44% | – | 0,0 | – |  |
| Cyndaquil | 2 | ★1 | Fogo | (só ataca) | 38% | 640 | 21% | – | 0,0 | – |  |
| Palmon | 2 | ★1 | Planta | (só ataca) | 38% | 637 | 21% | – | 0,0 | – |  |
| Vyper | 2 | ★1 | Atirador | Coisa Esquisita | 38% | 1038 | 68% | 8,9 | 1,0 | 1,3 |  |
| Hatenna | 2 | ★1 | Safada | (só ataca) | 36% | 636 | 22% | – | 0,0 | – |  |
| Masked Demonling | 2 | ★1 | Demoníacos | Pacto Sombrio | 36% | 606 | 3% | 8,7 | 0,8 | 3,0 |  |
| Ahri | 2 | ★1 | Safada | Charme | 36% | 670 | 28% | 8,7 | 0,9 | 2,3 |  |
| Tentomon | 2 | ★1 | Planta | (só ataca) | 35% | 628 | 18% | – | 0,0 | – |  |
| Chernobog | 2 | ★1 | Fogo | Bola de Fogo | 34% | 701 | 21% | 9,5 | 0,8 | 2,3 |  |
| Tusk | 2 | ★1 | Atirador | Vira Tusk | 80% | 897 | 77% | 10,7 | 0,8 | 1,6 | sim |
| Ball Breaker | 2 | ★1 | Atirador | Vira Ball Breaker | 70% | 808 | 67% | 10,7 | 0,7 | 1,1 | sim |
| Red Hot Chili Pepper | 2 | ★1 | Safada | Vira Red Hot Chili Pepper | 50% | 839 | 23% | 9,4 | 1,3 | 3,6 | sim |
| Foo Fighters (Stand) | 2 | ★1 | Água | Vira Foo Fighters (Stand) | 47% | 642 | 20% | 9,4 | 0,8 | 2,9 | sim |
| Metallica | 2 | ★1 | Únicos | Vira Metallica | 30% | 640 | 20% | 10,5 | 0,7 | 2,9 | sim |
| Echoes | 2 | ★1 | Vento | Vira Echoes | 23% | 650 | 17% | 8,9 | 1,0 | 2,3 | sim |
| Doctrine | 2 | ★2 | Anjo | Pacto Sombrio | 78% | 2132 | 84% | 9,8 | 1,0 | 4,4 |  |
| Togemon | 2 | ★2 | Porradeiro | (só ataca) | 75% | 1258 | 7% | – | 0,0 | – |  |
| McGinnis | 2 | ★2 | Tanque | Bateria de Mísseis | 75% | 1089 | 12% | 9,1 | 1,0 | 5,7 |  |
| Garurumon | 2 | ★2 | Porradeiro | (só ataca) | 73% | 1255 | 9% | – | 0,0 | – |  |
| Duosion | 2 | ★2 | Criaturinha Bizarra | (só ataca) | 72% | 1202 | 9% | – | 0,0 | – |  |
| Bayleef | 2 | ★2 | Tanque | (só ataca) | 71% | 977 | 9% | – | 0,0 | – |  |
| Doublade | 2 | ★2 | Criaturinha Bizarra | (só ataca) | 70% | 1205 | 7% | – | 0,0 | – |  |
| Vanillish | 2 | ★2 | Criaturinha Bizarra | (só ataca) | 70% | 1207 | 9% | – | 0,0 | – |  |
| Gurdurr | 2 | ★2 | Porradeiro | (só ataca) | 68% | 1235 | 7% | – | 0,0 | – |  |
| Greymon | 2 | ★2 | Dragão | (só ataca) | 60% | 1323 | 35% | – | 0,0 | – |  |
| Pier Reviewer | 2 | ★2 | Porradeiro | Pancadão | 58% | 1319 | 9% | 8,9 | 0,9 | 4,1 |  |
| Warwick | 2 | ★2 | Porradeiro | Pancadão | 58% | 1315 | 9% | 8,9 | 0,8 | 4,0 |  |
| Black Metal Dragon | 2 | ★2 | Dragão | Bateria de Mísseis | 57% | 1431 | 36% | 9,1 | 1,0 | 4,5 |  |
| Chomp-and-Charger | 2 | ★2 | Tanque | Muralha | 56% | 781 | 27% | 9,2 | 1,0 | 4,3 |  |
| Reinhardt | 2 | ★2 | Tanque | Muralha | 54% | 782 | 27% | 9,2 | 1,0 | 4,3 |  |
| Torracat | 2 | ★2 | Fogo | (só ataca) | 52% | 1109 | 5% | – | 0,0 | – |  |
| Black Frost | 2 | ★2 | Demoníacos | Pacto Sombrio | 51% | 1472 | 33% | 9,1 | 0,9 | 4,0 |  |
| Lava Golem | 2 | ★2 | Tanque | Muralha | 51% | 783 | 27% | 9,1 | 1,0 | 4,3 |  |
| Zilean | 2 | ★2 | Temporais | Parar o Tempo | 51% | 1578 | 78% | 11,4 | 0,7 | 1,9 |  |
| Luxio | 2 | ★2 | Raio | (só ataca) | 50% | 1110 | 4% | – | 0,0 | – |  |
| Gate Guardian | 2 | ★2 | Tanque | Muralha | 50% | 781 | 26% | 9,1 | 1,0 | 4,3 |  |
| Croconaw | 2 | ★2 | Água | (só ataca) | 49% | 1105 | 6% | – | 0,0 | – |  |
| Time Wizard | 2 | ★2 | Temporais | Parar o Tempo | 49% | 1582 | 78% | 11,3 | 0,7 | 1,9 |  |
| Kanzeon | 2 | ★2 | Temporais | Parar o Tempo | 48% | 1565 | 76% | 11,3 | 0,7 | 1,9 |  |
| Time Thief Redoer | 2 | ★2 | Temporais | Parar o Tempo | 47% | 1582 | 77% | 11,4 | 0,7 | 1,9 |  |
| Juno | 2 | ★2 | Fadinhas | Pó de Fada | 46% | 1209 | 89% | 9,8 | 0,9 | 4,1 |  |
| Ivy | 2 | ★2 | Fadinhas | Pó de Fada | 45% | 1198 | 87% | 9,8 | 0,9 | 4,1 |  |
| Mermaid | 2 | ★2 | Fadinhas | Pó de Fada | 44% | 1192 | 84% | 9,8 | 0,9 | 4,0 |  |
| Jinx | 2 | ★2 | Atirador | Tiro Perfurante | 43% | 2037 | 80% | 10,1 | 0,9 | 3,2 |  |
| Lulu | 2 | ★2 | Fadinhas | Pó de Fada | 43% | 1201 | 87% | 9,8 | 1,0 | 4,0 |  |
| Kazejin | 2 | ★2 | Vento | Tornado | 42% | 1363 | 19% | 9,5 | 0,9 | 3,3 |  |
| Kodama | 2 | ★2 | Vento | Tornado | 42% | 1348 | 17% | 9,5 | 0,9 | 3,3 |  |
| Seraphine | 2 | ★2 | Fadinhas | Pó de Fada | 42% | 1206 | 89% | 9,8 | 1,0 | 4,1 |  |
| Mercurius | 2 | ★2 | Assassino | Golpe Fatal | 41% | 1208 | 1% | 6,2 | 1,5 | 3,5 |  |
| Profaner Demon | 2 | ★2 | Demoníacos | Pacto Sombrio | 41% | 1242 | 6% | 8,9 | 0,9 | 4,2 |  |
| Jetpack Cat | 2 | ★2 | Fadinhas | Pó de Fada | 40% | 1203 | 85% | 9,8 | 1,0 | 4,0 |  |
| False Prophet | 2 | ★2 | Vento | Tornado | 40% | 1380 | 19% | 9,6 | 0,9 | 3,3 |  |
| Ahri | 2 | ★2 | Safada | Charme | 40% | 1323 | 31% | 9,0 | 0,9 | 3,2 |  |
| Widowmaker | 2 | ★2 | Atirador | Tiro Perfurante | 40% | 2030 | 80% | 10,1 | 0,9 | 3,1 |  |
| Vindicta | 2 | ★2 | Atirador | Tiro Perfurante | 40% | 2024 | 80% | 10,1 | 0,9 | 3,2 |  |
| Dartrix | 2 | ★2 | Planta | (só ataca) | 39% | 1206 | 33% | – | 0,0 | – |  |
| Quilava | 2 | ★2 | Fogo | (só ataca) | 38% | 1203 | 30% | – | 0,0 | – |  |
| Frogadier | 2 | ★2 | Água | (só ataca) | 37% | 1211 | 32% | – | 0,0 | – |  |
| Anubis | 2 | ★2 | Únicos | Vira Anubis | 37% | 1400 | 12% | 9,0 | 0,9 | 4,6 |  |
| Kabuterimon | 2 | ★2 | Planta | (só ataca) | 36% | 1230 | 33% | – | 0,0 | – |  |
| Hattrem | 2 | ★2 | Safada | (só ataca) | 34% | 1198 | 30% | – | 0,0 | – |  |
| Vyper | 2 | ★2 | Atirador | Coisa Esquisita | 29% | 1657 | 88% | 8,8 | 1,0 | 1,8 |  |
| Angemon | 2 | ★2 | Anjo | (só ataca) | 26% | 1591 | 70% | – | 0,0 | – |  |
| Tusk | 2 | ★2 | Atirador | Vira Tusk | 77% | 1737 | 73% | 10,6 | 0,7 | 3,5 | sim |
| Ball Breaker | 2 | ★2 | Atirador | Vira Ball Breaker | 67% | 1499 | 73% | 10,5 | 0,7 | 1,6 | sim |
| Echoes | 2 | ★2 | Vento | Vira Echoes | 53% | 1805 | 30% | 9,3 | 1,0 | 6,4 | sim |
| Red Hot Chili Pepper | 2 | ★2 | Safada | Vira Red Hot Chili Pepper | 50% | 1899 | 40% | 9,9 | 1,3 | 5,9 | sim |
| Foo Fighters (Stand) | 2 | ★2 | Água | Vira Foo Fighters (Stand) | 33% | 1471 | 20% | 10,0 | 0,9 | 5,6 | sim |
| Metallica | 2 | ★2 | Únicos | Vira Metallica | 20% | 1315 | 10% | 11,1 | 0,7 | 4,9 | sim |
| Barong | 3 | ★1 | Raio | Corrente Elétrica | 65% | 1285 | 56% | 10,5 | 0,9 | 2,2 |  |
| Guardromon | 3 | ★1 | Criaturinha Bizarra | (só ataca) | 65% | 762 | 2% | – | 0,0 | – |  |
| Machop | 3 | ★1 | Porradeiro | (só ataca) | 64% | 779 | 5% | – | 0,0 | – |  |
| Lifeweaver | 3 | ★1 | Anjo | Pó de Fada | 62% | 1004 | 66% | 9,1 | 1,0 | 2,9 |  |
| Big Shield Gardna | 3 | ★1 | Tanque | Muralha | 62% | 537 | 3% | 8,3 | 1,1 | 3,2 |  |
| Rookidee | 3 | ★1 | Vento | (só ataca) | 60% | 781 | 2% | – | 0,0 | – |  |
| Garen | 3 | ★1 | Tanque | Muralha | 60% | 534 | 4% | 8,3 | 1,1 | 3,2 |  |
| Soraka | 3 | ★1 | Anjo | Pó de Fada | 59% | 1002 | 66% | 9,2 | 1,0 | 2,9 |  |
| Venator | 3 | ★1 | Atirador | Tiro Perfurante | 58% | 1471 | 59% | 9,5 | 1,0 | 2,0 |  |
| Lillia | 3 | ★1 | Fadinhas | Pó de Fada | 58% | 963 | 68% | 9,2 | 1,0 | 3,1 |  |
| Michion, the Timelord | 3 | ★1 | Temporais | Parar o Tempo | 57% | 1170 | 60% | 10,4 | 0,9 | 1,1 |  |
| Aurora | 3 | ★1 | Fadinhas | Pó de Fada | 57% | 963 | 64% | 9,2 | 1,0 | 3,1 |  |
| Paradox | 3 | ★1 | Atirador | Tiro Perfurante | 57% | 1464 | 56% | 9,5 | 1,0 | 2,0 |  |
| Black Luster Soldier - Soldier of Chaos | 3 | ★1 | Assassino | Golpe Fatal | 56% | 785 | 8% | 5,4 | 1,7 | 2,3 |  |
| D.Mon | 3 | ★1 | Robô | Bateria de Mísseis | 56% | 895 | 33% | 8,4 | 1,0 | 3,2 |  |
| Demeter | 3 | ★1 | Fadinhas | Pó de Fada | 55% | 954 | 66% | 9,2 | 1,0 | 3,1 |  |
| Dratini | 3 | ★1 | Dragão | (só ataca) | 55% | 731 | 1% | – | 0,0 | – |  |
| Evilswarm Exciton Knight | 3 | ★1 | Porradeiro | Pancadão | 55% | 797 | 5% | 8,3 | 0,9 | 3,0 |  |
| Orisa | 3 | ★1 | Robô | Bateria de Mísseis | 55% | 896 | 32% | 8,4 | 1,0 | 3,2 |  |
| Milio | 3 | ★1 | Fadinhas | Pó de Fada | 55% | 955 | 63% | 9,2 | 1,0 | 3,1 |  |
| Gurr | 3 | ★1 | Porradeiro | Pancadão | 54% | 799 | 5% | 8,3 | 0,9 | 2,9 |  |
| Paige | 3 | ★1 | Fadinhas | Pó de Fada | 54% | 965 | 65% | 9,2 | 1,0 | 3,1 |  |
| Sukuna-Hikona - P4 | 3 | ★1 | Fadinhas | Pó de Fada | 54% | 960 | 68% | 9,2 | 1,0 | 3,1 |  |
| Venture | 3 | ★1 | Criaturinha Bizarra | Coisa Esquisita | 53% | 723 | 10% | 8,3 | 1,0 | 2,4 |  |
| Tornado Dragon | 3 | ★1 | Dragão | Sopro de Dragão | 52% | 901 | 27% | 9,2 | 0,8 | 2,5 |  |
| City Slicker | 3 | ★1 | Água | Jato d'Água | 52% | 739 | 5% | 8,3 | 1,0 | 3,6 |  |
| Hydra | 3 | ★1 | Dragão | Sopro de Dragão | 51% | 897 | 24% | 9,2 | 0,8 | 2,5 |  |
| Pico Devimon | 3 | ★1 | Demoníacos | (só ataca) | 49% | 857 | 26% | – | 0,0 | – |  |
| Pseudotrash | 3 | ★1 | Criaturinha Bizarra | Coisa Esquisita | 48% | 720 | 8% | 8,3 | 1,0 | 2,4 |  |
| Shuppet | 3 | ★1 | Demoníacos | (só ataca) | 48% | 844 | 25% | – | 0,0 | – |  |
| Graves | 3 | ★1 | Demoníacos | Pacto Sombrio | 48% | 922 | 35% | 8,4 | 0,9 | 2,7 |  |
| Carvanha | 3 | ★1 | Água | (só ataca) | 48% | 701 | 2% | – | 0,0 | – |  |
| Bounsweet | 3 | ★1 | Safada | (só ataca) | 46% | 694 | 1% | – | 0,0 | – |  |
| La Jinn the Mystical Genie of the Lamp | 3 | ★1 | Vento | Tornado | 46% | 858 | 17% | 8,6 | 0,9 | 2,2 |  |
| Genji | 3 | ★1 | Assassino | Golpe Fatal | 44% | 760 | 4% | 5,4 | 1,7 | 2,2 |  |
| Cendrillon | 3 | ★1 | Safada | Charme | 43% | 835 | 25% | 8,3 | 0,9 | 2,2 |  |
| Orpheus | 3 | ★1 | Anjo | Luz Divina | 43% | 1218 | 40% | 10,4 | 0,9 | 2,7 |  |
| Lamia | 3 | ★1 | Safada | Charme | 41% | 847 | 26% | 8,3 | 0,9 | 2,2 |  |
| Lalamon | 3 | ★1 | Planta | (só ataca) | 41% | 817 | 20% | – | 0,0 | – |  |
| Chucklehead | 3 | ★1 | Demoníacos | Pacto Sombrio | 41% | 764 | 3% | 8,3 | 0,9 | 2,9 |  |
| Shaman | 3 | ★1 | Anjo | Luz Divina | 40% | 1205 | 32% | 10,3 | 0,9 | 2,7 |  |
| Sandile | 3 | ★1 | Terra | (só ataca) | 40% | 670 | 0% | – | 0,0 | – |  |
| Violet | 3 | ★1 | Safada | Charme | 40% | 843 | 24% | 8,3 | 0,9 | 2,2 |  |
| Ralts | 3 | ★1 | Fadinhas | (só ataca) | 39% | 1144 | 47% | – | 0,0 | – |  |
| Niddhoggr | 3 | ★1 | Dragão | Sopro de Dragão | 39% | 721 | 0% | 9,0 | 0,8 | 2,6 |  |
| Abra | 3 | ★1 | Fadinhas | (só ataca) | 38% | 1145 | 47% | – | 0,0 | – |  |
| Aron | 3 | ★1 | Terra | (só ataca) | 37% | 670 | 0% | – | 0,0 | – |  |
| Gwen | 3 | ★1 | Assassino | Charme | 36% | 846 | 13% | 6,6 | 1,0 | 2,2 |  |
| Ekko | 3 | ★1 | Temporais | Parar o Tempo | 36% | 619 | 0% | 9,0 | 0,7 | 1,2 |  |
| Abaddon | 3 | ★1 | Anjo | Pacto Sombrio | 30% | 720 | 3% | 8,3 | 0,9 | 2,9 |  |
| Sex Pistols | 3 | ★1 | Atirador | Vira Sex Pistols | 68% | 659 | 22% | 8,0 | 0,8 | 2,5 | sim |
| Silver Chariot | 3 | ★1 | Porradeiro | Vira Silver Chariot | 64% | 668 | 25% | 8,3 | 1,0 | 1,8 | sim |
| Stray Cat | 3 | ★1 | Criaturinha Bizarra | Vira Stray Cat | 53% | 606 | 11% | 8,9 | 0,7 | 5,5 | sim |
| Bad Company | 3 | ★1 | Atirador | Vira Bad Company | 49% | 668 | 19% | 9,2 | 0,5 | 3,6 | sim |
| Civil War | 3 | ★1 | Atirador | Vira Civil War | 47% | 621 | 22% | 9,2 | 0,5 | 1,8 | sim |
| Pearl Jam | 3 | ★1 | Fadinhas | Vira Pearl Jam | 36% | 481 | 14% | 9,0 | 0,6 | 3,5 | sim |
| Light Rod Stand | 3 | ★1 | Únicos | Vira Light Rod Stand | 33% | 509 | 14% | 10,1 | 0,4 | 2,9 | sim |
| Machoke | 3 | ★2 | Porradeiro | (só ataca) | 76% | 1556 | 6% | – | 0,0 | – |  |
| Corvisquire | 3 | ★2 | Vento | (só ataca) | 72% | 1546 | 5% | – | 0,0 | – |  |
| Dragonair | 3 | ★2 | Dragão | (só ataca) | 66% | 1486 | 7% | – | 0,0 | – |  |
| Devimon | 3 | ★2 | Demoníacos | (só ataca) | 66% | 1498 | 7% | – | 0,0 | – |  |
| Orisa | 3 | ★2 | Robô | Bateria de Mísseis | 64% | 1742 | 34% | 8,7 | 1,0 | 4,4 |  |
| D.Mon | 3 | ★2 | Robô | Bateria de Mísseis | 62% | 1757 | 36% | 8,7 | 1,0 | 4,4 |  |
| Hagurumon | 3 | ★2 | Robô | (só ataca) | 60% | 1627 | 33% | – | 0,0 | – |  |
| Flauros | 3 | ★2 | Porradeiro | Pancadão | 60% | 1684 | 9% | 8,5 | 0,9 | 4,0 |  |
| Steenee | 3 | ★2 | Safada | (só ataca) | 59% | 1404 | 5% | – | 0,0 | – |  |
| Evilswarm Exciton Knight | 3 | ★2 | Porradeiro | Pancadão | 58% | 1657 | 7% | 8,6 | 0,9 | 4,0 |  |
| Sharpedo | 3 | ★2 | Água | (só ataca) | 57% | 1398 | 5% | – | 0,0 | – |  |
| Venator | 3 | ★2 | Atirador | Tiro Perfurante | 56% | 2655 | 80% | 9,4 | 1,0 | 3,1 |  |
| Grease Monk | 3 | ★2 | Água | Jato d'Água | 56% | 1496 | 9% | 8,5 | 1,0 | 4,7 |  |
| Big Shield Gardna | 3 | ★2 | Tanque | Muralha | 56% | 987 | 24% | 8,7 | 1,0 | 4,3 |  |
| Michion, the Timelord | 3 | ★2 | Temporais | Parar o Tempo | 55% | 2059 | 81% | 10,7 | 0,8 | 1,7 |  |
| Garen | 3 | ★2 | Tanque | Muralha | 55% | 987 | 25% | 8,7 | 1,0 | 4,3 |  |
| Hecatoncheires | 3 | ★2 | Tanque | Muralha | 54% | 987 | 24% | 8,7 | 1,0 | 4,3 |  |
| Venture | 3 | ★2 | Criaturinha Bizarra | Coisa Esquisita | 53% | 1405 | 18% | 8,6 | 1,0 | 3,4 |  |
| Gifted Gatherer | 3 | ★2 | Criaturinha Bizarra | Coisa Esquisita | 53% | 1402 | 18% | 8,6 | 1,0 | 3,5 |  |
| Soraka | 3 | ★2 | Anjo | Pó de Fada | 52% | 1625 | 80% | 9,3 | 1,0 | 3,7 |  |
| Lifeweaver | 3 | ★2 | Anjo | Pó de Fada | 52% | 1623 | 79% | 9,3 | 1,0 | 3,7 |  |
| Paradox | 3 | ★2 | Atirador | Tiro Perfurante | 52% | 2651 | 79% | 9,4 | 1,0 | 3,1 |  |
| Graves | 3 | ★2 | Demoníacos | Pacto Sombrio | 51% | 1837 | 35% | 8,6 | 1,0 | 3,9 |  |
| Genji | 3 | ★2 | Assassino | Golpe Fatal | 50% | 1562 | 1% | 5,9 | 1,6 | 3,6 |  |
| Milio | 3 | ★2 | Fadinhas | Pó de Fada | 49% | 1550 | 82% | 9,3 | 1,0 | 4,0 |  |
| Banette | 3 | ★2 | Demoníacos | (só ataca) | 49% | 1613 | 31% | – | 0,0 | – |  |
| Messiah | 3 | ★2 | Anjo | Luz Divina | 49% | 2270 | 59% | 10,7 | 0,9 | 4,1 |  |
| Paige | 3 | ★2 | Fadinhas | Pó de Fada | 47% | 1547 | 81% | 9,2 | 1,0 | 4,0 |  |
| Warhead | 3 | ★2 | Demoníacos | Pacto Sombrio | 47% | 1606 | 7% | 8,5 | 0,9 | 4,0 |  |
| Mother Harlot | 3 | ★2 | Safada | Charme | 47% | 1630 | 30% | 8,6 | 1,0 | 3,2 |  |
| Aurora | 3 | ★2 | Fadinhas | Pó de Fada | 47% | 1534 | 80% | 9,3 | 1,0 | 4,0 |  |
| Abdiel | 3 | ★2 | Anjo | Luz Divina | 46% | 2303 | 54% | 10,6 | 0,9 | 4,2 |  |
| Lillia | 3 | ★2 | Fadinhas | Pó de Fada | 46% | 1555 | 84% | 9,3 | 1,0 | 4,0 |  |
| Cybele | 3 | ★2 | Safada | Charme | 45% | 1633 | 29% | 8,6 | 1,0 | 3,2 |  |
| Kohryu | 3 | ★2 | Dragão | Sopro de Dragão | 45% | 1742 | 28% | 9,7 | 0,8 | 3,8 |  |
| Black Luster Soldier - Soldier of Chaos | 3 | ★2 | Assassino | Golpe Fatal | 45% | 1542 | 1% | 5,9 | 1,6 | 3,5 |  |
| La Jinn the Mystical Genie of the Lamp | 3 | ★2 | Vento | Tornado | 44% | 1699 | 15% | 9,1 | 1,0 | 3,2 |  |
| Sunflowmon | 3 | ★2 | Planta | (só ataca) | 43% | 1571 | 33% | – | 0,0 | – |  |
| Yamato-Takeru | 3 | ★2 | Fadinhas | Pó de Fada | 43% | 1544 | 80% | 9,3 | 1,0 | 4,0 |  |
| Lairon | 3 | ★2 | Terra | (só ataca) | 43% | 1325 | 3% | – | 0,0 | – |  |
| High Necromancer | 3 | ★2 | Anjo | Luz Divina | 43% | 2292 | 59% | 10,6 | 0,9 | 4,1 |  |
| Gwen | 3 | ★2 | Assassino | Charme | 42% | 1720 | 18% | 6,7 | 0,9 | 3,3 |  |
| Tornado Dragon | 3 | ★2 | Dragão | Sopro de Dragão | 42% | 1741 | 29% | 9,6 | 0,8 | 3,9 |  |
| Krokorok | 3 | ★2 | Terra | (só ataca) | 41% | 1331 | 2% | – | 0,0 | – |  |
| Violet | 3 | ★2 | Safada | Charme | 41% | 1624 | 28% | 8,6 | 1,0 | 3,2 |  |
| Nuwa | 3 | ★2 | Safada | Charme | 40% | 1650 | 31% | 8,6 | 1,0 | 3,1 |  |
| Vanadis | 3 | ★2 | Safada | Charme | 39% | 1617 | 28% | 8,6 | 1,0 | 3,1 |  |
| Ekko | 3 | ★2 | Temporais | Parar o Tempo | 31% | 1216 | 0% | 9,6 | 0,8 | 1,6 |  |
| Kirlia | 3 | ★2 | Fadinhas | (só ataca) | 27% | 1983 | 67% | – | 0,0 | – |  |
| Kadabra | 3 | ★2 | Fadinhas | (só ataca) | 23% | 1981 | 69% | – | 0,0 | – |  |
| Pearl Jam | 3 | ★2 | Fadinhas | Vira Pearl Jam | 61% | 898 | 31% | 8,9 | 0,8 | 6,0 | sim |
| Sex Pistols | 3 | ★2 | Atirador | Vira Sex Pistols | 61% | 1383 | 25% | 8,0 | 1,0 | 3,6 | sim |
| Chariot Requiem | 3 | ★2 | Porradeiro | Vira Chariot Requiem | 58% | 809 | 22% | 11,6 | 0,5 | 0,0 | sim |
| Stray Cat | 3 | ★2 | Criaturinha Bizarra | Vira Stray Cat | 50% | 1199 | 6% | 9,5 | 0,8 | 7,5 | sim |
| Bad Company | 3 | ★2 | Atirador | Vira Bad Company | 44% | 1340 | 28% | 9,2 | 0,7 | 5,6 | sim |
| Light Rod Stand | 3 | ★2 | Únicos | Vira Light Rod Stand | 44% | 1111 | 25% | 10,6 | 0,6 | 5,1 | sim |
| Civil War | 3 | ★2 | Atirador | Vira Civil War | 31% | 1168 | 17% | 9,2 | 0,6 | 2,9 | sim |
| Labrynth Cooclock | 4 | ★1 | Temporais | Parar o Tempo | 70% | 1458 | 58% | 9,8 | 0,9 | 1,0 |  |
| Mercy | 4 | ★1 | Anjo | Pó de Fada | 69% | 1269 | 57% | 8,6 | 1,1 | 2,7 |  |
| Agumon Hakase | 4 | ★1 | Criaturinha Bizarra | (só ataca) | 66% | 911 | 3% | – | 0,0 | – |  |
| Terriermon | 4 | ★1 | Vento | (só ataca) | 64% | 1053 | 22% | – | 0,0 | – |  |
| Bastion | 4 | ★1 | Atirador | Tiro Perfurante | 63% | 1809 | 53% | 8,9 | 1,1 | 2,0 |  |
| Tynamo | 4 | ★1 | Raio | (só ataca) | 63% | 1532 | 55% | – | 0,0 | – |  |
| D.Va | 4 | ★1 | Robô | Charme | 63% | 1054 | 30% | 7,8 | 1,0 | 2,1 |  |
| Twitch | 4 | ★1 | Atirador | Tiro Perfurante | 60% | 1811 | 52% | 8,9 | 1,1 | 1,9 |  |
| Heavy Machinery | 4 | ★1 | Robô | Bateria de Mísseis | 59% | 949 | 3% | 7,8 | 1,0 | 3,3 |  |
| Sojimaru Flying Beta Max | 4 | ★1 | Dragão | Bateria de Mísseis | 59% | 1075 | 28% | 7,7 | 1,1 | 3,0 |  |
| Tyrant of the Tides | 4 | ★1 | Dragão | Sopro de Dragão | 58% | 1057 | 22% | 8,6 | 0,9 | 2,3 |  |
| Winston | 4 | ★1 | Tanque | Muralha | 58% | 634 | 3% | 7,8 | 1,1 | 3,0 |  |
| Cyber Dragon Nova | 4 | ★1 | Dragão | Bateria de Mísseis | 57% | 1076 | 28% | 7,7 | 1,1 | 3,0 |  |
| Red-Eyes Black Dragon | 4 | ★1 | Dragão | Sopro de Dragão | 56% | 1058 | 20% | 8,6 | 0,9 | 2,3 |  |
| Impmon | 4 | ★1 | Demoníacos | (só ataca) | 56% | 1002 | 22% | – | 0,0 | – |  |
| Gragas | 4 | ★1 | Porradeiro | Pancadão | 55% | 961 | 2% | 7,8 | 0,9 | 2,7 |  |
| Vendetta | 4 | ★1 | Porradeiro | Pancadão | 53% | 953 | 2% | 7,9 | 0,9 | 2,7 |  |
| Volibear | 4 | ★1 | Tanque | Muralha | 52% | 632 | 4% | 7,8 | 1,1 | 3,0 |  |
| Malzahar | 4 | ★1 | Demoníacos | Pacto Sombrio | 52% | 1079 | 29% | 7,6 | 1,0 | 2,5 |  |
| Candmon | 4 | ★1 | Demoníacos | (só ataca) | 52% | 998 | 20% | – | 0,0 | – |  |
| Gible | 4 | ★1 | Dragão | (só ataca) | 51% | 877 | 2% | – | 0,0 | – |  |
| Deino | 4 | ★1 | Demoníacos | (só ataca) | 51% | 882 | 2% | – | 0,0 | – |  |
| Hanuman | 4 | ★1 | Porradeiro | Pancadão | 51% | 971 | 2% | 7,9 | 0,9 | 2,7 |  |
| Baal Zebul | 4 | ★1 | Demoníacos | Pacto Sombrio | 51% | 1078 | 28% | 7,7 | 1,0 | 2,5 |  |
| Mothman | 4 | ★1 | Criaturinha Bizarra | Coisa Esquisita | 48% | 852 | 6% | 7,8 | 1,0 | 2,2 |  |
| Kintoki-Douji | 4 | ★1 | Criaturinha Bizarra | Coisa Esquisita | 48% | 857 | 5% | 7,9 | 1,1 | 2,2 |  |
| Beach Baller | 4 | ★1 | Criaturinha Bizarra | Coisa Esquisita | 48% | 860 | 4% | 7,8 | 1,1 | 2,2 |  |
| Eevee | 4 | ★1 | Únicos | (só ataca) | 47% | 836 | 2% | – | 0,0 | – |  |
| Swordsman of Landstar | 4 | ★1 | Porradeiro | Pancadão | 45% | 955 | 2% | 7,8 | 0,9 | 2,7 |  |
| Larvesta | 4 | ★1 | Fogo | (só ataca) | 45% | 959 | 19% | – | 0,0 | – |  |
| Drifter | 4 | ★1 | Assassino | Golpe Fatal | 45% | 913 | 4% | 5,1 | 1,5 | 2,4 |  |
| Dominion | 4 | ★1 | Anjo | Luz Divina | 44% | 1495 | 31% | 9,7 | 0,9 | 2,6 |  |
| Buneary | 4 | ★1 | Safada | (só ataca) | 44% | 829 | 2% | – | 0,0 | – |  |
| Angel | 4 | ★1 | Anjo | Luz Divina | 44% | 1485 | 31% | 9,7 | 0,9 | 2,6 |  |
| Armageddon Knight | 4 | ★1 | Assassino | Golpe Fatal | 43% | 907 | 3% | 5,1 | 1,5 | 2,5 |  |
| Kassadin | 4 | ★1 | Assassino | Golpe Fatal | 42% | 915 | 3% | 5,1 | 1,5 | 2,5 |  |
| Wailmer | 4 | ★1 | Água | (só ataca) | 40% | 832 | 2% | – | 0,0 | – |  |
| Clockwork Knight | 4 | ★1 | Temporais | Parar o Tempo | 37% | 748 | 1% | 8,6 | 0,8 | 1,1 |  |
| Plotmon | 4 | ★1 | Fadinhas | (só ataca) | 36% | 789 | 0% | – | 0,0 | – |  |
| Pupitar | 4 | ★1 | Terra | (só ataca) | 35% | 805 | 1% | – | 0,0 | – |  |
| Rem | 4 | ★1 | Fadinhas | Coisa Esquisita | 33% | 1285 | 35% | 8,7 | 1,1 | 1,5 |  |
| Aatrox | 4 | ★1 | Demoníacos | Pacto Sombrio | 30% | 896 | 2% | 7,8 | 1,0 | 2,6 |  |
| Abrams | 4 | ★1 | Tanque | Pacto Sombrio | 29% | 721 | 1% | 7,8 | 1,0 | 2,4 |  |
| Apollo | 4 | ★1 | Assassino | Pacto Sombrio | 28% | 976 | 14% | 6,2 | 1,0 | 2,2 |  |
| Soft & Wet | 4 | ★1 | Porradeiro | Vira Soft & Wet | 57% | 864 | 23% | 8,0 | 0,9 | 1,3 | sim |
| Crazy Diamond | 4 | ★1 | Porradeiro | Vira Crazy Diamond | 57% | 837 | 17% | 8,0 | 1,0 | 3,3 | sim |
| Harvest | 4 | ★1 | Criaturinha Bizarra | Vira Harvest | 50% | 929 | 23% | 9,1 | 0,9 | 2,2 | sim |
| November Rain | 4 | ★1 | Criaturinha Bizarra | Vira November Rain | 50% | 954 | 20% | 9,1 | 0,8 | 2,6 | sim |
| Star Platinum | 4 | ★1 | Porradeiro | Vira Star Platinum | 43% | 825 | 20% | 10,8 | 0,5 | 1,6 | sim |
| The Hand | 4 | ★1 | Porradeiro | Vira The Hand | 43% | 986 | 20% | 8,1 | 0,9 | 3,2 | sim |
| Numemon | 4 | ★2 | Criaturinha Bizarra | (só ataca) | 71% | 1860 | 5% | – | 0,0 | – |  |
| Heavy Machinery | 4 | ★2 | Robô | Bateria de Mísseis | 67% | 1949 | 8% | 8,1 | 1,1 | 4,4 |  |
| Labrynth Cooclock | 4 | ★2 | Temporais | Parar o Tempo | 65% | 2569 | 73% | 9,9 | 0,9 | 1,5 |  |
| Zweilous | 4 | ★2 | Demoníacos | (só ataca) | 61% | 1774 | 3% | – | 0,0 | – |  |
| Tyranitar | 4 | ★2 | Tanque | (só ataca) | 61% | 1468 | 5% | – | 0,0 | – |  |
| Wailord | 4 | ★2 | Tanque | (só ataca) | 59% | 1467 | 5% | – | 0,0 | – |  |
| Gabite | 4 | ★2 | Dragão | (só ataca) | 59% | 1777 | 3% | – | 0,0 | – |  |
| Bakemon | 4 | ★2 | Demoníacos | (só ataca) | 55% | 2006 | 25% | – | 0,0 | – |  |
| Swordsman of Landstar | 4 | ★2 | Porradeiro | Pancadão | 55% | 1999 | 8% | 8,1 | 1,0 | 3,7 |  |
| Tailmon | 4 | ★2 | Gelo | (só ataca) | 55% | 1701 | 3% | – | 0,0 | – |  |
| Cyber Dragon Nova | 4 | ★2 | Dragão | Bateria de Mísseis | 55% | 2130 | 31% | 8,2 | 1,1 | 4,2 |  |
| Vendetta | 4 | ★2 | Porradeiro | Pancadão | 55% | 1980 | 8% | 8,1 | 1,0 | 3,6 |  |
| Twitch | 4 | ★2 | Atirador | Tiro Perfurante | 54% | 3266 | 70% | 8,9 | 1,0 | 2,9 |  |
| Seiten Taisei | 4 | ★2 | Porradeiro | Pancadão | 53% | 1981 | 10% | 8,1 | 1,0 | 3,6 |  |
| Malzahar | 4 | ★2 | Demoníacos | Pacto Sombrio | 53% | 2119 | 30% | 8,1 | 1,0 | 3,5 |  |
| Mercy | 4 | ★2 | Anjo | Pó de Fada | 53% | 2032 | 79% | 8,7 | 1,1 | 3,5 |  |
| Sojimaru Flying Beta Max | 4 | ★2 | Dragão | Bateria de Mísseis | 53% | 2123 | 29% | 8,1 | 1,1 | 4,2 |  |
| Bastion | 4 | ★2 | Atirador | Tiro Perfurante | 53% | 3298 | 74% | 8,9 | 1,0 | 2,9 |  |
| Camael | 4 | ★2 | Anjo | Luz Divina | 53% | 2851 | 50% | 9,9 | 1,0 | 4,1 |  |
| Basket Case | 4 | ★2 | Criaturinha Bizarra | Coisa Esquisita | 52% | 1706 | 16% | 8,1 | 1,1 | 3,2 |  |
| Winston | 4 | ★2 | Tanque | Muralha | 52% | 1192 | 16% | 8,2 | 1,1 | 4,1 |  |
| Sandalphon | 4 | ★2 | Anjo | Luz Divina | 52% | 2831 | 47% | 9,9 | 1,0 | 4,1 |  |
| Gragas | 4 | ★2 | Porradeiro | Pancadão | 51% | 1954 | 10% | 8,1 | 1,0 | 3,6 |  |
| Baal | 4 | ★2 | Demoníacos | Pacto Sombrio | 51% | 2166 | 32% | 8,1 | 1,0 | 3,6 |  |
| D.Va | 4 | ★2 | Robô | Charme | 51% | 2043 | 30% | 8,2 | 1,0 | 2,9 |  |
| Wizarmon | 4 | ★2 | Demoníacos | (só ataca) | 51% | 1981 | 26% | – | 0,0 | – |  |
| Kamui | 4 | ★2 | Criaturinha Bizarra | Coisa Esquisita | 50% | 1680 | 17% | 8,1 | 1,1 | 3,2 |  |
| Lopunny | 4 | ★2 | Safada | (só ataca) | 50% | 1683 | 4% | – | 0,0 | – |  |
| Drifter | 4 | ★2 | Assassino | Golpe Fatal | 49% | 1884 | 2% | 5,6 | 1,6 | 3,5 |  |
| Volibear | 4 | ★2 | Tanque | Muralha | 48% | 1189 | 18% | 8,3 | 1,1 | 4,1 |  |
| Eelektrik | 4 | ★2 | Raio | (só ataca) | 47% | 2639 | 68% | – | 0,0 | – |  |
| Kassadin | 4 | ★2 | Assassino | Golpe Fatal | 46% | 1850 | 0% | 5,6 | 1,6 | 3,5 |  |
| Loup-garou | 4 | ★2 | Assassino | Golpe Fatal | 45% | 1855 | 2% | 5,6 | 1,6 | 3,4 |  |
| Jolteon | 4 | ★2 | Raio | (só ataca) | 45% | 2636 | 67% | – | 0,0 | – |  |
| Galgomon | 4 | ★2 | Atirador | (só ataca) | 43% | 2996 | 83% | – | 0,0 | – |  |
| Armageddon Knight | 4 | ★2 | Assassino | Golpe Fatal | 42% | 1825 | 0% | 5,6 | 1,6 | 3,4 |  |
| Aatrox | 4 | ★2 | Demoníacos | Pacto Sombrio | 42% | 1880 | 6% | 8,1 | 1,0 | 3,6 |  |
| Red-Eyes Black Dragon | 4 | ★2 | Dragão | Sopro de Dragão | 41% | 2077 | 24% | 9,1 | 0,9 | 3,6 |  |
| Tyrant of the Tides | 4 | ★2 | Dragão | Sopro de Dragão | 41% | 2073 | 25% | 9,1 | 0,9 | 3,6 |  |
| Volcarona | 4 | ★2 | Fogo | (só ataca) | 38% | 1856 | 24% | – | 0,0 | – |  |
| Apollo | 4 | ★2 | Assassino | Pacto Sombrio | 35% | 2031 | 19% | 6,3 | 1,0 | 3,2 |  |
| Clockwork Knight | 4 | ★2 | Temporais | Parar o Tempo | 30% | 1455 | 2% | 9,0 | 0,8 | 1,5 |  |
| Rem | 4 | ★2 | Fadinhas | Coisa Esquisita | 29% | 2174 | 50% | 8,7 | 1,1 | 2,1 |  |
| Abrams | 4 | ★2 | Tanque | Pacto Sombrio | 28% | 1498 | 3% | 8,3 | 1,0 | 3,6 |  |
| Star Platinum | 4 | ★2 | Porradeiro | Vira Star Platinum | 60% | 1691 | 27% | 11,5 | 0,6 | 2,7 | sim |
| Crazy Diamond | 4 | ★2 | Porradeiro | Vira Crazy Diamond | 57% | 1592 | 30% | 8,5 | 0,9 | 5,0 | sim |
| Soft & Wet | 4 | ★2 | Porradeiro | Vira Soft & Wet | 53% | 1686 | 40% | 8,3 | 0,9 | 1,9 | sim |
| Harvest | 4 | ★2 | Criaturinha Bizarra | Vira Harvest | 50% | 1665 | 27% | 9,2 | 0,8 | 3,1 | sim |
| November Rain | 4 | ★2 | Criaturinha Bizarra | Vira November Rain | 47% | 1774 | 33% | 9,2 | 0,8 | 3,5 | sim |
| The Hand | 4 | ★2 | Porradeiro | Vira The Hand | 33% | 2000 | 23% | 8,3 | 0,9 | 4,7 | sim |
| Magearna | 5 | ★1 | Fadinhas | Vira Mega Magearna | 68% | 1986 | 62% | 9,4 | 0,4 | 0,0 |  |
| Nami | 5 | ★1 | Fadinhas | Pó de Fada | 68% | 1478 | 69% | 8,3 | 1,2 | 2,9 |  |
| Timestar Magician | 5 | ★1 | Temporais | Parar o Tempo | 66% | 1774 | 58% | 9,4 | 1,0 | 1,0 |  |
| Zoe | 5 | ★1 | Anjo | Pó de Fada | 66% | 1533 | 61% | 8,3 | 1,2 | 2,7 |  |
| Darkrai | 5 | ★1 | Demoníacos | Vira Mega Darkrai | 62% | 1301 | 33% | 8,3 | 0,6 | 0,0 |  |
| Toy Agumon | 5 | ★1 | Criaturinha Bizarra | (só ataca) | 60% | 1105 | 0% | – | 0,0 | – |  |
| Blitzcrank | 5 | ★1 | Robô | Bateria de Mísseis | 60% | 1137 | 4% | 7,5 | 1,1 | 3,1 |  |
| Legendary Excavators ft. Lam-chan & Lun-chan | 5 | ★1 | Robô | Bateria de Mísseis | 59% | 1145 | 4% | 7,5 | 1,1 | 3,1 |  |
| Sojimaru v2.1 | 5 | ★1 | Robô | Pacto Sombrio | 58% | 1383 | 29% | 7,6 | 1,1 | 2,4 |  |
| Echo | 5 | ★1 | Robô | Bateria de Mísseis | 57% | 1312 | 29% | 7,6 | 1,2 | 2,9 |  |
| Seven | 5 | ★1 | Robô | Bateria de Mísseis | 56% | 1295 | 29% | 7,6 | 1,1 | 2,9 |  |
| Ramattra | 5 | ★1 | Robô | Pacto Sombrio | 55% | 1391 | 30% | 7,6 | 1,1 | 2,4 |  |
| Zygarde (10%) | 5 | ★1 | Vento | (só ataca) | 54% | 1122 | 3% | – | 0,0 | – |  |
| Mauga | 5 | ★1 | Tanque | Muralha | 52% | 742 | 1% | 7,5 | 1,2 | 3,0 |  |
| Fiddlesticks | 5 | ★1 | Demoníacos | Pacto Sombrio | 51% | 1373 | 34% | 7,5 | 1,1 | 2,4 |  |
| Slifer the Sky Dragon | 5 | ★1 | Dragão | Sopro de Dragão | 50% | 1356 | 22% | 8,4 | 0,9 | 2,4 |  |
| The Winged Dragon of Ra | 5 | ★1 | Dragão | Sopro de Dragão | 50% | 1304 | 16% | 8,4 | 0,9 | 2,4 |  |
| Blessed Leviathan | 5 | ★1 | Dragão | Sopro de Dragão | 49% | 1334 | 17% | 8,4 | 0,9 | 2,4 |  |
| Arsène | 5 | ★1 | Demoníacos | Pacto Sombrio | 49% | 1348 | 31% | 7,5 | 1,1 | 2,4 |  |
| Daemon | 5 | ★1 | Demoníacos | Pacto Sombrio | 49% | 1349 | 31% | 7,5 | 1,1 | 2,4 |  |
| Orpheus Picaro | 5 | ★1 | Anjo | Luz Divina | 48% | 1809 | 37% | 9,4 | 1,0 | 2,5 |  |
| Dunsparce | 5 | ★1 | Dragão | (só ataca) | 48% | 1069 | 0% | – | 0,0 | – |  |
| Blue-Eyes White Dragon | 5 | ★1 | Dragão | Sopro de Dragão | 47% | 1297 | 18% | 8,4 | 0,9 | 2,4 |  |
| Obelisk the Tormentor | 5 | ★1 | Tanque | Muralha | 46% | 738 | 2% | 7,5 | 1,2 | 3,0 |  |
| Cupimon | 5 | ★1 | Anjo | (só ataca) | 43% | 1765 | 30% | – | 0,0 | – |  |
| Incubus | 5 | ★1 | Safada | Pacto Sombrio | 41% | 1307 | 26% | 7,5 | 1,1 | 2,4 |  |
| Mei | 5 | ★1 | Safada | Charme | 41% | 1223 | 22% | 7,4 | 1,1 | 1,9 |  |
| The Doorman | 5 | ★1 | Anjo | Luz Divina | 41% | 1803 | 33% | 9,4 | 1,0 | 2,5 |  |
| Mara | 5 | ★1 | Safada | Charme | 40% | 1212 | 22% | 7,5 | 1,1 | 1,9 |  |
| Mina | 5 | ★1 | Safada | Charme | 39% | 1224 | 22% | 7,5 | 1,1 | 1,9 |  |
| Maria | 5 | ★1 | Anjo | Luz Divina | 37% | 1747 | 26% | 9,3 | 1,0 | 2,5 |  |
| Cosmog | 5 | ★1 | Fadinhas | (só ataca) | 37% | 1682 | 28% | – | 0,0 | – |  |
| Izanagi | 5 | ★1 | Assassino | Golpe Fatal | 36% | 1059 | 1% | 4,9 | 1,5 | 2,2 |  |
| Vel'Koz | 5 | ★1 | Únicos | Vira Vel'Koz | 35% | 1243 | 16% | 9,0 | 0,9 | 3,1 |  |
| Mew | 5 | ★1 | Fadinhas | (só ataca) | 33% | 1691 | 27% | – | 0,0 | – |  |
| Gold Experience | 5 | ★1 | Temporais | Vira Gold Experience | 65% | 594 | 0% | 7,9 | 0,7 | 1,2 | sim |
| Scary Monsters | 5 | ★1 | Criaturinha Bizarra | Vira Scary Monsters | 60% | 666 | 8% | 8,8 | 0,7 | 2,2 | sim |
| Dirty Deeds Done Dirt Cheap | 5 | ★1 | Porradeiro | Vira Dirty Deeds Done Dirt Cheap | 46% | 667 | 8% | 8,7 | 0,7 | 1,2 | sim |
| Whitesnake | 5 | ★1 | Porradeiro | Vira Whitesnake | 46% | 668 | 8% | 8,5 | 0,6 | 1,0 | sim |
| Wonder of U | 5 | ★1 | Demoníacos | Vira Wonder of U | 33% | 877 | 4% | 10,2 | 0,5 | 3,3 | sim |
| Timestar Magician | 5 | ★2 | Temporais | Parar o Tempo | 69% | 3139 | 78% | 9,4 | 1,0 | 1,5 |  |
| Legendary Excavators ft. Lam-chan & Lun-chan | 5 | ★2 | Robô | Bateria de Mísseis | 65% | 2316 | 9% | 8,0 | 1,1 | 4,2 |  |
| Blitzcrank | 5 | ★2 | Robô | Bateria de Mísseis | 65% | 2292 | 8% | 8,0 | 1,1 | 4,2 |  |
| Izanagi-no-Okami | 5 | ★2 | Assassino | Golpe Fatal | 62% | 2299 | 0% | 5,3 | 1,7 | 3,4 |  |
| Dudunsparce | 5 | ★2 | Dragão | (só ataca) | 60% | 2114 | 2% | – | 0,0 | – |  |
| Zoe | 5 | ★2 | Anjo | Pó de Fada | 60% | 2457 | 81% | 8,3 | 1,2 | 3,5 |  |
| Ramattra | 5 | ★2 | Robô | Pacto Sombrio | 58% | 2682 | 34% | 7,9 | 1,1 | 3,5 |  |
| Fiddlesticks | 5 | ★2 | Demoníacos | Pacto Sombrio | 58% | 2676 | 33% | 7,9 | 1,1 | 3,5 |  |
| Sojimaru v2.1 | 5 | ★2 | Robô | Pacto Sombrio | 56% | 2632 | 35% | 7,9 | 1,1 | 3,5 |  |
| Lucifer | 5 | ★2 | Demoníacos | Pacto Sombrio | 54% | 2650 | 32% | 7,9 | 1,1 | 3,4 |  |
| Echo | 5 | ★2 | Robô | Bateria de Mísseis | 53% | 2496 | 30% | 7,9 | 1,2 | 4,0 |  |
| Nami | 5 | ★2 | Fadinhas | Pó de Fada | 53% | 2348 | 86% | 8,2 | 1,2 | 3,7 |  |
| Seven | 5 | ★2 | Robô | Bateria de Mísseis | 53% | 2534 | 31% | 7,9 | 1,2 | 4,0 |  |
| Obelisk the Tormentor | 5 | ★2 | Tanque | Muralha | 52% | 1353 | 18% | 8,0 | 1,2 | 4,1 |  |
| Zygarde (50%) | 5 | ★2 | Dragão | (só ataca) | 50% | 2377 | 25% | – | 0,0 | – |  |
| Mauga | 5 | ★2 | Tanque | Muralha | 50% | 1358 | 21% | 8,0 | 1,2 | 4,1 |  |
| Satanael | 5 | ★2 | Demoníacos | Pacto Sombrio | 49% | 2648 | 30% | 7,9 | 1,1 | 3,4 |  |
| Darkrai | 5 | ★2 | Demoníacos | Vira Mega Darkrai | 48% | 2415 | 31% | 8,7 | 0,5 | 0,0 |  |
| Arioch | 5 | ★2 | Safada | Pacto Sombrio | 48% | 2547 | 32% | 7,9 | 1,1 | 3,5 |  |
| Belial | 5 | ★2 | Demoníacos | Pacto Sombrio | 47% | 2626 | 31% | 7,9 | 1,1 | 3,4 |  |
| The Winged Dragon of Ra | 5 | ★2 | Dragão | Sopro de Dragão | 47% | 2584 | 21% | 8,7 | 0,9 | 3,3 |  |
| Magearna | 5 | ★2 | Fadinhas | Vira Mega Magearna | 47% | 3293 | 75% | 9,4 | 0,3 | 0,0 |  |
| Revolmon | 5 | ★2 | Atirador | (só ataca) | 47% | 3708 | 82% | – | 0,0 | – |  |
| Slifer the Sky Dragon | 5 | ★2 | Dragão | Sopro de Dragão | 46% | 2569 | 23% | 8,7 | 0,9 | 3,4 |  |
| The Doorman | 5 | ★2 | Anjo | Luz Divina | 46% | 3376 | 50% | 9,4 | 1,0 | 3,9 |  |
| Blessed Leviathan | 5 | ★2 | Dragão | Sopro de Dragão | 46% | 2535 | 21% | 8,7 | 0,9 | 3,4 |  |
| Maria | 5 | ★2 | Anjo | Luz Divina | 45% | 3401 | 52% | 9,4 | 1,0 | 3,9 |  |
| Blue-Eyes White Dragon | 5 | ★2 | Dragão | Sopro de Dragão | 45% | 2550 | 21% | 8,7 | 0,9 | 3,3 |  |
| Thanatos | 5 | ★2 | Demoníacos | Pacto Sombrio | 44% | 2586 | 30% | 7,9 | 1,1 | 3,5 |  |
| Lucemon | 5 | ★2 | Anjo | (só ataca) | 41% | 3128 | 61% | – | 0,0 | – |  |
| Mina | 5 | ★2 | Safada | Charme | 41% | 2357 | 23% | 7,9 | 1,1 | 2,7 |  |
| Vel'Koz | 5 | ★2 | Únicos | Vira Vel'Koz | 40% | 2481 | 18% | 9,5 | 0,8 | 4,8 |  |
| Mei | 5 | ★2 | Safada | Charme | 36% | 2351 | 24% | 7,8 | 1,1 | 2,7 |  |
| Cosmoem | 5 | ★2 | Fadinhas | (só ataca) | 36% | 2956 | 62% | – | 0,0 | – |  |
| Mewtwo | 5 | ★2 | Únicos | (só ataca) | 35% | 2192 | 19% | – | 0,0 | – |  |
| The World (Steel Ball Run) | 5 | ★2 | Porradeiro | Vira The World (Steel Ball Run) | 67% | 1337 | 4% | 10,9 | 0,5 | 2,5 | sim |
| C-MOON | 5 | ★2 | Porradeiro | Vira C-MOON | 52% | 1289 | 0% | 9,5 | 0,7 | 2,1 | sim |
| Dirty Deeds Done Dirt Cheap | 5 | ★2 | Porradeiro | Vira Dirty Deeds Done Dirt Cheap | 50% | 1295 | 17% | 9,5 | 0,7 | 1,8 | sim |
| Wonder of U | 5 | ★2 | Demoníacos | Vira Wonder of U | 42% | 1608 | 13% | 10,3 | 0,5 | 4,9 | sim |
| Gold Experience Requiem | 5 | ★2 | Temporais | Vira Gold Experience Requiem | 40% | 931 | 0% | 9,9 | 0,6 | 0,6 | sim |

</details>

## Habilidades

Ult de classe pela média de quem a usa como padrão (todas as estrelas e custos medidos):

| Ult | Classe | Campeões (★1 e ★2) | Vitórias (média) | Valor/lanç. (mediana) | Lanç./10 s |
|---|---|---|---|---|---|
| Corrente Elétrica | Raio | 1 | 65% | 2,25 | 0,9 |
| Bateria de Mísseis | Robô | 26 | 59% | 3,97 | 1,0 |
| Tiro Perfurante | Atirador | 27 | 55% | 2,16 | 0,9 |
| Jato d'Água | Água | 2 | 54% | 4,17 | 1,0 |
| Pancadão | Porradeiro | 21 | 54% | 3,59 | 0,9 |
| Parar o Tempo | Temporais | 18 | 52% | 1,33 | 0,8 |
| Muralha | Tanque | 27 | 52% | 3,86 | 1,0 |
| Pó de Fada | Fadinhas | 44 | 50% | 3,24 | 1,0 |
| Golpe Fatal | Assassino | 18 | 49% | 3,39 | 1,6 |
| Sopro de Dragão | Dragão | 21 | 48% | 2,65 | 0,9 |
| Pacto Sombrio | Demoníacos | 37 | 48% | 3,41 | 1,0 |
| Luz Divina | Anjo | 16 | 45% | 3,26 | 0,9 |
| Coisa Esquisita | Criaturinha Bizarra | 25 | 44% | 2,37 | 1,0 |
| Tornado | Vento | 8 | 43% | 2,73 | 0,9 |
| Charme | Safada | 26 | 41% | 2,66 | 1,0 |
| Bola de Fogo | Fogo | 1 | 34% | 2,26 | 0,8 |

Valor por lançamento (em múltiplos do dano de ataque) mais de 2,0× acima ou abaixo da mediana do custo e estrela (transformações fora). Abaixo nem sempre é fraco: controle (atordoar, provocar) e buff não entram no valor; olhe as vitórias.

| Campeão | Custo | ★ | Habilidade | Valor/lanç. | Mediana do grupo | Onde | Vitórias |
|---|---|---|---|---|---|---|---|
| Himiko | 2 | ★1 | Parar o Tempo | 1,17 | 2,97 | abaixo | 58% |
| Time Thief Redoer | 2 | ★1 | Parar o Tempo | 1,19 | 2,97 | abaixo | 55% |
| Time Wizard | 2 | ★1 | Parar o Tempo | 1,18 | 2,97 | abaixo | 53% |
| Zilean | 2 | ★1 | Parar o Tempo | 1,17 | 2,97 | abaixo | 55% |
| Vyper | 2 | ★1 | Coisa Esquisita | 1,34 | 2,97 | abaixo | 38% |
| Kanzeon | 2 | ★2 | Parar o Tempo | 1,87 | 4,04 | abaixo | 48% |
| Time Thief Redoer | 2 | ★2 | Parar o Tempo | 1,91 | 4,04 | abaixo | 47% |
| Time Wizard | 2 | ★2 | Parar o Tempo | 1,91 | 4,04 | abaixo | 49% |
| Zilean | 2 | ★2 | Parar o Tempo | 1,86 | 4,04 | abaixo | 51% |
| Vyper | 2 | ★2 | Coisa Esquisita | 1,78 | 4,04 | abaixo | 29% |
| Michion, the Timelord | 3 | ★1 | Parar o Tempo | 1,10 | 2,68 | abaixo | 57% |
| Ekko | 3 | ★1 | Parar o Tempo | 1,16 | 2,68 | abaixo | 36% |
| Michion, the Timelord | 3 | ★2 | Parar o Tempo | 1,70 | 3,87 | abaixo | 55% |
| Ekko | 3 | ★2 | Parar o Tempo | 1,65 | 3,87 | abaixo | 31% |
| Clockwork Knight | 4 | ★1 | Parar o Tempo | 1,06 | 2,46 | abaixo | 37% |
| Labrynth Cooclock | 4 | ★1 | Parar o Tempo | 1,01 | 2,46 | abaixo | 70% |
| Clockwork Knight | 4 | ★2 | Parar o Tempo | 1,50 | 3,56 | abaixo | 30% |
| Labrynth Cooclock | 4 | ★2 | Parar o Tempo | 1,54 | 3,56 | abaixo | 65% |
| Timestar Magician | 5 | ★1 | Parar o Tempo | 0,98 | 2,41 | abaixo | 66% |
| Timestar Magician | 5 | ★2 | Parar o Tempo | 1,47 | 3,48 | abaixo | 69% |

## Pacote de cada classe (papel + ult)

Um campeão sintético de custo 3 só com a classe (os atributos do papel e a ult da classe) e 3 bonecos, contra o mesmo time com um boneco no lugar dele. 72 cenários. "Vale" = bônus de vida e dano no boneco que empata. É a régua dos papéis e das ults sem traço nem habilidade própria.

| Classe | Vitórias ★1 | Vale ★1 | Vitórias ★2 | Vale ★2 |
|---|---|---|---|---|
| Temporais | 92% | +20% | 100% | +50% |
| Gelo | 99% | +28% | 100% | +47% |
| Fadinhas | 92% | +22% | 99% | +44% |
| Atirador | 99% | +25% | 100% | +44% |
| Tanque | 100% | +36% | 100% | +44% |
| Criaturinha Bizarra | 99% | +33% | 99% | +42% |
| Robô | 97% | +25% | 100% | +42% |
| Porradeiro | 100% | +36% | 100% | +42% |
| Assassino | 93% | +47% | 99% | +42% |
| Demoníacos | 98% | +28% | 100% | +36% |
| Dragão | 99% | +31% | 100% | +36% |
| Água | 98% | +22% | 100% | +36% |
| Raio | 96% | +22% | 100% | +36% |
| Planta | 99% | +25% | 100% | +36% |
| Fogo | 95% | +25% | 99% | +33% |
| Vento | 95% | +28% | 100% | +33% |
| Anjo | 83% | +9% | 95% | +31% |
| Safada | 97% | +25% | 99% | +25% |
| Únicos | 88% | +17% | 98% | +22% |
| Terra | 96% | +20% | 99% | +20% |

Mediana ★2: +36%. Todas perto da mediana.

## Traços

O time tem exatamente os campeões do degrau com o traço (sorteados, ★2) e mais 2 sem ele (JoJo: um usuário pra cada Stand); o outro lado é o mesmo time com o traço desligado. "Vale" = bônus de vida e dano no time todo que empata (60 cenários). Em negrito: mais de 1,6× longe da mediana do mesmo degrau. Origens: só referência (as escadas e os números delas não mudam aqui); Overwatch, Deadlock e Sujimon agem também fora da luta, e isso não entra.

### Classes

| Traço | Degraus | Degrau 1 | Degrau 2 | Degrau 3 | Degrau 4 | Degrau 5 | Degrau 6 |
|---|---|---|---|---|---|---|---|
| Tanque | 2/3/4/6/8 | +5% | +8% | +17% | +28% | +30% | – |
| Porradeiro | 2/3/4/6/8/10 | +5% | +9% | +12% | +22% | +26% | +34% |
| Assassino | 2/3/4/5/6 | +3% | +6% | +11% | +17% | +22% | – |
| Demoníacos | 2/3/4/6/8/10 | +5% | +8% | +15% | +25% | +37% | +50% |
| Criaturinha Bizarra | 3/4/5/7/9/10 | +6% | +9% | +11% | +33% | +42% | +47% |
| Fadinhas | 2/3/4/6/8/10 | +8% | +15% | +17% | +26% | +37% | +42% |
| Safada | 3/4/5/7/9/10 | +8% | +11% | +14% | +19% | +25% | +26% |
| Atirador | 2/3/4/5/7 | +11% | +17% | +23% | +26% | +33% | – |
| Anjo | 2/3/4/5/6 | +8% | +6% | +14% | +17% | +22% | – |
| Robô | 2/3/4/5/6 | +5% | +8% | +11% | +17% | +22% | – |
| Dragão | 2/3/4/5/7 | +6% | +11% | +14% | +20% | +33% | – |
| Temporais | 2/3/4/5 | +6% | +11% | +11% | +23% | – | – |
| **Mediana** |  | +6% | +9% | +14% | +23% | +30% | +42% |

Todos perto da mediana do degrau.

### Elementos

| Traço | Degraus | Degrau 1 | Degrau 2 | Degrau 3 | Degrau 4 | Degrau 5 |
|---|---|---|---|---|---|---|
| Fogo | 2/3/4/5/6 | +9% | +17% | +23% | +30% | +31% |
| Água | 2/3/4/5/6 | +5% | +11% | +17% | +22% | +23% |
| Terra | 2/3/4 | +5% | +6% | +14% | – | – |
| Vento | 2/3/4/5/6 | +5% | +14% | +23% | +33% | +37% |
| Raio | 2/3/4/5 | +5% | +6% | +22% | +31% | – |
| Gelo | 2/3/4 | +5% | +8% | +12% | – | – |
| Planta | 2/3/4/5 | +6% | +14% | +25% | +36% | – |
| **Mediana** |  | +5% | +11% | +22% | +31% | +31% |

Todos perto da mediana do degrau.

### Origens

| Traço | Degraus | Degrau 1 | Degrau 2 | Degrau 3 | Degrau 4 | Degrau 5 | Degrau 6 |
|---|---|---|---|---|---|---|---|
| Pokémon | 2/4/6/8/9/10 | +1% | +6% | +14% | +20% | +26% | +33% |
| Digimon | 2/3/4/5/6 | +5% | +8% | +14% | +19% | +20% | – |
| SMT | 2/3/4/6/8 | +5% | +8% | +9% | +15% | +19% | – |
| Persona | 1/2/3/4/5 | +1% | +1% | +5% | +6% | +12% | – |
| JoJo | 2/3/4/5/6 | +25% | +34% | +45% | +59% | +62% | – |
| Yu-Gi-Oh! | 2/3/5/7/9/10 | +3% | +6% | +9% | +20% | +25% | +30% |
| LoL | 2/3/5/7/9/10 | +3% | +5% | +8% | +11% | +15% | +19% |
| Overwatch | 2/3/4/5/7 | +5% | +6% | +8% | +14% | +19% | – |
| Deadlock | 2/3/4/5/6 | 0% | 0% | 0% | 0% | 0% | – |
| Sujimon | 2/3/4/5/6 | +3% | +6% | +9% | +19% | +26% | – |



## Origens

Time cheio de cada origem contra os times cheios das outras (20 cenários por par, dos dois lados), com os custos da loja daquele nível e os traços valendo. JoJo: metade Stands, metade usuários de outras origens. Digimon: um terço do time de fora, pro Parceiro. Overwatch, Deadlock e Sujimon agem também fora da luta, e isso não entra aqui. Sem itens.

| Origem | 4 no tabuleiro, ★1 | 6 no tabuleiro, ★2 | 8 no tabuleiro, ★2 | 10 no tabuleiro, ★2 | 10 no tabuleiro, ★3 |
|---|---|---|---|---|---|
| Pokémon | 58% | 48% | 37% | 49% | 56% |
| Digimon | 45% | 44% | 35% | 37% | 52% |
| SMT | 68% | 59% | 64% | 52% | 45% |
| Persona | 38% | 43% | 49% | 52% | 53% |
| JoJo | 30% | 40% | 47% | 54% | 58% |
| Yu-Gi-Oh! | 50% | 47% | 64% | 87% | 79% |
| LoL | 42% | 46% | 47% | 48% | 69% |
| Overwatch | 64% | 59% | 65% | 51% | 31% |
| Deadlock | 34% | 30% | 25% | 4% | 3% |
| Sujimon | 71% | 84% | 68% | 66% | 54% |

### Quanto vale evoluir

Os mesmos campeões numa estrela a mais: bônus de vida e dano no time da estrela de baixo que empata (40 cenários, tabuleiro de 6). Pokémon, Digimon, SMT, Persona e Sujimon: só as linhas evolutivas.

| Origem | ★1 → ★2 | ★2 → ★3 |
|---|---|---|
| Pokémon (linhas) | +91% | +103% |
| Digimon (linhas) | +84% | +97% |
| SMT (linhas) | +72% | +84% |
| Persona (linhas) | +84% | +84% |
| Yu-Gi-Oh! | +84% | +91% |
| LoL | +78% | +103% |
| Overwatch | +72% | +78% |
| Deadlock | +72% | +78% |
| Sujimon (linhas) | +103% | +109% |

## Composições forçadas

Times focados em cada traço (as 10 origens, cada classe e elemento) e em cada par origem + classe que existe no set (95 pares com 2 campeões ou mais), em vários tamanhos de tabuleiro e estrelas, com os custos da loja daquele nível. Cada foco luta contra 24 focos sorteados por ponto, dos dois lados (29760 lutas no total), e os traços valem; sem itens. Origem pura: o time cheio da seção Origens. JoJo: sempre metade Stands e metade usuários de outras origens. Digimon: dois terços Digimon e o resto de fora, pro Parceiro. Par: primeiro quem tem os dois; o que faltar, metade da origem e metade da classe. Overwatch, Deadlock e Sujimon agem também fora da luta, e isso não entra aqui. Em negrito: média fora de 35%–65%.

### Por traço

| Foco | 4 ★1 | 6 ★2 | 8 ★2 | 10 ★2 | 10 ★3 | Média |
|---|---|---|---|---|---|---|
| Demoníacos | 44% | 53% | 68% | 90% | 89% | **69%** |
| Vento | 35% | 67% | 80% | 81% | 71% | **67%** |
| Anjo | 43% | 64% | 65% | 61% | 74% | 61% |
| Gelo | 71% | 82% | 86% | 39% | 24% | 60% |
| Assassino | 42% | 68% | 68% | 70% | 50% | 60% |
| Dragão | 24% | 44% | 67% | 85% | 65% | 57% |
| Água | 35% | 56% | 61% | 69% | 57% | 55% |
| Criaturinha Bizarra | 22% | 31% | 60% | 75% | 84% | 55% |
| Sujimon | 20% | 58% | 47% | 86% | 58% | 54% |
| Yu-Gi-Oh! | 10% | 13% | 58% | 88% | 85% | 51% |
| Temporais | 26% | 54% | 55% | 55% | 50% | 48% |
| SMT | 31% | 36% | 56% | 63% | 54% | 48% |
| Robô | 27% | 41% | 51% | 55% | 40% | 43% |
| Overwatch | 28% | 32% | 43% | 55% | 47% | 41% |
| Safada | 18% | 29% | 37% | 43% | 74% | 40% |
| Raio | 25% | 48% | 70% | 39% | 17% | 40% |
| LoL | 7% | 13% | 48% | 49% | 80% | 39% |
| Digimon | 20% | 21% | 29% | 52% | 71% | 39% |
| Fadinhas | 27% | 31% | 40% | 39% | 49% | 37% |
| Pokémon | 21% | 20% | 34% | 47% | 61% | 37% |
| JoJo | 11% | 10% | 24% | 63% | 76% | 37% |
| Persona | 11% | 21% | 30% | 65% | 55% | 36% |
| Fogo | 35% | 40% | 44% | 9% | 38% | **33%** |
| Porradeiro | 35% | 43% | 31% | 33% | 24% | **33%** |
| Terra | 32% | 47% | 52% | 0% | 10% | **28%** |
| Atirador | 25% | 27% | 39% | 22% | 6% | **24%** |
| Tanque | 19% | 12% | 23% | 19% | 16% | **18%** |
| Deadlock | 10% | 14% | 27% | 9% | 20% | **16%** |
| Planta | 29% | 26% | 21% | 2% | 0% | **16%** |

**Fora de 35%–65% na média:** Demoníacos 69%, Vento 67%, Fogo 33%, Porradeiro 33%, Terra 28%, Atirador 24%, Tanque 18%, Deadlock 16%, Planta 16%.

### Pares origem + classe

Os 12 melhores e os 12 piores pela média; todos os 95 embaixo.

| Foco | 4 ★1 | 6 ★2 | 8 ★2 | 10 ★2 | 10 ★3 | Média |
|---|---|---|---|---|---|---|
| SMT + Demoníacos | 100% | 100% | 96% | 92% | 89% | **95%** |
| JoJo + Temporais | 79% | 98% | 96% | 99% | 99% | **94%** |
| Sujimon + Robô | 100% | 100% | 99% | 89% | 77% | **93%** |
| Sujimon + Dragão | 93% | 95% | 97% | 89% | 83% | **92%** |
| Sujimon + Água | 99% | 100% | 88% | 75% | 85% | **89%** |
| Yu-Gi-Oh! + Vento | 96% | 84% | 84% | 85% | 84% | **86%** |
| Pokémon + Fadinhas | 99% | 86% | 83% | 74% | 82% | **85%** |
| Overwatch + Robô | 88% | 100% | 97% | 77% | 59% | **84%** |
| Pokémon + Dragão | 92% | 98% | 81% | 79% | 66% | **83%** |
| Sujimon + Demoníacos | 89% | 92% | 85% | 78% | 69% | **83%** |
| Yu-Gi-Oh! + Dragão | 53% | 69% | 99% | 95% | 93% | **82%** |
| Persona + Demoníacos | 61% | 88% | 83% | 89% | 77% | **79%** |
| Pokémon + Terra | 47% | 43% | 12% | 20% | 26% | **30%** |
| Sujimon + Porradeiro | 31% | 18% | 19% | 36% | 38% | **28%** |
| Pokémon + Porradeiro | 43% | 41% | 27% | 11% | 15% | **28%** |
| SMT + Criaturinha Bizarra | 40% | 8% | 17% | 16% | 50% | **26%** |
| Pokémon + Criaturinha Bizarra | 43% | 25% | 11% | 16% | 30% | **25%** |
| JoJo + Tanque | 13% | 22% | 19% | 36% | 34% | **25%** |
| Pokémon + Gelo | 25% | 15% | 34% | 21% | 23% | **24%** |
| Deadlock + Atirador | 40% | 22% | 10% | 21% | 20% | **23%** |
| SMT + Fadinhas | 19% | 17% | 19% | 33% | 21% | **22%** |
| Sujimon + Tanque | 15% | 21% | 20% | 31% | 22% | **22%** |
| Pokémon + Planta | 35% | 35% | 16% | 1% | 1% | **18%** |
| Deadlock + Criaturinha Bizarra | 38% | 8% | 9% | 15% | 17% | **17%** |

<details><summary>Todos os pares</summary>

| Foco | 4 ★1 | 6 ★2 | 8 ★2 | 10 ★2 | 10 ★3 | Média |
|---|---|---|---|---|---|---|
| SMT + Demoníacos | 100% | 100% | 96% | 92% | 89% | **95%** |
| JoJo + Temporais | 79% | 98% | 96% | 99% | 99% | **94%** |
| Sujimon + Robô | 100% | 100% | 99% | 89% | 77% | **93%** |
| Sujimon + Dragão | 93% | 95% | 97% | 89% | 83% | **92%** |
| Sujimon + Água | 99% | 100% | 88% | 75% | 85% | **89%** |
| Yu-Gi-Oh! + Vento | 96% | 84% | 84% | 85% | 84% | **86%** |
| Pokémon + Fadinhas | 99% | 86% | 83% | 74% | 82% | **85%** |
| Overwatch + Robô | 88% | 100% | 97% | 77% | 59% | **84%** |
| Pokémon + Dragão | 92% | 98% | 81% | 79% | 66% | **83%** |
| Sujimon + Demoníacos | 89% | 92% | 85% | 78% | 69% | **83%** |
| Yu-Gi-Oh! + Dragão | 53% | 69% | 99% | 95% | 93% | **82%** |
| Persona + Demoníacos | 61% | 88% | 83% | 89% | 77% | **79%** |
| Digimon + Demoníacos | 79% | 86% | 78% | 70% | 83% | **79%** |
| SMT + Anjo | 100% | 86% | 82% | 65% | 59% | **79%** |
| LoL + Demoníacos | 96% | 87% | 75% | 64% | 71% | **79%** |
| Yu-Gi-Oh! + Gelo | 89% | 88% | 83% | 66% | 61% | **77%** |
| Persona + Assassino | 73% | 79% | 73% | 83% | 79% | **77%** |
| Yu-Gi-Oh! + Temporais | 54% | 88% | 92% | 83% | 65% | **76%** |
| Digimon + Vento | 67% | 72% | 66% | 79% | 80% | **73%** |
| Overwatch + Demoníacos | 71% | 76% | 74% | 66% | 64% | **70%** |
| Overwatch + Safada | 49% | 86% | 88% | 58% | 62% | **68%** |
| Yu-Gi-Oh! + Assassino | 79% | 77% | 53% | 74% | 57% | **68%** |
| Digimon + Atirador | 12% | 89% | 82% | 74% | 75% | **66%** |
| SMT + Safada | 94% | 80% | 72% | 44% | 40% | **66%** |
| LoL + Assassino | 76% | 66% | 55% | 54% | 69% | 64% |
| Overwatch + Porradeiro | 82% | 72% | 52% | 63% | 41% | 62% |
| Digimon + Anjo | 64% | 71% | 55% | 61% | 59% | 62% |
| Deadlock + Temporais | 68% | 65% | 60% | 61% | 55% | 62% |
| Pokémon + Vento | 86% | 40% | 48% | 61% | 71% | 61% |
| Overwatch + Fadinhas | 46% | 69% | 67% | 59% | 59% | 60% |
| Pokémon + Demoníacos | 87% | 70% | 52% | 51% | 40% | 60% |
| SMT + Porradeiro | 81% | 71% | 61% | 49% | 38% | 60% |
| JoJo + Porradeiro | 46% | 53% | 57% | 65% | 71% | 59% |
| Yu-Gi-Oh! + Porradeiro | 76% | 60% | 50% | 60% | 46% | 58% |
| Deadlock + Vento | 78% | 67% | 49% | 56% | 42% | 58% |
| SMT + Assassino | 65% | 62% | 53% | 66% | 43% | 58% |
| LoL + Anjo | 72% | 55% | 51% | 54% | 58% | 58% |
| Overwatch + Anjo | 68% | 63% | 52% | 47% | 57% | 58% |
| JoJo + Criaturinha Bizarra | 26% | 28% | 76% | 76% | 80% | 57% |
| Pokémon + Raio | 42% | 81% | 68% | 50% | 41% | 56% |
| JoJo + Planta | 48% | 69% | 63% | 39% | 56% | 55% |
| Digimon + Criaturinha Bizarra | 85% | 28% | 32% | 34% | 85% | 53% |
| Digimon + Fogo | 62% | 29% | 37% | 59% | 74% | 52% |
| Sujimon + Criaturinha Bizarra | 80% | 41% | 47% | 44% | 44% | 51% |
| Overwatch + Tanque | 75% | 69% | 57% | 35% | 18% | 51% |
| Deadlock + Demoníacos | 87% | 63% | 46% | 23% | 36% | 51% |
| LoL + Robô | 69% | 53% | 53% | 40% | 34% | 50% |
| Deadlock + Anjo | 66% | 58% | 49% | 42% | 32% | 49% |
| LoL + Criaturinha Bizarra | 66% | 60% | 36% | 24% | 52% | 48% |
| SMT + Vento | 20% | 40% | 67% | 54% | 55% | 47% |
| LoL + Porradeiro | 63% | 47% | 39% | 43% | 40% | 46% |
| Digimon + Planta | 63% | 43% | 45% | 26% | 53% | 46% |
| Pokémon + Água | 56% | 59% | 48% | 23% | 43% | 46% |
| SMT + Raio | 20% | 36% | 46% | 64% | 62% | 46% |
| Deadlock + Assassino | 65% | 50% | 44% | 43% | 24% | 45% |
| Pokémon + Safada | 80% | 59% | 27% | 23% | 37% | 45% |
| LoL + Temporais | 27% | 30% | 43% | 61% | 63% | 45% |
| Yu-Gi-Oh! + Robô | 64% | 51% | 31% | 47% | 31% | 45% |
| LoL + Tanque | 52% | 36% | 31% | 46% | 59% | 45% |
| SMT + Fogo | 23% | 11% | 39% | 59% | 85% | 44% |
| Persona + Safada | 30% | 24% | 42% | 61% | 56% | 42% |
| Deadlock + Safada | 67% | 43% | 41% | 34% | 24% | 42% |
| JoJo + Safada | 26% | 24% | 45% | 46% | 68% | 42% |
| Yu-Gi-Oh! + Tanque | 61% | 42% | 42% | 33% | 29% | 41% |
| SMT + Dragão | 56% | 28% | 44% | 54% | 24% | 41% |
| LoL + Fadinhas | 37% | 49% | 56% | 32% | 27% | 40% |
| JoJo + Atirador | 25% | 31% | 56% | 46% | 39% | 39% |
| Sujimon + Assassino | 14% | 37% | 31% | 59% | 52% | 39% |
| SMT + Gelo | 51% | 39% | 28% | 50% | 21% | 38% |
| Deadlock + Robô | 50% | 36% | 39% | 38% | 23% | 37% |
| Persona + Anjo | 52% | 23% | 30% | 39% | 41% | 37% |
| LoL + Safada | 24% | 41% | 38% | 33% | 39% | 35% |
| Pokémon + Assassino | 19% | 30% | 35% | 39% | 50% | **35%** |
| LoL + Atirador | 50% | 38% | 24% | 24% | 34% | **34%** |
| Digimon + Fadinhas | 50% | 13% | 10% | 37% | 58% | **34%** |
| Pokémon + Atirador | 24% | 25% | 31% | 49% | 37% | **33%** |
| Digimon + Raio | 7% | 9% | 40% | 49% | 61% | **33%** |
| Pokémon + Tanque | 17% | 51% | 40% | 31% | 26% | **33%** |
| Deadlock + Fadinhas | 50% | 21% | 42% | 28% | 21% | **33%** |
| Overwatch + Atirador | 30% | 39% | 36% | 20% | 36% | **32%** |
| Pokémon + Fogo | 35% | 56% | 24% | 10% | 36% | **32%** |
| Digimon + Porradeiro | 30% | 27% | 15% | 26% | 50% | **30%** |
| Deadlock + Tanque | 45% | 33% | 24% | 25% | 21% | **30%** |
| Pokémon + Terra | 47% | 43% | 12% | 20% | 26% | **30%** |
| Sujimon + Porradeiro | 31% | 18% | 19% | 36% | 38% | **28%** |
| Pokémon + Porradeiro | 43% | 41% | 27% | 11% | 15% | **28%** |
| SMT + Criaturinha Bizarra | 40% | 8% | 17% | 16% | 50% | **26%** |
| Pokémon + Criaturinha Bizarra | 43% | 25% | 11% | 16% | 30% | **25%** |
| JoJo + Tanque | 13% | 22% | 19% | 36% | 34% | **25%** |
| Pokémon + Gelo | 25% | 15% | 34% | 21% | 23% | **24%** |
| Deadlock + Atirador | 40% | 22% | 10% | 21% | 20% | **23%** |
| SMT + Fadinhas | 19% | 17% | 19% | 33% | 21% | **22%** |
| Sujimon + Tanque | 15% | 21% | 20% | 31% | 22% | **22%** |
| Pokémon + Planta | 35% | 35% | 16% | 1% | 1% | **18%** |
| Deadlock + Criaturinha Bizarra | 38% | 8% | 9% | 15% | 17% | **17%** |

</details>

### Campeões (vitórias de quem aparece nesses times)

Todas as lutas em que o campeão entrou (por um foco ou como complemento), somando os pontos; 30 lutas ou mais. Mistura o campeão com o time em volta: é sinal.

| Campeão | Origem | Custo | Stand | Lutas | Vitórias |
|---|---|---|---|---|---|
| Whitesnake | JoJo | 5 | sim | 510 | 88% |
| Scary Monsters | JoJo | 5 | sim | 574 | 87% |
| Gold Experience | JoJo | 5 | sim | 542 | 87% |
| Blessed Leviathan | Sujimon | 5 |  | 1990 | 80% |
| Slifer the Sky Dragon | Yu-Gi-Oh! | 5 |  | 1866 | 79% |
| Star Platinum | JoJo | 4 | sim | 948 | 77% |
| Red-Eyes Black Dragon | Yu-Gi-Oh! | 4 |  | 1412 | 74% |
| Legendary Excavators ft. Lam-chan & Lun-chan | Sujimon | 5 |  | 1318 | 74% |
| Tyrant of the Tides | Sujimon | 4 |  | 2434 | 74% |
| Orpheus Picaro | Persona | 5 |  | 1230 | 73% |
| Sojimaru v2.1 | Sujimon | 5 |  | 2548 | 73% |
| Daemon | SMT | 5 |  | 1470 | 73% |
| Incubus | SMT | 5 |  | 1928 | 72% |
| Arsène | Persona | 5 |  | 1196 | 72% |
| Labrynth Cooclock | Yu-Gi-Oh! | 4 |  | 1700 | 72% |
| Wraith | Deadlock | 1 |  | 1344 | 29% |
| Strength | JoJo | 1 | sim | 76 | 29% |
| Rat King | Deadlock | 1 |  | 1176 | 28% |
| Ukobach | SMT | 1 |  | 1174 | 28% |
| Mandrake | SMT | 1 |  | 1522 | 28% |
| Wild Hog | Sujimon | 1 |  | 1342 | 28% |
| Tepig | Pokémon | 1 |  | 1566 | 27% |
| Talking Head | JoJo | 1 | sim | 526 | 27% |
| Boy II Man | JoJo | 1 | sim | 530 | 27% |
| Torchic | Pokémon | 1 |  | 926 | 25% |
| Treecko | Pokémon | 1 |  | 974 | 25% |
| Turtwig | Pokémon | 1 |  | 1724 | 24% |
| Bulbasaur | Pokémon | 1 |  | 900 | 21% |
| Chespin | Pokémon | 1 |  | 988 | 19% |
| Snivy | Pokémon | 1 |  | 838 | 18% |

<details><summary>Todos os campeões</summary>

| Campeão | Origem | Custo | Stand | Lutas | Vitórias |
|---|---|---|---|---|---|
| Whitesnake | JoJo | 5 | sim | 510 | 88% |
| Scary Monsters | JoJo | 5 | sim | 574 | 87% |
| Gold Experience | JoJo | 5 | sim | 542 | 87% |
| Blessed Leviathan | Sujimon | 5 |  | 1990 | 80% |
| Slifer the Sky Dragon | Yu-Gi-Oh! | 5 |  | 1866 | 79% |
| Star Platinum | JoJo | 4 | sim | 948 | 77% |
| Red-Eyes Black Dragon | Yu-Gi-Oh! | 4 |  | 1412 | 74% |
| Legendary Excavators ft. Lam-chan & Lun-chan | Sujimon | 5 |  | 1318 | 74% |
| Tyrant of the Tides | Sujimon | 4 |  | 2434 | 74% |
| Orpheus Picaro | Persona | 5 |  | 1230 | 73% |
| Sojimaru v2.1 | Sujimon | 5 |  | 2548 | 73% |
| Daemon | SMT | 5 |  | 1470 | 73% |
| Incubus | SMT | 5 |  | 1928 | 72% |
| Arsène | Persona | 5 |  | 1196 | 72% |
| Labrynth Cooclock | Yu-Gi-Oh! | 4 |  | 1700 | 72% |
| La Jinn the Mystical Genie of the Lamp | Yu-Gi-Oh! | 3 |  | 1510 | 71% |
| Ramattra | Overwatch | 5 |  | 1610 | 71% |
| Tornado Dragon | Yu-Gi-Oh! | 3 |  | 2664 | 71% |
| Blue-Eyes White Dragon | Yu-Gi-Oh! | 5 |  | 1842 | 70% |
| Clockwork Knight | Yu-Gi-Oh! | 4 |  | 1746 | 70% |
| Chucklehead | Sujimon | 3 |  | 1950 | 69% |
| Sojimaru Flying Beta Max | Sujimon | 4 |  | 3452 | 69% |
| City Slicker | Sujimon | 3 |  | 1720 | 68% |
| Timestar Magician | Yu-Gi-Oh! | 5 |  | 2390 | 68% |
| Heavy Machinery | Sujimon | 4 |  | 1882 | 68% |
| Dunsparce | Pokémon | 5 |  | 1090 | 68% |
| Aatrox | LoL | 4 |  | 1586 | 67% |
| Baal Zebul | SMT | 4 |  | 1970 | 67% |
| Malzahar | LoL | 4 |  | 1564 | 67% |
| Cupimon | Digimon | 5 |  | 2640 | 66% |
| Mara | SMT | 5 |  | 1968 | 66% |
| Kazejin | Yu-Gi-Oh! | 2 |  | 1296 | 66% |
| November Rain | JoJo | 4 | sim | 458 | 66% |
| Impmon | Digimon | 4 |  | 1886 | 66% |
| Michion, the Timelord | Yu-Gi-Oh! | 3 |  | 1746 | 66% |
| Izanagi | Persona | 5 |  | 2086 | 65% |
| Zygarde (10%) | Pokémon | 5 |  | 1084 | 65% |
| Maria | SMT | 5 |  | 1630 | 65% |
| Cyber Dragon Nova | Yu-Gi-Oh! | 4 |  | 2286 | 65% |
| Crazy Diamond | JoJo | 4 | sim | 474 | 65% |
| Dirty Deeds Done Dirt Cheap | JoJo | 5 | sim | 276 | 64% |
| Candmon | Digimon | 4 |  | 2330 | 64% |
| Masked Demonling | Sujimon | 2 |  | 1968 | 64% |
| Predaplant Verte Anaconda | Yu-Gi-Oh! | 1 |  | 1174 | 64% |
| Echo | Overwatch | 5 |  | 1076 | 64% |
| Wonder of U | JoJo | 5 | sim | 138 | 64% |
| Harvest | JoJo | 4 | sim | 468 | 64% |
| Fiddlesticks | LoL | 5 |  | 2408 | 64% |
| Abaddon | SMT | 3 |  | 1850 | 63% |
| Armageddon Knight | Yu-Gi-Oh! | 4 |  | 1932 | 63% |
| Cosmog | Pokémon | 5 |  | 1492 | 62% |
| Time Wizard | Yu-Gi-Oh! | 2 |  | 1658 | 62% |
| Dratini | Pokémon | 3 |  | 1458 | 62% |
| Dominion | SMT | 4 |  | 3218 | 62% |
| Black Luster Soldier - Soldier of Chaos | Yu-Gi-Oh! | 3 |  | 1920 | 61% |
| Angel | SMT | 4 |  | 2442 | 61% |
| Mothman | SMT | 4 |  | 2270 | 61% |
| Bystial Magnamhut | Yu-Gi-Oh! | 1 |  | 1168 | 60% |
| Toy Agumon | Digimon | 5 |  | 2598 | 60% |
| Gible | Pokémon | 4 |  | 2000 | 59% |
| Pico Devimon | Digimon | 3 |  | 2490 | 59% |
| Soft & Wet | JoJo | 4 | sim | 492 | 59% |
| Terriermon | Digimon | 4 |  | 3968 | 59% |
| Dark Magician | Yu-Gi-Oh! | 1 |  | 1224 | 59% |
| Deino | Pokémon | 4 |  | 1806 | 59% |
| Kassadin | LoL | 4 |  | 2046 | 59% |
| Rookidee | Pokémon | 3 |  | 1548 | 59% |
| Darkrai | Pokémon | 5 |  | 1180 | 59% |
| Orisa | Overwatch | 3 |  | 1636 | 59% |
| Doctrine | Overwatch | 2 |  | 3132 | 59% |
| D.Va | Overwatch | 4 |  | 3156 | 59% |
| Mei | Overwatch | 5 |  | 2000 | 58% |
| Shuppet | Pokémon | 3 |  | 1520 | 58% |
| Stray Cat | JoJo | 3 | sim | 992 | 58% |
| Shaman | Sujimon | 3 |  | 1466 | 57% |
| Abra | Pokémon | 3 |  | 1132 | 57% |
| Magearna | Pokémon | 5 |  | 1210 | 57% |
| The Winged Dragon of Ra | Yu-Gi-Oh! | 5 |  | 1300 | 57% |
| The Hand | JoJo | 4 | sim | 496 | 57% |
| D.Mon | Overwatch | 3 |  | 1634 | 57% |
| Genji | Overwatch | 3 |  | 1660 | 57% |
| Kintoki-Douji | Persona | 4 |  | 2252 | 57% |
| Black Metal Dragon | Yu-Gi-Oh! | 2 |  | 2698 | 56% |
| Ralts | Pokémon | 3 |  | 1306 | 56% |
| Agumon Hakase | Digimon | 4 |  | 2586 | 56% |
| Mew | Pokémon | 5 |  | 576 | 56% |
| Sham Man Shaman | Sujimon | 2 |  | 1256 | 56% |
| Beach Baller | Sujimon | 4 |  | 3840 | 56% |
| Lamia | SMT | 3 |  | 1506 | 56% |
| Plotmon | Digimon | 4 |  | 2700 | 55% |
| Vel'Koz | LoL | 5 |  | 522 | 55% |
| Mercy | Overwatch | 4 |  | 3260 | 55% |
| The Doorman | Deadlock | 5 |  | 2756 | 54% |
| Time Thief Redoer | Yu-Gi-Oh! | 2 |  | 2628 | 54% |
| Nami | LoL | 5 |  | 2220 | 54% |
| Lifeweaver | Overwatch | 3 |  | 2096 | 54% |
| Zoe | LoL | 5 |  | 1940 | 54% |
| Carvanha | Pokémon | 3 |  | 1498 | 54% |
| Himiko | Persona | 2 |  | 1914 | 53% |
| Pseudotrash | Sujimon | 3 |  | 2218 | 53% |
| Swordsman of Landstar | Yu-Gi-Oh! | 4 |  | 2028 | 53% |
| Crabby Sentinel | Sujimon | 2 |  | 2462 | 53% |
| Juno | Overwatch | 2 |  | 2010 | 53% |
| Orpheus | Persona | 3 |  | 1734 | 53% |
| Zorro | Persona | 2 |  | 2914 | 53% |
| Ekko | LoL | 3 |  | 1646 | 53% |
| Blitzcrank | LoL | 5 |  | 1734 | 53% |
| Jack Frost | SMT | 2 |  | 3770 | 52% |
| Silver Chariot | JoJo | 3 | sim | 506 | 52% |
| Hanuman | SMT | 4 |  | 2756 | 52% |
| Mina | Deadlock | 5 |  | 2856 | 52% |
| Gwen | LoL | 3 |  | 2752 | 52% |
| Patamon | Digimon | 2 |  | 2830 | 52% |
| Zilean | LoL | 2 |  | 1608 | 52% |
| Bastion | Overwatch | 4 |  | 3072 | 51% |
| Echoes | JoJo | 2 | sim | 642 | 51% |
| Gragas | LoL | 4 |  | 2190 | 51% |
| Soraka | LoL | 3 |  | 2082 | 51% |
| Evilswarm Exciton Knight | Yu-Gi-Oh! | 3 |  | 1818 | 51% |
| Eevee | Pokémon | 4 |  | 1762 | 51% |
| Hydra | SMT | 3 |  | 1742 | 51% |
| Guardromon | Digimon | 3 |  | 2280 | 51% |
| Kiriko | Overwatch | 1 |  | 1678 | 51% |
| Vendetta | Overwatch | 4 |  | 2158 | 51% |
| Hey Ya! | JoJo | 1 | sim | 346 | 51% |
| Demeter | SMT | 3 |  | 1500 | 50% |
| Palladion | Persona | 1 |  | 2816 | 50% |
| Tynamo | Pokémon | 4 |  | 1970 | 50% |
| Light Rod Stand | JoJo | 3 | sim | 170 | 50% |
| Black Ooze | SMT | 1 |  | 1774 | 50% |
| Escapist | Sujimon | 1 |  | 1330 | 50% |
| Apollo | Deadlock | 4 |  | 3458 | 49% |
| Graves | Deadlock | 3 |  | 1988 | 49% |
| Niddhoggr | SMT | 3 |  | 2732 | 49% |
| Jetpack Cat | Overwatch | 2 |  | 1150 | 49% |
| Larvesta | Pokémon | 4 |  | 2392 | 49% |
| Cendrillon | Persona | 3 |  | 1606 | 48% |
| Sukuna-Hikona - P4 | Persona | 3 |  | 1268 | 48% |
| Pearl Jam | JoJo | 3 | sim | 150 | 48% |
| Totodile | Pokémon | 2 |  | 1254 | 48% |
| Paige | Deadlock | 3 |  | 2768 | 47% |
| Tubular Bells | JoJo | 1 | sim | 366 | 47% |
| Froakie | Pokémon | 2 |  | 1386 | 47% |
| Buneary | Pokémon | 4 |  | 2232 | 47% |
| Mauga | Overwatch | 5 |  | 2140 | 47% |
| Sex Pistols | JoJo | 3 | sim | 458 | 47% |
| Pro Pickpocket | Sujimon | 1 |  | 1640 | 47% |
| Lalamon | Digimon | 3 |  | 2760 | 46% |
| Obelisk the Tormentor | Yu-Gi-Oh! | 5 |  | 1588 | 46% |
| Lillia | LoL | 3 |  | 1932 | 45% |
| Winston | Overwatch | 4 |  | 3262 | 45% |
| Agumon | Digimon | 2 |  | 2182 | 45% |
| Twitch | LoL | 4 |  | 2286 | 45% |
| Milio | LoL | 3 |  | 1230 | 45% |
| Baby Face | JoJo | 1 | sim | 790 | 45% |
| Civil War | JoJo | 3 | sim | 458 | 45% |
| Wailmer | Pokémon | 4 |  | 2592 | 44% |
| Drifter | Deadlock | 4 |  | 2642 | 44% |
| Foo Fighters (Stand) | JoJo | 2 | sim | 104 | 44% |
| Mermaid | SMT | 2 |  | 2006 | 44% |
| Piplup | Pokémon | 1 |  | 784 | 44% |
| Sudama | SMT | 2 |  | 2180 | 44% |
| Idun | SMT | 1 |  | 1134 | 44% |
| Aurora | LoL | 3 |  | 1898 | 44% |
| Paradox | Deadlock | 3 |  | 3660 | 43% |
| Widowmaker | Overwatch | 2 |  | 2326 | 43% |
| Gurr | SMT | 3 |  | 3136 | 43% |
| Vanillite | Pokémon | 2 |  | 3090 | 43% |
| Bad Company | JoJo | 3 | sim | 468 | 43% |
| Pichu | Pokémon | 1 |  | 1074 | 43% |
| Jinzo | Yu-Gi-Oh! | 1 |  | 1344 | 43% |
| Barong | SMT | 3 |  | 1956 | 43% |
| Volibear | LoL | 4 |  | 1854 | 43% |
| Shinx | Pokémon | 2 |  | 1596 | 43% |
| Reinhardt | Overwatch | 2 |  | 1296 | 43% |
| Chernobog | SMT | 2 |  | 1456 | 42% |
| Red Hot Chili Pepper | JoJo | 2 | sim | 590 | 42% |
| Abrams | Deadlock | 4 |  | 3318 | 42% |
| Orianna | LoL | 1 |  | 1322 | 42% |
| Seven | Deadlock | 5 |  | 2318 | 42% |
| Pixie | SMT | 1 |  | 1906 | 42% |
| Venture | Overwatch | 3 |  | 2422 | 41% |
| Tracer | Overwatch | 1 |  | 2112 | 41% |
| Poppy | LoL | 1 |  | 954 | 41% |
| Baseball Diehard | Sujimon | 1 |  | 488 | 41% |
| Warwick | LoL | 2 |  | 1562 | 41% |
| Lulu | LoL | 2 |  | 1222 | 41% |
| Gate Guardian | Yu-Gi-Oh! | 2 |  | 1216 | 40% |
| Seraphine | LoL | 2 |  | 2104 | 40% |
| Holy's Stand | JoJo | 1 | sim | 502 | 40% |
| Rem | Deadlock | 4 |  | 3924 | 40% |
| Tusk | JoJo | 2 | sim | 532 | 39% |
| Kuriboh | Yu-Gi-Oh! | 1 |  | 518 | 39% |
| Palmon | Digimon | 2 |  | 2682 | 39% |
| Hammered Man | Sujimon | 1 |  | 1430 | 39% |
| Lava Golem | Yu-Gi-Oh! | 2 |  | 2004 | 39% |
| Carmen | Persona | 1 |  | 1484 | 39% |
| Venator | Deadlock | 3 |  | 3248 | 39% |
| Grubbin | Pokémon | 1 |  | 1548 | 39% |
| Ball Breaker | JoJo | 2 | sim | 530 | 39% |
| Big Shield Gardna | Yu-Gi-Oh! | 3 |  | 1828 | 39% |
| Vindicta | Deadlock | 2 |  | 2922 | 38% |
| Hatenna | Pokémon | 2 |  | 1110 | 38% |
| Bounsweet | Pokémon | 3 |  | 2692 | 38% |
| Gabumon | Digimon | 2 |  | 1774 | 38% |
| Punimon | Digimon | 1 |  | 1768 | 38% |
| Garen | LoL | 3 |  | 1756 | 38% |
| Squirtle | Pokémon | 1 |  | 1320 | 38% |
| Machop | Pokémon | 3 |  | 2150 | 38% |
| Roadhog | Overwatch | 1 |  | 1276 | 37% |
| Tentomon | Digimon | 2 |  | 1914 | 37% |
| Tyumon | Digimon | 1 |  | 1330 | 37% |
| Oshawott | Pokémon | 1 |  | 688 | 37% |
| Dark Magician Girl | Yu-Gi-Oh! | 1 |  | 466 | 37% |
| Dine-and-Dasher | Sujimon | 2 |  | 1524 | 37% |
| Cyndaquil | Pokémon | 2 |  | 1510 | 37% |
| Solosis | Pokémon | 2 |  | 1386 | 37% |
| Violet | Deadlock | 3 |  | 1740 | 36% |
| Yamato | Deadlock | 1 |  | 2850 | 36% |
| Litten | Pokémon | 2 |  | 1676 | 36% |
| Yuumi | LoL | 1 |  | 1008 | 36% |
| McGinnis | Deadlock | 2 |  | 2956 | 35% |
| Shakomon | Digimon | 1 |  | 802 | 35% |
| Captain Kidd | Persona | 1 |  | 1280 | 35% |
| Caitlyn | LoL | 1 |  | 1030 | 35% |
| Timburr | Pokémon | 2 |  | 1408 | 35% |
| Pupitar | Pokémon | 4 |  | 2480 | 35% |
| Honedge | Pokémon | 2 |  | 1374 | 35% |
| Ahri | LoL | 2 |  | 1364 | 35% |
| Charmander | Pokémon | 1 |  | 956 | 35% |
| Kai'Sa | LoL | 1 |  | 1670 | 34% |
| Sona | LoL | 1 |  | 996 | 34% |
| Metallica | JoJo | 2 | sim | 128 | 34% |
| Mudkip | Pokémon | 1 |  | 1608 | 34% |
| Shion | Overwatch | 1 |  | 1000 | 34% |
| Whismur | Pokémon | 1 |  | 192 | 34% |
| Ivy | Deadlock | 2 |  | 1604 | 34% |
| Ana | Overwatch | 1 |  | 928 | 34% |
| Popplio | Pokémon | 1 |  | 900 | 33% |
| Cait Sith | SMT | 1 |  | 1182 | 33% |
| Lash | Deadlock | 1 |  | 1234 | 33% |
| Elecmon | Digimon | 1 |  | 1658 | 33% |
| Jinx | LoL | 2 |  | 1556 | 32% |
| Akali | LoL | 1 |  | 1002 | 32% |
| Chikorita | Pokémon | 2 |  | 2490 | 32% |
| Sandile | Pokémon | 3 |  | 1330 | 32% |
| Fennekin | Pokémon | 1 |  | 1290 | 32% |
| Aron | Pokémon | 3 |  | 1682 | 32% |
| Vyper | Deadlock | 2 |  | 2978 | 32% |
| Chimchar | Pokémon | 1 |  | 1468 | 30% |
| Rowlet | Pokémon | 2 |  | 1950 | 30% |
| Roggenrola | Pokémon | 1 |  | 1748 | 30% |
| Baba | Deadlock | 1 |  | 626 | 29% |
| Wraith | Deadlock | 1 |  | 1344 | 29% |
| Strength | JoJo | 1 | sim | 76 | 29% |
| Rat King | Deadlock | 1 |  | 1176 | 28% |
| Ukobach | SMT | 1 |  | 1174 | 28% |
| Mandrake | SMT | 1 |  | 1522 | 28% |
| Wild Hog | Sujimon | 1 |  | 1342 | 28% |
| Tepig | Pokémon | 1 |  | 1566 | 27% |
| Talking Head | JoJo | 1 | sim | 526 | 27% |
| Boy II Man | JoJo | 1 | sim | 530 | 27% |
| Torchic | Pokémon | 1 |  | 926 | 25% |
| Treecko | Pokémon | 1 |  | 974 | 25% |
| Turtwig | Pokémon | 1 |  | 1724 | 24% |
| Bulbasaur | Pokémon | 1 |  | 900 | 21% |
| Chespin | Pokémon | 1 |  | 988 | 19% |
| Snivy | Pokémon | 1 |  | 838 | 18% |

</details>

### 2 Stands num time normal

O mesmo time de campeões normais, com 2 trocados por 2 Stands presos a 2 dos que ficam, contra ele sem Stand. Passar muito de 50% faria todo mundo querer Stand.

| Tabuleiro | Estrela | Lutas | Vitórias do time com Stands |
|---|---|---|---|
| 4 | ★2 | 240 | 45% |
| 6 | ★2 | 240 | 53% |
| 8 | ★2 | 240 | 53% |
| 10 | ★2 | 240 | 45% |

## Itens

Um portador sorteado (custo 2 a 4, ★2, sem Stands) com 3 bonecos; o outro lado é o mesmo time sem o item. "Vale" = bônus de vida e dano só no portador que empata (90 cenários). Em negrito: mais de 1,6× longe da mediana do grupo.

### Componentes (mediana +5%)

| Item | Id | Vitórias | Vale |
|---|---|---|---|
| Aurelus | aurelus | 70% | +7% |
| Pyrus | pyrus | 75% | +5% |
| Haos | haos | 67% | +5% |
| Darkus | darkus | 64% | +5% |
| Ventus | ventus | 72% | +5% |
| Subterra | subterra | 67% | +3% |
| Aquos | aquos | 55% | +1% |

### Completos (mediana +21%)

| Item | Id | Vitórias | Vale |
|---|---|---|---|
| Pyravian | pyrus+aurelus | 97% | **+37%** |
| Drago | pyrus+pyrus | 99% | +34% |
| Skyress | ventus+ventus | 97% | +34% |
| Nobilious | aurelus+aurelus | 94% | +32% |
| Falconeer | pyrus+ventus | 99% | +30% |
| Griffon | pyrus+haos | 100% | +28% |
| Saurus | pyrus+subterra | 99% | +28% |
| Tigrerra | haos+haos | 95% | +28% |
| Fear Ripper | pyrus+darkus | 99% | +27% |
| Pegatrix X Aurelus | haos+aurelus | 97% | +27% |
| Gargonoid | darkus+ventus | 98% | +27% |
| Hammersaur | haos+darkus | 97% | +25% |
| Monarus | haos+ventus | 98% | +25% |
| Jelldon | aquos+haos | 92% | +21% |
| Hydranoid | darkus+darkus | 92% | +21% |
| Gorem | subterra+subterra | 89% | +21% |
| Limulus | aquos+darkus | 89% | +19% |
| Hydorous X Aurelus | aquos+aurelus | 91% | +19% |
| Dragonoid X Darkus | darkus+aurelus | 88% | +19% |
| El Condor | subterra+ventus | 93% | +19% |
| Serpenoid | aquos+subterra | 93% | +18% |
| Tayghen | aquos+ventus | 95% | +18% |
| Hynoid | haos+subterra | 84% | +18% |
| Goreene | subterra+aurelus | 85% | +18% |
| Howlkor X Aurelus | ventus+aurelus | 95% | +18% |
| Wormquake | darkus+subterra | 84% | +16% |
| Siege | pyrus+aquos | 88% | +14% |
| Preyas | aquos+aquos | 79% | +14% |

**Longe da mediana:** Pyravian +37%.

## Ouro no chão (passivas)

Regra: ao lançar a habilidade (50%) e no golpe que derruba um inimigo (50%), chance de derrubar 1 de ouro, até 2/3/4 por luta. Alvo: perto de 1 de ouro por luta por campeão desses. Rodízio = lutas da força por campeão; partidas = por unidade-luta nas partidas de bots (com dois no mesmo lado, o ouro do lado é dividido).

| Campeão | Passiva | Ouro/luta rodízio ★1 | ★2 | Lutas nas partidas | Ouro/luta partidas |
|---|---|---|---|---|---|
| Harvest | Achados | 0,83 | 0,83 | 373 | 0,74 |
| Pro Pickpocket | Mão Leve | 1,33 | 1,40 | 2342 | 1,32 |
| Pseudotrash | Catador | 1,02 | 1,31 | 1022 | 0,97 |
| Agumon Hakase | Ouro de Numemon | 0,89 | 1,22 | 395 | 0,83 |
| Rat King | Tesouro do Rei Rato | 0,90 | 1,17 | 3115 | 0,82 |

## Partidas de bots

240 partidas de 8 bots (sementes 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240); duram 36,1 rodadas em média e acabam no estágio 6,2. 17% das lutas entre jogadores vão até os 30 s. As taxas misturam o efeito do traço/item com a força do tabuleiro de quem o tem (sinal, não medida isolada; essa é a das seções acima).

### Vitórias com o traço ativo (degrau mais alto atingido; 30 lutas ou mais)

| Traço | Degrau | Lutas | Vitórias |
|---|---|---|---|
| Persona | 5 | 104 | 99% |
| Temporais | 3 | 47 | 98% |
| Deadlock | 6 | 238 | 97% |
| Anjo | 6 | 87 | 95% |
| Overwatch | 7 | 43 | 91% |
| Overwatch | 5 | 232 | 90% |
| Anjo | 5 | 94 | 89% |
| Anjo | 4 | 60 | 85% |
| Vento | 6 | 43 | 84% |
| Assassino | 6 | 48 | 83% |
| Vento | 4 | 77 | 83% |
| Persona | 4 | 83 | 82% |
| Assassino | 5 | 184 | 81% |
| Anjo | 3 | 41 | 80% |
| Terra | 4 | 30 | 80% |
| Demoníacos | 6 | 40 | 80% |
| Demoníacos | 4 | 87 | 79% |
| Assassino | 4 | 321 | 79% |
| Deadlock | 5 | 260 | 78% |
| Raio | 5 | 57 | 75% |
| Vento | 3 | 158 | 75% |
| Anjo | 2 | 347 | 73% |
| Sujimon | 6 | 296 | 73% |
| Sujimon | 5 | 269 | 72% |
| Raio | 4 | 76 | 71% |
| Yu-Gi-Oh! | 7 | 226 | 71% |
| Sujimon | 4 | 252 | 71% |
| Demoníacos | 3 | 37 | 70% |
| SMT | 6 | 103 | 70% |
| Água | 6 | 492 | 69% |
| Vento | 2 | 781 | 69% |
| Yu-Gi-Oh! | 5 | 631 | 69% |
| Temporais | 2 | 374 | 68% |
| Fogo | 5 | 82 | 68% |
| Assassino | 3 | 530 | 68% |
| Água | 5 | 549 | 68% |
| Overwatch | 4 | 280 | 66% |
| Dragão | 5 | 60 | 65% |
| Persona | 2 | 419 | 64% |
| Demoníacos | 2 | 786 | 62% |
| Porradeiro | 4 | 555 | 62% |
| Digimon | 5 | 156 | 61% |
| Porradeiro | 6 | 230 | 61% |
| Planta | 4 | 604 | 60% |
| Tanque | 2 | 1921 | 60% |
| Dragão | 4 | 131 | 60% |
| Robô | 2 | 445 | 59% |
| Atirador | 7 | 173 | 59% |
| Planta | 5 | 294 | 59% |
| Overwatch | 3 | 701 | 58% |
| Digimon | 4 | 195 | 58% |
| Sujimon | 3 | 303 | 58% |
| Criaturinha Bizarra | 7 | 219 | 58% |
| Água | 4 | 624 | 57% |
| Fogo | 4 | 391 | 57% |
| Safada | 7 | 201 | 57% |
| Assassino | 2 | 921 | 56% |
| Atirador | 3 | 1548 | 56% |
| Overwatch | 2 | 2257 | 56% |
| Porradeiro | 3 | 448 | 56% |
| Gelo | 2 | 391 | 55% |
| Persona | 3 | 114 | 55% |
| LoL | 7 | 236 | 55% |
| Atirador | 4 | 1088 | 55% |
| Persona | 1 | 5767 | 55% |
| Dragão | 2 | 848 | 55% |
| Atirador | 2 | 2482 | 55% |
| Porradeiro | 2 | 2334 | 54% |
| Fadinhas | 6 | 133 | 54% |
| Safada | 5 | 977 | 54% |
| Digimon | 3 | 461 | 54% |
| Fadinhas | 2 | 2663 | 53% |
| Sujimon | 2 | 941 | 53% |
| Atirador | 5 | 1315 | 53% |
| Dragão | 3 | 309 | 53% |
| JoJo | 4 | 84 | 52% |
| Yu-Gi-Oh! | 2 | 941 | 52% |
| Planta | 3 | 1225 | 51% |
| Digimon | 2 | 1713 | 51% |
| Digimon | 6 | 92 | 51% |
| Yu-Gi-Oh! | 3 | 801 | 51% |
| Deadlock | 4 | 344 | 51% |
| Fogo | 2 | 3744 | 51% |
| Deadlock | 2 | 2019 | 50% |
| Pokémon | 2 | 10141 | 50% |
| Fadinhas | 3 | 1316 | 50% |
| Raio | 2 | 1613 | 49% |
| SMT | 4 | 451 | 49% |
| SMT | 2 | 3232 | 49% |
| Fogo | 3 | 1289 | 49% |
| Pokémon | 4 | 6593 | 49% |
| Deadlock | 3 | 735 | 48% |
| Água | 2 | 3647 | 48% |
| LoL | 5 | 616 | 48% |
| LoL | 2 | 2473 | 48% |
| Planta | 2 | 4084 | 47% |
| Pokémon | 9 | 153 | 47% |
| SMT | 3 | 958 | 47% |
| Fadinhas | 4 | 871 | 47% |
| Pokémon | 6 | 5306 | 46% |
| Safada | 3 | 1485 | 46% |
| Safada | 4 | 687 | 45% |
| Raio | 3 | 259 | 44% |
| JoJo | 3 | 528 | 43% |
| Terra | 2 | 1173 | 43% |
| Água | 3 | 1371 | 43% |
| Tanque | 3 | 510 | 43% |
| JoJo | 2 | 1665 | 42% |
| Tanque | 6 | 72 | 42% |
| Criaturinha Bizarra | 4 | 1735 | 41% |
| LoL | 3 | 1730 | 41% |
| Pokémon | 8 | 1069 | 40% |
| Criaturinha Bizarra | 5 | 1440 | 40% |
| Criaturinha Bizarra | 3 | 2499 | 39% |
| Tanque | 4 | 432 | 37% |
| Terra | 3 | 140 | 34% |

### Vitórias com o item em alguém do time (30 lutas ou mais)

| Item | Lutas | Vitórias |
|---|---|---|
| Pyravian | 5258 | 57% |
| Serpenoid | 5449 | 56% |
| Drago | 2498 | 54% |
| Tigrerra | 2665 | 54% |
| Nobilious | 2719 | 54% |
| Falconeer | 5023 | 53% |
| Hydorous X Aurelus | 5062 | 53% |
| Saurus | 5031 | 53% |
| Hynoid | 4835 | 53% |
| Limulus | 5103 | 53% |
| Fear Ripper | 5458 | 52% |
| Ventus | 5524 | 52% |
| Gargonoid | 4959 | 52% |
| Preyas | 2901 | 52% |
| El Condor | 5000 | 52% |
| Monarus | 5109 | 52% |
| Howlkor X Aurelus | 5228 | 52% |
| Griffon | 4601 | 52% |
| Tayghen | 5207 | 52% |
| Pyrus | 5394 | 51% |
| Dragonoid X Darkus | 4870 | 51% |
| Jelldon | 4822 | 51% |
| Pegatrix X Aurelus | 5189 | 51% |
| Subterra | 5374 | 51% |
| Wormquake | 4942 | 51% |
| Hydranoid | 2695 | 50% |
| Siege | 4471 | 50% |
| Hammersaur | 4766 | 50% |
| Darkus | 5008 | 50% |
| Aquos | 5456 | 50% |
| Gorem | 2603 | 50% |
| Skyress | 2951 | 49% |
| Haos | 5492 | 49% |
| Aurelus | 4827 | 48% |
| Goreene | 4560 | 48% |

### Rodadas de monstros (vitórias dos jogadores)

| Rodada | Lutas | Vitórias |
|---|---|---|
| 1-1 | 1920 | 100% |
| 1-2 | 1920 | 100% |
| 1-3 | 1920 | 100% |
| 2-7 | 1920 | 99% |
| 3-7 | 1920 | 58% |
| 4-7 | 1663 | 30% |
| 5-7 | 793 | 36% |
| 6-7 | 119 | 32% |

### Colocação pela origem mais usada (do estágio 3 em diante)

| Origem | Jogadores | Colocação média | Entre os 4 primeiros |
|---|---|---|---|
| Persona | 29 | 2,45 | 86% |
| Sujimon | 63 | 3,19 | 76% |
| Overwatch | 108 | 3,27 | 73% |
| Yu-Gi-Oh! | 93 | 3,87 | 60% |
| Deadlock | 130 | 3,93 | 58% |
| Digimon | 83 | 4,20 | 58% |
| SMT | 163 | 4,67 | 46% |
| Pokémon | 974 | 4,75 | 46% |
| LoL | 188 | 4,91 | 39% |
| JoJo | 89 | 5,47 | 34% |

### Em campo por nível

| Nível | Jogador-rodadas | Unidades em média | Stands em média | Máximo |
|---|---|---|---|---|
| 1 | 1920 | 1,0 | 0,0 | 1 |
| 2 | 1920 | 2,0 | 0,0 | 2 |
| 3 | 1920 | 3,0 | 0,1 | 3 |
| 4 | 5760 | 4,0 | 0,2 | 4 |
| 5 | 9600 | 5,0 | 0,2 | 5 |
| 6 | 11520 | 6,0 | 0,3 | 6 |
| 7 | 13076 | 7,0 | 0,4 | 7 |
| 8 | 8992 | 8,0 | 0,4 | 8 |
| 9 | 2055 | 9,0 | 0,3 | 9 |
| 10 | 2 | 10,0 | 0,5 | 10 |

### Almas do Deadlock (jogadores com o traço ativo, por estágio)

| Estágio | Jogador-rodadas | Almas em média |
|---|---|---|
| 1 | 87 | 1,0 |
| 2 | 597 | 7,0 |
| 3 | 934 | 16,2 |
| 4 | 1178 | 31,4 |
| 5 | 962 | 60,2 |
| 6 | 426 | 97,0 |
| 7 | 28 | 82,8 |

## Invariantes

Conferidos em cada rodada das partidas de bots (invariantes.ts): lugares das unidades, limite do tabuleiro, Stands, pool, ouro, vida, nível, itens e o resultado de cada luta. Partidas que não terminaram: 0. Erros do conteúdo durante a luta: 0.

Nenhum invariante quebrado.

<!-- histórico: daqui pra baixo é escrito à mão; o playtest mantém -->


## Histórico de ajustes

### 09/11/2026: medida maior e patch de números

Pedido do usuário: mais partidas e combinações, depois um patch só de números, buffando o que está fraco. Medido: 240 partidas de 8 bots (eram 24), mais 80 em cada dificuldade só pra conferir invariantes, e a medida nova **Composições forçadas** (124 focos: 10 origens, 19 classes/elementos e 95 pares origem + classe, em 5 pontos de tabuleiro/estrela, cerca de 30 mil lutas). "Antes" é o código do começo desta rodada; quatro rodadas de ajuste, sempre com a semente 2026.

Mudanças (buffs; os nerfs vêm depois):

| O quê | Antes | Depois | Motivo |
|---|---|---|---|
| Base custo 3 / 4 / 5 (vida, dano) | 720, 61 / 850, 75 / 1000, 90 | 750, 63 / 910, 80 / 1110, 98 | estrela valia mais que custo (77%) |
| Papel Atirador (vida) / Porradeiro (dano) | ×0,75 / ×1,05 | ×0,80 / ×1,10 | classes puras no fundo (18% e 32%) |
| Charme (Safada) | 250/375/560% | 300/450/675% | ult mais fraca do rodízio (36%) |
| Pacto Sombrio / Golpe Fatal | 260/390/590 / 300/450/675% | 300/450/680 / 340/510/770% | 41% e 41% |
| Pancadão / Tornado / Bola de Fogo | 200/300/450 / 240/360/540 / 210/315/470% | 230/345/520 / 280/420/630 / 240/360/540% | abaixo de 45% |
| Coisa Esquisita (gosma) / Parar o Tempo (dano) | 300/450/675 / 60/90/135% | 330/500/740 / 80/120/180% | 44% e 46% |
| Anubis | 180/270/400%, mana 80 | 300/450/675%, mana 70 | 15% no rodízio |
| Baba / Diehard / Mascot | 120/180/270 / 140/210/320 / 260/390/590% | 160/240/360 / 220/330/500 / 320/480/720% | 17% a 22% |
| Metallica / Echoes / Foo / Holy / Wonder / The Hand | 200/300/450 / 200/300/450 / 80/120/180 / 30/45/70 / 120/180/270 / 300/450/675% | 320/480/720 / 300/450/675 / 120/180/270 / 45/65/100 / 160/240/360 / 360/540/810% | Stands no fundo |
| Tanque (traço) | +20/30/40/70/100% | +50/65/75/90/115% | degraus baixos valiam +3% |
| Porradeiro (traço, vida) | +15/22/30/50/65/80% | +20/28/36/55/70/85% | |
| Fadinhas / Safada / Atirador | 4/6/8/14/18/22 · 15/21/27/40/55/70 · 3/4,5/6/7/9 | 5/8/10/16/20/24 · 18/24/30/42/55/70 · 4/5,5/7/8/10 | degraus baixos |
| Anjo | 40/45/50/65/80% | 60/70/70/80/90% | +5% e +3% nos 2 primeiros |
| Temporais / Fogo / Terra / Planta | 6/9/12/18 · 1/2/3/3,5/4 · 30/60/100 · 2/3,5/4,5/5,5 | 7/10/13/18 · 1,5/2,5/3,5/4/4,5 · 50/80/120 · 2,5/4/5/6,5 | |
| Pokémon (por Pokémon) | 1/1,5/2/2,5/3/3,5% | 2/2,4/3/3,2/3,6/4% | abaixo do meio até o 8 |
| Digimon | 8/12/18/25/35% | 16/22/30/38/50% | compensa o corte na ★2 (abaixo) |
| Persona / JoJo | 8/14/20/28/38 · 25/30/40/48/55 | 10/16/22/30/40 · 25/35/46/50/55 | JoJo: o degrau de 2 fica por causa do splash |
| LoL (poder) | 10/15/22/30/40/50% | 20/30/42/55/70/85% | +3 a +11% de equivalente |
| Overwatch (vel. ataque) | 6/10/15/20/28% | 10/15/20/27/36% | 23% no 10 ★3 |
| Deadlock (por 10 almas) | 1,5/2/2,5/3/4% | 2/2,5/3/4/5% | só age fora da luta; ver abaixo |
| Yu-Gi-Oh! (degraus de baixo) | 10/15/22% | 14/20/27% | 9% e 15% no começo |

Nerfs, à parte:

| O quê | Antes | Depois | Motivo |
|---|---|---|---|
| Forma que só ataca, ★2 | +28% | +24% | com o bônus de evoluir, 90% no rodízio |
| Evoluir Digimon, ★2 | +12% | +6% | idem (Numemon, Garurumon, Vegimon, Devimon) |
| Demoníacos (traço, 6/8/10) | 25/27/30%, e 15/20% no 3 e 4 | 20/22/25%, e 14/18% | focado em 77%, pares até 97% |
| Yu-Gi-Oh! (7/9/10 cartas) | 30/40/50% | 22/27/33% | 98% no tabuleiro de 10 |
| Sujimon | 10/15/22/30/40% | 6/10/15/24/34% | 2,9ª posição e 82%–90% no time cheio |
| Tusk / Ball Breaker | 22/32/50 / 150/225/340% | 20/29/45 / 135/200/300% | 80%+ entre Stands (papel Atirador) |
| Chefe (recalibração) | vida 3200, dano 210, ×1,34 | vida 3400, dano 225, ×1,27 | o patch deixou o time do estágio 3 mais forte |

Resultado (antes → depois):

| Medida | Antes | Depois |
|---|---|---|
| Origens, time cheio (4★1/6★2/8★2/10★2/10★3) | ver abaixo | |
| Pokémon | 53/50/39/55/57 | 58/48/37/49/56 |
| Digimon | 42/50/41/41/46 | 45/44/35/37/52 |
| SMT | 70/64/64/54/46 | 68/59/64/52/45 |
| Persona | 37/48/44/48/53 | 38/43/49/52/53 |
| JoJo | 34/37/41/52/60 | 30/40/47/54/58 |
| Yu-Gi-Oh! | 51/45/78/98/93 | 50/47/64/87/79 |
| LoL | 38/36/36/29/51 | 42/46/47/48/69 |
| Overwatch | 58/53/56/41/23 | 64/59/65/51/31 |
| Deadlock (sem almas) | 36/28/22/5/3 | 34/30/25/4/3 |
| Sujimon | 82/90/80/78/68 | 71/84/68/66/54 |
| Campeões fora de 35–65% no rodízio | 105 de 474 | 63 de 474 |
| Formas só-ataca acima de 65% | 41 | 22 |
| ★2 custo 2 / custo 3 contra ★1 custo 4 / custo 5 | 72% / 77% | 38% / 46% |
| ★3 custo 1 / custo 2 contra ★2 custo 3 / custo 4 | 71% / 77% | 63% / 63% |
| Traços focados fora de 35–65% (média) | 12 de 29 | 9 de 29 |
| 2 Stands num time normal (4/6/8/10) | 41/55/56/43 | 45/53/53/45 |
| Chefe 3-7 / 4-7 / 5-7 (vitória dos jogadores) | 61/23/23% | 58/30/36% |
| Duração | 35,4 rodadas | 36,1 rodadas |
| Colocação (origem mais usada) | Persona 2,9 … JoJo 5,7 | Persona 2,5 … JoJo 5,5 |

#### O que continua fora e por quê

- **Deadlock (5% no 10 ★2 sem almas):** o traço não age dentro da luta. Nas partidas ele junta 34 almas no estágio 4, 69 no 5 e 124 no 6 (+18% a +60% de vida e dano com os números novos) e acaba em 3,9ª; subir mais o bônus fora da luta não é necessário agora.
- **Pares origem + classe:** 47 de 95 fora de 35–65% (eram 43). Dois traços empilhados vão pros extremos, e o fundo são times sem dano (Tanque, Planta). Traço com poucos campeões caros (Planta, Terra, Gelo) cai no tabuleiro de 10 por custo, não por número: fica pra decisão de set.
- **Sujimon e Yu-Gi-Oh!** seguem no topo do time cheio com tabuleiro cheio (84% e 87%): os equivalentes do traço já estão abaixo da mediana, o resto é elenco. **Tanque puro** (18%) não tem dano.
- **Rodízio:** 22 formas ★2 só-ataca seguem em 70–78% (Doctrine, Machoke, Togemon, McGinnis) e Kirlia/Kadabra/Angemon ★2 em 23–27%; é o papel da forma.

#### Bugs encontrados

- **Texto do Tusk** dizia 30/45/70% (números de antes do nerf de 04/11), o código usava 22/32/50%: o texto agora sai das constantes. Teste em `simulacao.test.ts`.
- **Playtest fora de ordem:** as partidas do `partidas.ts` planejavam os bots com o carrossel ainda aberto (no jogo real o carrossel fecha antes), então os bots só usavam o campeão e o item do carrossel na rodada seguinte. Corrigido antes de medir.
- Nenhum invariante quebrado em 400 partidas (3 dificuldades, 1 luta em 40 conferida quadro a quadro): pool, limite, Stands, ouro, itens. Conferência nova em `invariantes.ts`.

### 05/11/2026: depois de jogar

Feedback do usuário: começar com dois campeões não foi boa ideia; gente demais de longe; JoJo forte demais porque o
tabuleiro passa do limite; vale um buff no escalonamento de Pokémon e Digimon; traços grandes merecem mais degraus. O
"antes" é o código do começo desta rodada, com as mesmas sementes. Mudanças, em `combate/atributos.ts`,
`partida/consultas.ts`, `partida/monstros.ts` e `conteudo/tracos.ts`; decisões e motivos no roadmap.

| Medida | Antes | Depois |
|---|---|---|
| Limite do tabuleiro | nível + 1 | nível, com todo Stand ocupando vaga |
| Bônus do JoJo por degrau | +6 / 10 / 13 / 16 / 18% (2/3/5/7/9/10) | +25 / 30 / 40 / 48 / 55% (2/3/4/5/6) |
| Máximo de unidades em campo nas partidas de bots | 19 | 12 |
| Formas de longe | 408 de 592 (69%) | 306 de 592 (52%) |
| Time cheio de JoJo (4 ★1, 6 ★2, 8 ★2, 10 ★2, 10 ★3) | 99 / 99 / 99 / 99 / 99% | 34 / 37 / 41 / 52 / 60% |
| Colocação de quem mais usa JoJo (bots quase não usam Stand) | 2,79 | 5,90 |
| Time cheio de Pokémon | 46 / 38 / 31 / 42 / 39% | 53 / 50 / 39 / 55 / 57% |
| Time cheio de Digimon | 34 / 30 / 28 / 26 / 16% | 42 / 50 / 41 / 41 / 46% |
| Evoluir no Pokémon (★1 → ★2, ★2 → ★3) | +84%, +84% | +91%, +91% |
| Evoluir no Digimon | +78%, +53% | +97%, +84% |
| Chefe na 3-7, 4-7 e 5-7 (vitória dos jogadores) | 64 / 31 / 37% | 60 / 29 / 36% |
| Duração | 33,6 rodadas | 35,5 rodadas |
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
