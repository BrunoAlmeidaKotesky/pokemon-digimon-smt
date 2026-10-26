// Ranking às cegas online: a sala vota a posição de cada personagem (room.ts), a visão não revela a fila (view.ts)
// e o jogador aceita a visão do ranking (protocol.ts).
import { beforeEach, describe, expect, it } from 'vitest';
import { RANK_SIZE } from '../core/rank';
import { makeList, mulberry32 } from '../core/test-helpers';
import type { Item } from '../types';
import { parseHostMsg } from './protocol';
import { createRoom, DEFAULT_CONFIG, reduce } from './room';
import type { Action, Ctx, OnlineConfig, RankGame, RankView, RoomState, Vote } from './types';
import { viewFor } from './view';

const LISTS: Record<string, Item[] | null> = { pokemon: makeList('P', 12), digimon: makeList('D', 10), mini: makeList('M', 2), jojo: null };

let rand = mulberry32(5);
const ctx = (over: Partial<Ctx> = {}): Ctx => ({ rand, now: 1000, lists: LISTS, ...over });
const R = (s: RoomState, a: Action, c: Ctx = ctx()) => reduce(s, a, c);

function room(names: string[] = ['Ana', 'Bia'], rank: Partial<OnlineConfig['rank']> = {}, over: Partial<OnlineConfig> = {}): RoomState {
  let s = createRoom('ABCD', { id: 'h', name: 'Host' }, { ...DEFAULT_CONFIG, mode: 'rank', rank: { ...DEFAULT_CONFIG.rank, size: 3, ...rank }, ...over });
  for (const n of names) s = R(s, { type: 'join', id: n.toLowerCase(), name: n });
  return s;
}
const started = (names?: string[], rank?: Partial<OnlineConfig['rank']>, over?: Partial<OnlineConfig>) => R(room(names, rank, over), { type: 'start' });
const V = (s: RoomState) => s.vote as Vote;
const G = (s: RoomState) => (s.game as RankGame).rank;
const vote = (s: RoomState, id: string, idx: number) => R(s, { type: 'vote', id, seq: V(s).seq, idx });
/** Todos votam em `pos` e o host avança. */
function decide(s: RoomState, pos: number): RoomState {
  for (const p of s.players) s = vote(s, p.id, pos);
  expect(V(s).result?.win).toBe(pos);
  return R(s, { type: 'next' });
}

beforeEach(() => {
  rand = mulberry32(5);
});

describe('Ranking online: início', () => {
  it('separado: um top por franquia e a votação é da posição do personagem da vez', () => {
    const s = started();
    expect(s.phase).toBe('play');
    expect(s.notice).toBe('');
    const r = G(s);
    expect(r.size).toBe(3);
    expect(r.mix).toBe(false);
    expect(r.tops.map(t => t.fr)).toEqual(['pokemon', 'digimon']);
    expect(V(s).items).toEqual([r.tops[0]!.queue[0]]);
    expect(V(s).items[0]!.fr).toBe('pokemon');
    expect(V(s).extras).toEqual(['']);
    expect(V(s).pos).toEqual({ n: 3, free: [0, 1, 2] });
  });

  it('misturado: um top só, com as vagas divididas igualmente', () => {
    const s = started(['Ana'], { size: 4, mix: true });
    const r = G(s);
    expect(r.tops).toHaveLength(1);
    expect(r.tops[0]!.fr).toBeNull();
    expect(r.tops[0]!.queue.filter(e => e.fr === 'pokemon')).toHaveLength(2);
    expect(r.tops[0]!.queue.filter(e => e.fr === 'digimon')).toHaveLength(2);
    expect(V(s).pos).toEqual({ n: 4, free: [0, 1, 2, 3] });
  });

  it('avisa sem franquia, franquia desconhecida ou lista que não carregou', () => {
    expect(started([], { frs: [] }).notice).toBe('Escolha pelo menos uma franquia.');
    expect(started([], { frs: [3 as unknown as string] }).notice).toBe('Franquia desconhecida no Ranking.');
    const s = started([], { frs: ['pokemon', 'jojo'] });
    expect(s.phase).toBe('lobby');
    expect(s.notice).toBe('Lista de JoJo ainda não carregou.');
  });

  it('franquia repetida conta uma vez; tamanho fora dos limites é corrigido; lista pequena dá top menor', () => {
    expect(G(started([], { frs: ['pokemon', 'pokemon'] })).tops).toHaveLength(1);
    expect(G(started([], { frs: ['pokemon'], size: 99 })).size).toBe(RANK_SIZE.max);
    expect(G(started([], { frs: ['pokemon'], size: 99 })).tops[0]!.slots).toHaveLength(12);
    expect(V(started([], { frs: ['mini'], size: 5 })).pos).toEqual({ n: 2, free: [0, 1] });
  });
});

describe('Ranking online: votação da posição', () => {
  it('só vale votar numa posição livre do top', () => {
    let s = started(['Ana']);
    s = decide(s, 1);
    const seq = V(s).seq;
    for (const idx of [1, 3, -1, 0.5]) expect(R(s, { type: 'vote', id: 'ana', seq, idx })).toBe(s);
    expect(V(vote(s, 'ana', 2)).ballots).toEqual({ ana: 2 });
  });

  it('a mais votada vence; o personagem fica travado nela e vem o próximo, sem aquela posição', () => {
    let s = started(['Ana', 'Bia']);
    const first = V(s).items[0]!;
    s = vote(s, 'h', 2);
    s = vote(s, 'ana', 2);
    s = vote(s, 'bia', 0);
    const res = V(s).result!;
    expect(res.counts).toEqual([1, 0, 2]);
    expect(res.win).toBe(2);
    expect(res.how).toBe('votos');
    expect(res.voters).toEqual([['bia'], [], ['h', 'ana']]);
    s = R(s, { type: 'next' });
    expect(G(s).tops[0]!.slots[2]).toEqual(first);
    expect(V(s).items[0]).not.toEqual(first);
    expect(V(s).pos).toEqual({ n: 3, free: [0, 1] });
  });

  it('empate entre posições vai pra roleta entre as empatadas', () => {
    let s = started(['Ana']);
    s = vote(s, 'h', 0);
    s = vote(s, 'ana', 2);
    const res = V(s).result!;
    expect(res.how).toBe('empate');
    expect(res.tie).toEqual([0, 2]);
    expect([0, 2]).toContain(res.win);
    expect(res.spin!.among).toEqual([0, 2]);
  });

  it('host encerra sem votos: roleta entre as posições livres, nunca numa ocupada', () => {
    let s = started(['Ana']);
    s = decide(s, 1);
    s = R(s, { type: 'close' });
    const res = V(s).result!;
    expect(res.how).toBe('empate');
    expect(res.tie).toEqual([0, 2]);
    expect(res.spin!.among).toEqual([0, 2]);
    expect([0, 2]).toContain(res.win);
  });

  it('roleta do host gira só entre as posições livres', () => {
    let s = started(['Ana'], {}, { roulette: true });
    s = decide(s, 0);
    s = R(s, { type: 'spin' });
    expect(V(s).result!.how).toBe('roleta');
    expect(V(s).result!.spin!.among).toEqual([1, 2]);
  });

  it('separado: top cheio passa pro próximo; no fim não há votação e "next" não faz nada', () => {
    let s = started(['Ana']);
    s = decide(s, 0); s = decide(s, 1); s = decide(s, 2);
    expect(G(s).cur).toBe(1);
    expect(V(s).items[0]!.fr).toBe('digimon');
    expect(V(s).pos).toEqual({ n: 3, free: [0, 1, 2] });
    s = decide(s, 2); s = decide(s, 1); s = decide(s, 0);
    expect(G(s).cur).toBe(2);
    expect(s.vote).toBeNull();
    expect(s.phase).toBe('play');
    expect(G(s).tops.map(t => t.slots.every(Boolean))).toEqual([true, true]);
    expect(R(s, { type: 'next' })).toBe(s);
  });

  it('quem sai no meio não trava: se só faltava ele, a votação é apurada', () => {
    let s = started(['Ana', 'Bia']);
    s = vote(s, 'h', 1);
    s = vote(s, 'ana', 1);
    s = R(s, { type: 'leave', id: 'bia' });
    expect(V(s).result?.win).toBe(1);
  });

  it('voltar ao lobby encerra o ranking', () => {
    const s = R(started(['Ana']), { type: 'lobby' });
    expect(s.phase).toBe('lobby');
    expect(s.game).toBeNull();
    expect(s.vote).toBeNull();
  });
});

describe('Ranking online: visão', () => {
  it('mostra as posições e quantos faltam, nunca a fila', () => {
    let s = started(['Ana']);
    s = decide(s, 2);
    const v = viewFor(s, 'ana', 1000);
    const g = v.game as RankView;
    expect(g.mode).toBe('rank');
    expect(g.size).toBe(3);
    expect(g.mix).toBe(false);
    expect(g.cur).toBe(0);
    expect(g.tops.map(t => t.fr)).toEqual(['pokemon', 'digimon']);
    expect(g.tops.map(t => t.left)).toEqual([2, 3]);
    expect(g.tops[0]!.slots[2]).toEqual(G(s).tops[0]!.slots[2]);
    expect(g.tops[0]).not.toHaveProperty('queue');
    // nenhum personagem da fila aparece na visão, a não ser o da vez
    const next = G(s).tops[0]!.queue[1]!.name;
    expect(JSON.stringify(v)).not.toContain(`"${next}"`);
    expect(v.vote!.items[0]!.name).toBe(G(s).tops[0]!.queue[0]!.name);
    expect(v.vote!.pos).toEqual({ n: 3, free: [0, 1] });
  });

  it('voto secreto esconde quem votou em cada posição', () => {
    let s = started(['Ana'], {}, { secret: true });
    s = vote(s, 'h', 0);
    s = vote(s, 'ana', 0);
    const v = viewFor(s, 'ana', 1000);
    expect(v.vote!.mine).toBe(0);
    expect(v.vote!.result!.voters).toBeNull();
    expect(v.vote!.result!.counts).toEqual([2, 0, 0]);
  });
});

describe('Ranking online: protocolo', () => {
  const view = (s: RoomState) => JSON.parse(JSON.stringify(viewFor(s, 'ana', 1000))) as Record<string, unknown>;
  const ok = (v: unknown) => parseHostMsg({ t: 'state', view: v })?.t === 'state';

  it('aceita a visão do ranking (em jogo, com resultado e no fim)', () => {
    let s = started(['Ana']);
    expect(ok(view(s))).toBe(true);
    s = vote(s, 'h', 2);
    s = vote(s, 'ana', 2);
    expect(ok(view(s))).toBe(true);
    for (const pos of [2, 1, 0, 0, 1, 2]) {
      if (!V(s).result) s = decide(s, pos); else s = R(s, { type: 'next' });
    }
    expect(s.vote).toBeNull();
    expect(ok(view(s))).toBe(true);
  });

  it('recusa voto ou posição fora do top', () => {
    const v = view(started(['Ana']));
    const vote = v.vote as Record<string, unknown>;
    expect(ok({ ...v, vote: { ...vote, mine: 3 } })).toBe(false);
    expect(ok({ ...v, vote: { ...vote, pos: { n: 3, free: [0, 3] } } })).toBe(false);
    expect(ok({ ...v, vote: { ...vote, pos: { n: -1, free: [] } } })).toBe(false);
    expect(ok({ ...v, game: { ...(v.game as object), tops: [{ fr: 'pokemon', slots: [1], left: 0 }] } })).toBe(false);
  });

  it('aceita configuração de host anterior ao Ranking (sem `rank`)', () => {
    const v = view(room(['Ana']));
    const cfg = { ...(v.cfg as Record<string, unknown>) };
    delete cfg.rank;
    expect(ok({ ...v, cfg })).toBe(true);
    expect(ok({ ...v, cfg: { ...cfg, rank: { size: 'x', frs: [], mix: false } } })).toBe(false);
  });
});
