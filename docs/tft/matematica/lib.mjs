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
 * fica mais perto, em razão, do custo do degrau alvo. `inicio` é o menor 1º degrau aceito (2 = nada de traço que
 * ativa com um campeão só). Devolve os degraus e a razão de custo de cada um (1 = igual).
 */
export function escadaEquivalente(n, nAlvo, alvo, u, max, inicio = 1) {
  const degraus = [];
  const razoes = [];
  let antes = inicio - 1;
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
 * Faixa de tamanhos de traço em que fechar o breakpoint `b` custa entre 1/(1 + tol) e (1 + tol) vezes o de um traço
 * de `nAlvo` campeões (tol = 0,25: até 25% mais caro ou 20% mais barato). Devolve { min, max }, inteiros.
 */
export function faixa(nAlvo, b, u, tol, vagas = 5) {
  const k = custoFechar(b, nAlvo, u, vagas);
  let min = b;
  while (custoFechar(b, min, u, vagas) / k > 1 + tol + 1e-12) min++;
  let max = min;
  while (custoFechar(b, max + 1, u, vagas) / k >= 1 / (1 + tol) - 1e-12) max++;
  return { min, max };
}

/**
 * Divide `vagas` novas entre os traços de `contagens` ({ nome: n }), uma por vez, sempre pro menor (empate: o primeiro
 * da lista). Como o custo de fechar cai quando n sobe, é a divisão que deixa o traço mais caro o mais barato possível.
 * Devolve { nome: quantas recebeu }.
 */
export function encher(contagens, vagas) {
  const n = { ...contagens };
  const ganho = Object.fromEntries(Object.keys(n).map(k => [k, 0]));
  for (let i = 0; i < vagas; i++) {
    const k = Object.keys(n).reduce((a, b) => (n[b] < n[a] ? b : a));
    n[k]++;
    ganho[k]++;
  }
  return ganho;
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

/**
 * Loja que mostra mais o que o jogador já tem: dentro do custo, o campeão que ele tem pesa `peso` e os outros pesam 1.
 * A chance de uma vaga trazer esse campeão vira chance·peso/(campeoes − 1 + peso), a mesma de uma loja sem peso com
 * (campeoes − 1 + peso)/peso campeões no custo: é esse número que vai em rolagensEsperadas (sem contar o pool
 * esvaziando, que mexe pouco; ver o teste das cópias).
 */
export const campeoesComPeso = (campeoes, peso) => (campeoes - 1 + peso) / peso;

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

/** `k` itens diferentes de `xs` ao acaso (Fisher-Yates parcial). Gasta sempre `k` números de `r`. */
export function amostra(xs, k, r) {
  const a = [...xs];
  for (let i = 0; i < k; i++) {
    const j = i + Math.floor(r() * (a.length - i));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, k);
}

/**
 * Um desenho de loja testado com o set de verdade, simulado rodada a rodada, com cópias infinitas (o pool não
 * esvazia). campeoes: [{ tracos: [origem, ...classes] }]. Em cada rodada sai um jogador: um traço T com pelo menos
 * `minTraco` campeões e um tabuleiro de `tabuleiro` campeões de T ao acaso. Os custos ainda não existem, então os
 * campeões se dividem ao acaso em `custos` custos de tamanho igual e a conta olha um deles, sorteado. Cada vaga cai
 * nesse custo com chance `chance` e aí sorteia um campeão dele pelo peso: quem está no tabuleiro (o "dono") pesa
 * `pesoDono`, quem divide origem ou classe com o tabuleiro pesa `pesoTime`, o resto 1. As `vagaDoTime` primeiras vagas
 * (vagas do time) também caem no custo com chance `chance`, mas sorteiam só entre os donos e quem divide traço com o
 * tabuleiro, com os mesmos pesos (sem ninguém assim no custo, sorteiam como as outras). Médias:
 * - m1: lojas pra juntar `alvo` cópias de um dono do custo (sorteado entre eles); só rodadas com dono no custo;
 * - m2: lojas até aparecer um campeão de T fora do tabuleiro; só rodadas com algum deles no custo;
 * - m3: campeões diferentes fora do tabuleiro por loja nesse custo, nas `lojasVariedade` primeiras lojas da rodada.
 * Devolve também quantas rodadas entram em m1 e em m2 e a fração do custo que divide traço com o tabuleiro (fracaoTime).
 * As rodadas saem de `semente` e são as mesmas em qualquer desenho; as lojas saem de outra sequência.
 */
export function simularLoja(campeoes, { vagas = 5, pesoDono = 1, vagaDoTime = 0, pesoTime = 1 } = {}, {
  chance, custos = 5, tabuleiro = 7, minTraco = 8, alvo = 2, rodadas = 20000, lojasVariedade = 10, semente = 1,
} = {}) {
  const membros = new Map();
  campeoes.forEach((c, i) => {
    for (const t of new Set(c.tracos)) {
      if (!membros.has(t)) membros.set(t, []);
      membros.get(t).push(i);
    }
  });
  const sorteaveis = [...membros].filter(([, ids]) => ids.length >= minTraco);
  const tamanhos = porCusto(campeoes.length, new Array(custos).fill(1));
  const todos = campeoes.map((_, i) => i);
  const rRodada = aleatorio(semente);
  const rLoja = aleatorio(semente + 0x9e3779b9);
  const naLoja = new Int32Array(vagas);
  // marcas por campeão (0/1), ligadas e desligadas a cada rodada: está no tabuleiro; é de T e está fora dele
  const noTab = new Uint8Array(campeoes.length);
  const ehNovo = new Uint8Array(campeoes.length);
  let s1 = 0, n1 = 0, s2 = 0, n2 = 0, s3 = 0, sTime = 0;
  for (let rodada = 0; rodada < rodadas; rodada++) {
    const [traco, doTraco] = sorteaveis[Math.floor(rRodada() * sorteaveis.length)];
    const tab = amostra(doTraco, tabuleiro, rRodada);
    const tracosTab = new Set(tab.flatMap(i => campeoes[i].tracos));
    const custo = amostra(todos, tamanhos[Math.floor(rRodada() * custos)], rRodada);
    for (const i of tab) noTab[i] = 1;
    const doTime = custo.filter(i => !noTab[i] && campeoes[i].tracos.some(t => tracosTab.has(t)));
    const donos = custo.filter(i => noTab[i]);
    const outros = custo.filter(i => !noTab[i] && !campeoes[i].tracos.some(t => tracosTab.has(t)));
    const quer = donos.length ? donos[Math.floor(rRodada() * donos.length)] : -1;
    const novos = doTime.filter(i => campeoes[i].tracos.includes(traco));
    for (const i of novos) ehNovo[i] = 1;
    // um número só escolhe o grupo (pelo peso total dele) e o campeão dentro do grupo
    const wD = donos.length * pesoDono;
    const wT = doTime.length * pesoTime;
    const sorteia = total => {
      let y = rLoja() * total;
      if (y < wD) return donos[Math.min(donos.length - 1, Math.floor(y / pesoDono))];
      y -= wD;
      if (y < wT) return doTime[Math.min(doTime.length - 1, Math.floor(y / pesoTime))];
      return outros[Math.min(outros.length - 1, Math.floor(y - wT))];
    };
    const total = wD + wT + outros.length;
    // vaga do time sem ninguém do time no custo: sorteia como uma vaga normal
    const totalTime = wD + wT > 0 ? wD + wT : total;
    let copias = 0, l1 = 0, l2 = 0, lojas = 0, vistos = 0;
    while (lojas < lojasVariedade || (quer >= 0 && !l1) || (novos.length && !l2)) {
      lojas++;
      let k = 0;
      for (let s = 0; s < vagas; s++) if (rLoja() < chance) naLoja[k++] = sorteia(s < vagaDoTime ? totalTime : total);
      let achou = false;
      for (let a = 0; a < k; a++) {
        const i = naLoja[a];
        if (i === quer) copias++;
        if (ehNovo[i]) achou = true;
        // campeão fora do tabuleiro que ainda não tinha saído nesta loja (a 1ª vez dele na loja é a vaga a)
        if (lojas <= lojasVariedade && !noTab[i] && naLoja.indexOf(i) === a) vistos++;
      }
      if (quer >= 0 && !l1 && copias >= alvo) l1 = lojas;
      if (novos.length && !l2 && achou) l2 = lojas;
    }
    if (quer >= 0) {
      s1 += l1;
      n1++;
    }
    if (novos.length) {
      s2 += l2;
      n2++;
    }
    s3 += vistos / lojasVariedade;
    sTime += (donos.length + doTime.length) / custo.length;
    for (const i of tab) noTab[i] = 0;
    for (const i of novos) ehNovo[i] = 0;
  }
  return { m1: s1 / n1, m2: s2 / n2, m3: s3 / rodadas, rodadasM1: n1, rodadasM2: n2, fracaoTime: sTime / rodadas };
}

/** Quantas mecânicas um desenho de loja junta à loja normal (peso pro dono, vaga do time, peso pro time). */
export const mecanicas = d => (d.pesoDono > 1) + (d.vagaDoTime > 0) + (d.pesoTime > 1);

/**
 * O melhor desenho: a menor soma m1 + m2 entre os que mantêm m3 em pelo menos `variedade` vezes o m3 de `base` (a
 * loja normal). Quem fica a menos de `empate` (fração) da menor soma empata, e aí ganha o com menos mecânicas (depois,
 * a menor soma). desenhos: [{ m1, m2, m3, pesoDono, vagaDoTime, pesoTime }].
 */
export function melhorDesenho(desenhos, base, { variedade = 0.75, empate = 0.01 } = {}) {
  const passam = desenhos.filter(d => d.m3 >= variedade * base.m3);
  const menor = Math.min(...passam.map(d => d.m1 + d.m2));
  return passam
    .filter(d => d.m1 + d.m2 <= menor * (1 + empate))
    .sort((a, b) => mecanicas(a) - mecanicas(b) || a.m1 + a.m2 - (b.m1 + b.m2))[0];
}
