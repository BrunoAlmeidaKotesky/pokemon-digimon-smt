import { describe, expect, it } from 'vitest';
import {
  aleatorio, amostra, campeoesComPeso, chanceAoMenos, comb, custoFechar, encher, escadaEquivalente, faixa, mecanicas, media, mediana,
  melhorDesenho, porCusto, resumoSet, rolagensEsperadas, simularFechar, simularLoja, simularRolagens, tabuleiroAleatorio, tracosDoSet,
} from './lib.mjs';

describe('custo de fechar um breakpoint', () => {
  it('soma dos degraus: (u/vagas)·Σ 1/(n − j); impossível acima de n', () => {
    expect(custoFechar(1, 10, 100, 1)).toBeCloseTo(10, 12);
    expect(custoFechar(2, 10, 100, 5)).toBeCloseTo(20 * (1 / 10 + 1 / 9), 12);
    expect(custoFechar(7, 6, 100)).toBe(Infinity);
  });
  it('bate com a simulação loja por loja', () => {
    for (const [b, n, u] of [[2, 28, 252], [6, 28, 252], [6, 12, 252], [6, 57, 252]]) {
      const conta = custoFechar(b, n, u);
      const sim = simularFechar(b, n, u, 5, 20000, 11);
      // a conta conta vagas e divide por 5; a simulação conta lojas inteiras (arredonda pra cima): até meia loja a mais
      expect(Math.abs(sim - conta)).toBeLessThan(0.6);
    }
  });
  it('escada equivalente: traço do mesmo tamanho fica com a mesma escada; maior pede degraus maiores, limitados ao tabuleiro', () => {
    expect(escadaEquivalente(28, 28, [2, 4, 6], 252, 9).degraus).toEqual([2, 4, 6]);
    const grande = escadaEquivalente(57, 28, [2, 4, 6], 252, 9);
    expect(grande.degraus[0]).toBeGreaterThan(2);
    expect(Math.max(...grande.degraus)).toBeLessThanOrEqual(9);
    const pequeno = escadaEquivalente(12, 28, [2, 4, 6], 252, 9).degraus;
    expect(pequeno.at(-1)).toBeLessThan(6);
    expect(escadaEquivalente(12, 28, [2, 4, 6], 252, 9, 2).degraus[0]).toBe(2);
  });
  it('faixa: sem tolerância é só o próprio alvo; com tolerância, as pontas ficam dentro e o vizinho de fora não', () => {
    expect(faixa(28, 6, 252, 0)).toEqual({ min: 28, max: 28 });
    const { min, max } = faixa(27.2, 6, 272, 0.25);
    const r = n => custoFechar(6, n, 272) / custoFechar(6, 27.2, 272);
    expect(min).toBeLessThan(27.2);
    expect(max).toBeGreaterThan(27.2);
    expect(r(min)).toBeLessThanOrEqual(1.25);
    expect(r(min - 1)).toBeGreaterThan(1.25);
    expect(r(max)).toBeGreaterThanOrEqual(0.8);
    expect(r(max + 1)).toBeLessThan(0.8);
  });
  it('encher: cada vaga vai pro menor; empate fica com o primeiro', () => {
    expect(encher({ a: 1, b: 5, c: 3 }, 4)).toEqual({ a: 3, b: 0, c: 1 });
    expect(encher({ a: 2, b: 2 }, 0)).toEqual({ a: 0, b: 0 });
  });
});

describe('contas básicas', () => {
  it('comb, média e mediana', () => {
    expect(comb(5, 2)).toBe(10);
    expect(comb(52, 5)).toBeCloseTo(2598960, 6);
    expect(comb(3, 4)).toBe(0);
    expect(media([1, 2, 6])).toBe(3);
    expect(mediana([5, 1, 3])).toBe(3);
    expect(mediana([4, 1, 3, 2])).toBe(2.5);
  });
  it('hipergeométrica: P(X ≥ 0) = 1; P(X ≥ 1) = 1 − C(u−n, l)/C(u, l)', () => {
    expect(chanceAoMenos(10, 3, 4, 0)).toBeCloseTo(1, 12);
    expect(chanceAoMenos(10, 3, 4, 1)).toBeCloseTo(1 - 35 / 210, 12);
    expect(chanceAoMenos(10, 3, 4, 4)).toBe(0);
    expect(chanceAoMenos(65, 65, 8, 8)).toBeCloseTo(1, 12);
  });
  it('porCusto: mesma proporção, soma exata', () => {
    expect(porCusto(65, [14, 13, 14, 14, 10])).toEqual([14, 13, 14, 14, 10]);
    const r = porCusto(322, [14, 13, 14, 14, 10]);
    expect(r.reduce((a, x) => a + x, 0)).toBe(322);
    // 69,35 · 64,4 · 69,35 · 69,35 · 49,54: os dois maiores restos (49,54 e 64,4) sobem
    expect(r).toEqual([69, 65, 69, 69, 50]);
  });
});

describe('traços', () => {
  const campeoes = [
    { tracos: ['A', 'X'] }, { tracos: ['A', 'X'] }, { tracos: ['A', 'Y'] }, { tracos: ['A'] }, { tracos: ['A', 'U'] },
  ];
  const bps = { A: [2, 4, 6], X: [2, 4], Y: [1], U: [1] };
  it('n, maior breakpoint que fecha sem emblema, sobra e únicos', () => {
    const t = Object.fromEntries(tracosDoSet(campeoes, bps).map(x => [x.nome, x]));
    expect(t.A).toMatchObject({ n: 5, topo: 6, fechavel: 4, sobra: 1, unico: false });
    expect(t.X).toMatchObject({ n: 2, fechavel: 2, sobra: 0 });
    expect(t.Y.unico).toBe(true);
    const r = resumoSet(campeoes, bps);
    expect(r).toMatchObject({ u: 5, pertencimentos: 9, tracos: 2, unicos: 2, tamanhoMedio: 3.5 });
    expect(r.k).toBeCloseTo(1.8, 12);
  });
  it('tabuleiro aleatório: traço que todo mundo tem sempre fecha', () => {
    const r = tabuleiroAleatorio([{ n: 10, bps: [2, 4] }, { n: 0, bps: [2] }], 10, 4);
    expect(r.ativos).toBeCloseTo(1, 12);
    expect(r.fechados).toBeCloseTo(2, 12);
  });
});

describe('loja', () => {
  it('uma vaga e uma cópia: geométrica, E = 1/q', () => {
    // q = 1 · 5/50
    expect(rolagensEsperadas({ chance: 1, campeoes: 10, copias: 5, alvo: 1, vagas: 1 })).toBeCloseTo(10, 9);
    // cinco vagas: E = 1/(1 − (1 − q)^5)
    expect(rolagensEsperadas({ chance: 0.5, campeoes: 10, copias: 5, alvo: 1 })).toBeCloseTo(1 / (1 - 0.95 ** 5), 9);
  });
  it('peso pro que o jogador tem: peso 1 não muda nada; com peso, a chance por vaga bate com a do pool equivalente', () => {
    expect(campeoesComPeso(56, 1)).toBe(56);
    const n = 56;
    const w = 3;
    expect(1 / campeoesComPeso(n, w)).toBeCloseTo(w / (n - 1 + w), 12);
    // peso 3 com 56 campeões fica entre o pool de 19 e o de 20
    const r = rolagensEsperadas({ chance: 0.55, campeoes: campeoesComPeso(n, w), copias: 30, alvo: 3 });
    expect(r).toBeGreaterThan(rolagensEsperadas({ chance: 0.55, campeoes: 19, copias: 30, alvo: 3 }));
    expect(r).toBeLessThan(rolagensEsperadas({ chance: 0.55, campeoes: 20, copias: 30, alvo: 3 }));
  });
  it('sem cópia suficiente: Infinity', () => {
    expect(rolagensEsperadas({ chance: 0.3, campeoes: 10, copias: 9, alvo: 9, tomadas: 1 })).toBe(Infinity);
  });
  it('a cadeia de Markov bate com a simulação da loja de verdade (sem reposição dentro da loja)', () => {
    for (const caso of [
      { chance: 0.45, campeoes: 14, copias: 30, alvo: 9 },
      { chance: 0.3, campeoes: 14, copias: 10, alvo: 3 },
      { chance: 0.33, campeoes: 14, copias: 10, alvo: 9, tomadas: 0 },
    ]) {
      const dp = rolagensEsperadas(caso);
      const mc = simularRolagens(caso, 20000, 7);
      expect(Math.abs(dp - mc) / mc).toBeLessThan(0.03);
    }
  });
  it('dobrar os campeões do custo quase dobra as rolagens; dobrar as cópias quase não muda (só o pool esvazia mais devagar)', () => {
    const a = rolagensEsperadas({ chance: 0.45, campeoes: 14, copias: 30, alvo: 9 });
    const b = rolagensEsperadas({ chance: 0.45, campeoes: 28, copias: 30, alvo: 9 });
    const c = rolagensEsperadas({ chance: 0.45, campeoes: 14, copias: 60, alvo: 9 });
    expect(b / a).toBeGreaterThan(1.9);
    expect(b / a).toBeLessThan(2.1);
    expect(c / a).toBeGreaterThan(0.9);
    expect(c / a).toBeLessThan(1);
  });
});

describe('desenho da loja com o set', () => {
  // 250 campeões, 10 origens de 25 e 12 classes: os 5 custos têm 50 cada
  const set = Array.from({ length: 250 }, (_, i) => ({ tracos: [`O${i % 10}`, `C${(i * 7) % 12}`] }));
  const op = { chance: 0.55, rodadas: 20000, semente: 5 };
  it('amostra: k itens diferentes do conjunto', () => {
    const a = amostra([1, 2, 3, 4, 5, 6], 4, aleatorio(3));
    expect(new Set(a).size).toBe(4);
    expect(a.every(x => x >= 1 && x <= 6)).toBe(true);
  });
  it('loja normal: m1 bate com a cadeia de Markov de um campeão num custo de 50 (alvo 2, cópias infinitas)', () => {
    for (const vagas of [5, 6, 7]) {
      const sim = simularLoja(set, { vagas }, op).m1;
      const conta = rolagensEsperadas({ chance: 0.55, campeoes: 50, copias: 1e9, alvo: 2, vagas });
      expect(Math.abs(sim - conta) / conta).toBeLessThan(0.03);
    }
  });
  it('loja normal: m3 bate com a conta, (50 − donos)·(1 − (1 − chance/50)^vagas), com 7·50/250 donos em média', () => {
    const conta = (50 - (7 * 50) / 250) * (1 - (1 - 0.55 / 50) ** 5);
    expect(Math.abs(simularLoja(set, {}, op).m3 - conta) / conta).toBeLessThan(0.01);
  });
  it('peso do dono acelera m1; vaga do time acelera m1 e m2; as rodadas são as mesmas em qualquer desenho', () => {
    const normal = simularLoja(set, {}, op);
    const peso = simularLoja(set, { pesoDono: 3 }, op);
    const time = simularLoja(set, { vagaDoTime: 1 }, op);
    expect(peso.m1).toBeLessThan(normal.m1 / 2);
    expect(time.m1).toBeLessThan(normal.m1);
    expect(time.m2).toBeLessThan(normal.m2);
    expect([peso.rodadasM1, time.rodadasM1]).toEqual([normal.rodadasM1, normal.rodadasM1]);
    expect([peso.rodadasM2, time.rodadasM2]).toEqual([normal.rodadasM2, normal.rodadasM2]);
  });
  it('melhor desenho: menor m1 + m2 entre os que mantêm a variedade; empate fica com o de menos mecânicas', () => {
    const base = { m1: 40, m2: 7, m3: 2.6, pesoDono: 1, vagaDoTime: 0, pesoTime: 1 };
    // a menor soma, mas com m3 abaixo de 75% do da base
    const semVariedade = { m1: 10, m2: 5, m3: 1.5, pesoDono: 4, vagaDoTime: 0, pesoTime: 1 };
    const duas = { m1: 12, m2: 6, m3: 2.5, pesoDono: 3, vagaDoTime: 1, pesoTime: 1 };
    // 0,6% acima de `duas`, com uma mecânica a menos
    const uma = { m1: 12.1, m2: 6, m3: 2.5, pesoDono: 3, vagaDoTime: 0, pesoTime: 1 };
    expect(mecanicas(base)).toBe(0);
    expect(mecanicas(duas)).toBe(2);
    expect(melhorDesenho([base, semVariedade, duas, uma], base)).toBe(uma);
    expect(melhorDesenho([base, semVariedade, duas, uma], base, { empate: 0 })).toBe(duas);
    expect(melhorDesenho([base, semVariedade, duas, uma], base, { variedade: 0.5, empate: 0 })).toBe(semVariedade);
  });
});
