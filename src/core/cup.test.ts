import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Cup, Entry, Item, Match } from '../types';
import {
  bracketColumns,
  bracketHeight,
  bracketLinks,
  buildEntrants,
  cupChoose,
  cupPair,
  cupSync,
  pairUp,
  roundName,
  same,
  startCup,
  toMatches,
} from './cup';
import { makeList, mulberry32, SEEDS, seedRandom, sequence } from './test-helpers';

afterEach(() => vi.restoreAllMocks());

const LISTS: Record<string, Item[]> = {
  pokemon: makeList('P', 40),
  digimon: makeList('D', 25),
  smt: makeList('S', 60),
  jojo: makeList('J', 10),
  ygo: makeList('Y', 12),
  bakugan: makeList('B', 9),
  sujimon: makeList('U', 8),
  tiny: makeList('T', 3),
  mini: makeList('M', 2),
};
const e = (name: string, fr: string, k?: string): Entry => (k === undefined ? { name, img: '', fr } : { name, img: '', fr, k });
const countBy = (list: Entry[]) => list.reduce<Record<string, number>>((acc, x) => ((acc[x.fr] = (acc[x.fr] || 0) + 1), acc), {});
const samePairs = (flat: Entry[]) => {
  let n = 0;
  for (let i = 0; i < flat.length; i += 2) if ((flat[i] as Entry).fr === (flat[i + 1] as Entry).fr) n++;
  return n;
};
/** Joga até o fim; `pickA` decide o vencedor de cada confronto. */
function playAll(c: Cup, pickA: (a: Entry, b: Entry) => boolean = () => true): string[] {
  const labels: string[] = [];
  for (let p = cupPair(c); p; p = cupPair(c)) {
    labels.push(roundName(c.round.length));
    cupChoose(c, pickA(p[0], p[1]) ? p[0] : p[1]);
  }
  return labels;
}
const build = (frs: string[], size: number, even: boolean, mix: boolean) => buildEntrants({ frs, size, even, mix, lists: LISTS });

describe('roundName', () => {
  it('nomes fixos e "Rodada de N"', () => {
    expect(roundName(2)).toBe('Final');
    expect(roundName(4)).toBe('Semifinal');
    expect(roundName(8)).toBe('Quartas de final');
    expect(roundName(16)).toBe('Rodada de 16');
    expect(roundName(32)).toBe('Rodada de 32');
    expect(roundName(64)).toBe('Rodada de 64');
  });
});

describe('toMatches / same', () => {
  it('toMatches agrupa de 2 em 2, sem vencedor', () => {
    const [a, b, c, d] = [e('a', 'x'), e('b', 'y'), e('c', 'x'), e('d', 'y')];
    expect(toMatches([a, b, c, d])).toEqual([
      { a, b, w: null },
      { a: c, b: d, w: null },
    ]);
    expect(toMatches([])).toEqual([]);
    expect(toMatches([null, a])).toEqual([{ a: null, b: a, w: null }]);
  });

  it('same: identidade, ou k igual (os dois definidos)', () => {
    const a = e('A', 'x');
    expect(same(a, a)).toBe(true);
    expect(same(a, { ...a })).toBe(false);
    expect(same(e('A', 'x', '1'), e('B', 'y', '1'))).toBe(true);
    expect(same(e('A', 'x', '1'), e('A', 'x', '2'))).toBe(false);
    expect(same(e('A', 'x', '1'), e('A', 'x'))).toBe(false);
    expect(same(null, null)).toBe(true);
    expect(same(null, a)).toBe(false);
    expect(same(a, null)).toBe(false);
    expect(same(undefined, e('A', 'x', '1'))).toBe(false);
  });
});

describe('pairUp', () => {
  it('é uma permutação da entrada e gasta (n-1) + (n/2-1) chamadas', () => {
    const list = [...makeList('P', 5).map(x => ({ ...x, fr: 'pokemon' })), ...makeList('D', 3).map(x => ({ ...x, fr: 'digimon' }))];
    const r = seedRandom(3);
    const got = pairUp(list);
    expect(r.calls()).toBe(7 + 3);
    expect(got).toHaveLength(8);
    expect(new Set(got)).toEqual(new Set(list));
    expect(list.map(x => x.name)).toEqual(['P0', 'P1', 'P2', 'P3', 'P4', 'D0', 'D1', 'D2']); // não mexe na entrada
  });

  it.each(SEEDS)('4 x 4: nenhum confronto da mesma franquia (semente %i)', seed => {
    seedRandom(seed);
    const list = [...Array.from({ length: 4 }, (_, i) => e('P' + i, 'pokemon')), ...Array.from({ length: 4 }, (_, i) => e('D' + i, 'digimon'))];
    expect(samePairs(pairUp(list))).toBe(0);
  });

  it('6 x 2: só os 2 confrontos inevitáveis da mesma franquia', () => {
    seedRandom(5);
    const list = [...Array.from({ length: 6 }, (_, i) => e('P' + i, 'pokemon')), e('D0', 'digimon'), e('D1', 'digimon')];
    expect(samePairs(pairUp(list))).toBe(2);
  });

  it('composições aleatórias: o mínimo possível de confrontos da mesma franquia', () => {
    seedRandom(2024);
    const g = mulberry32(99);
    for (let t = 0; t < 300; t++) {
      const total = 2 ** (1 + Math.floor(g() * 5));
      const frs = 1 + Math.floor(g() * 5);
      const list = Array.from({ length: total }, (_, i) => e('N' + i, 'f' + Math.floor(g() ** 2 * frs)));
      const max = Math.max(...Object.values(countBy(list)));
      expect(samePairs(pairUp(list))).toBe(Math.max(0, max - (total - max)) / 2);
    }
  });
});

describe('buildEntrants', () => {
  it('sem franquias: [] sem sortear', () => {
    const r = sequence([]);
    expect(build([], 8, true, true)).toEqual([]);
    expect(r.calls()).toBe(0);
  });

  it.each([4, 8, 16, 32, 64])('tamanho %i: exatamente esse número, sem repetidos, cópias com fr', size => {
    seedRandom(size);
    const frs = ['pokemon', 'digimon', 'smt'];
    const got = build(frs, size, false, false);
    expect(got).toHaveLength(size);
    expect(new Set(got.map(x => x.fr + '/' + x.name)).size).toBe(size);
    got.forEach(x => {
      expect(frs).toContain(x.fr);
      expect(LISTS[x.fr]).not.toContain(x);
      expect(x.name.startsWith((x.fr[0] as string).toUpperCase())).toBe(true);
    });
    expect(LISTS.pokemon).toHaveLength(40);
    expect(LISTS.pokemon?.[0]).toEqual({ name: 'P0', img: 'p/0.png' });
  });

  it('dividir igual: floor(size/frs) pra cada e o resto pra franquias sorteadas', () => {
    seedRandom(1);
    expect(Object.values(countBy(build(['pokemon', 'digimon'], 8, true, false))).sort()).toEqual([4, 4]);
    expect(Object.values(countBy(build(['pokemon', 'digimon', 'smt'], 8, true, false))).sort()).toEqual([2, 3, 3]);
    expect(Object.values(countBy(build(['pokemon', 'digimon', 'smt'], 16, true, false))).sort()).toEqual([5, 5, 6]);
    const seven = ['pokemon', 'digimon', 'smt', 'jojo', 'ygo', 'bakugan', 'sujimon'];
    expect(Object.values(countBy(build(seven, 8, true, false))).sort()).toEqual([1, 1, 1, 1, 1, 1, 2]);
  });

  it('sem dividir igual: cada vaga vai pra uma franquia sorteada (varia entre sementes)', () => {
    const dists = new Set<string>();
    for (const seed of SEEDS) {
      seedRandom(seed);
      const got = build(['pokemon', 'digimon'], 16, false, false);
      expect(got).toHaveLength(16);
      dists.add(JSON.stringify(countBy(got)));
    }
    expect(dists.size).toBeGreaterThan(1);
  });

  it('franquia pequena: entram todos dela e as outras completam as vagas', () => {
    seedRandom(6);
    const got = build(['tiny', 'pokemon'], 16, true, false);
    expect(got).toHaveLength(16);
    expect(countBy(got)).toEqual({ tiny: 3, pokemon: 13 });
  });

  it('não dá pra completar: cai pra maior potência de 2 possível', () => {
    seedRandom(7);
    expect(build(['tiny', 'mini'], 16, true, false)).toHaveLength(4); // 5 disponíveis
    expect(build(['tiny'], 8, true, false)).toHaveLength(2); // 3 disponíveis
    expect(build(['jojo', 'mini'], 16, false, false)).toHaveLength(8); // 12 disponíveis
    expect(build(['jojo', 'mini'], 4, false, false)).toHaveLength(4);
  });

  it.each(SEEDS)('misto: pares de franquias diferentes quando dá (semente %i)', seed => {
    seedRandom(seed);
    const got = build(['pokemon', 'digimon'], 16, true, true);
    expect(got).toHaveLength(16);
    expect(samePairs(got)).toBe(0);
  });
});

describe('startCup / fluxo completo', () => {
  it('startCup monta a primeira rodada', () => {
    const list = Array.from({ length: 4 }, (_, i) => e('N' + i, 'x'));
    const c = startCup(list, true);
    expect(c).toEqual({ round: list, next: [], i: 0, rounds: [toMatches(list)], losers: {}, champ: null, mix: true });
    expect(c.round).toBe(list);
    cupSync(c);
    expect(c.rounds).toHaveLength(1);
    expect(cupPair(c)).toEqual([list[0], list[1]]);
  });

  it.each([
    [8, false],
    [8, true],
    [16, false],
    [16, true],
  ])('%i participantes, misto=%s: rodadas, perdedores e campeão', (size, mix) => {
    seedRandom(size + (mix ? 1 : 0));
    const entrants = build(['pokemon', 'digimon', 'smt'], size, true, mix);
    const c = startCup(entrants, mix);
    const g = mulberry32(5);
    const labels = playAll(c, () => g() < 0.5);
    const sizes: number[] = [];
    for (let n = size; n >= 2; n /= 2) sizes.push(n);
    expect(labels).toEqual(sizes.flatMap(n => Array.from({ length: n / 2 }, () => roundName(n))));
    expect(c.rounds.map(r => r.length)).toEqual(sizes.map(n => n / 2));
    expect(c.champ).not.toBeNull();
    expect(cupPair(c)).toBeNull();
    // todo confronto decidido; quem passou é exatamente a rodada seguinte
    c.rounds.forEach((r, ri) => {
      r.forEach(m => expect([m.a, m.b]).toContain(m.w));
      const winners = r.map(m => m.w);
      const next = c.rounds[ri + 1];
      if (next) {
        const nextEntries = next.flatMap(m => [m.a, m.b]);
        if (!mix) expect(nextEntries).toEqual(winners);
        else expect(new Set(nextEntries)).toEqual(new Set(winners));
      } else expect(winners).toEqual([c.champ]);
    });
    // perdedores por tamanho da rodada
    sizes.forEach((n, ri) => {
      const r = c.rounds[ri] as Match[];
      expect(c.losers[n]).toEqual(r.map(m => (m.w === m.a ? m.b : m.a)));
    });
    expect(new Set([...Object.values(c.losers).flat(), c.champ])).toEqual(new Set(entrants));
  });

  it('chave fixa (sem misto): sempre o primeiro vence -> campeão é o primeiro da chave', () => {
    const list = Array.from({ length: 8 }, (_, i) => e('N' + i, i % 2 ? 'a' : 'b'));
    const c = startCup([...list], false);
    playAll(c);
    expect(c.champ).toBe(list[0]);
    expect(c.losers).toEqual({ 8: [list[1], list[3], list[5], list[7]], 4: [list[2], list[6]], 2: [list[4]] });
  });

  it('com 2 participantes: só a final', () => {
    const [a, b] = [e('A', 'x'), e('B', 'y')];
    const c = startCup([a, b], true);
    expect(playAll(c, (x, y) => x === b || y !== b)).toEqual(['Final']);
    expect(c.champ).toBe(b);
    expect(c.losers).toEqual({ 2: [a] });
  });

  it('depois do campeão: cupSync e cupChoose não mudam nada', () => {
    const list = Array.from({ length: 4 }, (_, i) => e('N' + i, 'x'));
    const c = startCup(list, false);
    playAll(c);
    const snap = JSON.stringify(c);
    cupSync(c);
    cupChoose(c, list[3] as Entry);
    expect(JSON.stringify(c)).toBe(snap);
  });

  it('modo misto re-pareia a cada rodada (gasta Math.random); chave fixa não', () => {
    const list = Array.from({ length: 8 }, (_, i) => e('N' + i, i < 4 ? 'a' : 'b'));
    let r = sequence([]);
    playAll(startCup([...list], false));
    expect(r.calls()).toBe(0);
    r = seedRandom(1);
    playAll(startCup([...list], true));
    // pairUp(4): 3 + 1; pairUp(2): 1 + 0
    expect(r.calls()).toBe(5);
  });
});

describe('bracketColumns', () => {
  const eight = () => Array.from({ length: 8 }, (_, i) => e('N' + i, i % 2 ? 'a' : 'b'));
  const flags = (c: Cup) => bracketColumns(c).map(col => col.matches.map(x => (x.now ? 'now' : x.hidden ? 'h' : '-')).join(''));
  const names = (col: { matches: { m: Match }[] }) => col.matches.map(x => [x.m.a?.name ?? null, x.m.b?.name ?? null]);

  it('no começo (8): rodada atual + futuras com placeholders + Campeão', () => {
    const c = startCup(eight(), false);
    const cols = bracketColumns(c);
    expect(cols.map(x => x.title)).toEqual(['Quartas de final', 'Semifinal', 'Final', 'Campeão']);
    expect(cols.map(x => x.champ)).toEqual([false, false, false, true]);
    expect(flags(c)).toEqual(['nowhhh', '--', '-', '-']);
    expect(names(cols[1] as never)).toEqual([[null, null], [null, null]]);
    expect(cols[3]?.matches).toEqual([{ m: { a: null, b: null, w: null }, hidden: false, now: false }]);
    expect(cols[0]?.matches[0]?.m).toBe(c.rounds[0]?.[0]);
  });

  it('16: títulos', () => {
    const c = startCup(Array.from({ length: 16 }, (_, i) => e('N' + i, 'x')), false);
    expect(bracketColumns(c).map(x => x.title)).toEqual(['Rodada de 16', 'Quartas de final', 'Semifinal', 'Final', 'Campeão']);
  });

  it('chave fixa: a próxima rodada já mostra quem passou; now/hidden andam', () => {
    const c = startCup(eight(), false);
    cupChoose(c, c.round[0] as Entry);
    expect(flags(c)).toEqual(['-nowhh', '--', '-', '-']);
    expect(names(bracketColumns(c)[1] as never)).toEqual([['N0', null], [null, null]]);
    cupChoose(c, c.round[3] as Entry);
    cupChoose(c, c.round[4] as Entry);
    expect(flags(c)).toEqual(['---now', '--', '-', '-']);
    expect(names(bracketColumns(c)[1] as never)).toEqual([['N0', 'N3'], ['N4', null]]);
    cupChoose(c, c.round[7] as Entry);
    // rodada 1 terminou: a coluna 1 vira a rodada atual
    const cols = bracketColumns(c);
    expect(cols.map(x => x.title)).toEqual(['Quartas de final', 'Semifinal', 'Final', 'Campeão']);
    expect(flags(c)).toEqual(['----', 'nowh', '-', '-']);
    expect(names(cols[1] as never)).toEqual([['N0', 'N3'], ['N4', 'N7']]);
    expect(names(cols[2] as never)).toEqual([[null, null]]);
  });

  it('modo misto: rodadas futuras ficam vazias', () => {
    seedRandom(2);
    const c = startCup(eight(), true);
    cupChoose(c, c.round[0] as Entry);
    cupChoose(c, c.round[2] as Entry);
    expect(names(bracketColumns(c)[1] as never)).toEqual([[null, null], [null, null]]);
  });

  it('com campeão: só as rodadas jogadas + Campeão, sem now/hidden', () => {
    const c = startCup(eight(), false);
    playAll(c);
    const cols = bracketColumns(c);
    expect(cols.map(x => x.title)).toEqual(['Quartas de final', 'Semifinal', 'Final', 'Campeão']);
    expect(flags(c)).toEqual(['----', '--', '-', '-']);
    expect(cols[3]?.matches[0]?.m.a).toBe(c.champ);
    expect(cols[2]?.matches[0]?.m).toBe(c.rounds[2]?.[0]);
  });

  it('não muda o estado do campeonato', () => {
    const c = startCup(eight(), false);
    cupChoose(c, c.round[1] as Entry);
    const snap = JSON.stringify(c);
    bracketColumns(c);
    bracketLinks(c);
    expect(JSON.stringify(c)).toBe(snap);
  });
});

describe('bracketLinks', () => {
  const eight = (k = false) => Array.from({ length: 8 }, (_, i) => e('N' + i, i % 2 ? 'a' : 'b', k ? 'k' + i : undefined));

  it('chave fixa: liga ao confronto mi>>1 da próxima coluna, já antes dela existir', () => {
    const c = startCup(eight(), false);
    expect(bracketLinks(c)).toEqual([]);
    cupChoose(c, c.round[0] as Entry);
    expect(bracketLinks(c)).toEqual([{ r: 0, m: 0, tr: 1, tm: 0 }]);
    cupChoose(c, c.round[3] as Entry);
    cupChoose(c, c.round[5] as Entry);
    expect(bracketLinks(c)).toEqual([
      { r: 0, m: 0, tr: 1, tm: 0 },
      { r: 0, m: 1, tr: 1, tm: 0 },
      { r: 0, m: 2, tr: 1, tm: 1 },
    ]);
  });

  it('chave fixa até o fim: 7 linhas, a final liga na coluna do campeão', () => {
    const c = startCup(eight(), false);
    playAll(c);
    const links = bracketLinks(c);
    expect(links).toHaveLength(7);
    expect(links.at(-1)).toEqual({ r: 2, m: 0, tr: 3, tm: 0 });
    expect(bracketColumns(c)[3]?.champ).toBe(true);
  });

  it('modo misto: nada liga enquanto a próxima rodada não foi sorteada; depois liga onde o vencedor caiu', () => {
    seedRandom(12);
    const c = startCup(eight(), true);
    for (let i = 0; i < 3; i++) cupChoose(c, c.round[c.i] as Entry);
    expect(bracketLinks(c)).toEqual([]);
    cupChoose(c, c.round[c.i] as Entry);
    const links = bracketLinks(c);
    expect(links).toHaveLength(4);
    links.forEach(l => {
      const w = c.rounds[0]?.[l.m]?.w;
      const target = c.rounds[1]?.[l.tm] as Match;
      expect(l.r).toBe(0);
      expect(l.tr).toBe(1);
      expect([target.a, target.b]).toContain(w);
    });
  });

  it('usa same(): objetos que vieram da rede (cópias com o mesmo k) ainda ligam', () => {
    seedRandom(13);
    const withK = startCup(eight(true), true);
    const noK = startCup(eight(false), true);
    for (const c of [withK, noK]) {
      for (let i = 0; i < 4; i++) cupChoose(c, c.round[c.i] as Entry);
      // troca a rodada 2 por cópias (como se tivesse vindo serializada)
      c.rounds[1] = (c.rounds[1] as Match[]).map(m => ({ a: m.a && { ...m.a }, b: m.b && { ...m.b }, w: null }));
    }
    expect(bracketLinks(withK)).toHaveLength(4);
    expect(bracketLinks(noK)).toHaveLength(0);
  });
});

describe('bracketHeight', () => {
  it('max(confrontos da 1ª rodada * 64, 160)', () => {
    const mk = (n: number) => startCup(Array.from({ length: n }, (_, i) => e('N' + i, 'x')), false);
    expect(bracketHeight(mk(2))).toBe(160);
    expect(bracketHeight(mk(4))).toBe(160);
    expect(bracketHeight(mk(8))).toBe(256);
    expect(bracketHeight(mk(16))).toBe(512);
    const c = mk(8);
    playAll(c);
    expect(bracketHeight(c)).toBe(256);
  });
});

// --- referência: cópia do campeonato do site antigo, sem DOM (só ganhou tipos/casts) ---
// O "DOM" do renderLog vira um Map 'r:m' -> conteúdo do .match, e drawLines devolve as ligações em vez do SVG.
type RefMatch = { a: Entry | null; b: Entry | null; w: Entry | null };
type RefCup = { round: Entry[]; next: Entry[]; i: number; rounds: RefMatch[][]; losers: Record<number, Entry[]>; champ: Entry | null };
type Link = { r: number; m: number; tr: number; tm: number };

function slot(it: Entry | null | undefined, m?: RefMatch): string {
  if(!it) return `[???]`;
  const st = !m || !m.w ? '' : (m.w===it ? ' win' : ' lose');
  return `[${it.fr}:${it.name}${st}]`;
}

function makeRefCup(SRC: Record<string, { list: Item[] }>) {
  const rnd = <T,>(a: T[]): T => a[Math.floor(Math.random()*a.length)] as T;
  const shuffle = <T,>(a: T[]): T[] => { for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j] as T,a[i] as T];} return a; };
  let cup: RefCup | null = null, cupMix = true;
  const ui = { current: [] as Entry[], onChoose: null as ((w: Entry) => void) | null, round: '', count: '' };
  function pairUp(list: Entry[]): Entry[] {
    const g: Record<string, Entry[]> = {}; shuffle([...list]).forEach(x => (g[x.fr] = g[x.fr] || []).push(x));
    const pairs: (Entry | undefined)[][] = [];
    for(;;){
      const ks = Object.keys(g).filter(k => (g[k] as Entry[]).length).sort((a,b) => (g[b] as Entry[]).length - (g[a] as Entry[]).length);
      if(!ks.length) break;
      const a = (g[ks[0] as string] as Entry[]).pop(), b = (g[(ks.length > 1 ? ks[1] : ks[0]) as string] as Entry[]).pop();
      pairs.push([a, b]);
    }
    return shuffle(pairs).flat() as Entry[];
  }
  const roundName = (n: number) => ({2:'Final',4:'Semifinal',8:'Quartas de final'} as Record<number, string>)[n] || `Rodada de ${n}`;
  function cupStart(frs: string[], size: number, even: boolean, mix: boolean): Entry[] {
    const counts: Record<string, number> = {}; frs.forEach(k => counts[k]=0);
    if(even){
      frs.forEach(k => counts[k] = Math.floor(size/frs.length));
      shuffle([...frs]).slice(0, size % frs.length).forEach(k => counts[k] = (counts[k] as number)+1);
    } else for(let i=0;i<size;i++){ const k = rnd(frs); counts[k] = (counts[k] as number)+1; }
    let entrants: Entry[] = [];
    const pools: Record<string, Item[]> = {};
    frs.forEach(k => { pools[k] = shuffle([...(SRC[k] as { list: Item[] }).list]); entrants.push(...(pools[k] as Item[]).splice(0, counts[k] as number).map(p => ({...p, fr:k}))); });
    // franquia com poucos personagens: completa as vagas com as outras
    for(let i = 0; entrants.length < size && frs.some(k => (pools[k] as Item[]).length); i++){
      const k = frs[i % frs.length] as string;
      if((pools[k] as Item[]).length) entrants.push({...((pools[k] as Item[]).pop() as Item), fr:k});
    }
    let n = 2; while(n*2 <= Math.min(size, entrants.length)) n *= 2;
    entrants = shuffle(entrants).slice(0, n);
    cupMix = mix;
    if(cupMix) entrants = pairUp(entrants);
    cup = {round: entrants, next: [], i: 0, rounds: [toMatches(entrants)], losers: {}, champ: null};
    cupStep();
    return entrants;
  }
  function cupStep(): void {
    const c = cup as RefCup;
    if(c.i >= c.round.length){
      if(c.next.length === 1) return cupFinish(c.next[0] as Entry);
      c.round = cupMix ? pairUp(c.next) : c.next; c.next = []; c.i = 0;
      c.rounds.push(toMatches(c.round));
    }
    const a = c.round[c.i] as Entry, b = c.round[c.i+1] as Entry;
    ui.round = roundName(c.round.length);
    ui.count = `confronto ${c.i/2+1} de ${c.round.length/2}`;
    ui.current = [a, b]; ui.onChoose = w => {
      const l = w===a ? b : a;
      c.next.push(w);
      ((c.rounds[c.rounds.length-1] as RefMatch[])[c.i/2] as RefMatch).w = w;
      (c.losers[c.round.length] = c.losers[c.round.length] || []).push(l);
      c.i += 2; cupStep();
    };
  }
  function cupFinish(champ: Entry){ ui.current = []; ui.onChoose = null; (cup as RefCup).champ = champ; ui.round = ''; ui.count = ''; }
  function toMatches(list: Entry[]): RefMatch[] { const m: RefMatch[] = []; for(let i=0;i<list.length;i+=2) m.push({a:list[i] as Entry, b:list[i+1] as Entry, w:null}); return m; }
  function renderLog(): { H: number; dom: Map<string, string> } {
    const c = cup as RefCup;
    const cols = c.rounds.map(r => ({title: roundName(r.length*2), matches: r}));
    const lastLen = (c.rounds[c.rounds.length-1] as RefMatch[]).length;
    let n = lastLen / 2;
    if(!c.champ) while(n >= 1){
      const ms: RefMatch[] = Array.from({length:n}, () => ({a:null, b:null, w:null}));
      if(n === lastLen/2 && !cupMix) c.next.forEach((w,i) => (ms[i>>1] as RefMatch)[i%2?'b':'a'] = w);
      cols.push({title: roundName(n*2), matches: ms}); n /= 2;
    }
    const H = Math.max((c.rounds[0] as RefMatch[]).length * 64, 160);
    const dom = new Map<string, string>();
    cols.forEach((col, ci) => col.matches.forEach((m, mi) => {
      const hide = !c.champ && ci === c.rounds.length-1 && mi > c.i/2;
      dom.set(`${ci}:${mi}`, `${col.title}|${hide ? slot(null)+slot(null) : slot(m.a, m)+slot(m.b, m)}`);
    }));
    dom.set(`${cols.length}:0`, `Campeão|${slot(c.champ)}`);
    if(!c.champ){ const key = `${c.rounds.length-1}:${c.i/2}`; const cur = dom.get(key); if(cur != null) dom.set(key, cur + '|now'); }
    return { H, dom };
  }
  function drawLines(): Link[] {
    const c = cup as RefCup;
    const { dom } = renderLog();
    const at = (r: number, m: number) => dom.has(`${r}:${m}`);
    const links: Link[] = [];
    c.rounds.forEach((round, r) => round.forEach((m, mi) => {
      if(!m.w) return;
      let tr: number | undefined, tm: number | undefined;
      const nr = c.rounds[r+1];
      if(nr){ tm = nr.findIndex(x => x.a===m.w || x.b===m.w); tr = r+1; }
      else if(c.champ === m.w){ tr = r+1; tm = 0; }
      else if(!cupMix){ tr = r+1; tm = mi>>1; }
      if(tm == null || tm < 0) return;
      const A = at(r, mi), B = at(tr as number, tm); if(!A || !B) return;
      links.push({r, m: mi, tr: tr as number, tm});
    }));
    return links;
  }
  return { cupStart, pairUp, renderLog, drawLines, ui, get cup() { return cup as RefCup; } };
}

/** O mesmo "DOM" do renderLog de referência, montado a partir de bracketColumns/bracketHeight. */
function newDom(c: Cup): { H: number; dom: Map<string, string> } {
  const dom = new Map<string, string>();
  bracketColumns(c).forEach((col, ci) =>
    col.matches.forEach((x, mi) => {
      const html = col.champ ? slot(x.m.a) : x.hidden ? slot(null) + slot(null) : slot(x.m.a, x.m) + slot(x.m.b, x.m);
      dom.set(`${ci}:${mi}`, `${col.title}|${html}${x.now ? '|now' : ''}`);
    }),
  );
  return { H: bracketHeight(c), dom };
}

describe('equivalência com o site antigo (mulberry32)', () => {
  const SRC = Object.fromEntries(Object.entries(LISTS).map(([k, list]) => [k, { list }]));
  const configs: [string[], number, boolean, boolean][] = [];
  for (const size of [4, 8, 16, 32, 64]) for (const even of [true, false]) for (const mix of [true, false]) configs.push([['pokemon', 'digimon', 'smt'], size, even, mix]);
  configs.push(
    [['pokemon', 'tiny'], 16, true, true],
    [['tiny', 'pokemon'], 16, false, false],
    [['tiny', 'mini'], 16, true, true],
    [['tiny', 'mini', 'jojo'], 32, true, false],
    [['tiny'], 8, true, true],
    [['pokemon', 'digimon', 'smt', 'jojo', 'ygo', 'bakugan', 'sujimon'], 8, true, true],
    [['pokemon', 'digimon', 'smt', 'jojo', 'ygo', 'bakugan', 'sujimon'], 32, false, true],
    [['smt'], 16, true, true],
    [['smt'], 8, false, false],
  );

  it.each(SEEDS)('participantes, rodadas, chave e linhas passo a passo, semente %i', seed => {
    for (const [frs, size, even, mix] of configs) {
      // referência
      let r = seedRandom(seed);
      const ref = makeRefCup(SRC);
      const refEntrants = ref.cupStart(frs, size, even, mix);
      const refSteps: unknown[] = [];
      for (;;) {
        refSteps.push({ ui: [ref.ui.round, ref.ui.count, ref.ui.current], log: ref.renderLog(), links: ref.drawLines() });
        if (!ref.ui.onChoose) break;
        ref.ui.onChoose(ref.ui.current[Math.random() < 0.5 ? 0 : 1] as Entry);
      }
      const refCalls = r.calls();

      // novo
      r = seedRandom(seed);
      const entrants = buildEntrants({ frs, size, even, mix, lists: LISTS });
      const c = startCup(entrants, mix);
      cupSync(c);
      const steps: unknown[] = [];
      for (;;) {
        const p = cupPair(c);
        steps.push({
          ui: p ? [roundName(c.round.length), `confronto ${c.i / 2 + 1} de ${c.round.length / 2}`, p] : ['', '', []],
          log: newDom(c),
          links: bracketLinks(c),
        });
        if (!p) break;
        cupChoose(c, p[Math.random() < 0.5 ? 0 : 1]);
      }

      const tag = `${frs.join('+')} ${size} even=${even} mix=${mix}`;
      expect(entrants, tag).toEqual(refEntrants);
      expect(steps, tag).toEqual(refSteps);
      expect(c.rounds, tag).toEqual(ref.cup.rounds);
      expect(c.losers, tag).toEqual(ref.cup.losers);
      expect(c.champ, tag).toEqual(ref.cup.champ);
      expect(r.calls(), tag).toBe(refCalls);
    }
  });

  it.each(SEEDS)('pairUp sozinho, semente %i', seed => {
    const g = mulberry32(seed);
    const lists = Array.from({ length: 30 }, (_, t) => {
      const total = 2 ** (1 + (t % 6));
      return Array.from({ length: total }, (_, i) => e('N' + i, 'f' + Math.floor(g() * (1 + (t % 4)))));
    });
    let r = seedRandom(seed);
    const refOut = lists.map(makeRefCup(SRC).pairUp);
    const refCalls = r.calls();
    r = seedRandom(seed);
    expect(lists.map(l => pairUp(l))).toEqual(refOut);
    expect(r.calls()).toBe(refCalls);
  });
});
