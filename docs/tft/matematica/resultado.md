# Resultado: equilíbrio do Set 1

Gerado por `node docs/tft/matematica/analise.mjs` em 2026-11-04, com a exportação do Catálogo de 2026-11-04. Método e fórmulas: [README.md](README.md). Escolhas que entram na conta: breakpoints 2/4/6, tabuleiro de 9, loja de 5 vagas, tolerância de 25% no custo.

## Resumo

- **Tamanho certo de um traço:** 27,0 campeões; aceitável de 23 a 33 (custo de fechar 6 até 25% longe).
- **Classes:** de 17 a 37. Fora da faixa: Criaturinha Bizarra (sobram 1), Fadinhas (sobram 1), Safada (sobram 4), Porradeiro (sobram 2), Anjo (faltam 3), Temporais (faltam 6) e Assassino (faltam 3) (seção 3).
- **Elementos:** uns 16 cada; com 2/4/6 custam 1,84× pra fechar 6. Escada própria 2/3/4, ou 4 elementos. Entre si, fora: Fogo (sobram 1), Terra (faltam 2) e Gelo (faltam 2) (seção 4).
- **Origens fora da faixa:** Pokémon (55), Digimon (19), Persona (12), Deadlock (21) e Sujimon (20): escada própria ou mudar o tamanho (seção 6).
- **Loja:** pelo critério (menor m1 + m2 sem perder variedade), o melhor desenho é **7 vagas + peso 4 pro dono + vaga do time**: 2 cópias a mais de um campeão do tabuleiro em 7,5 lojas e um campeão novo do traço em 5,2, contra 12,0 e 6,4 com 6 vagas + peso 3 e 39,5 e 7,2 na loja normal de 5. O critério premia sempre mais vagas e mais peso; o teto vem da economia, que falta (seção 8).

## 1. O que temos
Campeão = uma linha evolutiva (cada forma é um nível: o Ivysaur é o nível 2 do Bulbasaur) ou um personagem solto (que sobe de estrela, como os do LoL e as cartas do Yu-Gi-Oh!). As 557 formas marcadas dão **270 campeões** em 10 franquias.

| Origem | Formas | Linhas | Soltos | Campeões | Só com elemento | Só Únicos | Sem nada |
|---|---|---|---|---|---|---|---|
| Pokémon | 168 | 53 | 2 | 55 | 13 | 1 | 0 |
| Digimon | 79 | 19 | 0 | 19 | 1 | 0 | 0 |
| SMT | 83 | 24 | 2 | 26 | 1 | 0 | 0 |
| Persona | 37 | 12 | 0 | 12 | 0 | 0 | 0 |
| JoJo | 38 | 4 | 27 | 31 | 2 | 3 | 0 |
| Yu-Gi-Oh! | 31 | 0 | 31 | 31 | 2 | 0 | 0 |
| LoL | 31 | 0 | 31 | 31 | 0 | 1 | 0 |
| Overwatch | 24 | 0 | 24 | 24 | 0 | 0 | 0 |
| Deadlock | 21 | 0 | 21 | 21 | 0 | 1 | 0 |
| Sujimon | 45 | 14 | 6 | 20 | 2 | 1 | 0 |
| **Total** | 557 | 126 | 144 | **270** | 21 | 7 | 0 |

Traços: 10 origens, 12 classes, 7 elementos (Fogo, Água, Terra, Vento, Raio, Gelo, Planta; 2 ficaram de fora) e Únicos, que não junta ninguém. Por campeão: **1,21 classes** (28 com 0, 170 com 1, 59 com 2, 12 com 3, 1 com 4) e **0,41 elementos**.

## 2. A régua: quanto custa fechar um breakpoint
Pra ter b campeões diferentes de um traço que tem n, num pool de 270, esperam-se (270/5)·Σ_{j<b} 1/(n − j) lojas (cada vaga mostra um campeão qualquer; a conta está no README e a simulação loja a loja confere). O custo só depende de n: **equilíbrio é todo traço com a mesma escada ter o mesmo n**. O tamanho certo é o de uma origem média, n* = 270 ÷ 10 = **27,0**. Lojas pra fechar cada breakpoint, por tamanho do traço:

| Campeões no traço | Fechar 2 | Fechar 4 | Fechar 6 | Custo de fechar 6 (1 = tamanho certo) |
|---|---|---|---|---|
| 12 | 9,4 | 20,8 | 35,3 | 2,65× |
| 16 | 7,0 | 15,0 | 24,4 | 1,84× |
| 23 | 4,8 | 10,1 | 15,9 | 1,20× |
| 27 | 4,1 | 8,5 | 13,3 | 1,00× |
| 33 | 3,3 | 6,9 | 10,7 | 0,80× |
| 40 | 2,7 | 5,6 | 8,7 | 0,65× |
| 55 | 2,0 | 4,0 | 6,2 | 0,46× |

**Faixa aceitável: de 23 a 33 campeões por traço.** Abaixo de 23, fechar 6 custa mais de 1,25× o de um traço do tamanho certo; acima de 33, menos de 0,80×. Traço grande demais não obriga breakpoint maior (o tabuleiro tem 9): ele só fica barato, e a comp dele fica forte demais.

## 3. Classes contra a faixa (23 a 33)
Todas as franquias têm campeões marcados. Cada classe contra a faixa, e o que mexer pra ela entrar:

| Classe | Campeões | Custo de fechar 6 | Situação |
|---|---|---|---|
| Temporais | 17 | 1,71× | faltam 6 |
| Anjo | 20 | 1,41× | faltam 3 |
| Assassino | 20 | 1,41× | faltam 3 |
| Robô | 23 | 1,20× | na faixa |
| Dragão | 23 | 1,20× | na faixa |
| Tanque | 26 | 1,04× | na faixa |
| Atirador | 27 | 1,00× | na faixa |
| Demoníacos | 32 | 0,83× | na faixa |
| Criaturinha Bizarra | 34 | 0,78× | sobram 1 (15 têm outra classe) |
| Fadinhas | 34 | 0,78× | sobram 1 (19 têm outra classe) |
| Porradeiro | 35 | 0,75× | sobram 2 (17 têm outra classe) |
| Safada | 37 | 0,71× | sobram 4 (22 têm outra classe) |

**O que mexer:** trocar a classe de 8 campeões, de Criaturinha Bizarra (1), Fadinhas (1), Safada (4) e Porradeiro (2) pra Anjo (3), Temporais (6) e Assassino (3); e dar Anjo, Temporais e Assassino a mais 4 campeões que hoje não têm classe (28). Quem dá pra trocar sem ficar sem classe (tem outra):

- **Criaturinha Bizarra:** Hi Andromon (Digimon: Robô); Metal Etemon (Digimon: Robô, Porradeiro); EBEmon (X-Antibody) (Digimon: Robô); Justimon(Critical Arm) (Digimon: Atirador, Porradeiro); Baphomet (SMT: Demoníacos, Safada); King Frost (SMT: Demoníacos); Yamata-no-Orochi (SMT: Demoníacos, Dragão); Cironnup (SMT: Fadinhas, Atirador); Nekomata (SMT: Assassino); Fionn mac Cumhaill (SMT: Demoníacos, Porradeiro, Assassino); The World Over Heaven (JoJo: Temporais, Porradeiro); Baby Face (JoJo: Safada); Fiddlesticks (LoL: Demoníacos); Vyper (Deadlock: Atirador); Rem (Deadlock: Fadinhas)

- **Fadinhas:** Gallade (Pokémon: Safada, Porradeiro); Lunala (Pokémon: Demoníacos); Rosemon (Digimon: Safada, Porradeiro); Ofanimon (Digimon: Safada, Anjo); Marin Angemon (Digimon: Safada); Alice (SMT: Demoníacos, Safada); Isis (SMT: Safada); Cironnup (SMT: Criaturinha Bizarra, Atirador); Aurora (LoL: Safada); Lillia (LoL: Safada); Nami (LoL: Safada); Seraphine (LoL: Safada); Soraka (LoL: Anjo); Zoe (LoL: Anjo); Juno (Overwatch: Safada); Kiriko (Overwatch: Safada); Lifeweaver (Overwatch: Anjo); Mercy (Overwatch: Anjo); Rem (Deadlock: Criaturinha Bizarra)

- **Safada:** Gallade (Pokémon: Fadinhas, Porradeiro); Rosemon (Digimon: Fadinhas, Porradeiro); Ofanimon (Digimon: Fadinhas, Anjo); Marin Angemon (Digimon: Fadinhas); Adramelech (SMT: Demoníacos); Alice (SMT: Demoníacos, Fadinhas); Baphomet (SMT: Demoníacos, Criaturinha Bizarra); Nuwa -Snake- (SMT: Dragão); Isis (SMT: Fadinhas); Satan (SMT: Demoníacos); Baby Face (JoJo: Criaturinha Bizarra); Aurora (LoL: Fadinhas); Gwen (LoL: Assassino); Kai'Sa (LoL: Atirador); Lillia (LoL: Fadinhas); Nami (LoL: Fadinhas); Seraphine (LoL: Fadinhas); D.Va (Overwatch: Robô); Juno (Overwatch: Fadinhas); Kiriko (Overwatch: Fadinhas); Tracer (Overwatch: Atirador); Widowmaker (Overwatch: Atirador)

- **Porradeiro:** Machamp (Pokémon: Tanque); Gallade (Pokémon: Fadinhas, Safada); Emboar (Pokémon: Tanque); Metal Garurumon (Digimon: Robô); Rosemon (Digimon: Fadinhas, Safada); Metal Etemon (Digimon: Criaturinha Bizarra, Robô); Justimon(Critical Arm) (Digimon: Criaturinha Bizarra, Atirador); Futsunushi (SMT: Tanque, Assassino); Zeus (SMT: Dragão); Yoshitsune (SMT: Assassino); Fionn mac Cumhaill (SMT: Demoníacos, Criaturinha Bizarra, Assassino); Melchizedek (SMT: Robô); William (Persona: Atirador); Made in Heaven (JoJo: Temporais); The World Over Heaven (JoJo: Criaturinha Bizarra, Temporais); Star Platinum (JoJo: Temporais); Winston (Overwatch: Tanque)

Sem classe (só elemento ou Únicos), candidatos pra Anjo, Temporais e Assassino: Venusaur (Pokémon: Planta); Raichu (Pokémon: Raio); Typhlosion (Pokémon: Fogo); Swampert (Pokémon: Água, Terra); Exploud (Pokémon); Mega Sharpedo (Pokémon: Água); Luxray (Pokémon: Raio); Serperior (Pokémon: Planta); Samurott (Pokémon: Água); Krookodile (Pokémon: Terra); Eelektross (Pokémon: Raio); Primarina (Pokémon: Água, Gelo); Corviknight (Pokémon: Vento); Raikou (Pokémon: Fogo, Água, Raio); Herakle Kabuterimon (Digimon: Planta); Arahabaki (SMT: Fogo, Gelo); Strength (JoJo); Echoes (JoJo: Vento, Planta); Metallica (JoJo); Light Rod Stand (JoJo); Foo Fighters (Stand) (JoJo: Água); Kazejin (Yu-Gi-Oh!: Vento); La Jinn the Mystical Genie of the Lamp (Yu-Gi-Oh!: Vento); Vel'Koz (LoL); Baba (Deadlock); Pornogra-Pharoah (Sujimon: Água); Monster Monastic (Sujimon: Vento); Massacre Mascot (Sujimon).

## 4. Elementos
Com 0,41 elemento por campeão, cada elemento fica com uns 16 campeões, abaixo da faixa das classes: com 2/4/6, fechar 6 custa 1,84× o de uma classe. Duas saídas: (a) elementos com escada própria, **2/3/4** (custo de cada degrau contra o da classe: 1,71× · 1,28× · 1,13×); ou (b) menos elementos: com as vagas de hoje, o número que deixa cada um do tamanho de uma classe é 4,1.
Com a escada própria, entre si os elementos ficam iguais quando cada um tem de 13 a 19 (fechar 4 até 25% longe da média deles).

| Elemento | Campeões | Situação |
|---|---|---|
| Terra | 11 | faltam 2 |
| Gelo | 11 | faltam 2 |
| Raio | 15 | na faixa |
| Planta | 16 | na faixa |
| Água | 18 | na faixa |
| Vento | 19 | na faixa |
| Fogo | 20 | sobram 1 |

## 5. Quantas classes e quantos elementos
Cada campeão entra em 1 origem, c classes e e elementos, então as vagas somam U·(1 + c + e). Com todo traço do tamanho n*: **classes = origens × c** e **elementos = origens × e**.

|  | Valor |
|---|---|
| Origens | 10 |
| n* (campeões por traço) | 27,0 |
| Classes ideais (1,21 por campeão) | 12,1 |
| Elementos ideais (0,41 por campeão) | 4,1 |
| Elementos ideais se todo campeão tiver 1 | 10 |

**12 classes estão certas** (a conta pede 12,1). Os 7 elementos pedem mais campeões com elemento (0,70 por campeão, hoje 0,41) ou a escada própria da seção 4.

## 6. Origens: o tamanho é fixo, então a escada muda
Uma franquia com mais campeões fecha 2/4/6 mais barato. Pra igualar, a escada de cada origem sobe ou desce até o custo de cada degrau ficar o mais perto do de uma origem média (27,0 campeões com 2/4/6), sem passar do tabuleiro (9).

| Origem | Campeões | Custo de fechar 6 com 2/4/6 | Escada que iguala | Custo de cada degrau (1 = igual) |
|---|---|---|---|---|
| Pokémon | 55 | 0,46× | 4/8/9 | 0,99× · 0,99× · 0,72× |
| Digimon | 19 | 1,49× | 2/3/4 | 1,43× · 1,06× · 0,93× |
| SMT | 26 | 1,04× | 2/4/6 | 1,04× · 1,04× · 1,04× |
| Persona | 12 | 2,65× | 1/2/3 | 1,10× · 1,11× · 1,11× |
| JoJo | 31 | 0,86× | 2/5/7 | 0,87× · 1,10× · 1,02× |
| Yu-Gi-Oh! | 31 | 0,86× | 2/5/7 | 0,87× · 1,10× · 1,02× |
| LoL | 31 | 0,86× | 2/5/7 | 0,87× · 1,10× · 1,02× |
| Overwatch | 24 | 1,14× | 2/4/5 | 1,13× · 1,13× · 0,93× |
| Deadlock | 21 | 1,33× | 2/3/5 | 1,29× · 0,96× · 1,08× |
| Sujimon | 20 | 1,41× | 2/3/4 | 1,36× · 1,01× · 0,88× |

Pokémon não se iguala nem com a escada no limite do tabuleiro. Persona só se iguala com um degrau 1 (ativo com um campeão só). A alternativa à escada é mexer no tamanho: de 23 a 33 campeões, a origem usa 2/4/6.

## 7. Comps que fecham origem e classe juntas
Pra fechar 6 de uma origem e 4 de uma classe em 9 vagas, pelo menos 1 campeão precisa ter as duas; pra 6 e 6, 3. Com as classes de hoje, em quantas das 12 classes cada origem consegue isso:

| Origem | 6 + 4 (≥ 1 em comum) | 6 + 6 (≥ 3 em comum) | Classe mais concentrada nela |
|---|---|---|---|
| Pokémon | 10 | 9 | Tanque: 8 de 26 |
| Digimon | 9 | 7 | Anjo: 4 de 20 |
| SMT | 11 | 8 | Demoníacos: 9 de 32 |
| Persona | 9 | 1 | Anjo: 3 de 20 |
| JoJo | 8 | 5 | Temporais: 4 de 17 |
| Yu-Gi-Oh! | 10 | 5 | Temporais: 7 de 17 |
| LoL | 11 | 4 | Fadinhas: 10 de 34 |
| Overwatch | 10 | 6 | Robô: 6 de 23 |
| Deadlock | 11 | 6 | Atirador: 5 de 27 |
| Sujimon | 9 | 3 | Robô: 4 de 23 |

Com tudo do tamanho certo e as classes espalhadas, uma origem e uma classe têm em média n*·n*/270 = 2,7 campeões em comum. Dá 6 + 4 com quase qualquer par; 6 + 6 (3 em comum) fica no limite: sai quando a classe tem um pouco mais daquela origem que a média.

## 8. Loja: que desenho junta cópias e acha o traço mais rápido
Os custos ainda não existem, então cada rodada divide os 270 campeões ao acaso em 5 custos de tamanho igual (54) e olha um deles; cada vaga cai nesse custo com 55% de chance (o custo 1 no nível 4 do TFT, de referência). O jogador simulado escolhe um traço T (origem ou classe com pelo menos 8 campeões) e tem 7 campeões de T ao acaso no tabuleiro, de qualquer custo; os que caíram no custo olhado são os **donos**. Em média, 62% do custo divide origem ou classe com o tabuleiro. **Cópias infinitas: o pool não esvazia.** Média de 20000 rodadas, as mesmas em todos os desenhos (semente fixa; trocar a semente muda m1 + m2 em uns 1%); m1 conta só as 15900 com dono no custo, m2 só as 19306 com algum campeão de T fora do tabuleiro no custo.

Desenhos: 5, 6 e 7 vagas; **peso do dono** (o campeão que o jogador já tem pesa isso no sorteio do custo, os outros 1); **vaga do time** (uma das vagas sorteia só entre os campeões do custo que dividem origem ou classe com o tabuleiro); e, de ideia extra, **peso 2 pro time** (quem divide origem ou classe com o tabuleiro pesa 2 em toda vaga). Medidas: **m1** = lojas pra juntar 2 cópias a mais de um dono (a 2 estrelas); **m2** = lojas até aparecer um campeão de T que não está no tabuleiro; **m3** = campeões diferentes fora do tabuleiro por loja, nesse custo (opção de mudar de comp). Ordenado por m1 + m2; em negrito, a loja normal, a de 6 vagas + peso 3 e a melhor.

| Desenho | m1 | m2 | m1 + m2 | m3 | m3 contra a loja normal |
|---|---|---|---|---|---|
| **7 vagas + peso 4 pro dono + vaga do time** | 7,5 | 5,2 | **12,7** | 3,37 | 128% |
| 7 vagas + peso 4 pro dono | 8,1 | 5,6 | 13,7 | 3,40 | 129% |
| 6 vagas + peso 4 pro dono + vaga do time | 8,6 | 6,0 | 14,6 | 2,90 | 110% |
| 7 vagas + peso 3 pro dono + vaga do time | 9,6 | 5,1 | 14,7 | 3,45 | 131% |
| 6 vagas + peso 4 pro dono | 9,4 | 6,5 | 15,9 | 2,93 | 111% |
| 7 vagas + peso 3 pro dono | 10,4 | 5,5 | 15,9 | 3,47 | 132% |
| 6 vagas + peso 3 pro dono + vaga do time | 11,0 | 5,8 | 16,7 | 2,97 | 113% |
| 7 vagas + peso 4 pro dono + peso 2 pro time | 12,2 | 4,5 | 16,8 | 3,50 | 133% |
| 5 vagas + peso 4 pro dono + vaga do time | 10,1 | 7,0 | 17,1 | 2,42 | 92% |
| **6 vagas + peso 3 pro dono** | 12,0 | 6,4 | **18,3** | 2,99 | 114% |
| 7 vagas + peso 2 pro dono + vaga do time | 13,7 | 5,0 | 18,7 | 3,54 | 135% |
| 5 vagas + peso 4 pro dono | 11,1 | 7,7 | 18,8 | 2,45 | 93% |
| 6 vagas + peso 4 pro dono + peso 2 pro time | 14,1 | 5,2 | 19,3 | 3,02 | 115% |
| 5 vagas + peso 3 pro dono + vaga do time | 12,7 | 6,9 | 19,6 | 2,48 | 94% |
| 7 vagas + peso 2 pro dono | 15,0 | 5,4 | 20,4 | 3,55 | 135% |
| 7 vagas + peso 3 pro dono + peso 2 pro time | 16,1 | 4,4 | 20,5 | 3,55 | 135% |
| 6 vagas + peso 2 pro dono + vaga do time | 15,7 | 5,7 | 21,4 | 3,05 | 116% |
| 5 vagas + peso 3 pro dono | 14,3 | 7,7 | 21,9 | 2,50 | 95% |
| 5 vagas + peso 4 pro dono + peso 2 pro time | 16,9 | 6,1 | 23,0 | 2,53 | 96% |
| 6 vagas + peso 2 pro dono | 17,3 | 6,2 | 23,5 | 3,06 | 116% |
| 6 vagas + peso 3 pro dono + peso 2 pro time | 18,4 | 5,1 | 23,5 | 3,06 | 116% |
| 5 vagas + peso 2 pro dono + vaga do time | 18,3 | 6,7 | 25,0 | 2,54 | 97% |
| 7 vagas + peso 2 pro dono + peso 2 pro time | 23,1 | 4,4 | 27,5 | 3,61 | 137% |
| 5 vagas + peso 2 pro dono | 20,5 | 7,4 | 27,8 | 2,56 | 98% |
| 5 vagas + peso 3 pro dono + peso 2 pro time | 22,2 | 6,0 | 28,1 | 2,57 | 98% |
| 7 vagas + vaga do time | 25,9 | 4,8 | 30,7 | 3,63 | 138% |
| 6 vagas + peso 2 pro dono + peso 2 pro time | 27,0 | 5,0 | 32,0 | 3,11 | 118% |
| 7 vagas | 28,2 | 5,3 | 33,4 | 3,64 | 139% |
| 6 vagas + vaga do time | 29,8 | 5,5 | 35,3 | 3,13 | 119% |
| 5 vagas + peso 2 pro dono + peso 2 pro time | 32,4 | 6,0 | 38,3 | 2,61 | 99% |
| 6 vagas | 32,8 | 6,1 | 38,9 | 3,14 | 119% |
| 5 vagas + vaga do time | 34,9 | 6,4 | 41,3 | 2,62 | 100% |
| **5 vagas** | 39,5 | 7,2 | **46,7** | 2,63 | 100% |
| 7 vagas + peso 2 pro time | 45,0 | 4,3 | 49,3 | 3,66 | 139% |
| 6 vagas + peso 2 pro time | 52,0 | 4,9 | 56,9 | 3,16 | 120% |
| 5 vagas + peso 2 pro time | 62,3 | 5,8 | 68,1 | 2,65 | 101% |

**Melhor pelo critério (README, conta 10): 7 vagas + peso 4 pro dono + vaga do time.** m1 + m2 = 12,7 lojas (m1 7,5, m2 5,2), 31% menos que a de 6 vagas + peso 3 (18,3: m1 12,0, m2 6,4) e 73% menos que a loja normal de 5 vagas (46,7: m1 39,5, m2 7,2), com m3 em 128% do da loja normal.

Por quê: cada vaga e cada ponto de peso do dono a mais baixam m1 + m2, e nenhum desenho perde variedade a ponto de sair (o menor m3, de 5 vagas + peso 4 pro dono + vaga do time, é 92% do da loja normal; o corte é 75%), então o critério vai pro canto da grade. A vaga do time tira em média 9% de m1 + m2 e 1% de m3. O peso 2 pro time piora m1 + m2 em todo desenho: o dono divide o sorteio com quem divide traço com o tabuleiro e sai menos (m1 55% maior), e m2 cai só 20%.

O critério não cobra nada por acelerar, então vai pro máximo da grade; o teto de verdade vem da economia (ouro por rodada, 2 de ouro por loja), que ainda não tem conta aqui. Com o número de vagas fixado, o melhor de cada um: 5 vagas + peso 4 pro dono + vaga do time (m1 + m2 = 17,1); 6 vagas + peso 4 pro dono + vaga do time (m1 + m2 = 14,6); 7 vagas + peso 4 pro dono + vaga do time (m1 + m2 = 12,7). Na de 6 vagas + peso 3, só ligar a vaga do time baixa m1 + m2 de 18,3 pra 16,7 (9%).

Conferência: a conta 9 do README (um dono sozinho num custo de 54) dá 11,7 lojas de m1 pra 6 vagas + peso 3; a simulação com o set dá 12,0. Ter mais de um campeão no mesmo custo divide o peso, mas acontece pouco e muda pouco.
