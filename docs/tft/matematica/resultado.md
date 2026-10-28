# Resultado: equilíbrio do Set 1

Gerado por `node docs/tft/matematica/analise.mjs` em 2026-10-28, com a exportação do Catálogo de 2026-10-28. Método e fórmulas: [README.md](README.md). Escolhas que entram na conta: breakpoints 2/4/6, tabuleiro de 9, loja de 5 vagas, tolerância de 25% no custo.

## Resumo

- **Tamanho certo de um traço:** 27,8 campeões; aceitável de 23 a 34 (custo de fechar 6 até 25% longe).
- **Classes:** de 19 a 39. Fora da faixa: Criaturinha Bizarra (sobram 5), Fadinhas (sobram 1), Safada (sobram 4), Porradeiro (sobram 1), Anjo (faltam 1), Dragão (faltam 1), Temporais (faltam 4) e Assassino (faltam 4) (seção 3).
- **Elementos:** uns 15 cada; com 2/4/6 custam 2,05× pra fechar 6. Escada própria 2/3/4, ou 4 elementos. Entre si, fora: Fogo (sobram 2), Terra (faltam 2) e Gelo (faltam 2) (seção 4).
- **Origens fora da faixa:** Pokémon (55), Persona (12), Deadlock (21) e Sujimon (20): escada própria ou mudar o tamanho (seção 6).
- **Loja:** pelo critério (menor m1 + m2 sem perder variedade), o melhor desenho é **7 vagas + peso 4 pro dono + vaga do time**: 2 cópias a mais de um campeão do tabuleiro em 7,8 lojas e um campeão novo do traço em 5,3, contra 12,3 e 6,5 com 6 vagas + peso 3 e 40,5 e 7,3 na loja normal de 5. O critério premia sempre mais vagas e mais peso; o teto vem da economia, que falta (seção 8).

## 1. O que temos
Campeão = uma linha evolutiva (cada forma é um nível: o Ivysaur é o nível 2 do Bulbasaur) ou um personagem solto (que sobe de estrela, como os do LoL e as cartas do Yu-Gi-Oh!). As 563 formas marcadas dão **278 campeões** em 10 franquias.

| Origem | Formas | Linhas | Soltos | Campeões | Só com elemento | Só Únicos | Sem nada |
|---|---|---|---|---|---|---|---|
| Pokémon | 166 | 52 | 3 | 55 | 16 | 1 | 0 |
| Digimon | 83 | 19 | 4 | 23 | 1 | 0 | 0 |
| SMT | 85 | 24 | 4 | 28 | 1 | 0 | 0 |
| Persona | 37 | 12 | 0 | 12 | 0 | 0 | 0 |
| JoJo | 38 | 4 | 27 | 31 | 2 | 3 | 0 |
| Yu-Gi-Oh! | 33 | 0 | 33 | 33 | 3 | 0 | 0 |
| LoL | 31 | 0 | 31 | 31 | 0 | 1 | 0 |
| Overwatch | 24 | 0 | 24 | 24 | 0 | 0 | 0 |
| Deadlock | 21 | 0 | 21 | 21 | 0 | 1 | 0 |
| Sujimon | 45 | 14 | 6 | 20 | 2 | 1 | 0 |
| **Total** | 563 | 125 | 153 | **278** | 25 | 7 | 0 |

Traços: 10 origens, 12 classes, 7 elementos (Fogo, Água, Terra, Vento, Raio, Gelo, Planta; 2 ficaram de fora) e Únicos, que não junta ninguém. Por campeão: **1,21 classes** (32 com 0, 171 com 1, 62 com 2, 12 com 3, 1 com 4) e **0,38 elementos**.

## 2. A régua: quanto custa fechar um breakpoint
Pra ter b campeões diferentes de um traço que tem n, num pool de 278, esperam-se (278/5)·Σ_{j<b} 1/(n − j) lojas (cada vaga mostra um campeão qualquer; a conta está no README e a simulação loja a loja confere). O custo só depende de n: **equilíbrio é todo traço com a mesma escada ter o mesmo n**. O tamanho certo é o de uma origem média, n* = 278 ÷ 10 = **27,8**. Lojas pra fechar cada breakpoint, por tamanho do traço:

| Campeões no traço | Fechar 2 | Fechar 4 | Fechar 6 | Custo de fechar 6 (1 = tamanho certo) |
|---|---|---|---|---|
| 12 | 9,7 | 21,4 | 36,3 | 2,74× |
| 16 | 7,2 | 15,4 | 25,1 | 1,90× |
| 23 | 4,9 | 10,4 | 16,4 | 1,24× |
| 28 | 4,0 | 8,4 | 13,1 | 0,99× |
| 34 | 3,3 | 6,9 | 10,6 | 0,80× |
| 40 | 2,8 | 5,8 | 8,9 | 0,67× |
| 55 | 2,0 | 4,2 | 6,4 | 0,48× |

**Faixa aceitável: de 23 a 34 campeões por traço.** Abaixo de 23, fechar 6 custa mais de 1,25× o de um traço do tamanho certo; acima de 34, menos de 0,80×. Traço grande demais não obriga breakpoint maior (o tabuleiro tem 9): ele só fica barato, e a comp dele fica forte demais.

## 3. Classes contra a faixa (23 a 34)
Todas as franquias têm campeões marcados. Cada classe contra a faixa, e o que mexer pra ela entrar:

| Classe | Campeões | Custo de fechar 6 | Situação |
|---|---|---|---|
| Temporais | 19 | 1,54× | faltam 4 |
| Assassino | 19 | 1,54× | faltam 4 |
| Anjo | 22 | 1,30× | faltam 1 |
| Dragão | 22 | 1,30× | faltam 1 |
| Robô | 23 | 1,24× | na faixa |
| Tanque | 23 | 1,24× | na faixa |
| Atirador | 27 | 1,03× | na faixa |
| Demoníacos | 33 | 0,83× | na faixa |
| Fadinhas | 35 | 0,78× | sobram 1 (20 têm outra classe) |
| Porradeiro | 35 | 0,78× | sobram 1 (17 têm outra classe) |
| Safada | 38 | 0,71× | sobram 4 (22 têm outra classe) |
| Criaturinha Bizarra | 39 | 0,69× | sobram 5 (16 têm outra classe) |

**O que mexer:** trocar a classe de 10 campeões, de Criaturinha Bizarra (5), Fadinhas (1), Safada (4) e Porradeiro (1) pra Anjo (1), Dragão (1), Temporais (4) e Assassino (4); e tirar a classe de mais 1 que têm outra. Quem dá pra trocar sem ficar sem classe (tem outra):

- **Criaturinha Bizarra:** Hi Andromon (Digimon: Robô); Metal Etemon (Digimon: Robô, Porradeiro); EBEmon (X-Antibody) (Digimon: Robô); Justimon(Critical Arm) (Digimon: Atirador, Porradeiro); Baphomet (SMT: Demoníacos, Safada); King Frost (SMT: Demoníacos); Yamata-no-Orochi (SMT: Demoníacos, Dragão); Cironnup (SMT: Fadinhas, Atirador); Nekomata (SMT: Assassino); Fionn mac Cumhaill (SMT: Demoníacos, Porradeiro, Assassino); The World Over Heaven (JoJo: Temporais, Porradeiro); Baby Face (JoJo: Safada); Labrynth Cooclock (Yu-Gi-Oh!: Temporais); Fiddlesticks (LoL: Demoníacos); Vyper (Deadlock: Atirador); Rem (Deadlock: Fadinhas)

- **Fadinhas:** Gallade (Pokémon: Safada, Porradeiro); Lunala (Pokémon: Demoníacos); Rosemon (Digimon: Safada, Porradeiro); Ofanimon (Digimon: Safada, Anjo); Marin Angemon (Digimon: Safada); Alice (SMT: Demoníacos, Safada); Isis (SMT: Safada); Cironnup (SMT: Criaturinha Bizarra, Atirador); Fortuna (SMT: Temporais); Aurora (LoL: Safada); Lillia (LoL: Safada); Nami (LoL: Safada); Seraphine (LoL: Safada); Soraka (LoL: Anjo); Zoe (LoL: Anjo); Juno (Overwatch: Safada); Kiriko (Overwatch: Safada); Lifeweaver (Overwatch: Anjo); Mercy (Overwatch: Anjo); Rem (Deadlock: Criaturinha Bizarra)

- **Safada:** Gallade (Pokémon: Fadinhas, Porradeiro); Rosemon (Digimon: Fadinhas, Porradeiro); Ofanimon (Digimon: Fadinhas, Anjo); Marin Angemon (Digimon: Fadinhas); Adramelech (SMT: Demoníacos); Alice (SMT: Demoníacos, Fadinhas); Baphomet (SMT: Demoníacos, Criaturinha Bizarra); Nuwa -Snake- (SMT: Dragão); Isis (SMT: Fadinhas); Satan (SMT: Demoníacos); Baby Face (JoJo: Criaturinha Bizarra); Aurora (LoL: Fadinhas); Gwen (LoL: Assassino); Kai'Sa (LoL: Atirador); Lillia (LoL: Fadinhas); Nami (LoL: Fadinhas); Seraphine (LoL: Fadinhas); D.Va (Overwatch: Robô); Juno (Overwatch: Fadinhas); Kiriko (Overwatch: Fadinhas); Tracer (Overwatch: Atirador); Widowmaker (Overwatch: Atirador)

- **Porradeiro:** Machamp (Pokémon: Tanque); Gallade (Pokémon: Fadinhas, Safada); Emboar (Pokémon: Tanque); Metal Garurumon (Digimon: Robô); Rosemon (Digimon: Fadinhas, Safada); Metal Etemon (Digimon: Criaturinha Bizarra, Robô); Justimon(Critical Arm) (Digimon: Criaturinha Bizarra, Atirador); Futsunushi (SMT: Tanque, Assassino); Zeus (SMT: Dragão); Yoshitsune (SMT: Assassino); Fionn mac Cumhaill (SMT: Demoníacos, Criaturinha Bizarra, Assassino); Melchizedek (SMT: Robô); William (Persona: Atirador); Made in Heaven (JoJo: Temporais); The World Over Heaven (JoJo: Criaturinha Bizarra, Temporais); Star Platinum (JoJo: Temporais); Winston (Overwatch: Tanque)

## 4. Elementos
Com 0,38 elemento por campeão, cada elemento fica com uns 15 campeões, abaixo da faixa das classes: com 2/4/6, fechar 6 custa 2,05× o de uma classe. Duas saídas: (a) elementos com escada própria, **2/3/4** (custo de cada degrau contra o da classe: 1,88× · 1,41× · 1,25×); ou (b) menos elementos: com as vagas de hoje, o número que deixa cada um do tamanho de uma classe é 3,8.
Com a escada própria, entre si os elementos ficam iguais quando cada um tem de 13 a 18 (fechar 4 até 25% longe da média deles).

| Elemento | Campeões | Situação |
|---|---|---|
| Terra | 11 | faltam 2 |
| Gelo | 11 | faltam 2 |
| Raio | 15 | na faixa |
| Vento | 16 | na faixa |
| Planta | 16 | na faixa |
| Água | 18 | na faixa |
| Fogo | 20 | sobram 2 |

## 5. Quantas classes e quantos elementos
Cada campeão entra em 1 origem, c classes e e elementos, então as vagas somam U·(1 + c + e). Com todo traço do tamanho n*: **classes = origens × c** e **elementos = origens × e**.

|  | Valor |
|---|---|
| Origens | 10 |
| n* (campeões por traço) | 27,8 |
| Classes ideais (1,21 por campeão) | 12,1 |
| Elementos ideais (0,38 por campeão) | 3,8 |
| Elementos ideais se todo campeão tiver 1 | 10 |

**12 classes estão certas** (a conta pede 12,1). Os 7 elementos pedem mais campeões com elemento (0,70 por campeão, hoje 0,38) ou a escada própria da seção 4.

## 6. Origens: o tamanho é fixo, então a escada muda
Uma franquia com mais campeões fecha 2/4/6 mais barato. Pra igualar, a escada de cada origem sobe ou desce até o custo de cada degrau ficar o mais perto do de uma origem média (27,8 campeões com 2/4/6), sem passar do tabuleiro (9).

| Origem | Campeões | Custo de fechar 6 com 2/4/6 | Escada que iguala | Custo de cada degrau (1 = igual) |
|---|---|---|---|---|
| Pokémon | 55 | 0,48× | 4/8/9 | 1,02× · 1,02× · 0,74× |
| Digimon | 23 | 1,24× | 2/3/5 | 1,21× · 0,90× · 1,00× |
| SMT | 28 | 0,99× | 2/4/6 | 0,99× · 0,99× · 0,99× |
| Persona | 12 | 2,74× | 1/2/3 | 1,14× · 1,14× · 1,15× |
| JoJo | 31 | 0,89× | 2/4/7 | 0,90× · 0,89× · 1,05× |
| Yu-Gi-Oh! | 33 | 0,83× | 2/5/7 | 0,84× · 1,06× · 0,98× |
| LoL | 31 | 0,89× | 2/4/7 | 0,90× · 0,89× · 1,05× |
| Overwatch | 24 | 1,18× | 2/3/5 | 1,16× · 0,86× · 0,96× |
| Deadlock | 21 | 1,37× | 2/3/5 | 1,33× · 0,99× · 1,11× |
| Sujimon | 20 | 1,45× | 2/3/4 | 1,40× · 1,04× · 0,91× |

Pokémon não se iguala nem com a escada no limite do tabuleiro. Persona só se iguala com um degrau 1 (ativo com um campeão só). A alternativa à escada é mexer no tamanho: de 23 a 34 campeões, a origem usa 2/4/6.

## 7. Comps que fecham origem e classe juntas
Pra fechar 6 de uma origem e 4 de uma classe em 9 vagas, pelo menos 1 campeão precisa ter as duas; pra 6 e 6, 3. Com as classes de hoje, em quantas das 12 classes cada origem consegue isso:

| Origem | 6 + 4 (≥ 1 em comum) | 6 + 6 (≥ 3 em comum) | Classe mais concentrada nela |
|---|---|---|---|
| Pokémon | 10 | 8 | Dragão: 7 de 22 |
| Digimon | 10 | 7 | Anjo: 5 de 22 |
| SMT | 12 | 8 | Demoníacos: 10 de 33 |
| Persona | 9 | 1 | Anjo: 3 de 22 |
| JoJo | 8 | 5 | Porradeiro: 8 de 35 |
| Yu-Gi-Oh! | 11 | 6 | Temporais: 7 de 19 |
| LoL | 11 | 4 | Fadinhas: 10 de 35 |
| Overwatch | 10 | 6 | Robô: 6 de 23 |
| Deadlock | 11 | 6 | Atirador: 5 de 27 |
| Sujimon | 9 | 3 | Robô: 4 de 23 |

Com tudo do tamanho certo e as classes espalhadas, uma origem e uma classe têm em média n*·n*/278 = 2,8 campeões em comum. Dá 6 + 4 com quase qualquer par; 6 + 6 (3 em comum) fica no limite: sai quando a classe tem um pouco mais daquela origem que a média.

## 8. Loja: que desenho junta cópias e acha o traço mais rápido
Os custos ainda não existem, então cada rodada divide os 278 campeões ao acaso em 5 custos de tamanho igual (56 e 55) e olha um deles; cada vaga cai nesse custo com 55% de chance (o custo 1 no nível 4 do TFT, de referência). O jogador simulado escolhe um traço T (origem ou classe com pelo menos 8 campeões) e tem 7 campeões de T ao acaso no tabuleiro, de qualquer custo; os que caíram no custo olhado são os **donos**. Em média, 63% do custo divide origem ou classe com o tabuleiro. **Cópias infinitas: o pool não esvazia.** Média de 20000 rodadas, as mesmas em todos os desenhos (semente fixa; trocar a semente muda m1 + m2 em uns 1%); m1 conta só as 15825 com dono no custo, m2 só as 19345 com algum campeão de T fora do tabuleiro no custo.

Desenhos: 5, 6 e 7 vagas; **peso do dono** (o campeão que o jogador já tem pesa isso no sorteio do custo, os outros 1); **vaga do time** (uma das vagas sorteia só entre os campeões do custo que dividem origem ou classe com o tabuleiro); e, de ideia extra, **peso 2 pro time** (quem divide origem ou classe com o tabuleiro pesa 2 em toda vaga). Medidas: **m1** = lojas pra juntar 2 cópias a mais de um dono (a 2 estrelas); **m2** = lojas até aparecer um campeão de T que não está no tabuleiro; **m3** = campeões diferentes fora do tabuleiro por loja, nesse custo (opção de mudar de comp). Ordenado por m1 + m2; em negrito, a loja normal, a de 6 vagas + peso 3 e a melhor.

| Desenho | m1 | m2 | m1 + m2 | m3 | m3 contra a loja normal |
|---|---|---|---|---|---|
| **7 vagas + peso 4 pro dono + vaga do time** | 7,8 | 5,3 | **13,1** | 3,38 | 128% |
| 7 vagas + peso 4 pro dono | 8,3 | 5,7 | 14,1 | 3,41 | 129% |
| 6 vagas + peso 4 pro dono + vaga do time | 8,8 | 6,1 | 14,9 | 2,91 | 110% |
| 7 vagas + peso 3 pro dono + vaga do time | 9,8 | 5,2 | 15,1 | 3,47 | 132% |
| 6 vagas + peso 4 pro dono | 9,6 | 6,6 | 16,1 | 2,94 | 112% |
| 7 vagas + peso 3 pro dono | 10,6 | 5,7 | 16,3 | 3,48 | 132% |
| 7 vagas + peso 4 pro dono + peso 2 pro time | 12,6 | 4,5 | 17,1 | 3,52 | 133% |
| 6 vagas + peso 3 pro dono + vaga do time | 11,4 | 5,9 | 17,2 | 2,98 | 113% |
| 5 vagas + peso 4 pro dono + vaga do time | 10,3 | 7,0 | 17,3 | 2,43 | 92% |
| **6 vagas + peso 3 pro dono** | 12,3 | 6,5 | **18,8** | 3,00 | 114% |
| 7 vagas + peso 2 pro dono + vaga do time | 14,1 | 5,1 | 19,2 | 3,55 | 135% |
| 5 vagas + peso 4 pro dono | 11,4 | 7,9 | 19,3 | 2,46 | 93% |
| 6 vagas + peso 4 pro dono + peso 2 pro time | 14,6 | 5,2 | 19,9 | 3,03 | 115% |
| 5 vagas + peso 3 pro dono + vaga do time | 13,1 | 6,8 | 20,0 | 2,49 | 95% |
| 7 vagas + peso 2 pro dono | 15,4 | 5,4 | 20,8 | 3,56 | 135% |
| 7 vagas + peso 3 pro dono + peso 2 pro time | 16,3 | 4,5 | 20,9 | 3,57 | 135% |
| 6 vagas + peso 2 pro dono + vaga do time | 16,2 | 5,8 | 22,0 | 3,05 | 116% |
| 5 vagas + peso 3 pro dono | 14,6 | 7,7 | 22,2 | 2,52 | 96% |
| 5 vagas + peso 4 pro dono + peso 2 pro time | 17,6 | 6,1 | 23,7 | 2,54 | 96% |
| 6 vagas + peso 3 pro dono + peso 2 pro time | 18,9 | 5,1 | 24,0 | 3,07 | 117% |
| 6 vagas + peso 2 pro dono | 17,8 | 6,3 | 24,1 | 3,07 | 116% |
| 5 vagas + peso 2 pro dono + vaga do time | 18,9 | 6,6 | 25,6 | 2,55 | 97% |
| 7 vagas + peso 2 pro dono + peso 2 pro time | 23,7 | 4,5 | 28,2 | 3,62 | 137% |
| 5 vagas + peso 3 pro dono + peso 2 pro time | 22,6 | 6,1 | 28,7 | 2,57 | 98% |
| 5 vagas + peso 2 pro dono | 21,2 | 7,6 | 28,8 | 2,57 | 98% |
| 7 vagas + vaga do time | 26,6 | 4,9 | 31,5 | 3,64 | 138% |
| 6 vagas + peso 2 pro dono + peso 2 pro time | 27,5 | 5,1 | 32,6 | 3,12 | 118% |
| 7 vagas | 29,1 | 5,4 | 34,5 | 3,64 | 138% |
| 6 vagas + vaga do time | 30,7 | 5,6 | 36,4 | 3,13 | 119% |
| 5 vagas + peso 2 pro dono + peso 2 pro time | 33,2 | 6,0 | 39,2 | 2,61 | 99% |
| 6 vagas | 33,7 | 6,2 | 39,9 | 3,14 | 119% |
| 5 vagas + vaga do time | 36,2 | 6,4 | 42,6 | 2,62 | 100% |
| **5 vagas** | 40,5 | 7,3 | **47,8** | 2,63 | 100% |
| 7 vagas + peso 2 pro time | 46,4 | 4,3 | 50,8 | 3,67 | 139% |
| 6 vagas + peso 2 pro time | 53,9 | 5,0 | 58,8 | 3,16 | 120% |
| 5 vagas + peso 2 pro time | 64,6 | 5,9 | 70,5 | 2,65 | 101% |

**Melhor pelo critério (README, conta 10): 7 vagas + peso 4 pro dono + vaga do time.** m1 + m2 = 13,1 lojas (m1 7,8, m2 5,3), 31% menos que a de 6 vagas + peso 3 (18,8: m1 12,3, m2 6,5) e 73% menos que a loja normal de 5 vagas (47,8: m1 40,5, m2 7,3), com m3 em 128% do da loja normal.

Por quê: cada vaga e cada ponto de peso do dono a mais baixam m1 + m2, e nenhum desenho perde variedade a ponto de sair (o menor m3, de 5 vagas + peso 4 pro dono + vaga do time, é 92% do da loja normal; o corte é 75%), então o critério vai pro canto da grade. A vaga do time tira em média 9% de m1 + m2 e 1% de m3. O peso 2 pro time piora m1 + m2 em todo desenho: o dono divide o sorteio com quem divide traço com o tabuleiro e sai menos (m1 55% maior), e m2 cai só 20%.

O critério não cobra nada por acelerar, então vai pro máximo da grade; o teto de verdade vem da economia (ouro por rodada, 2 de ouro por loja), que ainda não tem conta aqui. Com o número de vagas fixado, o melhor de cada um: 5 vagas + peso 4 pro dono + vaga do time (m1 + m2 = 17,3); 6 vagas + peso 4 pro dono + vaga do time (m1 + m2 = 14,9); 7 vagas + peso 4 pro dono + vaga do time (m1 + m2 = 13,1). Na de 6 vagas + peso 3, só ligar a vaga do time baixa m1 + m2 de 18,8 pra 17,2 (8%).

Conferência: a conta 9 do README (um dono sozinho num custo de 56) dá 12,1 lojas de m1 pra 6 vagas + peso 3; a simulação com o set dá 12,3. Ter mais de um campeão no mesmo custo divide o peso, mas acontece pouco e muda pouco.
