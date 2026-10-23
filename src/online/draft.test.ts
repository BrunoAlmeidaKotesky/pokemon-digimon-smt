import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { planSpin } from '../core/spin';
import { makeList, mulberry32, SEEDS } from '../core/test-helpers';
import type { Entry, Item } from '../types';
import { DRAFT_ROUNDS, DRAFT_X, draftSettings, isBye, MAX_REDOS, redoNotice } from './draft';
import { createRoom, DEFAULT_CONFIG, reduce } from './room';
import type { Action, Ctx, DraftGame, DraftTeam, DraftView, OnlineConfig, Qualified, RoomState, Vote } from './types';
import { viewFor } from './view';

// ---------- fixtures ----------

/** Congela tudo (o redutor que tentar mudar o estado de entrada lança TypeError). */
function deepFreeze<T>(o: T, seen = new WeakSet<object>()): T {
  if (o && typeof o === 'object' && !seen.has(o)) {
    seen.add(o);
    Object.freeze(o);
    for (const v of Object.values(o)) deepFreeze(v, seen);
  }
  return o;
}

const LISTS: Record<string, Item[] | null> = deepFreeze({
  pokemon: makeList('P', 12),
  digimon: makeList('D', 10),
  smt: makeList('S', 9),
  jojo: makeList('J', 6),
  ygo: makeList('Y', 5),
  bakugan: makeList('B', 4),
  sujimon: makeList('U', 4),
});
const ALL_FRS = ['pokemon', 'digimon', 'smt', 'jojo', 'ygo', 'bakugan', 'sujimon'];

let rand = mulberry32(1);
const NOW = 1000;
const ctx = (over: Partial<Ctx> = {}): Ctx => ({ rand, now: NOW, lists: LISTS, ...over });

/** Gerador que devolve exatamente estes valores (erro se pedir mais). */
function seqRand(values: number[]): () => number {
  let i = 0;
  return () => {
    if (i >= values.length) throw new Error('rand chamado demais');
    return values[i++] as number;
  };
}

/** reduce com o estado de entrada congelado. */
function R(s: RoomState, a: Action, c: Ctx = ctx()): RoomState {
  return reduce(deepFreeze(s), a, c);
}

const HOST = { id: 'h', name: 'Host' };
type DraftCfg = OnlineConfig['draft'];

/** Sala de Draft com o host + estes jogadores (id = nome em minúsculas). */
function room(names: string[] = ['Ana', 'Bia'], draft: Partial<DraftCfg> = {}, cfg: Partial<OnlineConfig> = {}): RoomState {
  let s = createRoom('DRFT', HOST, { ...DEFAULT_CONFIG, ...cfg, mode: 'draft', draft: { ...DEFAULT_CONFIG.draft, ...draft } });
  for (const n of names) s = R(s, { type: 'join', id: n.toLowerCase(), name: n });
  return s;
}
const started = (names?: string[], draft?: Partial<DraftCfg>, cfg?: Partial<OnlineConfig>, c?: Ctx) =>
  R(room(names, draft, cfg), { type: 'start' }, c);

const G = (s: RoomState) => s.game as DraftGame;
const T = (s: RoomState, id: string) => G(s).teams[id] as DraftTeam;
const V = (s: RoomState) => s.vote as Vote;
const namesOf = (es: (Entry | null)[]) => es.flatMap(e => (e ? [e.name] : []));
const DV = (s: RoomState, id: string) => viewFor(s, id, NOW).game as DraftView;
/** opções da vez do jogador */
const cur = (s: RoomState, id: string) => T(s, id).opts[T(s, id).queue[0] as number] as Entry[];

/** Escolha do jogador na franquia da vez (idx nas opções), com a rodada e a passada certas. */
function pick(s: RoomState, id: string, idx: number, c?: Ctx): RoomState {
  return R(s, { type: 'pick', id, round: G(s).round, att: T(s, id).att, idx }, c);
}

/** Escolhe pelo nome (precisa estar nas opções da vez). */
function pickName(s: RoomState, id: string, name: string): RoomState {
  const idx = cur(s, id).findIndex(e => e.name === name);
  expect(idx).toBeGreaterThanOrEqual(0);
  return pick(s, id, idx);
}

/** Escolhe a primeira opção que nenhum outro time escolheu nesta franquia. */
function pickFree(s: RoomState, id: string, c?: Ctx): RoomState {
  const g = G(s);
  const fi = T(s, id).queue[0] as number;
  const taken = new Set(namesOf(Object.entries(g.teams).map(([o, t]) => (o === id ? null : t.picks[fi] ?? null))));
  const idx = cur(s, id).findIndex(e => !taken.has(e.name));
  return pick(s, id, Math.max(idx, 0), c);
}

/** Todo mundo escolhe (sem repetir, quando dá) até a rodada sair da escolha. */
function pickAll(s: RoomState, c?: Ctx): RoomState {
  for (let guard = 0; G(s).step === 'pick'; guard++) {
    expect(guard).toBeLessThan(500);
    const g = G(s);
    const id = g.order.find(x => !!g.teams[x] && !g.teams[x].skipped && g.teams[x].queue.length > 0);
    if (!id) throw new Error('ninguém pra escolher e a rodada não andou');
    s = pickFree(s, id, c);
  }
  return s;
}

/** Todos votam em `idx` e o host avança. */
function decide(s: RoomState, idx: number, c?: Ctx): RoomState {
  for (const p of s.players) s = R(s, { type: 'vote', id: p.id, seq: V(s).seq, idx }, c);
  expect(V(s).result?.win).toBe(idx);
  return R(s, { type: 'next' }, c);
}

/** Revela tudo (todos votam no primeiro item). */
function revealAll(s: RoomState): RoomState {
  for (let guard = 0; G(s).step === 'reveal'; guard++) {
    expect(guard).toBeLessThan(50);
    s = decide(s, 0);
  }
  return s;
}

const NOTICE_TAIL = 'por todos: duas ou mais pessoas escolheram o mesmo personagem. As opções são novas.';

beforeEach(() => {
  rand = mulberry32(1);
});
afterEach(() => {
  vi.restoreAllMocks();
});

// ---------- testes ----------

describe('Draft: início', () => {
  it('cria o jogo e dá um time com opções novas pra cada jogador da sala', () => {
    const s0 = room(['Ana', 'Bia'], { frs: ['jojo', 'pokemon', 'digimon'], x: 3, rounds: 2 });
    const s = R(s0, { type: 'start' });
    expect(s.phase).toBe('play');
    expect(s.notice).toBe('');
    expect(s.vote).toBeNull();
    const g = G(s);
    expect(g).toMatchObject({
      mode: 'draft',
      frs: ['jojo', 'pokemon', 'digimon'],
      x: 3,
      rounds: 2,
      round: 1,
      step: 'pick',
      order: ['h', 'ana', 'bia'],
      used: { jojo: [], pokemon: [], digimon: [] },
      banned: {},
      redos: {},
      redo: null,
      reveal: 0,
      qualified: [],
      history: [],
      final: null,
      champion: null,
    });
    expect(Object.keys(g.teams)).toEqual(['h', 'ana', 'bia']);
    for (const id of g.order) {
      const t = T(s, id);
      expect(t.picks).toEqual([null, null, null]);
      expect(t.queue).toEqual([0, 1, 2]);
      expect(t.att).toBe(0);
      expect(t.skipped).toBe(false);
      g.frs.forEach((k, fi) => {
        const o = t.opts[fi]!;
        expect(o).toHaveLength(3);
        expect(new Set(namesOf(o)).size).toBe(3);
        for (const e of o) {
          expect(e.fr).toBe(k);
          expect(LISTS[k]!.some(x => x.name === e.name && x.img === e.img)).toBe(true);
        }
      });
    }
    // não mexe no saco da sala (Duelo/Trio)
    expect(s.bags).toEqual({});
  });

  it('x e rounds dentro dos limites (o que não é número vira o padrão)', () => {
    expect(DRAFT_X).toEqual({ min: 2, max: 6, def: 3 });
    expect(DRAFT_ROUNDS).toEqual({ min: 1, max: 5, def: 1 });
    expect(draftSettings({ x: 1, rounds: 0 })).toEqual({ x: 2, rounds: 1 });
    expect(draftSettings({ x: 9, rounds: 9 })).toEqual({ x: 6, rounds: 5 });
    expect(draftSettings({ x: 4, rounds: 3 })).toEqual({ x: 4, rounds: 3 });
    expect(draftSettings({ x: 4.4, rounds: 2.6 })).toEqual({ x: 4, rounds: 3 });
    expect(draftSettings({ x: Number.NaN, rounds: '2' as unknown as number })).toEqual({ x: 3, rounds: 1 });
    expect(draftSettings(null)).toEqual({ x: 3, rounds: 1 });
    const s = started([], { frs: ['pokemon'], x: 10, rounds: 0 });
    expect(G(s)).toMatchObject({ x: 6, rounds: 1 });
    expect(T(s, 'h').opts[0]).toHaveLength(6);
  });

  it('franquia com menos personagens que X: menos opções', () => {
    const s = started(['Ana'], { frs: ['bakugan', 'jojo'], x: 6 });
    expect(T(s, 'h').opts[0]).toHaveLength(4);
    expect(T(s, 'ana').opts[1]).toHaveLength(6);
  });
});

describe('Draft: escolha secreta', () => {
  it('a escolha grava a Entry (com fr) e anda a fila; escolhas inválidas são ignoradas', () => {
    let s = started(['Ana'], { frs: ['jojo', 'pokemon'] });
    const t = T(s, 'h');
    const bad: Action[] = [
      { type: 'pick', id: 'h', round: 2, att: 0, idx: 0 },
      { type: 'pick', id: 'h', round: 1, att: 1, idx: 0 },
      { type: 'pick', id: 'h', round: 1, att: 0, idx: -1 },
      { type: 'pick', id: 'h', round: 1, att: 0, idx: 3 },
      { type: 'pick', id: 'h', round: 1, att: 0, idx: 0.5 },
      { type: 'pick', id: 'h', round: 1, att: 0, idx: Number.NaN },
      { type: 'pick', id: 'zzz', round: 1, att: 0, idx: 0 },
      { type: 'pick', id: '__proto__', round: 1, att: 0, idx: 0 },
    ];
    for (const a of bad) expect(R(s, a)).toBe(s);
    s = pick(s, 'h', 1);
    expect(T(s, 'h').picks).toEqual([{ ...t.opts[0]![1]!, fr: 'jojo' }, null]);
    expect(T(s, 'h').queue).toEqual([1]);
    s = pick(s, 'h', 2);
    expect(T(s, 'h').picks[1]).toEqual(t.opts[1]![2]);
    expect(T(s, 'h').queue).toEqual([]);
    // terminou: nada mais a escolher (e a rodada espera a Ana)
    expect(pick(s, 'h', 0)).toBe(s);
    expect(G(s).step).toBe('pick');
    // escolha de Draft fora do Draft (ou no lobby) não faz nada
    const duel = R(createRoom('X', HOST), { type: 'start' });
    expect(R(duel, { type: 'pick', id: 'h', round: 1, att: 0, idx: 0 })).toBe(duel);
    expect(R(duel, { type: 'skip' })).toBe(duel);
    const lobby = room(['Ana']);
    expect(R(lobby, { type: 'pick', id: 'h', round: 1, att: 0, idx: 0 })).toBe(lobby);
    expect(R(lobby, { type: 'skip' })).toBe(lobby);
  });

  it('opções independentes por jogador: saco próprio por jogador e franquia', () => {
    let differ = 0;
    for (const seed of SEEDS) {
      rand = mulberry32(seed);
      let s = started(['Ana', 'Bia'], { frs: ['pokemon', 'digimon'], x: 3 });
      const g = G(s);
      expect(Object.keys(g.bags)).toEqual(['h', 'ana', 'bia']);
      for (const id of g.order)
        g.frs.forEach((k, fi) => {
          // cada um tirou as opções de um saco cheio só dele: saco + opções = a franquia inteira
          const bag = g.bags[id]![k]!;
          expect(bag).toHaveLength(LISTS[k]!.length - 3);
          expect(new Set([...bag, ...namesOf(T(s, id).opts[fi]!)])).toEqual(new Set(LISTS[k]!.map(x => x.name)));
        });
      if (namesOf(T(s, 'h').opts[0]!).join() !== namesOf(T(s, 'ana').opts[0]!).join()) differ++;
      // a escolha de um não mexe no time nem no saco dos outros
      const before = structuredClone({ ana: g.teams.ana, bia: g.teams.bia, bags: { ana: g.bags.ana, bia: g.bags.bia } });
      s = pick(s, 'h', 0);
      expect({ ana: G(s).teams.ana, bia: G(s).teams.bia, bags: { ana: G(s).bags.ana, bia: G(s).bags.bia } }).toEqual(before);
    }
    expect(differ).toBeGreaterThan(SEEDS.length / 2);
  });

  it('o saco do jogador passa por todos antes de repetir (rodada após rodada)', () => {
    let s = started([], { frs: ['pokemon'], x: 3, rounds: 4 });
    const seen: string[] = [];
    for (let r = 1; r <= 4; r++) {
      expect(G(s)).toMatchObject({ round: r, step: 'pick' });
      seen.push(...namesOf(T(s, 'h').opts[0]!));
      s = revealAll(pick(s, 'h', 0));
    }
    expect(seen).toHaveLength(12);
    expect(new Set(seen)).toEqual(new Set(LISTS.pokemon!.map(x => x.name)));
  });

  it('quem cai (offline) continua com time e a rodada espera por ele', () => {
    let s = started(['Ana'], { frs: ['jojo'] });
    s = R(s, { type: 'online', id: 'ana', online: false });
    expect(T(s, 'ana')).toBeDefined();
    s = pick(s, 'h', 0);
    expect(G(s).step).toBe('pick');
    s = pick(s, 'ana', 0);
    expect(G(s).step).toBe('reveal');
  });
});

describe('Draft: repetidos', () => {
  it('dois jogadores escolhem o mesmo duas vezes seguidas: todos refazem duas vezes, banidos acumulam', () => {
    // Yu-Gi-Oh! tem 5 personagens e X = 5: todo mundo vê os mesmos, então dá pra repetir de propósito
    let s = started(['Ana', 'Bia'], { frs: ['jojo', 'ygo'], x: 5 });
    for (const id of ['h', 'ana', 'bia']) s = pickFree(s, id);
    const jojo = Object.fromEntries(['h', 'ana', 'bia'].map(id => [id, T(s, id).picks[0]]));
    const X = cur(s, 'h')[0]!.name;
    s = pickName(s, 'h', X);
    s = pickName(s, 'ana', X);
    expect(G(s).redo).toBeNull();
    const old = s;
    s = pickFree(s, 'bia');

    // 1ª refação
    let g = G(s);
    expect(g.step).toBe('pick');
    expect(g.redo).toEqual([1]);
    expect(g.banned).toEqual({ 1: [X] });
    expect(g.redos).toEqual({ 1: 1 });
    expect(s.notice).toBe(`Yu-Gi-Oh! vai ser refeita ${NOTICE_TAIL}`);
    for (const word of [X, 'Host', 'Ana', 'Bia']) expect(s.notice).not.toContain(word);
    for (const id of ['h', 'ana', 'bia']) {
      const t = T(s, id);
      expect(t.att).toBe(1);
      expect(t.queue).toEqual([1]);
      expect(t.picks).toEqual([jojo[id], null]);
      expect(namesOf(t.opts[1]!).sort()).toEqual(['Y0', 'Y1', 'Y2', 'Y3', 'Y4'].filter(n => n !== X));
    }
    expect(DV(s, 'bia')).toMatchObject({ redo: ['ygo'], me: { fi: 1, att: 1 } });
    // escolha atrasada (passada velha) é ignorada
    expect(R(s, { type: 'pick', id: 'h', round: 1, att: 0, idx: 0 })).toBe(s);
    expect(R(old, { type: 'pick', id: 'bia', round: 1, att: 0, idx: 0 }).notice).toBe(s.notice);

    // 2ª refação: repetem de novo
    const Z = cur(s, 'h')[0]!.name;
    s = pickName(s, 'h', Z);
    s = pickName(s, 'ana', Z);
    s = pickFree(s, 'bia');
    g = G(s);
    expect(g.step).toBe('pick');
    expect(g.redo).toEqual([1]);
    expect(g.banned).toEqual({ 1: [X, Z] });
    expect(g.redos).toEqual({ 1: 2 });
    expect(s.notice).toBe(`Yu-Gi-Oh! vai ser refeita ${NOTICE_TAIL}`);
    for (const word of [X, Z, 'Host', 'Ana', 'Bia']) expect(s.notice).not.toContain(word);
    for (const id of ['h', 'ana', 'bia']) {
      expect(T(s, id).att).toBe(2);
      expect(namesOf(T(s, id).opts[1]!)).toHaveLength(3);
      expect(namesOf(T(s, id).opts[1]!)).not.toContain(X);
      expect(namesOf(T(s, id).opts[1]!)).not.toContain(Z);
    }
    expect(R(s, { type: 'pick', id: 'ana', round: 1, att: 1, idx: 0 })).toBe(s);

    // 3ª passada sem repetir: revelação
    for (const id of ['h', 'ana', 'bia']) s = pickFree(s, id);
    g = G(s);
    expect(g.step).toBe('reveal');
    expect(g.redo).toBeNull();
    expect(s.notice).toBe('');
    const ygo = g.history[0]!.teams.map(t => t.picks.find(e => e.fr === 'ygo')!.name);
    expect(new Set(ygo).size).toBe(3);
    expect(ygo).not.toContain(X);
    expect(ygo).not.toContain(Z);
    expect([...g.used.ygo!].sort()).toEqual([...ygo].sort());
    expect(g.history[0]!.teams.map(t => t.picks.find(e => e.fr === 'jojo'))).toEqual([jojo.h, jojo.ana, jojo.bia]);
  });

  it('duas franquias repetidas ao mesmo tempo: aviso no plural e fila com as duas, na ordem', () => {
    let s = started(['Ana'], { frs: ['ygo', 'bakugan'], x: 5 });
    const [y, b] = [cur(s, 'h')[0]!.name, T(s, 'h').opts[1]![0]!.name];
    s = pickName(s, 'h', y);
    s = pickName(s, 'h', b);
    s = pickName(s, 'ana', y);
    s = pickName(s, 'ana', b);
    expect(G(s).redo).toEqual([0, 1]);
    expect(G(s).banned).toEqual({ 0: [y], 1: [b] });
    expect(s.notice).toBe(`Yu-Gi-Oh! e Bakugan vão ser refeitas ${NOTICE_TAIL}`);
    expect(T(s, 'h').queue).toEqual([0, 1]);
    expect(T(s, 'ana').picks).toEqual([null, null]);
    expect(DV(s, 'h').redo).toEqual(['ygo', 'bakugan']);
    expect(redoNotice(['Pokémon', 'JoJo', 'Digimon'])).toBe(`Pokémon, JoJo e Digimon vão ser refeitas ${NOTICE_TAIL}`);
    expect(redoNotice(['Pokémon'])).toBe(`Pokémon vai ser refeita ${NOTICE_TAIL}`);
  });

  it(`limite de segurança: depois de ${MAX_REDOS} refações da mesma franquia o repetido é aceito`, () => {
    let s = started(['Ana'], { frs: ['digimon'], x: 6 });
    for (let n = 1; n <= MAX_REDOS + 1; n++) {
      const both = namesOf(cur(s, 'h')).find(x => namesOf(cur(s, 'ana')).includes(x))!;
      s = pickName(pickName(s, 'h', both), 'ana', both);
      if (n <= MAX_REDOS) {
        expect(G(s).redos).toEqual({ 0: n });
        expect(G(s).step).toBe('pick');
      }
    }
    expect(G(s).redos).toEqual({ 0: MAX_REDOS });
    expect(G(s).banned[0]).toHaveLength(MAX_REDOS);
    expect(G(s).step).toBe('reveal');
    expect(V(s).items[0]!.name).toBe(V(s).items[1]!.name);
    expect(V(s).items[0]!.k).not.toBe(V(s).items[1]!.k);
  });

  it('banidos nunca voltam: sem opção, a franquia é pulada (e a revelação pula ela)', () => {
    let s = started(['Ana'], { frs: ['bakugan', 'jojo'], x: 4 });
    const b0 = cur(s, 'h')[0]!.name;
    s = pickName(s, 'h', b0);
    s = pickFree(s, 'h');
    s = pickName(s, 'ana', b0);
    s = pickFree(s, 'ana');
    for (let n = 1; n <= 3; n++) {
      expect(G(s).redos).toEqual({ 0: n });
      expect(cur(s, 'h')).toHaveLength(4 - n);
      const b = cur(s, 'h')[0]!.name;
      s = pickName(pickName(s, 'h', b), 'ana', b);
    }
    // os 4 de Bakugan foram banidos: ninguém tem opção e a franquia fica sem escolha
    const g = G(s);
    expect(g.redos).toEqual({ 0: 4 });
    expect([...g.banned[0]!].sort()).toEqual(['B0', 'B1', 'B2', 'B3']);
    expect(g.step).toBe('reveal');
    expect(g.redo).toBeNull();
    expect(s.notice).toBe('');
    expect(T(s, 'h').opts[0]).toEqual([]);
    expect(T(s, 'h').picks[0]).toBeNull();
    expect(g.used.bakugan).toEqual([]);
    expect(g.history[0]!.teams.map(t => t.picks.map(e => e.fr))).toEqual([['jojo'], ['jojo']]);
    expect(g.reveal).toBe(1);
    expect(V(s).items.map(e => e.fr)).toEqual(['jojo', 'jojo']);
    // 1 classificado: campeão direto
    s = decide(s, 1);
    expect(G(s).step).toBe('end');
    expect(G(s).champion).toMatchObject({ by: 'ana', fr: 'jojo', k: 'q1-1' });
  });
});

describe('Draft: exclusão entre rodadas', () => {
  it('nada que foi escolhido (used) aparece nas opções da rodada 2', () => {
    for (const seed of SEEDS) {
      rand = mulberry32(seed);
      let s = pickAll(started(['Ana', 'Bia'], { frs: ['jojo', 'ygo', 'pokemon'], x: 3, rounds: 2 }));
      expect(G(s).step).toBe('reveal');
      s = revealAll(s);
      const g = G(s);
      expect(g).toMatchObject({ round: 2, step: 'pick', banned: {}, redos: {}, redo: null, reveal: 0 });
      expect(s.vote).toBeNull();
      const picked = g.history[0]!.teams.flatMap(t => t.picks);
      g.frs.forEach((k, fi) => {
        expect([...g.used[k]!].sort()).toEqual(picked.filter(e => e.fr === k).map(e => e.name).sort());
        expect(g.used[k]).toHaveLength(3);
        for (const id of g.order) {
          const t = T(s, id);
          expect(t.att).toBe(0);
          expect(t.picks).toEqual([null, null, null]);
          // ygo tem 5: sobram 2 fora de used, então só 2 opções
          expect(t.opts[fi]).toHaveLength(Math.min(3, LISTS[k]!.length - 3));
          for (const n of namesOf(t.opts[fi]!)) expect(g.used[k]).not.toContain(n);
        }
      });
    }
  });

  it('se ninguém sobra fora de used, as opções vêm de used (menos opções quando sobra pouco)', () => {
    let s = started([], { frs: ['bakugan'], x: 2, rounds: 5 });
    const sizes: number[] = [];
    for (let r = 1; r <= 5; r++) {
      const o = namesOf(T(s, 'h').opts[0]!);
      sizes.push(o.length);
      const used = G(s).used.bakugan!;
      if (r < 5) for (const n of o) expect(used).not.toContain(n);
      else {
        expect(used).toHaveLength(4);
        for (const n of o) expect(used).toContain(n);
      }
      s = revealAll(pick(s, 'h', 0));
    }
    expect(sizes).toEqual([2, 2, 2, 1, 2]);
  });
});

describe('Draft: skip, entradas e saídas', () => {
  it('skip: ignorado se ninguém terminou; senão segue sem quem falta (que fica de fora da revelação)', () => {
    let s = started(['Ana', 'Bia'], { frs: ['jojo', 'pokemon', 'digimon'], rounds: 2 });
    expect(R(s, { type: 'skip' })).toBe(s);
    s = pickFree(s, 'bia');
    expect(R(s, { type: 'skip' })).toBe(s);
    for (const id of ['h', 'ana']) for (let i = 0; i < 3; i++) s = pickFree(s, id);
    expect(G(s).step).toBe('pick');
    expect(DV(s, 'h').progress).toEqual([
      { id: 'h', name: 'Host', state: 'pronto' },
      { id: 'ana', name: 'Ana', state: 'pronto' },
      { id: 'bia', name: 'Bia', state: 'escolhendo' },
    ]);
    const biaPick = T(s, 'bia').picks[0]!;
    s = R(s, { type: 'skip' });
    const g = G(s);
    expect(g.step).toBe('reveal');
    expect(T(s, 'bia').skipped).toBe(true);
    expect(T(s, 'h').skipped).toBe(false);
    expect(g.history[0]!.teams.map(t => t.id)).toEqual(['h', 'ana']);
    expect(V(s).items.map(e => (e as Qualified).by)).toEqual(['h', 'ana']);
    expect(V(s).extras).toEqual(['de Host', 'de Ana']);
    // a escolha parcial de quem foi pulado não conta (pickFree fez h e Ana fugirem dela)
    expect(g.used.jojo).toHaveLength(2);
    expect(g.used.jojo).not.toContain(biaPick.name);
    expect(DV(s, 'h').progress.map(p => p.state)).toEqual(['pronto', 'pronto', 'pulado']);
    expect(DV(s, 'bia').me).toMatchObject({ fi: null, opts: [], skipped: true });
    // fora da escolha: ignorado
    expect(R(s, { type: 'skip' })).toBe(s);
    // Bia vota normalmente e volta com time novo na próxima rodada
    s = revealAll(s);
    expect(G(s)).toMatchObject({ round: 2, step: 'pick' });
    expect(T(s, 'bia')).toMatchObject({ skipped: false, att: 0, queue: [0, 1, 2] });
  });

  it('quem entra no meio da rodada fica sem time até a próxima (mas vota na revelação)', () => {
    let s = started(['Ana'], { frs: ['jojo'], rounds: 2 });
    s = R(s, { type: 'join', id: 'carla', name: 'Carla' });
    expect(G(s).teams.carla).toBeUndefined();
    expect(G(s).order).toEqual(['h', 'ana']);
    expect(DV(s, 'carla').me).toBeNull();
    expect(DV(s, 'carla').progress.map(p => p.id)).toEqual(['h', 'ana']);
    expect(R(s, { type: 'pick', id: 'carla', round: 1, att: 0, idx: 0 })).toBe(s);
    s = pickFree(pickFree(s, 'h'), 'ana');
    expect(G(s).step).toBe('reveal');
    expect(V(s).items).toHaveLength(2);
    // a votação espera a Carla também
    s = R(s, { type: 'vote', id: 'h', seq: V(s).seq, idx: 0 });
    s = R(s, { type: 'vote', id: 'ana', seq: V(s).seq, idx: 0 });
    expect(V(s).result).toBeNull();
    s = R(s, { type: 'vote', id: 'carla', seq: V(s).seq, idx: 1 });
    expect(V(s).result).toMatchObject({ counts: [2, 1], win: 0 });
    s = R(s, { type: 'next' });
    expect(G(s)).toMatchObject({ round: 2, step: 'pick', order: ['h', 'ana', 'carla'] });
    expect(T(s, 'carla').queue).toEqual([0]);
    expect(DV(s, 'carla').me).toMatchObject({ fi: 0, att: 0, skipped: false });
  });

  it('kick durante a escolha apaga o time e libera a rodada; leave também', () => {
    let s = started(['Ana', 'Bia'], { frs: ['jojo', 'pokemon'] });
    for (const id of ['h', 'ana']) s = pickFree(pickFree(s, id), id);
    s = pickFree(s, 'bia');
    expect(G(s).step).toBe('pick');
    const kicked = R(s, { type: 'kick', id: 'bia' });
    expect(G(kicked).step).toBe('reveal');
    expect(G(kicked).teams.bia).toBeUndefined();
    expect(G(kicked).order).toEqual(['h', 'ana']);
    expect(G(kicked).history[0]!.teams.map(t => t.id)).toEqual(['h', 'ana']);
    expect(V(kicked).items).toHaveLength(2);
    const left = R(s, { type: 'leave', id: 'bia' });
    expect(G(left).step).toBe('reveal');
    // quem sai já tendo terminado: o time some e a rodada continua esperando os outros
    let t = started(['Ana', 'Bia'], { frs: ['jojo'] });
    t = pickFree(t, 'ana');
    t = R(t, { type: 'leave', id: 'ana' });
    expect(G(t).step).toBe('pick');
    expect(G(t).teams.ana).toBeUndefined();
    expect(DV(t, 'h').progress.map(p => p.id)).toEqual(['h', 'bia']);
  });

  it('kick durante a revelação: as escolhas reveladas continuam', () => {
    let s = pickAll(started(['Ana', 'Bia'], { frs: ['jojo', 'pokemon'] }));
    const items = V(s).items;
    s = R(s, { type: 'kick', id: 'bia' });
    expect(V(s).items).toEqual(items);
    s = decide(s, 2);
    expect(G(s).qualified[0]).toMatchObject({ by: 'bia', byName: 'Bia' });
    expect(V(s).items.map(e => (e as Qualified).by)).toEqual(['h', 'ana', 'bia']);
  });
});

describe('Draft: revelação', () => {
  it('uma votação por franquia com a escolha de cada um; o vencedor se classifica', () => {
    let s = pickAll(started(['Ana', 'Bia'], { frs: ['jojo', 'pokemon'] }));
    const g = G(s);
    expect(g.step).toBe('reveal');
    expect(g.reveal).toBe(0);
    const h = g.history[0]!;
    expect(h.round).toBe(1);
    expect(h.teams.map(t => [t.id, t.name])).toEqual([
      ['h', 'Host'],
      ['ana', 'Ana'],
      ['bia', 'Bia'],
    ]);
    expect(V(s).items).toEqual(
      h.teams.map(t => ({ ...t.picks[0]!, k: `d1-0-${t.id}`, by: t.id, byName: t.name, round: 1, fi: 0 })),
    );
    expect(V(s).extras).toEqual(['de Host', 'de Ana', 'de Bia']);
    // pode votar no próprio
    s = R(s, { type: 'vote', id: 'h', seq: V(s).seq, idx: 1 });
    s = R(s, { type: 'vote', id: 'ana', seq: V(s).seq, idx: 1 });
    s = R(s, { type: 'vote', id: 'bia', seq: V(s).seq, idx: 0 });
    const win = V(s).items[1] as Qualified;
    s = R(s, { type: 'next' });
    expect(G(s).qualified).toEqual([{ ...win, k: 'q1-0' }]);
    expect(G(s).reveal).toBe(1);
    expect(V(s).items.map(e => e.fr)).toEqual(['pokemon', 'pokemon', 'pokemon']);
    expect(V(s).items.map(e => e.k)).toEqual(['d1-1-h', 'd1-1-ana', 'd1-1-bia']);
    expect(R(s, { type: 'pick', id: 'h', round: 1, att: 0, idx: 0 })).toBe(s);
  });

  it('empate na revelação: roleta entre os empatados', () => {
    const vals = [0.7, 0.3, 0.6];
    let s = pickAll(started(['Ana', 'Bia', 'Carla'], { frs: ['jojo'] }));
    s = R(s, { type: 'vote', id: 'h', seq: V(s).seq, idx: 3 });
    s = R(s, { type: 'vote', id: 'ana', seq: V(s).seq, idx: 1 });
    s = R(s, { type: 'vote', id: 'bia', seq: V(s).seq, idx: 3 });
    s = R(s, { type: 'vote', id: 'carla', seq: V(s).seq, idx: 1 }, ctx({ rand: seqRand(vals) }));
    const plan = planSpin(2, seqRand(vals));
    const r = V(s).result!;
    expect(r).toMatchObject({ how: 'empate', tie: [1, 3], counts: [0, 2, 0, 2] });
    expect(r.spin).toMatchObject({ among: [1, 3], start: plan.start, total: plan.total });
    expect(r.win).toBe([1, 3][(plan.start + plan.total) % 2]);
    const win = V(s).items[r.win] as Qualified;
    s = R(s, { type: 'next' });
    // 1 franquia, 1 rodada: o único classificado é campeão direto
    expect(G(s).qualified).toEqual([{ ...win, k: 'q1-0' }]);
    expect(G(s)).toMatchObject({ step: 'end', final: null, champion: { ...win, k: 'q1-0' } });
    expect(s.vote).toBeNull();
  });

  it('roleta do host e encerrar também valem na revelação', () => {
    let s = pickAll(started(['Ana'], { frs: ['jojo'], rounds: 2 }, { roulette: true }));
    s = R(s, { type: 'spin' });
    expect(V(s).result!.how).toBe('roleta');
    s = R(s, { type: 'next' });
    expect(G(s)).toMatchObject({ round: 2, step: 'pick' });
    s = pickAll(s);
    s = R(R(s, { type: 'vote', id: 'ana', seq: V(s).seq, idx: 1 }), { type: 'close' });
    expect(V(s).result).toMatchObject({ win: 1, how: 'votos' });
  });
});

describe('Draft: final', () => {
  for (const q of [3, 5, 6]) {
    it(`${q} classificados: byes em confrontos diferentes, ninguém vota contra bye, campeão no fim`, () => {
      let size = 2;
      while (size < q) size *= 2;
      const patterns = new Set<string>();
      for (const seed of SEEDS) {
        rand = mulberry32(seed);
        let s = revealAll(pickAll(started([], { frs: ALL_FRS.slice(0, q), rounds: 1 })));
        const g = G(s);
        expect(g.step).toBe('final');
        expect(g.qualified).toHaveLength(q);
        const c = g.final!;
        expect(c.mix).toBe(false);
        const first = c.rounds[0]!;
        expect(first).toHaveLength(size / 2);
        const byes = first.flatMap(m => [m.a!, m.b!]).filter(isBye);
        expect(byes).toHaveLength(size - q);
        expect(byes.map(e => ({ ...e })).sort((a, b) => a.k!.localeCompare(b.k!))).toEqual(
          byes.map((_, i) => ({ name: 'bye', img: '', fr: '', k: `bye-${i + 1}` })),
        );
        for (const m of first) expect(isBye(m.a) && isBye(m.b)).toBe(false);
        expect(first.filter(m => isBye(m.a) || isBye(m.b))).toHaveLength(size - q);
        const real = first.flatMap(m => [m.a!, m.b!]).filter(e => !isBye(e));
        expect(real.map(e => e.k).sort()).toEqual(g.qualified.map(e => e.k).sort());
        patterns.add(first.map(m => (isBye(m.b) ? 'b' : '-')).join(''));
        let votes = 0;
        while (G(s).step === 'final') {
          const items = V(s).items as Qualified[];
          expect(items).toHaveLength(2);
          for (const e of items) expect(isBye(e)).toBe(false);
          expect(V(s).extras).toEqual(items.map(e => `de ${e.byName} · R${e.round}`));
          s = decide(s, votes % 2);
          votes++;
          expect(votes).toBeLessThan(q);
        }
        // sem votação nos confrontos com bye: Q - 1 votações
        expect(votes).toBe(q - 1);
        expect(G(s).step).toBe('end');
        expect(s.vote).toBeNull();
        const champ = G(s).champion!;
        expect(G(s).qualified).toContainEqual(champ);
        expect(G(s).final!.champ!.k).toBe(champ.k);
        expect(isBye(champ)).toBe(false);
        expect(R(s, { type: 'next' })).toBe(s);
      }
      // os byes caem em confrontos escolhidos ao acaso
      if (size - q > 0 && size - q < size / 2) expect(patterns.size).toBeGreaterThan(1);
    });
  }

  it('empate na final: roleta entre os empatados', () => {
    const vals = [0.2, 0.8, 0.4];
    let s = revealAll(pickAll(started(['Ana'], { frs: ['jojo', 'pokemon'] })));
    expect(G(s).step).toBe('final');
    expect(G(s).final!.round).toHaveLength(2);
    s = R(s, { type: 'vote', id: 'h', seq: V(s).seq, idx: 0 });
    s = R(s, { type: 'vote', id: 'ana', seq: V(s).seq, idx: 1 }, ctx({ rand: seqRand(vals) }));
    const plan = planSpin(2, seqRand(vals));
    const r = V(s).result!;
    expect(r).toMatchObject({ how: 'empate', tie: [0, 1], counts: [1, 1] });
    expect(r.win).toBe((plan.start + plan.total) % 2);
    const win = V(s).items[r.win] as Qualified;
    s = R(s, { type: 'next' });
    expect(G(s).step).toBe('end');
    expect(G(s).champion).toEqual(win);
    expect(G(s).champion!.k).toMatch(/^q1-[01]$/);
  });
});

describe('Draft: do começo ao fim', () => {
  it('2 rodadas × 3 franquias com 3 jogadores: escolha, revelação, nova rodada, final com byes e campeão', () => {
    rand = mulberry32(2026);
    let s = started(['Ana', 'Bia'], { frs: ['jojo', 'pokemon', 'digimon'], x: 3, rounds: 2 });
    const ids = ['h', 'ana', 'bia'];
    for (let round = 1; round <= 2; round++) {
      // passo 1: escolha secreta
      expect(G(s)).toMatchObject({ round, step: 'pick', redo: null });
      expect(s.vote).toBeNull();
      for (const id of ids) {
        const v = DV(s, id);
        expect(v).toMatchObject({ round, step: 'pick', title: '', count: '', history: null, champion: null, final: null });
        expect(v.me).toMatchObject({ fi: 0, att: 0, skipped: false, picks: [null, null, null] });
        expect(v.me!.opts).toEqual(T(s, id).opts[0]);
        expect(v.progress.map(p => p.state)).toEqual(['escolhendo', 'escolhendo', 'escolhendo']);
      }
      s = pickAll(s);
      // passo 2: revelação, uma franquia por vez
      expect(G(s).step).toBe('reveal');
      expect(G(s).history).toHaveLength(round);
      for (let fi = 0; fi < 3; fi++) {
        expect(G(s).reveal).toBe(fi);
        expect(DV(s, 'ana')).toMatchObject({ step: 'reveal', reveal: fi, history: null });
        expect(V(s).items.map(e => e.k)).toEqual(ids.map(id => `d${round}-${fi}-${id}`));
        s = decide(s, fi);
        const q = G(s).qualified.at(-1)!;
        expect(q).toMatchObject({ by: ids[fi], round, fi, k: `q${round}-${fi}`, fr: G(s).frs[fi] });
      }
    }
    // passo 3: final com 6 classificados (chave de 8, 2 byes)
    const g = G(s);
    expect(g.step).toBe('final');
    expect(g.qualified).toHaveLength(6);
    expect(g.final!.rounds[0]!.filter(m => isBye(m.a) || isBye(m.b))).toHaveLength(2);
    const seen: string[] = [];
    while (G(s).step === 'final') {
      const v = DV(s, 'bia');
      expect(v.history).toBeNull();
      seen.push(`${v.title} / ${v.count}`);
      s = decide(s, seen.length % 2);
    }
    expect(seen).toEqual([
      'Quartas de final / confronto 1 de 2',
      'Quartas de final / confronto 2 de 2',
      'Semifinal / confronto 1 de 2',
      'Semifinal / confronto 2 de 2',
      'Final / confronto 1 de 1',
    ]);
    const end = G(s);
    expect(end.step).toBe('end');
    expect(s.vote).toBeNull();
    expect(end.qualified).toContainEqual(end.champion);
    expect(end.history.map(h => h.round)).toEqual([1, 2]);
    for (const h of end.history) {
      expect(h.teams.map(t => t.id)).toEqual(ids);
      for (const t of h.teams) expect(t.picks.map(e => e.fr)).toEqual(['jojo', 'pokemon', 'digimon']);
    }
    // nenhuma escolha repetida entre as rodadas (used)
    for (const k of end.frs) {
      const all = end.history.flatMap(h => h.teams.flatMap(t => t.picks.filter(e => e.fr === k).map(e => e.name)));
      expect(new Set(all).size).toBe(6);
    }
    const v = DV(s, 'ana');
    expect(v).toMatchObject({ step: 'end', title: '', count: '', champion: end.champion });
    expect(v.history).toEqual(end.history);
    // volta pro lobby e começa de novo
    s = R(s, { type: 'lobby' });
    expect(s.game).toBeNull();
    s = R(s, { type: 'start' });
    expect(G(s)).toMatchObject({ round: 1, step: 'pick', history: [], qualified: [] });
  });
});

describe('Draft: visão', () => {
  it('não vaza as opções nem as escolhas dos outros (nem o saco)', () => {
    for (const seed of SEEDS) {
      rand = mulberry32(seed);
      let s = started(['Ana', 'Bia'], { frs: ['jojo', 'pokemon', 'digimon'], x: 3 });
      s = pickFree(s, 'ana');
      s = pickFree(pickFree(s, 'bia'), 'bia');
      const g = G(s);
      for (const me of g.order) {
        const v = viewFor(s, me, NOW);
        const json = JSON.stringify(v);
        expect(json).not.toContain('bags');
        expect(v.game).not.toHaveProperty('teams');
        expect(v.vote).toBeNull();
        const t = T(s, me);
        const mine = new Set([...Object.values(t.opts).flatMap(namesOf), ...namesOf(t.picks)]);
        for (const other of g.order) {
          if (other === me) continue;
          const o = T(s, other);
          for (const n of [...Object.values(o.opts).flatMap(namesOf), ...namesOf(o.picks)])
            if (!mine.has(n)) expect(json).not.toContain(`"${n}"`);
        }
        const dv = v.game as DraftView;
        for (const p of dv.progress) expect(Object.keys(p).sort()).toEqual(['id', 'name', 'state']);
        expect(dv.me!.opts).toEqual(t.opts[t.queue[0]!]);
        expect(dv.me!.picks).toEqual(t.picks);
      }
    }
  });

  it('history só no fim', () => {
    let s = started(['Ana'], { frs: ['jojo', 'pokemon'] });
    expect(DV(s, 'h').history).toBeNull();
    s = pickAll(s);
    expect(G(s).history).toHaveLength(1);
    expect(DV(s, 'h').history).toBeNull();
    s = revealAll(s);
    expect(G(s).step).toBe('final');
    expect(DV(s, 'ana').history).toBeNull();
    s = decide(s, 0);
    expect(G(s).step).toBe('end');
    expect(DV(s, 'ana').history).toEqual(G(s).history);
  });
});

describe('Draft: pureza', () => {
  it('nenhuma ação muda o estado recebido', () => {
    let s = started(['Ana', 'Bia'], { frs: ['jojo', 'ygo'], x: 5 }, { roulette: true });
    s = pickFree(pickFree(s, 'h'), 'h');
    s = pickFree(s, 'ana');
    const states: RoomState[] = [s];
    const acts = (st: RoomState): Action[] => [
      { type: 'pick', id: 'ana', round: G(st).round, att: G(st).teams.ana?.att ?? 0, idx: 0 },
      { type: 'pick', id: 'bia', round: G(st).round, att: G(st).teams.bia?.att ?? 0, idx: 0 },
      { type: 'skip' },
      { type: 'kick', id: 'bia' },
      { type: 'leave', id: 'ana' },
      { type: 'join', id: 'carla', name: 'Carla' },
      { type: 'online', id: 'ana', online: false },
      { type: 'vote', id: 'h', seq: st.vote?.seq ?? 0, idx: 0 },
      { type: 'close' },
      { type: 'spin' },
      { type: 'next' },
      { type: 'lobby' },
    ];
    s = pickAll(s);
    states.push(s);
    states.push(R(s, { type: 'close' }));
    s = revealAll(s);
    states.push(s);
    for (const st of states) {
      const snap = JSON.stringify(st);
      for (const a of acts(st)) {
        reduce(st, a, ctx());
        expect(JSON.stringify(st)).toBe(snap);
      }
    }
  });

  it('não usa Math.random nem Date.now', () => {
    const mr = vi.spyOn(Math, 'random');
    const dn = vi.spyOn(Date, 'now');
    let s = pickAll(started(['Ana', 'Bia'], { frs: ['jojo', 'pokemon', 'smt'], rounds: 2 }));
    while (G(s).step !== 'end') s = G(s).step === 'pick' ? pickAll(s) : decide(s, 0);
    for (const id of ['h', 'ana', 'bia']) viewFor(s, id, 5);
    expect(mr).not.toHaveBeenCalled();
    expect(dn).not.toHaveBeenCalled();
  });
});
