import { beforeEach, describe, expect, it } from 'vitest';
import { makeList, mulberry32 } from '../core/test-helpers';
import type { Item } from '../types';
import { createRoom, DEFAULT_CONFIG, reduce } from './room';
import type { Action, Ctx, CupGame, KingGame, OnlineConfig, RoomState, Vote } from './types';
import { viewFor } from './view';

const LISTS: Record<string, Item[] | null> = {
  pokemon: makeList('P', 12),
  digimon: makeList('D', 10),
  smt: makeList('S', 9),
  jojo: makeList('J', 6),
};

let rand = mulberry32(3);
const ctx = (now = 1000): Ctx => ({ rand, now, lists: LISTS });
const R = (s: RoomState, a: Action, now?: number) => reduce(s, a, ctx(now));

function room(names: string[], cfg: Partial<OnlineConfig> = {}): RoomState {
  let s = createRoom('SALA', { id: 'h', name: 'Host' }, { ...DEFAULT_CONFIG, ...cfg });
  for (const n of names) s = R(s, { type: 'join', id: n.toLowerCase(), name: n });
  return s;
}
const started = (names: string[], cfg: Partial<OnlineConfig> = {}) => R(room(names, cfg), { type: 'start' });
const V = (s: RoomState) => s.vote as Vote;
const vote = (s: RoomState, id: string, idx: number, now?: number) => R(s, { type: 'vote', id, seq: V(s).seq, idx }, now);

beforeEach(() => {
  rand = mulberry32(3);
});

describe('viewFor', () => {
  it('lobby: dados da sala, jogadores e nada de partida', () => {
    const s = R(room(['Ana']), { type: 'online', id: 'ana', online: false });
    const v = viewFor(s, 'ana', 5);
    expect(v).toEqual({
      code: 'SALA',
      me: 'ana',
      hostId: 'h',
      phase: 'lobby',
      cfg: DEFAULT_CONFIG,
      notice: '',
      players: [
        { id: 'h', name: 'Host', host: true, online: true, voted: false },
        { id: 'ana', name: 'Ana', host: false, online: false, voted: false },
      ],
      game: null,
      vote: null,
    });
  });

  it('aviso vai pra todos', () => {
    const s = R(room([], { mode: 'draft' }), { type: 'start' });
    expect(viewFor(s, 'h', 0).notice).toBe('O Draft ainda não está disponível.');
  });

  it('voted (votação aberta) e mine (o meu voto)', () => {
    let s = started(['Ana', 'Bia']);
    s = vote(s, 'ana', 1);
    const forAna = viewFor(s, 'ana', 0);
    expect(forAna.players.map(p => p.voted)).toEqual([false, true, false]);
    expect(forAna.vote!.mine).toBe(1);
    expect(forAna.vote!.result).toBeNull();
    expect(viewFor(s, 'bia', 0).vote!.mine).toBeNull();
    expect(viewFor(s, 'h', 0).vote!.mine).toBeNull();
    // apurou: a votação deixou de estar aberta
    s = vote(vote(s, 'h', 0), 'bia', 1);
    const done = viewFor(s, 'bia', 0);
    expect(done.players.every(p => !p.voted)).toBe(true);
    expect(done.vote!.mine).toBe(1);
  });

  it('itens e extras da votação', () => {
    const s = started(['Ana']);
    const v = viewFor(s, 'h', 0).vote!;
    expect(v.seq).toBe(V(s).seq);
    expect(v.items).toEqual(V(s).items);
    expect(v.extras).toEqual(['', '']);
  });

  it('resultado com nomes de quem votou (voto aberto)', () => {
    let s = started(['Ana', 'Bia']);
    s = vote(vote(vote(s, 'h', 0), 'bia', 1), 'ana', 0);
    expect(viewFor(s, 'bia', 0).vote!.result).toEqual({
      counts: [2, 1],
      voters: [['Host', 'Ana'], ['Bia']],
      win: 0,
      tie: null,
      how: 'votos',
      spin: null,
    });
  });

  it('voto secreto: só a contagem, sem nomes', () => {
    let s = started(['Ana', 'Bia'], { secret: true });
    s = vote(vote(vote(s, 'h', 0), 'bia', 1), 'ana', 0);
    const r = viewFor(s, 'ana', 0).vote!.result!;
    expect(r.counts).toEqual([2, 1]);
    expect(r.voters).toBeNull();
    expect(r.win).toBe(0);
    // e o próprio voto continua visível pra quem votou
    expect(viewFor(s, 'bia', 0).vote!.mine).toBe(1);
  });

  it('quem saiu depois de votar some dos nomes, mas o voto continua na contagem', () => {
    let s = started(['Ana', 'Bia']);
    s = vote(vote(vote(s, 'h', 0), 'bia', 1), 'ana', 0);
    s = R(s, { type: 'kick', id: 'bia' });
    const r = viewFor(s, 'h', 0).vote!.result!;
    expect(r.counts).toEqual([2, 1]);
    expect(r.voters).toEqual([['Host', 'Ana'], []]);
  });

  it('roleta: age = agora - quando o host decidiu', () => {
    let s = started(['Ana']);
    s = vote(vote(s, 'h', 0, 1000), 'ana', 1, 2000);
    const plan = V(s).result!.spin!;
    expect(plan.at).toBe(2000);
    const r = viewFor(s, 'ana', 2750).vote!.result!;
    expect(r.how).toBe('empate');
    expect(r.tie).toEqual([0, 1]);
    expect(r.spin).toEqual({ ...plan, age: 750 });
  });

  it('Duelo e Trio: modo, franquias e coroas (sem os slots nem o saco)', () => {
    let s = started(['Ana']);
    s = R(vote(vote(s, 'h', 1), 'ana', 1), { type: 'next' });
    expect(viewFor(s, 'h', 0).game).toEqual({ mode: 'duel', frs: ['pokemon', 'digimon'], streak: [0, 1] });
    const t = started(['Ana'], { mode: 'trio' });
    expect(viewFor(t, 'h', 0).game).toEqual({ mode: 'trio', frs: (t.game as KingGame).frs, streak: [0, 0, 0] });
  });

  it('Campeonato: chave, título da rodada e contagem do confronto; no fim, Campeão', () => {
    let s = started(['Ana'], { mode: 'cup', cup: { size: 4, frs: ['pokemon', 'digimon'], even: true, mix: false } });
    const at = () => viewFor(s, 'h', 0).game as { mode: 'cup'; title: string; count: string };
    expect(at()).toMatchObject({ mode: 'cup', title: 'Semifinal', count: 'confronto 1 de 2' });
    expect(viewFor(s, 'h', 0).game).toMatchObject({ cup: (s.game as CupGame).cup });
    const seen: string[] = [];
    while (s.vote) {
      seen.push(`${at().title} / ${at().count}`);
      s = R(vote(vote(s, 'h', 0), 'ana', 0), { type: 'next' });
    }
    expect(seen).toEqual(['Semifinal / confronto 1 de 2', 'Semifinal / confronto 2 de 2', 'Final / confronto 1 de 1']);
    const end = viewFor(s, 'ana', 0);
    expect(end.vote).toBeNull();
    expect(end.game).toMatchObject({ mode: 'cup', title: 'Campeão', count: '' });
  });

  it('nunca expõe o saco de sorteio', () => {
    let s = started(['Ana', 'Bia']);
    s = vote(s, 'ana', 0);
    expect(Object.keys(s.bags).length).toBeGreaterThan(0);
    for (const pid of ['h', 'ana', 'bia']) {
      const v = viewFor(s, pid, 0);
      expect(v).not.toHaveProperty('bags');
      expect(JSON.stringify(v)).not.toContain('bags');
      // nenhum nome que ainda está no saco aparece (só quem já está na tela)
      const json = JSON.stringify(v);
      for (const name of s.bags.digimon!) expect(json).not.toContain(`"${name}"`);
    }
  });

  it('a visão é uma cópia: mexer nela não mexe na sala', () => {
    let s = started(['Ana'], { mode: 'cup', cup: { size: 4, frs: ['pokemon', 'digimon'], even: true, mix: true } });
    s = vote(vote(s, 'h', 0), 'ana', 0);
    const snap = JSON.stringify(s);
    const v = viewFor(s, 'h', 0);
    v.cfg.cup.frs.push('xyz');
    v.players[0]!.name = 'X';
    v.vote!.items[0]!.name = 'X';
    v.vote!.result!.counts[0] = 99;
    (v.game as { cup: { round: unknown[] } }).cup.round.length = 0;
    expect(JSON.stringify(s)).toBe(snap);
  });
});
