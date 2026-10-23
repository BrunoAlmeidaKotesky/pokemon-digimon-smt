import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cupPair, same } from '../core/cup';
import { planSpin } from '../core/spin';
import { installStorage, makeList, mulberry32 } from '../core/test-helpers';
import type { Cup, Item } from '../types';
import { canJoin, createRoom, crown, DEFAULT_CONFIG, frLabel, MAX_PLAYERS, reduce } from './room';
import type { Action, Ctx, CupGame, GameView, KingGame, OnlineConfig, RoomState, Vote } from './types';
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
/** Sala com o host + estes jogadores (id = nome em minúsculas). */
function room(names: string[] = ['Ana', 'Bia'], cfg: Partial<OnlineConfig> = {}): RoomState {
  let s = createRoom('ABCD', HOST, { ...DEFAULT_CONFIG, ...cfg });
  for (const n of names) s = R(s, { type: 'join', id: n.trim().toLowerCase(), name: n });
  return s;
}
const started = (names?: string[], cfg?: Partial<OnlineConfig>, c?: Ctx) => R(room(names, cfg), { type: 'start' }, c);
const V = (s: RoomState) => s.vote as Vote;
const king = (s: RoomState) => s.game as KingGame;
const cupOf = (s: RoomState) => (s.game as CupGame).cup;
const vote = (s: RoomState, id: string, idx: number, c?: Ctx) => R(s, { type: 'vote', id, seq: V(s).seq, idx }, c);
function votes(s: RoomState, picks: Record<string, number>, c?: Ctx): RoomState {
  for (const [id, idx] of Object.entries(picks)) s = vote(s, id, idx, c);
  return s;
}
/** Todos votam em `idx` e o host avança. */
function decide(s: RoomState, idx: number, c?: Ctx): RoomState {
  for (const p of s.players) s = vote(s, p.id, idx, c);
  expect(V(s).result?.win).toBe(idx);
  return R(s, { type: 'next' }, c);
}

beforeEach(() => {
  rand = mulberry32(1);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ---------- testes ----------

describe('createRoom e DEFAULT_CONFIG', () => {
  it('configuração padrão', () => {
    expect(DEFAULT_CONFIG).toEqual({
      mode: 'duel',
      secret: false,
      roulette: false,
      duel: ['pokemon', 'digimon'],
      trio: ['pokemon', 'digimon', 'smt'],
      cup: { size: 16, frs: ['pokemon', 'digimon', 'smt', 'jojo', 'ygo', 'bakugan', 'sujimon'], even: true, mix: true },
      draft: { frs: ['jojo', 'pokemon', 'digimon', 'smt'], x: 3, rounds: 1 },
    });
  });

  it('o host é o primeiro jogador e a sala começa no lobby', () => {
    const s = createRoom('XYZW', { id: 'h1', name: ' Bruno ' });
    expect(s).toEqual({
      code: 'XYZW',
      hostId: 'h1',
      players: [{ id: 'h1', name: 'Bruno', host: true, online: true }],
      cfg: DEFAULT_CONFIG,
      phase: 'lobby',
      game: null,
      vote: null,
      bags: {},
      nextSeq: expect.any(Number),
      notice: '',
    });
    // cópia: mexer na sala não mexe no padrão
    expect(s.cfg).not.toBe(DEFAULT_CONFIG);
    expect(s.cfg.cup.frs).not.toBe(DEFAULT_CONFIG.cup.frs);
  });

  it('aceita uma configuração', () => {
    const cfg: OnlineConfig = { ...DEFAULT_CONFIG, mode: 'trio', secret: true };
    const s = createRoom('A', HOST, cfg);
    expect(s.cfg).toEqual(cfg);
    expect(s.cfg).not.toBe(cfg);
  });

  it('rótulos e coroa', () => {
    expect(frLabel('pokemon')).toBe('Pokémon');
    expect(frLabel('smt')).toBe('SMT/Persona');
    expect(frLabel('ygo')).toBe('Yu-Gi-Oh!');
    expect(frLabel('xyz')).toBe('xyz');
    expect(crown(0)).toBe('');
    expect(crown(1)).toBe('♛ 1 vitória');
    expect(crown(5)).toBe('♛ 5 vitórias');
  });
});

describe('canJoin', () => {
  const bad = { ok: false, reason: 'Escolha um apelido.' };

  it('apelido vazio, só espaços ou com mais de 16 caracteres', () => {
    const s = room([]);
    expect(canJoin(s, 'x', '')).toEqual(bad);
    expect(canJoin(s, 'x', '   ')).toEqual(bad);
    expect(canJoin(s, 'x', 'a'.repeat(17))).toEqual(bad);
    expect(canJoin(s, 'x', `  ${'a'.repeat(16)}  `)).toEqual({ ok: true, id: 'x' });
    expect(canJoin(s, 'x', 'Z')).toEqual({ ok: true, id: 'x' });
  });

  it('mesmo id volta pro lugar (mesmo online e com outro apelido)', () => {
    const s = room(['Ana']);
    expect(canJoin(s, 'ana', 'Ana')).toEqual({ ok: true, id: 'ana' });
    expect(canJoin(s, 'ana', 'Outro')).toEqual({ ok: true, id: 'ana' });
  });

  it('apelido de quem está offline recupera o lugar (sem diferenciar maiúsculas)', () => {
    const s = R(room(['Ana']), { type: 'online', id: 'ana', online: false });
    expect(canJoin(s, 'outro-aparelho', ' aNA ')).toEqual({ ok: true, id: 'ana' });
  });

  it('apelido de quem está online é recusado', () => {
    const s = room(['Ana']);
    const dup = { ok: false, reason: 'Já tem alguém com esse apelido na sala.' };
    expect(canJoin(s, 'x', 'ANA')).toEqual(dup);
    expect(canJoin(s, 'x', 'host')).toEqual(dup);
  });

  it('sala cheia recusa quem é novo, mas não quem volta', () => {
    const names = Array.from({ length: MAX_PLAYERS - 1 }, (_, i) => `J${i}`);
    const almost = room(names.slice(0, -1));
    expect(almost.players).toHaveLength(MAX_PLAYERS - 1);
    expect(canJoin(almost, 'novo', 'Novo')).toEqual({ ok: true, id: 'novo' });
    let s = room(names);
    expect(s.players).toHaveLength(16);
    expect(canJoin(s, 'novo', 'Novo')).toEqual({ ok: false, reason: 'A sala está cheia (16 jogadores).' });
    expect(canJoin(s, 'j3', 'J3')).toEqual({ ok: true, id: 'j3' });
    s = R(s, { type: 'online', id: 'j3', online: false });
    expect(canJoin(s, 'novo', 'j3')).toEqual({ ok: true, id: 'j3' });
    // e o redutor também não deixa passar do limite
    expect(R(s, { type: 'join', id: 'novo', name: 'Novo' })).toBe(s);
  });
});

describe('jogadores', () => {
  it('quem entra vai pro fim da lista', () => {
    const s = room(['Ana', ' Bia ']);
    expect(s.players).toEqual([
      { id: 'h', name: 'Host', host: true, online: true },
      { id: 'ana', name: 'Ana', host: false, online: true },
      { id: 'bia', name: 'Bia', host: false, online: true },
    ]);
  });

  it('join inválido (apelido ruim ou de alguém online) e join de quem já está online não mudam nada', () => {
    const s = room(['Ana']);
    expect(R(s, { type: 'join', id: 'x', name: '  ' })).toBe(s);
    expect(R(s, { type: 'join', id: 'x', name: 'ana' })).toBe(s);
    expect(R(s, { type: 'join', id: 'ana', name: 'Ana' })).toBe(s);
  });

  it('offline não remove; quem volta (mesmo id) fica no mesmo lugar e com o voto já dado', () => {
    let s = started(['Ana', 'Bia']);
    s = vote(s, 'ana', 1);
    s = R(s, { type: 'online', id: 'ana', online: false });
    expect(s.players.map(p => p.id)).toEqual(['h', 'ana', 'bia']);
    expect(s.players[1]!.online).toBe(false);
    expect(V(s).ballots).toEqual({ ana: 1 });
    s = R(s, { type: 'join', id: 'ana', name: 'Ana' });
    expect(s.players[1]).toEqual({ id: 'ana', name: 'Ana', host: false, online: true });
    expect(V(s).ballots).toEqual({ ana: 1 });
  });

  it('o mesmo apelido em outro aparelho recupera o lugar de quem caiu', () => {
    let s = started(['Ana', 'Bia']);
    s = vote(s, 'bia', 0);
    s = R(s, { type: 'online', id: 'bia', online: false });
    s = R(s, { type: 'join', id: 'celular-novo', name: 'BIA' });
    expect(s.players).toHaveLength(3);
    expect(s.players[2]).toEqual({ id: 'bia', name: 'Bia', host: false, online: true });
    expect(V(s).ballots).toEqual({ bia: 0 });
  });

  it('online: marca e desmarca; id desconhecido ou sem mudança não faz nada', () => {
    let s = room(['Ana']);
    expect(R(s, { type: 'online', id: 'zzz', online: false })).toBe(s);
    expect(R(s, { type: 'online', id: 'ana', online: true })).toBe(s);
    s = R(s, { type: 'online', id: 'ana', online: false });
    expect(s.players[1]!.online).toBe(false);
    s = R(s, { type: 'online', id: 'ana', online: true });
    expect(s.players[1]!.online).toBe(true);
  });

  it('a votação espera quem está offline (até o host encerrar)', () => {
    let s = started(['Ana', 'Bia']);
    s = R(s, { type: 'online', id: 'bia', online: false });
    s = votes(s, { h: 0, ana: 0 });
    expect(V(s).result).toBeNull();
    const closed = R(s, { type: 'close' });
    expect(V(closed).result).toMatchObject({ win: 0, how: 'votos', counts: [2, 0] });
    // ou ela volta e vota
    s = R(s, { type: 'join', id: 'bia', name: 'Bia' });
    s = vote(s, 'bia', 1);
    expect(V(s).result).toMatchObject({ win: 0, how: 'votos', counts: [2, 1] });
  });

  it('quem entra no meio da partida vota na votação aberta e o resultado espera por ele', () => {
    let s = started(['Ana']);
    s = vote(s, 'h', 0);
    s = R(s, { type: 'join', id: 'carla', name: 'Carla' });
    s = vote(s, 'ana', 0);
    expect(V(s).result).toBeNull();
    s = vote(s, 'carla', 1);
    expect(V(s).result).toMatchObject({ counts: [2, 1], voters: [['h', 'ana'], ['carla']], win: 0 });
  });

  it('leave e kick removem o jogador e o voto dele', () => {
    let s = started(['Ana', 'Bia', 'Carla']);
    s = votes(s, { bia: 1, h: 0 });
    s = R(s, { type: 'leave', id: 'bia' });
    expect(s.players.map(p => p.id)).toEqual(['h', 'ana', 'carla']);
    expect(V(s).ballots).toEqual({ h: 0 });
    expect(V(s).result).toBeNull();
    s = R(s, { type: 'kick', id: 'carla' });
    expect(s.players.map(p => p.id)).toEqual(['h', 'ana']);
    s = vote(s, 'ana', 0);
    expect(V(s).result).toMatchObject({ counts: [2, 0], win: 0 });
  });

  it('kick/leave fecham a votação se todos os que ficaram já votaram', () => {
    let s = started(['Ana', 'Bia']);
    s = votes(s, { h: 1, ana: 1 });
    expect(V(s).result).toBeNull();
    const kicked = R(s, { type: 'kick', id: 'bia' });
    expect(V(kicked).result).toMatchObject({ counts: [0, 2], voters: [[], ['h', 'ana']], win: 1, how: 'votos' });
    const left = R(s, { type: 'leave', id: 'bia' });
    expect(V(left).result).toMatchObject({ win: 1, how: 'votos' });
  });

  it('o host nunca é removido; id desconhecido não faz nada', () => {
    const s = started(['Ana']);
    expect(R(s, { type: 'kick', id: 'h' })).toBe(s);
    expect(R(s, { type: 'leave', id: 'h' })).toBe(s);
    expect(R(s, { type: 'kick', id: 'zzz' })).toBe(s);
  });

  it('leave no lobby', () => {
    const s = R(room(['Ana', 'Bia']), { type: 'leave', id: 'ana' });
    expect(s.players.map(p => p.id)).toEqual(['h', 'bia']);
  });
});

describe('config', () => {
  it('no lobby: merge raso por chave (cup/draft/duel/trio substituídos inteiros)', () => {
    let s = room([]);
    s = R(s, { type: 'config', patch: { mode: 'trio', secret: true } });
    expect(s.cfg).toEqual({ ...DEFAULT_CONFIG, mode: 'trio', secret: true });
    const cup = { size: 8, frs: ['smt'], even: false, mix: false };
    s = R(s, { type: 'config', patch: { cup, duel: ['jojo', 'ygo'] } });
    expect(s.cfg.cup).toEqual(cup);
    expect(s.cfg.duel).toEqual(['jojo', 'ygo']);
    expect(s.cfg.trio).toEqual(DEFAULT_CONFIG.trio);
    cup.frs.push('jojo'); // cópia: o patch não fica preso no estado
    expect(s.cfg.cup.frs).toEqual(['smt']);
  });

  it('chave indefinida ou desconhecida é ignorada', () => {
    const s = room([]);
    expect(R(s, { type: 'config', patch: { mode: undefined } })).toBe(s);
    expect(R(s, { type: 'config', patch: { lixo: 1 } as unknown as Partial<OnlineConfig> })).toBe(s);
  });

  it('durante a partida é ignorada', () => {
    const s = started(['Ana']);
    expect(R(s, { type: 'config', patch: { secret: true } })).toBe(s);
  });
});

describe('start', () => {
  it('Duelo: sorteia um de cada franquia, zera a coroa e abre a votação', () => {
    const s0 = room(['Ana']);
    const s = R(s0, { type: 'start' });
    expect(s.phase).toBe('play');
    expect(s.notice).toBe('');
    const g = king(s);
    expect(g.mode).toBe('duel');
    expect(g.frs).toEqual(['pokemon', 'digimon']);
    expect(g.slots.map(e => e.fr)).toEqual(['pokemon', 'digimon']);
    expect(g.slots.every(e => LISTS[e.fr]!.some(x => x.name === e.name && x.img === e.img))).toBe(true);
    expect(g.streak).toEqual([0, 0]);
    expect(s.vote).toEqual({ seq: s0.nextSeq, items: g.slots, extras: ['', ''], ballots: {}, result: null });
    expect(s.nextSeq).toBe(s0.nextSeq + 1);
  });

  it('Trio: três franquias', () => {
    const s = started(['Ana'], { mode: 'trio' });
    expect(king(s).mode).toBe('trio');
    expect(king(s).slots.map(e => e.fr)).toEqual(['pokemon', 'digimon', 'smt']);
    expect(king(s).streak).toEqual([0, 0, 0]);
    expect(V(s).extras).toEqual(['', '', '']);
  });

  it('mesma franquia dos dois lados: nunca o mesmo personagem', () => {
    for (let seed = 1; seed <= 30; seed++) {
      rand = mulberry32(seed);
      const s = started(['Ana'], { duel: ['bakugan', 'bakugan'] });
      expect(king(s).slots[0]!.name).not.toBe(king(s).slots[1]!.name);
    }
  });

  it('lista que não carregou: fica no lobby com aviso', () => {
    const s0 = room(['Ana']);
    let s = R(s0, { type: 'start' }, ctx({ lists: { ...LISTS, digimon: null } }));
    expect(s.phase).toBe('lobby');
    expect(s.game).toBeNull();
    expect(s.vote).toBeNull();
    expect(s.notice).toBe('Lista de Digimon ainda não carregou.');
    s = R(s, { type: 'start' }, ctx({ lists: { ...LISTS, pokemon: [] } }));
    expect(s.notice).toBe('Lista de Pokémon ainda não carregou.');
    const trio = R(room([], { mode: 'trio' }), { type: 'start' }, ctx({ lists: { ...LISTS, smt: null } }));
    expect(trio.notice).toBe('Lista de SMT/Persona ainda não carregou.');
    const odd = R(room([], { duel: ['pokemon', 'xyz'] }), { type: 'start' });
    expect(odd.notice).toBe('Lista de xyz ainda não carregou.');
    // carregou: começa e limpa o aviso
    s = R(s, { type: 'start' });
    expect(s.phase).toBe('play');
    expect(s.notice).toBe('');
  });

  it('Draft: franquias vazias, repetidas ou sem lista ficam no lobby com aviso; senão começa a rodada 1', () => {
    const draft = (frs: unknown[]) => ({ mode: 'draft' as const, draft: { frs: frs as string[], x: 3, rounds: 1 } });
    const cases: [unknown[], string][] = [
      [[], 'Escolha pelo menos uma franquia.'],
      [['pokemon', 'jojo', 'pokemon'], 'Cada franquia só pode aparecer uma vez no Draft.'],
      [['pokemon', 'xyz'], 'Lista de xyz ainda não carregou.'],
      [[1], 'Franquia desconhecida no Draft.'],
    ];
    for (const [frs, msg] of cases) {
      const s = R(room(['Ana'], draft(frs)), { type: 'start' });
      expect(s.phase).toBe('lobby');
      expect(s.game).toBeNull();
      expect(s.vote).toBeNull();
      expect(s.notice).toBe(msg);
    }
    const miss = R(room(['Ana'], draft(['jojo', 'smt'])), { type: 'start' }, ctx({ lists: { ...LISTS, smt: null } }));
    expect(miss.notice).toBe('Lista de SMT/Persona ainda não carregou.');
    const s = R(room(['Ana'], { mode: 'draft' }), { type: 'start' });
    expect(s.phase).toBe('play');
    expect(s.notice).toBe('');
    expect(s.vote).toBeNull();
    expect(s.game).toMatchObject({ mode: 'draft', frs: DEFAULT_CONFIG.draft.frs, round: 1, step: 'pick', order: ['h', 'ana'] });
  });

  it('start durante a partida é ignorado', () => {
    const s = started(['Ana']);
    expect(R(s, { type: 'start' })).toBe(s);
  });

  it('Campeonato: só as franquias carregadas; nenhuma = aviso', () => {
    const cup = { size: 8, frs: ['pokemon', 'jojo', 'ygo'], even: true, mix: true };
    const s = started(['Ana'], { mode: 'cup', cup }, ctx({ lists: { ...LISTS, jojo: null } }));
    expect(s.phase).toBe('play');
    const c = cupOf(s);
    expect(c.round).toHaveLength(8);
    expect(new Set(c.round.map(e => e.fr))).toEqual(new Set(['pokemon', 'ygo']));
    // k estável e único (a chave atravessa a rede)
    expect(new Set(c.round.map(e => e.k)).size).toBe(8);
    expect(V(s).items).toEqual(cupPair(c));
    expect(V(s).extras).toEqual(['', '']);

    const none = R(room([], { mode: 'cup', cup }), { type: 'start' }, ctx({ lists: { ...LISTS, pokemon: null, jojo: null, ygo: null } }));
    expect(none.phase).toBe('lobby');
    expect(none.notice).toBe('Lista de Pokémon ainda não carregou.');
    const empty = R(room([], { mode: 'cup', cup: { ...cup, frs: [] } }), { type: 'start' });
    expect(empty.phase).toBe('lobby');
    expect(empty.notice).not.toBe('');
  });
});

describe('votação', () => {
  it('só apura quando todos votaram; 2 x 1 ganha por votos', () => {
    let s = started(['Ana', 'Bia']);
    s = votes(s, { h: 0, bia: 1 });
    expect(V(s).result).toBeNull();
    expect(V(s).ballots).toEqual({ h: 0, bia: 1 });
    s = vote(s, 'ana', 0);
    expect(V(s).result).toEqual({ counts: [2, 1], voters: [['h', 'ana'], ['bia']], win: 0, tie: null, how: 'votos', spin: null });
  });

  it('pode trocar o voto enquanto não apurou', () => {
    let s = started(['Ana', 'Bia']);
    s = vote(s, 'ana', 0);
    s = vote(s, 'ana', 1);
    expect(V(s).ballots).toEqual({ ana: 1 });
    expect(vote(s, 'ana', 1)).toBe(s); // mesmo voto: nada muda
    s = votes(s, { h: 1, bia: 0 });
    expect(V(s).result).toMatchObject({ counts: [1, 2], win: 1, how: 'votos' });
    expect(vote(s, 'ana', 0)).toBe(s); // depois de apurar, não troca mais
  });

  it('empate 1 x 1: roleta só entre os empatados, igual ao planSpin', () => {
    const vals = [0.7, 0.3, 0.6];
    let s = started(['Ana']);
    s = vote(s, 'h', 0);
    const seq0 = s.nextSeq;
    s = vote(s, 'ana', 1, ctx({ rand: seqRand(vals), now: 4242 }));
    const plan = planSpin(2, seqRand(vals));
    const r = V(s).result!;
    expect(r.how).toBe('empate');
    expect(r.tie).toEqual([0, 1]);
    expect(r.counts).toEqual([1, 1]);
    expect(r.spin).toEqual({ id: seq0, among: [0, 1], start: plan.start, total: plan.total, at: 4242 });
    expect(r.win).toBe([0, 1][(plan.start + plan.total) % 2]);
    expect(s.nextSeq).toBe(seq0 + 1);
  });

  it('empate 2 x 2 no Trio: quem teve menos voto nunca ganha', () => {
    const wins = new Set<number>();
    for (let seed = 1; seed <= 40; seed++) {
      rand = mulberry32(seed);
      let s = started(['Ana', 'Bia', 'Carla'], { mode: 'trio' });
      s = votes(s, { h: 0, ana: 2, bia: 0, carla: 2 });
      const r = V(s).result!;
      expect(r.how).toBe('empate');
      expect(r.tie).toEqual([0, 2]);
      expect(r.spin!.among).toEqual([0, 2]);
      expect(r.win).toBe(r.spin!.among[(r.spin!.start + r.spin!.total) % 2]);
      wins.add(r.win);
    }
    expect([...wins].sort()).toEqual([0, 2]);
  });

  it('empate triplo no Trio: roleta entre os três', () => {
    const vals = [0.1, 0.9, 0.5];
    let s = started(['Ana', 'Bia'], { mode: 'trio' });
    s = votes(s, { h: 0, ana: 1 });
    s = vote(s, 'bia', 2, ctx({ rand: seqRand(vals) }));
    const plan = planSpin(3, seqRand(vals));
    const r = V(s).result!;
    expect(r).toMatchObject({ how: 'empate', tie: [0, 1, 2], counts: [1, 1, 1], voters: [['h'], ['ana'], ['bia']] });
    expect(r.spin).toMatchObject({ among: [0, 1, 2], start: plan.start, total: plan.total });
    expect(r.win).toBe((plan.start + plan.total) % 3);
  });

  it('votos inválidos são ignorados', () => {
    let s = started(['Ana']);
    const seq = V(s).seq;
    for (const a of [
      { type: 'vote', id: 'ana', seq: seq - 1, idx: 0 },
      { type: 'vote', id: 'ana', seq: seq + 1, idx: 0 },
      { type: 'vote', id: 'ana', seq, idx: -1 },
      { type: 'vote', id: 'ana', seq, idx: 2 },
      { type: 'vote', id: 'ana', seq, idx: 0.5 },
      { type: 'vote', id: 'ana', seq, idx: Number.NaN },
      { type: 'vote', id: 'zzz', seq, idx: 0 },
    ] as Action[])
      expect(R(s, a)).toBe(s);
    // depois do next, o seq antigo não vale mais
    s = decide(s, 0);
    expect(R(s, { type: 'vote', id: 'ana', seq, idx: 0 })).toBe(s);
    // no lobby não há votação
    const lobby = room(['Ana']);
    expect(R(lobby, { type: 'vote', id: 'ana', seq: 1, idx: 0 })).toBe(lobby);
  });
});

describe('close (host encerra)', () => {
  it('sem votação aberta não faz nada', () => {
    const lobby = room(['Ana']);
    expect(R(lobby, { type: 'close' })).toBe(lobby);
    const done = votes(started(['Ana']), { h: 0, ana: 0 });
    expect(R(done, { type: 'close' })).toBe(done);
  });

  it('sem nenhum voto: roleta entre todos', () => {
    const vals = [0.4, 0.2, 0.8];
    const s = R(started(['Ana']), { type: 'close' }, ctx({ rand: seqRand(vals) }));
    const plan = planSpin(2, seqRand(vals));
    expect(V(s).result).toEqual({
      counts: [0, 0],
      voters: [[], []],
      win: (plan.start + plan.total) % 2,
      tie: [0, 1],
      how: 'empate',
      spin: { id: expect.any(Number), among: [0, 1], start: plan.start, total: plan.total, at: NOW },
    });
    const trio = R(started(['Ana'], { mode: 'trio' }), { type: 'close' });
    expect(V(trio).result!.spin!.among).toEqual([0, 1, 2]);
  });

  it('com os votos que tem', () => {
    let s = vote(started(['Ana', 'Bia']), 'bia', 1);
    s = R(s, { type: 'close' });
    expect(V(s).result).toEqual({ counts: [0, 1], voters: [[], ['bia']], win: 1, tie: null, how: 'votos', spin: null });
    let t = votes(started(['Ana', 'Bia']), { h: 0, ana: 1 });
    t = R(t, { type: 'close' });
    expect(V(t).result).toMatchObject({ how: 'empate', tie: [0, 1] });
  });
});

describe('roleta do host', () => {
  it('sem cfg.roulette é ignorada', () => {
    const s = started(['Ana']);
    expect(R(s, { type: 'spin' })).toBe(s);
  });

  it('com cfg.roulette: entre todos os itens, mantendo os votos já dados', () => {
    const vals = [0.99, 0.5, 0.25];
    let s = started(['Ana', 'Bia'], { roulette: true });
    s = vote(s, 'ana', 1);
    s = R(s, { type: 'spin' }, ctx({ rand: seqRand(vals), now: 777 }));
    const plan = planSpin(2, seqRand(vals));
    expect(V(s).result).toEqual({
      counts: [0, 1],
      voters: [[], ['ana']],
      win: (plan.start + plan.total) % 2,
      tie: null,
      how: 'roleta',
      spin: { id: expect.any(Number), among: [0, 1], start: plan.start, total: plan.total, at: 777 },
    });
    // já decidido: nem roleta de novo nem voto
    expect(R(s, { type: 'spin' })).toBe(s);
    expect(vote(s, 'bia', 0)).toBe(s);
    const trio = R(started(['Ana'], { mode: 'trio', roulette: true }), { type: 'spin' });
    expect(V(trio).result!.spin!.among).toEqual([0, 1, 2]);
  });
});

describe('Duelo e Trio (rei do morro)', () => {
  it('quem ganha fica e a coroa sobe; o outro lado troca por alguém novo da mesma franquia', () => {
    let s = started(['Ana']);
    const champ = king(s).slots[0]!;
    for (let n = 1; n <= 6; n++) {
      const before = king(s).slots.map(e => e.name);
      const seq = V(s).seq;
      s = decide(s, 0);
      const g = king(s);
      expect(g.slots[0]).toEqual(champ);
      expect(g.streak).toEqual([n, 0]);
      expect(g.slots[1]!.fr).toBe('digimon');
      expect(before).not.toContain(g.slots[1]!.name);
      expect(V(s)).toEqual({ seq: expect.any(Number), items: g.slots, extras: [crown(n), ''], ballots: {}, result: null });
      expect(V(s).seq).toBeGreaterThan(seq);
    }
    expect(V(s).extras).toEqual(['♛ 6 vitórias', '']);
    const right = king(s).slots[1]!;
    s = decide(s, 1);
    expect(king(s).streak).toEqual([0, 1]);
    expect(king(s).slots[1]).toEqual(right);
    expect(king(s).slots[0]!.fr).toBe('pokemon');
    expect(king(s).slots[0]!.name).not.toBe(champ.name);
    expect(V(s).extras).toEqual(['', '♛ 1 vitória']);
  });

  it('mesma franquia dos dois lados: o desafiante nunca é quem está na tela', () => {
    let s = started(['Ana'], { duel: ['bakugan', 'bakugan'] });
    for (let n = 0; n < 30; n++) {
      const before = king(s).slots.map(e => e.name);
      const w = n % 3 ? 0 : 1;
      s = decide(s, w);
      const g = king(s);
      expect(g.slots.map(e => e.fr)).toEqual(['bakugan', 'bakugan']);
      expect(g.slots[w]!.name).toBe(before[w]);
      expect(before).not.toContain(g.slots[1 - w]!.name);
    }
  });

  it('Trio: o vencedor fica, os outros dois trocam (cada um na sua franquia)', () => {
    let s = started(['Ana'], { mode: 'trio' });
    for (let n = 1; n <= 4; n++) {
      const before = king(s).slots.map(e => e.name);
      s = decide(s, 2);
      const g = king(s);
      expect(g.streak).toEqual([0, 0, n]);
      expect(g.slots[2]!.name).toBe(before[2]);
      expect(g.slots.map(e => e.fr)).toEqual(['pokemon', 'digimon', 'smt']);
      expect(before).not.toContain(g.slots[0]!.name);
      expect(before).not.toContain(g.slots[1]!.name);
      expect(V(s).extras).toEqual(['', '', crown(n)]);
    }
    s = decide(s, 0);
    expect(king(s).streak).toEqual([1, 0, 0]);
    expect(V(s).extras).toEqual(['♛ 1 vitória', '', '']);
  });

  it('Trio com tudo da mesma franquia: os três sempre diferentes', () => {
    let s = started(['Ana'], { mode: 'trio', trio: ['bakugan', 'bakugan', 'bakugan'] });
    for (let n = 0; n < 20; n++) {
      s = decide(s, n % 3);
      expect(new Set(king(s).slots.map(e => e.name)).size).toBe(3);
    }
  });

  it('o resultado da roleta decide quem fica', () => {
    let s = started(['Ana']);
    s = votes(s, { h: 0, ana: 1 });
    const win = V(s).result!.win;
    const stay = king(s).slots[win]!;
    s = R(s, { type: 'next' });
    expect(king(s).slots[win]).toEqual(stay);
    expect(king(s).streak[win]).toBe(1);
  });

  it('next sem resultado é ignorado', () => {
    const s = vote(started(['Ana']), 'h', 0);
    expect(R(s, { type: 'next' })).toBe(s);
    const lobby = room(['Ana']);
    expect(R(lobby, { type: 'next' })).toBe(lobby);
  });

  it('next com a lista do desafiante sumida: avisa e espera', () => {
    const s = votes(started(['Ana']), { h: 0, ana: 0 });
    const t = R(s, { type: 'next' }, ctx({ lists: { ...LISTS, digimon: null } }));
    expect(t.notice).toBe('Lista de Digimon ainda não carregou.');
    expect(t.vote).toEqual(s.vote);
    expect(t.game).toEqual(s.game);
    const u = R(t, { type: 'next' });
    expect(u.notice).toBe('');
    expect(king(u).streak).toEqual([1, 0]);
  });
});

describe('Campeonato', () => {
  type CupView = Extract<GameView, { mode: 'cup' }>;
  const CUP = { size: 8, frs: ['pokemon', 'digimon', 'smt', 'jojo'], even: true };

  for (const mix of [true, false]) {
    it(`8 participantes até o campeão (${mix ? 'misto' : 'chave fixa'})`, () => {
      let s = started(['Ana'], { mode: 'cup', cup: { ...CUP, mix } });
      const first = cupOf(s);
      expect(first.round).toHaveLength(8);
      expect(first.mix).toBe(mix);
      expect(new Set(first.round.map(e => e.fr))).toEqual(new Set(CUP.frs));
      const titles: string[] = [];
      const counts: string[] = [];
      const winners: string[] = [];
      let n = 0;
      while (s.vote) {
        const g = viewFor(s, 'h', NOW).game as CupView;
        titles.push(g.title);
        counts.push(g.count);
        const pair = cupPair(cupOf(s))!;
        expect(V(s).items).toEqual(pair);
        expect(V(s).extras).toEqual(['', '']);
        winners.push(pair[n % 2]!.k!);
        s = decide(s, n % 2);
        n++;
        expect(n).toBeLessThan(10);
      }
      expect(n).toBe(7);
      expect(titles).toEqual(['Quartas de final', 'Quartas de final', 'Quartas de final', 'Quartas de final', 'Semifinal', 'Semifinal', 'Final']);
      expect(counts).toEqual([
        'confronto 1 de 4',
        'confronto 2 de 4',
        'confronto 3 de 4',
        'confronto 4 de 4',
        'confronto 1 de 2',
        'confronto 2 de 2',
        'confronto 1 de 1',
      ]);
      const c = cupOf(s);
      expect(s.phase).toBe('play');
      expect(c.champ!.k).toBe(winners[6]);
      expect(c.rounds.map(r => r.length)).toEqual([4, 2, 1]);
      const semis = c.rounds[1]!.flatMap(m => [m.a!.k, m.b!.k]);
      if (mix) expect([...semis].sort()).toEqual(winners.slice(0, 4).sort());
      else expect(semis).toEqual(winners.slice(0, 4));
      const end = viewFor(s, 'h', NOW);
      expect(end.vote).toBeNull();
      expect(end.game).toMatchObject({ mode: 'cup', title: 'Campeão', count: '' });
      expect(R(s, { type: 'next' })).toBe(s);
      expect(R(s, { type: 'close' })).toBe(s);
    });
  }

  it('a chave sobrevive à rede (JSON): same() reconhece pelo k', () => {
    let s = started(['Ana'], { mode: 'cup', cup: { ...CUP, mix: false } });
    s = decide(s, 0);
    const first = cupOf(s);
    const wire = JSON.parse(JSON.stringify(first)) as Cup;
    expect(same(wire.rounds[0]![0]!.w, wire.round[0])).toBe(true);
    expect(wire.round[0]!.k).toBe(first.round[0]!.k);
  });
});

describe('saco de sorteio da sala', () => {
  it('N sorteios seguidos numa lista de N são todos diferentes', () => {
    let s = started(['Ana']);
    const seen = [king(s).slots[1]!.name];
    const sizes = [s.bags.digimon!.length];
    for (let i = 0; i < 9; i++) {
      s = decide(s, 0);
      seen.push(king(s).slots[1]!.name);
      sizes.push(s.bags.digimon!.length);
    }
    expect(new Set(seen).size).toBe(10);
    expect(new Set(seen)).toEqual(new Set(LISTS.digimon!.map(x => x.name)));
    expect(sizes).toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
    const last = seen[9];
    s = decide(s, 0); // esvaziou: refaz o saco (e não traz de volta quem acabou de perder)
    expect(s.bags.digimon!.length).toBeGreaterThanOrEqual(8);
    expect(king(s).slots[1]!.name).not.toBe(last);
  });

  it('o saco começa embaralhado com tudo da franquia', () => {
    const s = started(['Ana']);
    const all = new Set([...s.bags.pokemon!, king(s).slots[0]!.name]);
    expect(all).toEqual(new Set(LISTS.pokemon!.map(x => x.name)));
  });

  it('nome que não existe mais na lista é ignorado', () => {
    let s = votes(started(['Ana']), { h: 0, ana: 0 });
    const onScreen = king(s).slots.map(e => e.name);
    const fresh = LISTS.digimon!.map(x => x.name).find(n => !onScreen.includes(n))!;
    s = { ...s, bags: { ...s.bags, digimon: [fresh, 'Fantasma'] } };
    s = R(s, { type: 'next' });
    expect(king(s).slots[1]!.name).toBe(fresh);
    expect(s.bags.digimon).toEqual([]);
  });

  it('continua de onde parou na partida seguinte', () => {
    let s = started(['Ana'], { duel: ['jojo', 'ygo'] });
    const seen = new Set(king(s).slots.map(e => e.name));
    s = R(s, { type: 'lobby' });
    s = R(s, { type: 'start' });
    for (const e of king(s).slots) expect(seen.has(e.name)).toBe(false);
  });

  it('não usa Math.random, Date.now nem o saco do jogador local (localStorage)', () => {
    const storage = installStorage();
    const mr = vi.spyOn(Math, 'random');
    const dn = vi.spyOn(Date, 'now');
    let s = started(['Ana', 'Bia'], { roulette: true });
    s = votes(s, { h: 0, ana: 1, bia: 0 });
    s = R(s, { type: 'next' });
    s = decide(s, 1);
    s = R(s, { type: 'spin' });
    s = R(s, { type: 'next' });
    s = R(s, { type: 'close' });
    s = R(s, { type: 'lobby' });
    s = R(s, { type: 'config', patch: { mode: 'cup', cup: { size: 8, frs: ['pokemon', 'smt'], even: false, mix: true } } });
    s = R(s, { type: 'start' });
    while (s.vote) s = R(R(s, { type: 'close' }), { type: 'next' });
    viewFor(s, 'ana', 5);
    expect(mr).not.toHaveBeenCalled();
    expect(dn).not.toHaveBeenCalled();
    expect(storage.length).toBe(0);
  });
});

describe('lobby', () => {
  it('volta ao lobby mantendo jogadores e configuração', () => {
    let s = votes(started(['Ana']), { h: 0 });
    s = R(s, { type: 'lobby' });
    expect(s.phase).toBe('lobby');
    expect(s.game).toBeNull();
    expect(s.vote).toBeNull();
    expect(s.notice).toBe('');
    expect(s.players.map(p => p.id)).toEqual(['h', 'ana']);
    const again = R(s, { type: 'lobby' });
    expect(again).toBe(s);
    // limpa aviso pendente
    const warned = R(room([]), { type: 'start' }, ctx({ lists: { ...LISTS, digimon: null } }));
    expect(warned.notice).not.toBe('');
    expect(R(warned, { type: 'lobby' }).notice).toBe('');
  });
});

describe('imutabilidade', () => {
  it('nenhuma ação muda o estado recebido', () => {
    let s = started(['Ana', 'Bia'], { roulette: true });
    s = vote(s, 'ana', 1);
    const snap = JSON.stringify(s);
    const actions: Action[] = [
      { type: 'join', id: 'carla', name: 'Carla' },
      { type: 'online', id: 'bia', online: false },
      { type: 'leave', id: 'bia' },
      { type: 'kick', id: 'ana' },
      { type: 'vote', id: 'h', seq: V(s).seq, idx: 0 },
      { type: 'close' },
      { type: 'spin' },
      { type: 'lobby' },
    ];
    for (const a of actions) {
      const t = reduce(s, a, ctx());
      expect(t).not.toBe(s);
      expect(JSON.stringify(s)).toBe(snap);
    }
    const closed = reduce(s, { type: 'close' }, ctx());
    const snap2 = JSON.stringify(closed);
    reduce(closed, { type: 'next' }, ctx());
    expect(JSON.stringify(closed)).toBe(snap2);
    const lobby = room(['Ana']);
    const snap3 = JSON.stringify(lobby);
    reduce(lobby, { type: 'config', patch: { secret: true } }, ctx());
    reduce(lobby, { type: 'start' }, ctx());
    expect(JSON.stringify(lobby)).toBe(snap3);
  });

  it('ação desconhecida devolve o mesmo estado', () => {
    const s = room(['Ana']);
    expect(R(s, { type: 'xyz' } as unknown as Action)).toBe(s);
  });
});
