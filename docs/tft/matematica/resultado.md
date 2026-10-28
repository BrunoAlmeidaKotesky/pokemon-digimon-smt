# Resultado: equilíbrio do Set 1

Gerado por `node docs/tft/matematica/analise.mjs` em 2026-10-28, com a exportação do Catálogo de 2026-10-28. Método e fórmulas: [README.md](README.md). Escolhas que entram na conta: breakpoints 2/4/6, tabuleiro de 9, loja de 5 vagas, tolerância de 25% no custo.

## Resumo

- **Tamanho certo de um traço:** 27,2 campeões; aceitável de 23 a 33 (custo de fechar 6 até 25% longe).
- **Yu-Gi-Oh!:** 27 cartas (23 a 33), com 34 vagas de classe: Temporais 11, Dragão 9, Assassino 8, Robô 3 e Tanque 3; nada nas outras. E 11 de elemento: Terra 5, Gelo 4 e Vento 2 (seção 3).
- **Classes depois disso:** de 23 a 39. Acima da faixa: Criaturinha Bizarra (35, sobram 2), Fadinhas (36, sobram 3) e Safada (39, sobram 6); só tirando a classe de quem tem outra.
- **Elementos:** uns 16 cada; com 2/4/6 custam 1,85× pra fechar 6. Escada própria 2/3/4, ou 4 elementos.
- **Origens fora da faixa:** Pokémon (55), Persona (12), Deadlock (21) e Sujimon (20): escada própria ou mudar o tamanho (seção 5).

## 1. O que temos
Campeão = uma linha evolutiva (cada forma é um nível: o Ivysaur é o nível 2 do Bulbasaur) ou um personagem solto. As 530 formas marcadas dão **245 campeões** em 9 franquias. Yu-Gi-Oh! ainda não tem ninguém marcado; nas contas entra com 27 (seção 3).

| Origem | Formas | Linhas | Soltos | Campeões | Só com elemento | Só Únicos | Sem nada |
|---|---|---|---|---|---|---|---|
| Pokémon | 166 | 52 | 3 | 55 | 15 | 1 | 0 |
| Digimon | 83 | 19 | 4 | 23 | 1 | 0 | 0 |
| SMT | 85 | 24 | 4 | 28 | 1 | 0 | 0 |
| Persona | 37 | 12 | 0 | 12 | 0 | 0 | 0 |
| JoJo | 38 | 4 | 27 | 31 | 2 | 3 | 0 |
| LoL | 31 | 0 | 31 | 31 | 0 | 1 | 0 |
| Overwatch | 24 | 0 | 24 | 24 | 0 | 0 | 0 |
| Deadlock | 21 | 0 | 21 | 21 | 0 | 1 | 0 |
| Sujimon | 45 | 14 | 6 | 20 | 2 | 1 | 0 |
| **Total** | 530 | 125 | 120 | **245** | 21 | 7 | 0 |

Traços: 9 origens (10 com Yu-Gi-Oh!), 12 classes, 7 elementos (Fogo, Água, Terra, Vento, Raio, Gelo, Planta; 2 ficaram de fora) e Únicos, que não junta ninguém. Por campeão: **1,24 classes** (28 com 0, 146 com 1, 55 com 2, 15 com 3, 1 com 4) e **0,40 elementos**.

## 2. A régua: quanto custa fechar um breakpoint
Pra ter b campeões diferentes de um traço que tem n, num pool de 272, esperam-se (272/5)·Σ_{j<b} 1/(n − j) lojas (cada vaga mostra um campeão qualquer; a conta está no README e a simulação loja a loja confere). O custo só depende de n: **equilíbrio é todo traço com a mesma escada ter o mesmo n**. O tamanho certo é o de uma origem média, n* = 272 ÷ 10 = **27,2**. Lojas pra fechar cada breakpoint, por tamanho do traço:

| Campeões no traço | Fechar 2 | Fechar 4 | Fechar 6 | Custo de fechar 6 (1 = tamanho certo) |
|---|---|---|---|---|
| 12 | 9,5 | 21,0 | 35,5 | 2,68× |
| 16 | 7,0 | 15,1 | 24,6 | 1,85× |
| 23 | 4,8 | 10,1 | 16,0 | 1,21× |
| 27 | 4,1 | 8,5 | 13,4 | 1,01× |
| 33 | 3,3 | 6,9 | 10,7 | 0,81× |
| 40 | 2,8 | 5,7 | 8,7 | 0,66× |
| 55 | 2,0 | 4,1 | 6,2 | 0,47× |

**Faixa aceitável: de 23 a 33 campeões por traço.** Abaixo de 23, fechar 6 custa mais de 1,25× o de um traço do tamanho certo; acima de 33, menos de 0,80×. Traço grande demais não obriga breakpoint maior (o tabuleiro tem 9): ele só fica barato, e a comp dele fica forte demais.

## 3. Yu-Gi-Oh!: quantas cartas e que classes
**Cartas:** 27 campeões (tamanho de uma origem média, 245 ÷ 9); qualquer número de 23 a 33 fica na faixa. Carta com evolução (uma linha) conta como um.
**Classes:** com 1,24 classes por campeão, como o resto do set, as 27 cartas dão **34 vagas de classe** (quase todas com 1 classe, uma em cada 4 com 2). A conta dá cada vaga pra classe que estiver menor no momento: é a divisão que deixa a classe mais cara de fechar o mais barata possível.

| Classe | Hoje | Yu-Gi-Oh! recebe | Depois | Custo de fechar 6 | Situação |
|---|---|---|---|---|---|
| Temporais | 12 | 11 | 23 | 1,21× | na faixa |
| Dragão | 14 | 9 | 23 | 1,21× | na faixa |
| Assassino | 15 | 8 | 23 | 1,21× | na faixa |
| Robô | 20 | 3 | 23 | 1,21× | na faixa |
| Tanque | 20 | 3 | 23 | 1,21× | na faixa |
| Anjo | 23 | — | 23 | 1,21× | na faixa |
| Atirador | 26 | — | 26 | 1,05× | na faixa |
| Demoníacos | 32 | — | 32 | 0,84× | na faixa |
| Porradeiro | 33 | — | 33 | 0,81× | na faixa |
| Criaturinha Bizarra | 35 | — | 35 | 0,76× | acima da faixa: sobram 2 (17 têm outra classe) |
| Fadinhas | 36 | — | 36 | 0,74× | acima da faixa: sobram 3 (22 têm outra classe) |
| Safada | 39 | — | 39 | 0,67× | acima da faixa: sobram 6 (22 têm outra classe) |

Pra todas as classes entrarem na faixa só com Yu-Gi-Oh!, são 34 vagas; pra todas chegarem a 27 (o centro), 59, ou 2,2 classes por carta. Criaturinha Bizarra, Fadinhas e Safada já passam da faixa sem o Yu-Gi-Oh!: carta nova não resolve, só tirar a classe de quem tem outra (a coluna diz quantos).

Uma classe que fica quase toda numa franquia vira uma segunda origem e não cruza com as outras (seção 6). Se a cota de uma classe pequena ficar grande demais pro Yu-Gi-Oh!, o resto dela pode vir dos campeões das outras franquias que hoje só têm elemento (21).

**Elementos:** com 0,40 elemento por campeão, as 27 cartas dão **11 vagas de elemento**, divididas do mesmo jeito.

| Elemento | Hoje | Yu-Gi-Oh! recebe | Depois |
|---|---|---|---|
| Terra | 10 | 5 | 15 |
| Gelo | 10 | 4 | 14 |
| Vento | 13 | 2 | 15 |
| Raio | 14 | — | 14 |
| Planta | 16 | — | 16 |
| Fogo | 18 | — | 18 |
| Água | 18 | — | 18 |

Mesmo assim cada elemento fica com uns 16 campeões, abaixo da faixa: com 2/4/6, fechar 6 custa 1,85× o de uma classe. Duas saídas: (a) elementos com escada própria, **2/3/4** (custo de cada degrau: 1,72× · 1,29× · 1,14×); ou (b) menos elementos: com as vagas de hoje, o número que deixa cada um do tamanho certo é 4,0.

## 4. Quantas classes e quantos elementos
Cada campeão entra em 1 origem, c classes e e elementos, então as vagas somam U·(1 + c + e). Com todo traço do tamanho n*: **classes = origens × c** e **elementos = origens × e**.

|  | Valor |
|---|---|
| Origens | 10 |
| n* (campeões por traço) | 27,2 |
| Classes ideais (1,24 por campeão) | 12,4 |
| Elementos ideais (0,40 por campeão) | 4,0 |
| Elementos ideais se todo campeão tiver 1 | 10 |

**12 classes estão certas** (a conta pede 12,4). Os 7 elementos pedem mais campeões com elemento (0,70 por campeão, hoje 0,40) ou a escada própria da seção 3.

## 5. Origens: o tamanho é fixo, então a escada muda
Uma franquia com mais campeões fecha 2/4/6 mais barato. Pra igualar, a escada de cada origem sobe ou desce até o custo de cada degrau ficar o mais perto do de uma origem média (27,2 campeões com 2/4/6), sem passar do tabuleiro (9).

| Origem | Campeões | Custo de fechar 6 com 2/4/6 | Escada que iguala | Custo de cada degrau (1 = igual) |
|---|---|---|---|---|
| Pokémon | 55 | 0,47× | 4/8/9 | 1,00× · 1,00× · 0,72× |
| Digimon | 23 | 1,21× | 2/3/5 | 1,19× · 0,88× · 0,98× |
| SMT | 28 | 0,97× | 2/4/6 | 0,97× · 0,97× · 0,97× |
| Persona | 12 | 2,68× | 1/2/3 | 1,11× · 1,12× · 1,12× |
| JoJo | 31 | 0,87× | 2/5/7 | 0,88× · 1,11× · 1,03× |
| LoL | 31 | 0,87× | 2/5/7 | 0,88× · 1,11× · 1,03× |
| Overwatch | 24 | 1,15× | 2/4/5 | 1,14× · 1,14× · 0,93× |
| Deadlock | 21 | 1,34× | 2/3/5 | 1,30× · 0,96× · 1,08× |
| Sujimon | 20 | 1,42× | 2/3/4 | 1,37× · 1,01× · 0,89× |
| Yu-Gi-Oh! (a escolher) | 27 | 1,01× | 2/4/6 | 1,01× · 1,01× · 1,01× |

Pokémon não se iguala nem com a escada no limite do tabuleiro. Persona só se iguala com um degrau 1 (ativo com um campeão só). A alternativa à escada é mexer no tamanho: de 23 a 33 campeões, a origem usa 2/4/6.

## 6. Comps que fecham origem e classe juntas
Pra fechar 6 de uma origem e 4 de uma classe em 9 vagas, pelo menos 1 campeão precisa ter as duas; pra 6 e 6, 3. Com as classes de hoje (sem o Yu-Gi-Oh!), em quantas das 12 classes cada origem consegue isso:

| Origem | 6 + 4 (≥ 1 em comum) | 6 + 6 (≥ 3 em comum) | Classe mais concentrada nela |
|---|---|---|---|
| Pokémon | 11 | 8 | Dragão: 7 de 14 |
| Digimon | 10 | 7 | Anjo: 5 de 23 |
| SMT | 12 | 8 | Demoníacos: 10 de 32 |
| Persona | 9 | 1 | Assassino: 2 de 15 |
| JoJo | 8 | 5 | Temporais: 4 de 12 |
| LoL | 11 | 4 | Fadinhas: 11 de 36 |
| Overwatch | 10 | 6 | Robô: 6 de 20 |
| Deadlock | 11 | 6 | Assassino: 3 de 15 |
| Sujimon | 9 | 3 | Dragão: 3 de 14 |

Com tudo do tamanho certo e as classes espalhadas, uma origem e uma classe têm em média n*·n*/272 = 2,7 campeões em comum. Dá 6 + 4 com quase qualquer par; 6 + 6 (3 em comum) fica no limite: sai quando a classe tem um pouco mais daquela origem que a média.
