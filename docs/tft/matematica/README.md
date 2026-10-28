# Contas do modo TFT

O modo estilo TFT é um jogo de números: quantos campeões cada traço junta, quanto custa fechar um breakpoint, chance
na loja, economia. Esta pasta guarda essas contas, feitas com scripts sobre o nosso próprio set (nada copiado do
TFT da Riot). Cada número do resultado sai de um script, e as funções têm teste.

## Arquivos

- `lib.mjs`: as funções, sem ler arquivo. Inclui o custo de fechar um breakpoint, a faixa de tamanho aceitável, a
  escada de breakpoints que iguala esse custo, a divisão de vagas novas entre traços, a hipergeométrica, a loja como
  cadeia de Markov, a simulação dos desenhos de loja com o set e as simulações que conferem as contas.
- `lib.test.mjs`: testes das funções. Rodam com o Vitest do site, e o CI roda junto.
- `analise.mjs`: lê a exportação do Catálogo (os marcados, com linhas e classes) e grava `resultado.md`. As
  escolhas de design que entram na conta ficam no topo: breakpoints, tamanho do tabuleiro, vagas da loja, tolerância,
  a franquia que ainda falta escolher e os elementos que ficaram de fora.
- `resultado.md`: a última saída da análise.

## Como rodar

```sh
node docs/tft/matematica/analise.mjs          # refaz o resultado.md
node node_modules/vitest/vitest.mjs run docs  # testes das contas
```

Quando chegar uma exportação nova do Catálogo (grupo "marcados"), salve como `docs/tft/set1-escolhas-vN.json` e troque
o caminho em `EXPORTACAO` no `analise.mjs`.

## Definições

- **Campeão**: o que a loja vende. É uma linha evolutiva (cada forma é um nível: o Ivysaur é o nível 2 do
  Bulbasaur) ou um personagem solto.
- **Traço**: origem (a franquia), classe ou elemento. As classes de uma linha são as de qualquer forma dela.
- **U**: campeões no set. **O**: origens. **n**: campeões num traço. **c**: classes por campeão. **e**: elementos por
  campeão.

## As contas

1. **Custo de fechar um breakpoint.** Pra juntar b campeões diferentes de um traço com n, num pool de U, cada vaga
   da loja mostra um campeão qualquer. Depois de achar j deles, uma vaga traz um novo com chance (n − j)/U. Somando
   os degraus, esperam-se (U/vagas) · Σ_{j<b} 1/(n − j) lojas. Uma simulação loja a loja confere a conta.
2. **Equilíbrio.** Fechar o mesmo breakpoint custa o mesmo em qualquer traço. Como o custo só depende de n, traços
   com a mesma escada (2/4/6) devem ter o mesmo n.
3. **Tamanho certo.** As origens são fixas (uma por franquia), então o tamanho certo de qualquer traço é o de uma
   origem média: n* = U/O.
4. **Quantos traços.** Cada campeão entra em 1 origem, c classes e e elementos, então
   Σn = U·(1 + c + e). Com todo traço do tamanho n*: **classes = O·c** e **elementos = O·e**.
5. **Origem fora do tamanho.** A origem não muda de tamanho, então muda a escada. Cada degrau vira o b, até o
   tamanho do tabuleiro, cujo custo fica mais perto do degrau correspondente de uma origem média.
6. **Faixa aceitável.** O tamanho de traço em que fechar o último breakpoint custa no máximo (1 + tolerância) vezes
   o de um traço de n* e no mínimo 1/(1 + tolerância) vezes. Com tolerância 0,25: até 25% mais caro ou 20% mais barato.
7. **O que mexer.** Classe acima da faixa perde a classe de quem tem outra; classe abaixo ganha. Trocar a classe de
   um campeão resolve uma sobra e uma falta de uma vez, então o mínimo de mudanças é o maior entre o total que sobra e
   o total que falta. Se uma franquia ainda não tem ninguém marcado, ela entra com n* campeões (n*·c vagas de classe,
   n*·e de elemento), e cada vaga vai pra classe menor no momento: como o custo cai quando n sobe, é a divisão que
   deixa o traço mais caro o mais barato possível.
8. **Comps que fecham dois traços.** Pra fechar a de um traço e b de outro em L vagas, pelo menos a + b − L
   campeões precisam ter os dois. Com os traços espalhados, a média em comum é n₁·n₂/U.
9. **Loja com peso.** Se o campeão que o jogador já tem pesa w no sorteio do custo (os outros, 1), a chance de uma
   vaga trazê-lo é chance·w/(n − 1 + w): a mesma de uma loja normal com (n − 1 + w)/w campeões no custo. As lojas pra
   juntar as cópias saem da cadeia de Markov com esse número. É um campeão isolado; a conta 10 olha o set inteiro.
10. **Desenho da loja com o set.** Simulação rodada a rodada (`simularLoja`). Os custos ainda não existem, então cada
    rodada divide os campeões ao acaso em 5 custos de tamanho igual e olha um; cada vaga cai nele com a chance de
    referência (55%). O jogador sorteia um traço T (origem ou classe com pelo menos 8 campeões) e põe 7 campeões de T
    ao acaso no tabuleiro; os que caíram no custo olhado são os donos. Cópias infinitas: o pool não esvazia. Desenhos:
    vagas (5, 6, 7); **peso do dono** (o campeão que o jogador já tem pesa w no sorteio do custo, os outros 1); **vaga
    do time** (uma das vagas, que cai no custo com a mesma chance, sorteia só entre os campeões do custo que dividem
    origem ou classe com o tabuleiro, com os mesmos pesos); **peso pro time** (quem divide origem ou classe com o
    tabuleiro pesa 2 em toda vaga). Medidas, com as mesmas rodadas em todo desenho:
    - **m1**: lojas pra juntar 2 cópias a mais de um dono (a 2 estrelas); só rodadas com dono no custo;
    - **m2**: lojas até aparecer um campeão de T que não está no tabuleiro; só rodadas com algum deles no custo;
    - **m3**: campeões diferentes fora do tabuleiro por loja, nesse custo (opção de mudar de comp).

    **Critério do melhor** (`melhorDesenho`): a menor soma m1 + m2 entre os desenhos que mantêm m3 em pelo menos 75%
    do m3 da loja normal (5 vagas, sem peso nem vaga do time). Diferença menor que 2% em m1 + m2 é empate (trocar a
    semente muda a soma em uns 1%), e no empate ganha o mais simples: menos mecânicas entre peso do dono, vaga do time
    e peso pro time. Com peso 1 e sem vaga do time, m1 tem de bater com a cadeia de Markov da conta 9 (alvo 2,
    campeões = tamanho do custo), e o teste confere. O critério não cobra nada por acelerar: quanto a loja pode
    acelerar depende da economia, que ainda não tem conta.

## Premissas (mudar alguma muda o resultado)

- **Loja:** toda vaga mostra qualquer campeão com a mesma chance. Quando houver custo por campeão, o custo de
  fechar pesa mais nos traços de campeões caros. Nos desenhos de loja (conta 10), os custos são sorteados, a chance
  do custo é 55% (o custo 1 no nível 4 do TFT, só de referência de mecânica) e as cópias são infinitas.
- **JoJo:** os Stands entram como campeões. Eles entram presos a outra unidade: se não forem vendidos na loja como
  campeão, saem da conta.
- **Yu-Gi-Oh!:** as cartas não têm linha; sobem de estrela, como os campeões do LoL. Franquia sem ninguém marcado
  entraria com o tamanho de uma origem média (campeões ÷ franquias).
- **Elementos:** Luz e Trevas ficaram de fora (o usuário não quer). Únicos não conta como classe. Com a escada própria,
  os elementos são comparados entre si (a faixa em volta da média deles).
- **Tolerância:** 25% no custo de fechar o último breakpoint.
- **Tabuleiro:** 9 campeões. O doc ainda não decide esse número.

## Contas que ainda dá pra fazer aqui

- Custo por campeão (quais formas entram em qual custo) e o efeito no custo de fechar cada traço.
- Economia: ouro por rodada, juros, sequência de vitórias e derrotas, contra nível e rolagem. É ela que diz quanto a
  loja pode acelerar (conta 10).
- Itens: 7 componentes Bakugan dão 28 receitas; quantos componentes por partida pra fechar 3 itens num campeão.
