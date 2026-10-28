# Contas do modo TFT

O modo estilo TFT é um jogo de números: quantos campeões cada traço junta, quanto custa fechar um breakpoint, chance
na loja, economia. Esta pasta guarda essas contas, feitas com scripts sobre o nosso próprio set (nada copiado do
TFT da Riot). Cada número do resultado sai de um script, e as funções têm teste.

## Arquivos

- `lib.mjs`: as funções, sem ler arquivo. Inclui o custo de fechar um breakpoint, a faixa de tamanho aceitável, a
  escada de breakpoints que iguala esse custo, a divisão de vagas novas entre traços, a hipergeométrica, a loja como
  cadeia de Markov e as simulações que conferem as contas.
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
7. **Cota da franquia que falta.** Ela entra com n* campeões, que dão n*·c vagas de classe e n*·e de elemento. Cada
   vaga vai pra classe (ou elemento) menor no momento: como o custo cai quando n sobe, é a divisão que deixa o traço
   mais caro o mais barato possível. Classe que já passa da faixa não se resolve com carta nova, só tirando a classe
   de quem tem outra.
8. **Comps que fecham dois traços.** Pra fechar a de um traço e b de outro em L vagas, pelo menos a + b − L
   campeões precisam ter os dois. Com os traços espalhados, a média em comum é n₁·n₂/U.

## Premissas (mudar alguma muda o resultado)

- **Loja:** toda vaga mostra qualquer campeão com a mesma chance. Quando houver custo por campeão, o custo de
  fechar pesa mais nos traços de campeões caros.
- **JoJo:** os Stands entram como campeões. Eles entram presos a outra unidade: se não forem vendidos na loja como
  campeão, saem da conta.
- **Yu-Gi-Oh!:** ainda sem ninguém marcado; entra com o tamanho de uma origem média (campeões ÷ franquias).
- **Elementos:** Luz e Trevas ficaram de fora (o usuário não quer). Únicos não conta como classe.
- **Tolerância:** 25% no custo de fechar o último breakpoint.
- **Tabuleiro:** 9 campeões. O doc ainda não decide esse número.

## Contas que ainda dá pra fazer aqui

- Custo por campeão (quais formas entram em qual custo) e o efeito no custo de fechar cada traço.
- Subir de nível (juntar cópias da mesma linha): as funções da loja em cadeia de Markov já estão no `lib.mjs`.
- Economia: ouro por rodada, juros, sequência de vitórias e derrotas, contra nível e rolagem.
- Itens: 7 componentes Bakugan dão 28 receitas; quantos componentes por partida pra fechar 3 itens num campeão.
