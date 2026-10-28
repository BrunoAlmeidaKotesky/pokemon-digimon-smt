# Resultado: equilíbrio do Set 1

Gerado por `node docs/tft/matematica/analise.mjs` em 2026-10-28. Método e fórmulas: [README.md](README.md). Escolhas que entram na conta: breakpoints 2/4/6, tabuleiro de 9, loja de 5 vagas.

## Resumo

- **Classes:** 12 é o número certo (a conta pede 14,0; 12,6 sem o Yu-Gi-Oh!). Falta equilibrar o tamanho: cada uma com 38 campeões (30 sem o Yu-Gi-Oh!). Hoje vão de 0 a 42 (seção 4).
- **Elementos:** 9 é o número certo **se forem o 3º traço de todo mundo** (a conta pede 10; 9 sem o Yu-Gi-Oh!), com 36 campeões cada. Como classe reserva, não: as classes ficariam com 22 campeões e custariam 1,57× uma origem pra fechar 6 (seção 3).
- **Origens:** a média é 32,2 campeões. Fechar 6 custa mais de 1,35× ou menos de 0,75× o da média em Pokémon (57), Digimon (23), Persona (12), Overwatch (24), Deadlock (21), Sujimon (20) e Yu-Gi-Oh! (70). Ou a escada de cada uma muda, ou o tamanho (seção 5).

## 1. O que temos
Campeão = uma linha evolutiva (cada forma é um nível: o Ivysaur é o nível 2 do Bulbasaur) ou um personagem solto. As 595 formas do grupo "Set 1 (base)" dão **322 campeões** (252 sem os 70 candidatos do Yu-Gi-Oh!, que ainda não têm classe). Bakugan (itens) e Final Fantasy (monstros) não são campeões.

| Origem | Formas | Linhas | Soltos | Campeões | Sem classe |
|---|---|---|---|---|---|
| Pokémon | 156 | 48 | 9 | 57 | 31 |
| Digimon | 83 | 19 | 4 | 23 | 5 |
| SMT | 87 | 24 | 6 | 30 | 2 |
| Persona | 37 | 12 | 0 | 12 | 3 |
| JoJo | 40 | 4 | 29 | 33 | 12 |
| LoL | 32 | 0 | 32 | 32 | 8 |
| Overwatch | 24 | 0 | 24 | 24 | 7 |
| Deadlock | 21 | 0 | 21 | 21 | 3 |
| Sujimon | 45 | 14 | 6 | 20 | 13 |
| Yu-Gi-Oh! | 70 | 0 | 70 | 70 | 70 |
| **Total** | 595 | 121 | 201 | **322** | 154 |

Traços: 10 origens, 12 classes (Demoníacos, Criaturinha Bizarra, Fadinhas, Safada, Atirador, Anjo, Robô, Dragão, Temporais, Tanque, Porradeiro, Assassino), 9 elementos e Únicos (que não junta ninguém: cada um é um traço próprio). Quem tem classe tem em média **1,40 classes** (113 com 1, 48 com 2, 6 com 3, 1 com 9). Baba (Deadlock) tem 9: provavelmente marcado por engano, e puxa a média pra cima.

## 2. A régua: quanto custa fechar um breakpoint
Pra ter b campeões diferentes de um traço que tem n, num pool de 322, esperam-se (322/5)·Σ_{j<b} 1/(n − j) lojas (cada vaga mostra um campeão qualquer; a conta está no README e a simulação loja a loja confere). O custo só depende de n: **equilíbrio é todo traço com a mesma escada ter o mesmo n**. Lojas pra fechar cada breakpoint, por tamanho do traço:

| Campeões no traço | Fechar 2 | Fechar 4 | Fechar 6 |
|---|---|---|---|
| 12 | 11,2 | 24,8 | 42,1 |
| 20 | 6,6 | 14,0 | 22,3 |
| 32 | 4,1 | 8,5 | 13,1 |
| 40 | 3,3 | 6,7 | 10,3 |
| 57 | 2,3 | 4,6 | 7,1 |
| 70 | 1,9 | 3,8 | 5,7 |

## 3. Quantas classes e quantos elementos
As origens são fixas (uma por franquia), então o tamanho certo de um traço é o tamanho médio de uma origem: n* = campeões ÷ origens = 322 ÷ 10 = **32,2**. Cada campeão entra em 1 origem, c classes e e elementos, então as vagas somam 322·(1 + c + e). Com todo traço do tamanho n*: **classes = origens × c** e **elementos = origens × e**.

|  | Com o Yu-Gi-Oh! (322) | Sem o Yu-Gi-Oh! (252) |
|---|---|---|
| Origens | 10 | 9 |
| n* (campeões por traço) | 32,2 | 28,0 |
| Classes ideais, 1 classe por campeão | 10 | 9 |
| Classes ideais, 1,40 por campeão (como hoje) | 14,0 | 12,6 |
| Campeões por classe, com as 12 de hoje | 37,7 | 29,5 |
| Elementos ideais, 1 por campeão (3º traço de todo mundo) | 10 | 9 |
| Campeões por elemento, com os 9 de hoje | 35,8 | 28,0 |

**12 classes estão certas**: a conta pede 14,0 (12,6 sem o Yu-Gi-Oh!). **9 elementos também**, se forem o 3º traço de todo mundo: a conta pede 10 (9 sem o Yu-Gi-Oh!), e cada um fica com 36 campeões, custando 0,89× uma origem média pra fechar 6.

Como **classe reserva** (só pra quem não tem classe), os elementos dividem com as classes as mesmas 452 vagas: 21 traços de 21,5 campeões, e fechar 6 custa 1,57× o de uma origem. Fica desequilibrado contra as origens; pra caber como reserva, a soma de classes e elementos teria de ficar em 14.

## 4. Cada classe hoje contra o tamanho certo
Com 1,40 classes por campeão e 12 classes, cada uma deveria ter **38 campeões** (quando todos os 322 tiverem classe). A coluna da direita diz quantas vezes mais caro (ou mais barato, abaixo de 1) é fechar 6 nela do que numa classe do tamanho certo.

| Classe | Campeões hoje | Tamanho certo | Falta (+) ou sobra (−) | Custo de fechar 6 |
|---|---|---|---|---|
| Demoníacos | 31 | 38 | +7 | 1,24× |
| Criaturinha Bizarra | 36 | 38 | +2 | 1,05× |
| Fadinhas | 35 | 38 | +3 | 1,08× |
| Safada | 42 | 38 | -4 | 0,89× |
| Atirador | 26 | 38 | +12 | 1,50× |
| Anjo | 23 | 38 | +15 | 1,72× |
| Robô | 19 | 38 | +19 | 2,15× |
| Dragão | 12 | 38 | +26 | 3,82× |
| Temporais | 12 | 38 | +26 | 3,82× |
| Tanque | 0 | 38 | +38 | não fecha |
| Porradeiro | 0 | 38 | +38 | não fecha |
| Assassino | 0 | 38 | +38 | não fecha |

Hoje 154 campeões estão sem classe: são eles que completam as classes que faltam (as 11 com "+" somam 224 vagas). Elementos: nenhum dado ainda; o tamanho certo de cada um é 36.

## 5. Origens: o tamanho é fixo, então a escada muda
Uma franquia com mais campeões fecha 2/4/6 mais barato. Pra igualar, a escada de cada origem sobe ou desce até o custo de cada degrau ficar o mais perto do de uma origem média (32,2 campeões com 2/4/6), sem passar do tabuleiro (9).

| Origem | Campeões | Custo de fechar 6 com 2/4/6 | Escada que iguala | Custo de cada degrau (1 = igual) |
|---|---|---|---|---|
| Pokémon | 57 | 0,54× | 4/7/9 | 1,14× · 0,99× · 0,84× |
| Digimon | 23 | 1,45× | 2/3/4 | 1,41× · 1,05× · 0,92× |
| SMT | 30 | 1,08× | 2/4/6 | 1,07× · 1,08× · 1,08× |
| Persona | 12 | 3,22× | 1/2/3 | 1,32× · 1,34× · 1,35× |
| JoJo | 33 | 0,97× | 2/4/6 | 0,98× · 0,97× · 0,97× |
| LoL | 32 | 1,01× | 2/4/6 | 1,01× · 1,01× · 1,01× |
| Overwatch | 24 | 1,39× | 2/3/5 | 1,35× · 1,00× · 1,13× |
| Deadlock | 21 | 1,61× | 1/3/4 | 0,75× · 1,15× · 1,02× |
| Sujimon | 20 | 1,71× | 1/3/4 | 0,79× · 1,21× · 1,07× |
| Yu-Gi-Oh! | 70 | 0,44× | 4/9 | 0,93× · 1,05× |

Pokémon e Yu-Gi-Oh! não se igualam nem com a escada no limite do tabuleiro: o último degrau fica mais barato, ou falta degrau. Persona, Deadlock e Sujimon só se igualam com um degrau 1 (ativo com um campeão só). Nesses casos, a alternativa à escada é mexer no tamanho: com 32 campeões por franquia, todas usam 2/4/6.

## 6. Comps que fecham origem e classe juntas
Pra fechar 6 de uma origem e 4 de uma classe em 9 vagas, pelo menos 1 campeão precisa ter as duas; pra 6 e 6, 3. Com as classes de hoje, em quantas das 12 classes cada origem consegue isso:

| Origem | 6 + 4 (≥ 1 em comum) | 6 + 6 (≥ 3 em comum) | Em comum por classe, em média |
|---|---|---|---|
| Pokémon | 8 | 6 | 3,5 |
| Digimon | 9 | 4 | 1,4 |
| SMT | 9 | 6 | 1,8 |
| Persona | 6 | 1 | 0,7 |
| JoJo | 6 | 4 | 2,0 |
| LoL | 8 | 3 | 2,0 |
| Overwatch | 7 | 5 | 1,5 |
| Deadlock | 9 | 8 | 1,3 |
| Sujimon | 4 | 2 | 1,2 |
| Yu-Gi-Oh! | 0 | 0 | 4,3 |

Com tudo do tamanho certo e as classes espalhadas pelas franquias, uma origem e uma classe têm em média n*·n_classe/322 = 3,8 campeões em comum: dá 6 + 6 em 9 vagas com quase qualquer par. Classe concentrada numa franquia só vira uma "sub-origem" e não cruza.
