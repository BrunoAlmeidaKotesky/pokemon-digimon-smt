# Resultado: equilíbrio do Set 1

Gerado por `node docs/tft/matematica/analise.mjs` em 2026-11-05, com a exportação do Catálogo de 2026-11-04. Método e fórmulas: [README.md](README.md). Escolhas que entram na conta: breakpoints 2/4/6, tabuleiro de 9, loja de 5 vagas, tolerância de 25% no custo.

## Resumo

- **Tamanho certo de um traço:** 27,0 campeões; aceitável de 23 a 33 (custo de fechar 6 até 25% longe).
- **Classes:** de 17 a 37. Fora da faixa: Criaturinha Bizarra (sobram 1), Fadinhas (sobram 1), Safada (sobram 4), Porradeiro (sobram 2), Anjo (faltam 3), Temporais (faltam 6) e Assassino (faltam 3) (seção 3).
- **Elementos:** uns 16 cada; com 2/4/6 custam 1,84× pra fechar 6. Escada própria 2/3/4, ou 4 elementos. Entre si, fora: Fogo (sobram 1), Terra (faltam 2) e Gelo (faltam 2) (seção 4).
- **Origens fora da faixa:** Pokémon (55), Digimon (19), Persona (12), Deadlock (21) e Sujimon (20): escada própria ou mudar o tamanho (seção 6).
- **Loja:** pelo critério (menor m1 + m2 sem perder variedade), o melhor desenho é **7 vagas + peso 4 pro dono + vaga do time**: 2 cópias a mais de um campeão do tabuleiro em 7,5 lojas e um campeão novo do traço em 5,4, contra 12,1 e 6,4 com 6 vagas + peso 3 e 39,3 e 7,2 na loja normal de 5. O critério premia sempre mais vagas e mais peso; o teto vem da economia, que falta (seção 8).

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

Traços: 10 origens, 12 classes, 7 elementos (Fogo, Água, Terra, Vento, Raio, Gelo, Planta; 2 ficaram de fora) e Únicos, que não junta ninguém. Por campeão: **1,21 classes** (28 com 0, 170 com 1, 60 com 2, 11 com 3, 1 com 4) e **0,41 elementos**.

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
| Atirador | 24 | 1,14× | na faixa |
| Dragão | 24 | 1,14× | na faixa |
| Tanque | 27 | 1,00× | na faixa |
| Demoníacos | 32 | 0,83× | na faixa |
| Criaturinha Bizarra | 34 | 0,78× | sobram 1 (15 têm outra classe) |
| Fadinhas | 34 | 0,78× | sobram 1 (19 têm outra classe) |
| Porradeiro | 35 | 0,75× | sobram 2 (17 têm outra classe) |
| Safada | 37 | 0,71× | sobram 4 (22 têm outra classe) |

**O que mexer:** trocar a classe de 8 campeões, de Criaturinha Bizarra (1), Fadinhas (1), Safada (4) e Porradeiro (2) pra Anjo (3), Temporais (6) e Assassino (3); e dar Anjo, Temporais e Assassino a mais 4 campeões que hoje não têm classe (28). Quem dá pra trocar sem ficar sem classe (tem outra):

- **Criaturinha Bizarra:** Hi Andromon (Digimon: Robô); Metal Etemon (Digimon: Robô, Porradeiro); EBEmon (X-Antibody) (Digimon: Robô); Justimon(Critical Arm) (Digimon: Atirador, Porradeiro); Baphomet (SMT: Demoníacos, Safada); King Frost (SMT: Demoníacos); Yamata-no-Orochi (SMT: Demoníacos, Dragão); Cironnup (SMT: Fadinhas); Nekomata (SMT: Assassino); Fionn mac Cumhaill (SMT: Demoníacos, Porradeiro, Assassino); The World Over Heaven (JoJo: Temporais, Porradeiro); Baby Face (JoJo: Safada); Fiddlesticks (LoL: Demoníacos); Vyper (Deadlock: Atirador); Rem (Deadlock: Fadinhas)

- **Fadinhas:** Gallade (Pokémon: Safada, Porradeiro); Lunala (Pokémon: Demoníacos); Rosemon (Digimon: Safada, Porradeiro); Ofanimon (Digimon: Safada, Anjo); Marin Angemon (Digimon: Safada); Alice (SMT: Demoníacos, Safada); Isis (SMT: Safada); Cironnup (SMT: Criaturinha Bizarra); Aurora (LoL: Safada); Lillia (LoL: Safada); Nami (LoL: Safada); Seraphine (LoL: Safada); Soraka (LoL: Anjo); Zoe (LoL: Anjo); Juno (Overwatch: Safada); Kiriko (Overwatch: Safada); Lifeweaver (Overwatch: Anjo); Mercy (Overwatch: Anjo); Rem (Deadlock: Criaturinha Bizarra)

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

### 6b. Origens com 5 ou 6 degraus (Autobatalha)
A Autobatalha usa mais degraus nas origens. Referência: uma origem média (27,0 campeões) com 2/3/4/6/8; as origens maiores que a média ganham 6 degraus, com referência 2/3/4/6/8/10. Cada origem pega a escada que iguala o custo de cada degrau ao da referência, até 10 (o nível máximo). Degrau repetido não existe: quando a conta empilha degraus no limite, a origem fica com menos degraus.

| Origem | Campeões | Referência | Escada que iguala | Custo de cada degrau (1 = igual) |
|---|---|---|---|---|
| Pokémon | 55 | 2/3/4/6/8/10 | 4/6/8/10 | 0,99× · 0,99× · 0,99× · 0,81× |
| Digimon | 19 | 2/3/4/6/8 | 2/3/4/5/6 | 1,43× · 1,45× · 1,46× · 1,20× · 1,07× |
| SMT | 26 | 2/3/4/6/8 | 2/3/4/6/8 | 1,04× · 1,04× · 1,04× · 1,04× · 1,05× |
| Persona | 12 | 2/3/4/6/8 | 1/2/3/4/5 | 1,10× · 1,51× · 1,74× · 1,57× · 1,48× |
| JoJo | 31 | 2/3/4/6/8/10 | 2/3/5/7/9/10 | 0,87× · 0,87× · 1,10× · 1,02× · 0,98× · 0,85× |
| Yu-Gi-Oh! | 31 | 2/3/4/6/8/10 | 2/3/5/7/9/10 | 0,87× · 0,87× · 1,10× · 1,02× · 0,98× · 0,85× |
| LoL | 31 | 2/3/4/6/8/10 | 2/3/5/7/9/10 | 0,87× · 0,87× · 1,10× · 1,02× · 0,98× · 0,85× |
| Overwatch | 24 | 2/3/4/6/8 | 2/3/4/5/7 | 1,13× · 1,13× · 1,13× · 0,93× · 0,98× |
| Deadlock | 21 | 2/3/4/6/8 | 2/3/4/5/6 | 1,29× · 1,30× · 1,31× · 1,08× · 0,95× |
| Sujimon | 20 | 2/3/4/6/8 | 2/3/4/5/6 | 1,36× · 1,37× · 1,38× · 1,14× · 1,01× |

### 6c. Classes e elementos com degraus pelo tamanho (Autobatalha)
Quantos degraus cada traço tem sai do tamanho dele, com a régua das origens: 3 até 13 campeões, 4 de 14 a 17, 5 de 18 a 29 e 6 de 30 em diante. Traço pequeno continua curto. A escada guarda os degraus de antes quando dá (quem já fecha 2/4/6 continua fechando), e Criaturinha Bizarra e Safada continuam começando no 3. "Custo" compara cada degrau com a referência do mesmo número de degraus num traço do tamanho certo (27,0 campeões; 1 = igual). Com limite = nível, o degrau b fecha no nível b: o último tem de caber no nível 12 e no traço.

| Traço | Campeões | Degraus pela conta | Escada antes | Escada agora | Custo de cada degrau | Lojas pro último | Último cabe? |
|---|---|---|---|---|---|---|---|
| Safada | 37 | 6 | 3/5/7 | 3/4/5/7/9/10 | 1,10× · 0,98× · 0,91× · 0,84× · 0,80× · 0,69× | 16,7 | sim (nível 10) |
| Criaturinha Bizarra | 34 | 6 | 3/5/7 | 3/4/5/7/9/10 | 1,20× · 1,07× · 1,00× · 0,92× · 0,88× · 0,76× | 18,5 | sim (nível 10) |
| Porradeiro | 35 | 6 | 2/4/6 | 2/3/4/6/8/10 | 0,77× · 0,76× · 0,76× · 0,75× · 0,74× · 0,73× | 17,9 | sim (nível 10) |
| Fadinhas | 34 | 6 | 2/4/6 | 2/3/4/6/8/10 | 0,79× · 0,79× · 0,78× · 0,78× · 0,77× · 0,76× | 18,5 | sim (nível 10) |
| Demoníacos | 32 | 6 | 2/4/6 | 2/3/4/6/8/10 | 0,84× · 0,84× · 0,84× · 0,83× · 0,82× · 0,81× | 19,9 | sim (nível 10) |
| Tanque | 27 | 5 | 2/4/6 | 2/3/4/6/8 | 1,00× · 1,00× · 1,00× · 1,00× · 1,00× | 18,6 | sim (nível 8) |
| Atirador | 24 | 5 | 2/4/6 | 2/3/4/5/7 | 1,13× · 1,13× · 1,13× · 0,93× · 0,98× | 18,2 | sim (nível 7) |
| Dragão | 24 | 5 | 2/4/6 | 2/3/4/5/7 | 1,13× · 1,13× · 1,13× · 0,93× · 0,98× | 18,2 | sim (nível 7) |
| Robô | 23 | 5 | 2/4/6 | 2/3/4/5/6 | 1,18× · 1,18× · 1,19× · 0,97× · 0,86× | 15,9 | sim (nível 6) |
| Assassino | 20 | 5 | 2/4/6 | 2/3/4/5/6 | 1,36× · 1,37× · 1,38× · 1,14× · 1,01× | 18,7 | sim (nível 6) |
| Anjo | 20 | 5 | 2/4/6 | 2/3/4/5/6 | 1,36× · 1,37× · 1,38× · 1,14× · 1,01× | 18,7 | sim (nível 6) |
| Temporais | 17 | 4 | 2/4/6 | 2/3/4/5 | 1,61× · 1,63× · 1,65× · 1,37× | 18,2 | sim (nível 5) |
| Fogo | 20 | 5 | 2/3/4 | 2/3/4/5/6 | 1,36× · 1,37× · 1,38× · 1,14× · 1,01× | 18,7 | sim (nível 6) |
| Vento | 19 | 5 | 2/3/4 | 2/3/4/5/6 | 1,43× · 1,45× · 1,46× · 1,20× · 1,07× | 19,9 | sim (nível 6) |
| Água | 18 | 5 | 2/3/4 | 2/3/4/5/6 | 1,51× · 1,53× · 1,55× · 1,28× · 1,14× | 21,2 | sim (nível 6) |
| Planta | 16 | 4 | 2/3/4 | 2/3/4/5 | 1,71× · 1,74× · 1,77× · 1,47× | 19,5 | sim (nível 5) |
| Raio | 15 | 4 | 2/3/4 | 2/3/4/5 | 1,83× · 1,86× · 1,90× · 1,58× | 21,0 | sim (nível 5) |
| Terra | 11 | 3 | 2/3/4 | 2/3/4 | 2,53× · 1,92× · 1,74× | 23,1 | sim (nível 4) |
| Gelo | 11 | 3 | 2/3/4 | 2/3/4 | 2,53× · 1,92× · 1,74× | 23,1 | sim (nível 4) |

Todos com o número de degraus da conta. Todos os últimos degraus cabem. As origens ficam como na seção 6b (o JoJo, como na seção 9):

| Origem | Campeões | Degraus pela conta | Escada | Último cabe? |
|---|---|---|---|---|
| Pokémon | 55 | 6 | 2/4/6/8/9/10 | sim (nível 10) |
| Digimon | 19 | 5 | 2/3/4/5/6 | sim (nível 6) |
| SMT | 26 | 5 | 2/3/4/6/8 | sim (nível 8) |
| Persona | 12 | 3 | 1/2/3/4/5 | sim (nível 5) |
| JoJo | 31 | 6 | 2/3/4/5/6/8 | sim (nível 8) |
| Yu-Gi-Oh! | 31 | 6 | 2/3/5/7/9/10 | sim (nível 10) |
| LoL | 31 | 6 | 2/3/5/7/9/10 | sim (nível 10) |
| Overwatch | 24 | 5 | 2/3/4/5/7 | sim (nível 7) |
| Deadlock | 21 | 5 | 2/3/4/5/6 | sim (nível 6) |
| Sujimon | 20 | 5 | 2/3/4/5/6 | sim (nível 6) |

## 7. Comps que fecham origem e classe juntas
Pra fechar 6 de uma origem e 4 de uma classe em 9 vagas, pelo menos 1 campeão precisa ter as duas; pra 6 e 6, 3. Com as classes de hoje, em quantas das 12 classes cada origem consegue isso:

| Origem | 6 + 4 (≥ 1 em comum) | 6 + 6 (≥ 3 em comum) | Classe mais concentrada nela |
|---|---|---|---|
| Pokémon | 10 | 8 | Tanque: 9 de 27 |
| Digimon | 9 | 7 | Anjo: 4 de 20 |
| SMT | 10 | 8 | Demoníacos: 9 de 32 |
| Persona | 9 | 1 | Anjo: 3 de 20 |
| JoJo | 8 | 5 | Temporais: 4 de 17 |
| Yu-Gi-Oh! | 9 | 5 | Dragão: 10 de 24 |
| LoL | 11 | 4 | Fadinhas: 10 de 34 |
| Overwatch | 10 | 6 | Robô: 6 de 23 |
| Deadlock | 11 | 6 | Atirador: 5 de 24 |
| Sujimon | 9 | 3 | Robô: 4 de 23 |

Com tudo do tamanho certo e as classes espalhadas, uma origem e uma classe têm em média n*·n*/270 = 2,7 campeões em comum. Dá 6 + 4 com quase qualquer par; 6 + 6 (3 em comum) fica no limite: sai quando a classe tem um pouco mais daquela origem que a média.

## 8. Loja: que desenho junta cópias e acha o traço mais rápido
Os custos ainda não existem, então cada rodada divide os 270 campeões ao acaso em 5 custos de tamanho igual (54) e olha um deles; cada vaga cai nesse custo com 55% de chance (o custo 1 no nível 4 do TFT, de referência). O jogador simulado escolhe um traço T (origem ou classe com pelo menos 8 campeões) e tem 7 campeões de T ao acaso no tabuleiro, de qualquer custo; os que caíram no custo olhado são os **donos**. Em média, 62% do custo divide origem ou classe com o tabuleiro. **Cópias infinitas: o pool não esvazia.** Média de 20000 rodadas, as mesmas em todos os desenhos (semente fixa; trocar a semente muda m1 + m2 em uns 1%); m1 conta só as 15837 com dono no custo, m2 só as 19256 com algum campeão de T fora do tabuleiro no custo.

Desenhos: 5, 6 e 7 vagas; **peso do dono** (o campeão que o jogador já tem pesa isso no sorteio do custo, os outros 1); **vaga do time** (uma das vagas sorteia só entre os campeões do custo que dividem origem ou classe com o tabuleiro); e, de ideia extra, **peso 2 pro time** (quem divide origem ou classe com o tabuleiro pesa 2 em toda vaga). Medidas: **m1** = lojas pra juntar 2 cópias a mais de um dono (a 2 estrelas); **m2** = lojas até aparecer um campeão de T que não está no tabuleiro; **m3** = campeões diferentes fora do tabuleiro por loja, nesse custo (opção de mudar de comp). Ordenado por m1 + m2; em negrito, a loja normal, a de 6 vagas + peso 3 e a melhor.

| Desenho | m1 | m2 | m1 + m2 | m3 | m3 contra a loja normal |
|---|---|---|---|---|---|
| **7 vagas + peso 4 pro dono + vaga do time** | 7,5 | 5,4 | **13,0** | 3,37 | 128% |
| 7 vagas + peso 4 pro dono | 8,1 | 5,9 | 14,0 | 3,40 | 129% |
| 6 vagas + peso 4 pro dono + vaga do time | 8,6 | 6,0 | 14,6 | 2,90 | 110% |
| 7 vagas + peso 3 pro dono + vaga do time | 9,6 | 5,2 | 14,8 | 3,45 | 131% |
| 7 vagas + peso 3 pro dono | 10,4 | 5,7 | 16,0 | 3,48 | 132% |
| 6 vagas + peso 4 pro dono | 9,3 | 6,7 | 16,1 | 2,93 | 111% |
| 7 vagas + peso 4 pro dono + peso 2 pro time | 12,2 | 4,6 | 16,7 | 3,50 | 133% |
| 6 vagas + peso 3 pro dono + vaga do time | 11,0 | 5,9 | 16,8 | 2,97 | 113% |
| 5 vagas + peso 4 pro dono + vaga do time | 10,0 | 6,9 | 16,9 | 2,42 | 92% |
| **6 vagas + peso 3 pro dono** | 12,1 | 6,4 | **18,5** | 2,99 | 114% |
| 7 vagas + peso 2 pro dono + vaga do time | 13,6 | 5,0 | 18,7 | 3,53 | 135% |
| 5 vagas + peso 4 pro dono | 11,1 | 7,8 | 19,0 | 2,45 | 93% |
| 6 vagas + peso 4 pro dono + peso 2 pro time | 14,2 | 5,2 | 19,3 | 3,02 | 115% |
| 5 vagas + peso 3 pro dono + vaga do time | 12,8 | 6,9 | 19,7 | 2,48 | 94% |
| 7 vagas + peso 3 pro dono + peso 2 pro time | 15,8 | 4,5 | 20,3 | 3,55 | 135% |
| 7 vagas + peso 2 pro dono | 14,9 | 5,5 | 20,4 | 3,56 | 135% |
| 6 vagas + peso 2 pro dono + vaga do time | 15,6 | 5,7 | 21,3 | 3,05 | 116% |
| 5 vagas + peso 3 pro dono | 14,3 | 7,8 | 22,1 | 2,51 | 95% |
| 5 vagas + peso 4 pro dono + peso 2 pro time | 16,8 | 6,2 | 23,0 | 2,53 | 96% |
| 6 vagas + peso 3 pro dono + peso 2 pro time | 18,5 | 5,1 | 23,6 | 3,06 | 117% |
| 6 vagas + peso 2 pro dono | 17,4 | 6,3 | 23,7 | 3,06 | 117% |
| 5 vagas + peso 2 pro dono + vaga do time | 18,4 | 6,5 | 25,0 | 2,55 | 97% |
| 7 vagas + peso 2 pro dono + peso 2 pro time | 23,0 | 4,5 | 27,5 | 3,61 | 137% |
| 5 vagas + peso 3 pro dono + peso 2 pro time | 22,1 | 6,0 | 28,0 | 2,57 | 98% |
| 5 vagas + peso 2 pro dono | 20,6 | 7,5 | 28,1 | 2,57 | 98% |
| 7 vagas + vaga do time | 25,9 | 4,9 | 30,8 | 3,63 | 138% |
| 6 vagas + peso 2 pro dono + peso 2 pro time | 26,6 | 5,0 | 31,6 | 3,11 | 118% |
| 7 vagas | 28,1 | 5,4 | 33,5 | 3,64 | 139% |
| 6 vagas + vaga do time | 29,7 | 5,4 | 35,1 | 3,13 | 119% |
| 5 vagas + peso 2 pro dono + peso 2 pro time | 31,9 | 6,0 | 37,9 | 2,60 | 99% |
| 6 vagas | 32,8 | 6,2 | 39,0 | 3,14 | 119% |
| 5 vagas + vaga do time | 34,8 | 6,5 | 41,3 | 2,62 | 100% |
| **5 vagas** | 39,3 | 7,2 | **46,5** | 2,63 | 100% |
| 7 vagas + peso 2 pro time | 44,6 | 4,4 | 49,0 | 3,66 | 139% |
| 6 vagas + peso 2 pro time | 51,8 | 5,0 | 56,7 | 3,16 | 120% |
| 5 vagas + peso 2 pro time | 62,1 | 5,9 | 68,0 | 2,65 | 101% |

**Melhor pelo critério (README, conta 10): 7 vagas + peso 4 pro dono + vaga do time.** m1 + m2 = 13,0 lojas (m1 7,5, m2 5,4), 30% menos que a de 6 vagas + peso 3 (18,5: m1 12,1, m2 6,4) e 72% menos que a loja normal de 5 vagas (46,5: m1 39,3, m2 7,2), com m3 em 128% do da loja normal.

Por quê: cada vaga e cada ponto de peso do dono a mais baixam m1 + m2, e nenhum desenho perde variedade a ponto de sair (o menor m3, de 5 vagas + peso 4 pro dono + vaga do time, é 92% do da loja normal; o corte é 75%), então o critério vai pro canto da grade. A vaga do time tira em média 10% de m1 + m2 e 1% de m3. O peso 2 pro time piora m1 + m2 em todo desenho: o dono divide o sorteio com quem divide traço com o tabuleiro e sai menos (m1 54% maior), e m2 cai só 21%.

O critério não cobra nada por acelerar, então vai pro máximo da grade; o teto de verdade vem da economia (ouro por rodada, 2 de ouro por loja), que ainda não tem conta aqui. Com o número de vagas fixado, o melhor de cada um: 5 vagas + peso 4 pro dono + vaga do time (m1 + m2 = 16,9); 6 vagas + peso 4 pro dono + vaga do time (m1 + m2 = 14,6); 7 vagas + peso 4 pro dono + vaga do time (m1 + m2 = 13,0). Na de 6 vagas + peso 3, só ligar a vaga do time baixa m1 + m2 de 18,5 pra 16,8 (9%).

Conferência: a conta 9 do README (um dono sozinho num custo de 54) dá 11,7 lojas de m1 pra 6 vagas + peso 3; a simulação com o set dá 12,1. Ter mais de um campeão no mesmo custo divide o peso, mas acontece pouco e muda pouco.

## 9. Stands e o limite do tabuleiro
Com limite = nível, cada Stand precisa de um usuário de outra origem, e os que passam dos que ficam fora da vaga gastam uma vaga. Em cada célula, unidades em campo no máximo / Stands que cabem. A força de cada regra vem da simulação: equilibrio.md, seção "Stands".

| Regra | Nível 3 | Nível 6 | Nível 9 | Nível 12 |
|---|---|---|---|---|
| Sem limite (o pedido original) | 6 / 3 | 12 / 6 | 18 / 9 | 24 / 12 |
| Todo Stand ocupa vaga | 3 / 1 | 6 / 3 | 9 / 4 | 12 / 6 |
| Até 2 fora da vaga | 5 / 2 | 8 / 4 | 11 / 5 | 14 / 7 |
| Um fora da vaga a cada 3 níveis | 4 / 2 | 8 / 4 | 12 / 6 | 16 / 8 |

Escada do JoJo com a regra do jogo (um fora da vaga a cada 3 níveis): em que nível cada degrau fecha. A escada de antes parava no 11 pro degrau de 7 e nunca chegava em 9 nem 10.

| Escada | Degrau 1 | Degrau 2 | Degrau 3 | Degrau 4 | Degrau 5 | Degrau 6 |
|---|---|---|---|---|---|---|
| Antes (2/3/5/7/9/10) | 3 | 5 | 8 | 11 | nunca | nunca |
| Agora (2/3/4/5/6/8) | 3 | 5 | 6 | 8 | 9 | 12 |
