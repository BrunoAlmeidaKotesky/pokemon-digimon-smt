import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Entry, Stats } from '../types';
import { emptyStats, loadStats, meter, record, saveStats, updateBest } from './stats';
import { installStorage, mulberry32, SEEDS } from './test-helpers';

afterEach(() => vi.unstubAllGlobals());

const LABEL: Record<string, string> = { pokemon: 'Pokémon', digimon: 'Digimon', smt: 'SMT' };
const label = (k: string) => LABEL[k] as string;
const e = (name: string, fr: string): Entry => ({ name, img: '', fr });

describe('emptyStats / loadStats / saveStats', () => {
  it('emptyStats', () => {
    expect(emptyStats()).toEqual({ w: {}, n: {}, hist: [], best: null });
    expect(emptyStats()).not.toBe(emptyStats());
  });

  it('nada guardado, JSON corrompido, "null" ou sem localStorage -> placar zerado com best null', () => {
    installStorage();
    expect(loadStats()).toEqual(emptyStats());
    installStorage({ 'pdx-stats': '{corrompido' });
    expect(loadStats()).toEqual(emptyStats());
    installStorage({ 'pdx-stats': 'null' });
    expect(loadStats()).toEqual(emptyStats());
    installStorage({ 'pdx-stats': '0' });
    expect(loadStats()).toEqual(emptyStats());
    vi.stubGlobal('localStorage', undefined);
    expect(loadStats()).toEqual(emptyStats());
  });

  it('guardado sem best: mantém o resto e põe best null (no fim, como o antigo)', () => {
    installStorage({ 'pdx-stats': JSON.stringify({ w: { pokemon: 2 }, n: { pokemon: 3, digimon: 3 }, hist: ['a', 'b'] }) });
    const s = loadStats();
    expect(s).toEqual({ w: { pokemon: 2 }, n: { pokemon: 3, digimon: 3 }, hist: ['a', 'b'], best: null });
    expect(Object.keys(s)).toEqual(['w', 'n', 'hist', 'best']);
  });

  it('guardado com best: mantém', () => {
    const v: Stats = { w: {}, n: {}, hist: [], best: { name: 'Agumon', fr: 'digimon', streak: 4 } };
    installStorage({ 'pdx-stats': JSON.stringify(v) });
    expect(loadStats()).toEqual(v);
  });

  it('saveStats grava em pdx-stats', () => {
    const st = installStorage();
    const s = emptyStats();
    s.w.smt = 1;
    saveStats(s);
    expect(st.getItem('pdx-stats')).toBe('{"w":{"smt":1},"n":{},"hist":[],"best":null}');
  });
});

describe('record', () => {
  it('conta vitória do vencedor e aparição de todos; histórico com os rótulos', () => {
    const s = emptyStats();
    const a = e('Pikachu', 'pokemon');
    const b = e('Agumon', 'digimon');
    record(s, a, [a, b], label);
    expect(s.w).toEqual({ pokemon: 1 });
    expect(s.n).toEqual({ pokemon: 1, digimon: 1 });
    expect(s.hist).toEqual(['Pikachu (Pokémon) venceu Agumon (Digimon)']);
  });

  it('trio: perdedores separados por vírgula; mesma franquia conta duas vezes', () => {
    const s = emptyStats();
    const a = e('Jack Frost', 'smt');
    const b = e('Pixie', 'smt');
    const c = e('Gabumon', 'digimon');
    record(s, b, [a, b, c], label);
    expect(s.w).toEqual({ smt: 1 });
    expect(s.n).toEqual({ smt: 2, digimon: 1 });
    expect(s.hist[0]).toBe('Pixie (SMT) venceu Jack Frost (SMT), Gabumon (Digimon)');
  });

  it('perdedor = todos menos o vencedor por identidade (mesmo nome em outro objeto conta como perdedor)', () => {
    const s = emptyStats();
    const a = e('Eevee', 'pokemon');
    const a2 = e('Eevee', 'pokemon');
    record(s, a, [a, a2], label);
    expect(s.hist[0]).toBe('Eevee (Pokémon) venceu Eevee (Pokémon)');
  });

  it('mais recente primeiro, no máximo 30', () => {
    const s = emptyStats();
    for (let i = 0; i < 35; i++) {
      const a = e('A' + i, 'pokemon');
      record(s, a, [a, e('B' + i, 'digimon')], label);
    }
    expect(s.hist).toHaveLength(30);
    expect(s.hist[0]).toBe('A34 (Pokémon) venceu B34 (Digimon)');
    expect(s.hist[29]).toBe('A5 (Pokémon) venceu B5 (Digimon)');
    expect(s.w.pokemon).toBe(35);
    expect(s.n.digimon).toBe(35);
  });

  it('não salva', () => {
    const st = installStorage();
    const a = e('A', 'pokemon');
    record(emptyStats(), a, [a, e('B', 'smt')], label);
    expect(st.length).toBe(0);
  });
});

describe('updateBest', () => {
  it('sem best: troca; maior: troca; igual ou menor: não', () => {
    const s = emptyStats();
    expect(updateBest(s, e('A', 'pokemon'), 1)).toBe(true);
    expect(s.best).toEqual({ name: 'A', fr: 'pokemon', streak: 1 });
    expect(updateBest(s, e('B', 'smt'), 1)).toBe(false);
    expect(updateBest(s, e('B', 'smt'), 0)).toBe(false);
    expect(s.best?.name).toBe('A');
    expect(updateBest(s, e('B', 'smt'), 2)).toBe(true);
    expect(s.best).toEqual({ name: 'B', fr: 'smt', streak: 2 });
  });
});

describe('meter', () => {
  it('pct arredondado; 0 sem aparições', () => {
    const s = emptyStats();
    expect(meter(s, 'pokemon')).toEqual({ w: 0, n: 0, pct: 0 });
    s.w.pokemon = 1;
    s.n.pokemon = 3;
    expect(meter(s, 'pokemon')).toEqual({ w: 1, n: 3, pct: 33 });
    s.w.pokemon = 2;
    expect(meter(s, 'pokemon').pct).toBe(67);
    s.n.digimon = 4;
    expect(meter(s, 'digimon')).toEqual({ w: 0, n: 4, pct: 0 });
    s.w.smt = 1;
    s.n.smt = 2;
    expect(meter(s, 'smt').pct).toBe(50);
  });
});

// --- referência: cópia do site antigo (placar + o trecho do duelo que mexe no best), só com tipos/casts ---
function makeRef(SRC: Record<string, { label: string }>) {
  let stats: Stats | null = null;
  try{ stats = JSON.parse(localStorage.getItem('pdx-stats') as string) || null; }catch{ /* igual */ }
  if(!stats) stats = {w:{}, n:{}, hist:[]} as unknown as Stats;
  stats.best = stats.best || null;
  const S = stats;
  function save(){ try{ localStorage.setItem('pdx-stats', JSON.stringify(S)); }catch{ /* igual */ } }
  function record(winner: Entry, all: Entry[]){
    S.w[winner.fr] = (S.w[winner.fr]||0)+1;
    all.forEach(x => S.n[x.fr] = (S.n[x.fr]||0)+1);
    const losers = all.filter(x => x!==winner).map(x => `${x.name} (${(SRC[x.fr] as { label: string }).label})`).join(', ');
    S.hist.unshift(`${winner.name} (${(SRC[winner.fr] as { label: string }).label}) venceu ${losers}`);
    S.hist = S.hist.slice(0,30);
    save();
  }
  function duelWin(w: Entry, slots: Entry[], streak: number){
    record(w, slots);
    if(!S.best || streak > S.best.streak){ S.best = {name:w.name, fr:w.fr, streak}; save(); }
  }
  function meter(k: string){ const w = S.w[k]||0, n = S.n[k]||0, pct = n ? Math.round(w/n*100) : 0; return {w, n, pct}; }
  return { duelWin, meter, stats: S };
}

describe('equivalência com o site antigo', () => {
  const starts = [
    null,
    '{corrompido',
    'null',
    JSON.stringify({ w: { pokemon: 3 }, n: { pokemon: 5, smt: 5 }, hist: ['velho'] }),
    JSON.stringify({ w: {}, n: {}, hist: [], best: { name: 'X', fr: 'smt', streak: 3 } }),
  ];
  it.each(SEEDS)('load + record + best + meter, semente %i', seed => {
    const SRC = Object.fromEntries(Object.entries(LABEL).map(([k, l]) => [k, { label: l }]));
    const keys = Object.keys(LABEL);
    for (const start of starts) {
      const init: Record<string, string> = start == null ? {} : { 'pdx-stats': start };
      const play = (win: (w: Entry, all: Entry[], streak: number) => void) => {
        const g = mulberry32(seed);
        const pool = Array.from({ length: 12 }, (_, i) => e('N' + i, keys[i % keys.length] as string));
        let streak = 0;
        let king: Entry | null = null;
        for (let i = 0; i < 60; i++) {
          const n = g() < 0.3 ? 3 : 2;
          const all = Array.from({ length: n }, () => pool[Math.floor(g() * pool.length)] as Entry).map(x => ({ ...x }));
          const w = all[Math.floor(g() * n)] as Entry;
          streak = king && king.name === w.name ? streak + 1 : 1;
          king = w;
          win(w, all, streak);
        }
      };
      let st = installStorage(init);
      const ref = makeRef(SRC);
      play(ref.duelWin);
      const refSaved = st.getItem('pdx-stats');
      const refMeters = keys.map(k => ref.meter(k));

      st = installStorage(init);
      const s = loadStats();
      play((w, all, streak) => {
        record(s, w, all, label);
        saveStats(s);
        if (updateBest(s, w, streak)) saveStats(s);
      });
      expect(st.getItem('pdx-stats')).toBe(refSaved);
      expect(keys.map(k => meter(s, k))).toEqual(refMeters);
    }
  });
});
