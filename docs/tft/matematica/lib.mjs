// Contas do modo estilo TFT: funções puras (não leem arquivo), usadas por analise.mjs e testadas em lib.test.mjs.
// Campeão = o que a loja vende: uma linha evolutiva (cada forma é um nível: Ivysaur é o nível 2 do Bulbasaur) ou um
// personagem solto. Traço = origem (franquia), classe ou elemento.

export const soma = xs => xs.reduce((a, x) => a + x, 0);
export const media = xs => soma(xs) / xs.length;
export function mediana(xs) {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** C(n, k) em ponto flutuante (0 fora do intervalo). */
export function comb(n, k) {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= Math.min(k, n - k); i++) r = (r * (n - Math.min(k, n - k) + i)) / i;
  return r;
}

/**
 * P(X ≥ b), X hipergeométrica: tabuleiro com `l` campeões diferentes sorteados entre `u`, dos quais `n` têm o traço.
 */
export function chanceAoMenos(u, n, l, b) {
  const total = comb(u, l);
  let p = 0;
  for (let x = Math.max(b, 0); x <= Math.min(n, l); x++) p += (comb(n, x) * comb(u - n, l - x)) / total;
  return Math.min(1, p);
}

/**
 * Lojas esperadas pra ver `b` campeões diferentes de um traço que tem `n`, num pool de `u` campeões, com `vagas` por
 * loja, se cada vaga mostra um campeão do pool com a mesma chance. Depois de achar j deles, uma vaga traz um novo com
 * chance (n − j)/u, então esperam-se u/(n − j) vagas; somando os degraus: (u/vagas)·Σ_{j<b} 1/(n − j). É o custo de
 * fechar o breakpoint b: só depende de n (e de u, igual pra todos os traços).
 */
export function custoFechar(b, n, u, vagas = 5) {
  if (b > n) return Infinity;
  let s = 0;
  for (let j = 0; j < b; j++) s += 1 / (n - j);
  return (u / vagas) * s;
}

/** O mesmo de custoFechar, simulado loja por loja (média de `vezes`). */
export function simularFechar(b, n, u, vagas = 5, vezes = 20000, semente = 1) {
  const r = aleatorio(semente);
  let total = 0;
  for (let v = 0; v < vezes; v++) {
    const vistos = new Set();
    let lojas = 0;
    while (vistos.size < b) {
      lojas++;
      for (let s = 0; s < vagas; s++) {
        const c = Math.floor(r() * u);
        if (c < n) vistos.add(c);
      }
    }
    total += lojas;
  }
  return total / vezes;
}

/**
 * Escada de breakpoints pra um traço de `n` campeões custar o mesmo que a escada `alvo` (ex.: [2, 4, 6]) num traço de
 * `nAlvo`: pra cada degrau, o b (maior que o degrau anterior e até `max`, o tamanho do tabuleiro) cujo custo de fechar
 * fica mais perto, em razão, do custo do degrau alvo. Devolve os degraus e a razão de custo de cada um (1 = igual).
 */
export function escadaEquivalente(n, nAlvo, alvo, u, max) {
  const degraus = [];
  const razoes = [];
  let antes = 0;
  for (const t of alvo) {
    const k = custoFechar(t, nAlvo, u);
    let melhor = null;
    for (let b = antes + 1; b <= Math.min(n, max); b++) {
      const d = Math.abs(Math.log(custoFechar(b, n, u) / k));
      if (!melhor || d < melhor.d) melhor = { b, d };
    }
    if (!melhor) break;
    degraus.push(melhor.b);
    razoes.push(custoFechar(melhor.b, n, u) / k);
    antes = melhor.b;
  }
  return { degraus, razoes };
}

/**
 * Cada traço do set: quantos campeões têm ele (n), os breakpoints, o maior que dá pra fechar só com campeões
 * diferentes (sem emblema) e quanto sobra acima dele. campeoes: [{ tracos: [nome] }]; breakpoints: { nome: [2, 4, 6] }.
 */
export function tracosDoSet(campeoes, breakpoints) {
  const n = new Map();
  for (const c of campeoes) for (const t of new Set(c.tracos)) n.set(t, (n.get(t) ?? 0) + 1);
  return [...n].map(([nome, qtd]) => {
    const bps = breakpoints[nome] ?? [];
    const fechavel = bps.filter(b => b <= qtd).at(-1) ?? 0;
    return { nome, n: qtd, bps, topo: bps.at(-1) ?? 0, fechavel, sobra: qtd - fechavel, unico: qtd === 1 };
  });
}

/**
 * Resumo de um set: campeões (u), traços por campeão (k), traços que juntam 2 ou mais campeões e os únicos, e o
 * tamanho desses traços.
 */
export function resumoSet(campeoes, breakpoints) {
  const tracos = tracosDoSet(campeoes, breakpoints);
  const juntam = tracos.filter(t => !t.unico);
  const pertencimentos = soma(campeoes.map(c => new Set(c.tracos).size));
  return {
    u: campeoes.length,
    k: pertencimentos / campeoes.length,
    pertencimentos,
    tracos: juntam.length,
    unicos: tracos.length - juntam.length,
    tamanhoMedio: media(juntam.map(t => t.n)),
    tamanhoMediana: mediana(juntam.map(t => t.n)),
    lista: tracos,
  };
}

/**
 * Num tabuleiro de `l` campeões diferentes sorteados ao acaso entre `u`: quantos traços ficam ativos (fecham o 1º
 * breakpoint) e quantos breakpoints fecham, em média. tracos: [{ n, bps }]. É uma régua pra comparar sets (uma comp de
 * verdade escolhe os campeões e fecha mais), não o que um jogador faz.
 */
export function tabuleiroAleatorio(tracos, u, l) {
  let ativos = 0;
  let fechados = 0;
  for (const t of tracos) {
    if (!t.bps.length) continue;
    ativos += chanceAoMenos(u, t.n, l, t.bps[0]);
    for (const b of t.bps) fechados += chanceAoMenos(u, t.n, l, b);
  }
  return { ativos, fechados };
}

/**
 * Lojas (rolagens) esperadas pra juntar `alvo` cópias de um campeão (3 = 2★, 9 = 3★), comprando toda cópia que
 * aparece. Cada loja tem `vagas` vagas; numa vaga, o custo do campeão sai com chance `chance` e, dentro do custo, sai
 * uma cópia do que sobrou no pool: com j cópias já compradas e `tomadas` com outros jogadores, a chance da vaga trazer
 * o campeão é q = chance·(copias − tomadas − j)/(campeoes·copias − tomadas − j). O número de cópias numa loja é tratado
 * como Binomial(vagas, q) e o tempo até `alvo` sai exato da cadeia de Markov: E[j] = (1 + Σ P(j→i)·E[i]) / (1 − P(j→j)).
 * Sem cópia sobrando pra chegar no alvo: Infinity.
 */
export function rolagensEsperadas({ chance, campeoes, copias, alvo, vagas = 5, tomadas = 0 }) {
  if (copias - tomadas < alvo || chance <= 0) return Infinity;
  const pool = campeoes * copias - tomadas;
  const e = new Array(alvo + 1).fill(0);
  for (let j = alvo - 1; j >= 0; j--) {
    const q = (chance * (copias - tomadas - j)) / (pool - j);
    let fica = 0;
    let resto = 0;
    for (let x = 0; x <= vagas; x++) {
      const px = comb(vagas, x) * q ** x * (1 - q) ** (vagas - x);
      const i = Math.min(alvo, j + x);
      if (i === j) fica += px;
      else resto += px * e[i];
    }
    e[j] = (1 + resto) / (1 - fica);
  }
  return e[0];
}

/** Gerador pseudoaleatório com semente (mulberry32), pra simulação repetível. */
export function aleatorio(semente) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * O mesmo de rolagensEsperadas, simulado: cada vaga sorteia o custo e depois uma cópia do pool sem reposição dentro da
 * loja (o que está à mostra não volta pro sorteio até rolar), como no jogo. Média de `vezes` partidas.
 */
export function simularRolagens({ chance, campeoes, copias, alvo, vagas = 5, tomadas = 0 }, vezes = 20000, semente = 1) {
  const r = aleatorio(semente);
  const pool = campeoes * copias - tomadas;
  let total = 0;
  for (let v = 0; v < vezes; v++) {
    let j = 0;
    let rolagens = 0;
    while (j < alvo) {
      rolagens++;
      let alvoNaLoja = 0;
      let outrosNaLoja = 0;
      for (let s = 0; s < vagas; s++) {
        if (r() >= chance) continue;
        const restamAlvo = copias - tomadas - j - alvoNaLoja;
        const restam = pool - j - alvoNaLoja - outrosNaLoja;
        if (r() * restam < restamAlvo) alvoNaLoja++;
        else outrosNaLoja++;
      }
      j = Math.min(alvo, j + alvoNaLoja);
    }
    total += rolagens;
  }
  return total / vezes;
}

/**
 * Divide `u` campeões pelos 5 custos na mesma proporção de `referencia` (ex.: 14/13/14/14/10), arredondando pelo maior
 * resto pra somar `u`.
 */
export function porCusto(u, referencia) {
  const tot = soma(referencia);
  const bruto = referencia.map(x => (u * x) / tot);
  const r = bruto.map(Math.floor);
  const ordem = bruto.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0]);
  for (let i = 0; soma(r) < u; i++) r[ordem[i][1]]++;
  return r;
}
