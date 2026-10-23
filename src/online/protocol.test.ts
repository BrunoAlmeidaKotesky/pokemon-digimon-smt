import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from './room';
import { cleanName, MAX_NAME, parseClientMsg, parseHostMsg } from './protocol';
import type { RoomView } from './types';

const LONG = (n: number): string => 'x'.repeat(n);

/** valores que não são mensagem de jeito nenhum */
const JUNK: unknown[] = [null, undefined, 0, 42, NaN, '', 'hello', true, [], [{ t: 'ping' }], {}, () => 1, Symbol('t')];

function view(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    code: 'ABCD',
    me: 'p1',
    hostId: 'h1',
    phase: 'lobby',
    cfg: structuredClone(DEFAULT_CONFIG),
    notice: '',
    players: [
      { id: 'h1', name: 'Host', host: true, online: true, voted: false },
      { id: 'p1', name: 'Ana', host: false, online: true, voted: true },
    ],
    game: null,
    vote: null,
    ...over,
  };
}

describe('parseClientMsg', () => {
  it('aceita as mensagens válidas', () => {
    expect(parseClientMsg({ t: 'hello', id: 'abc', name: 'Ana' })).toEqual({ t: 'hello', id: 'abc', name: 'Ana' });
    expect(parseClientMsg({ t: 'hello', id: '', name: '' })).toEqual({ t: 'hello', id: '', name: '' });
    expect(parseClientMsg({ t: 'vote', seq: 3, idx: 0 })).toEqual({ t: 'vote', seq: 3, idx: 0 });
    expect(parseClientMsg({ t: 'leave' })).toEqual({ t: 'leave' });
    expect(parseClientMsg({ t: 'ping' })).toEqual({ t: 'ping' });
  });

  it('devolve só os campos conhecidos', () => {
    expect(parseClientMsg({ t: 'vote', seq: 1, idx: 2, extra: 'x', __proto__x: 1 })).toEqual({ t: 'vote', seq: 1, idx: 2 });
    expect(parseClientMsg({ t: 'ping', huge: LONG(10000) })).toEqual({ t: 'ping' });
  });

  it('recusa o que não é objeto', () => {
    for (const j of JUNK) expect(parseClientMsg(j)).toBeNull();
  });

  it('recusa tipo desconhecido ou ausente', () => {
    expect(parseClientMsg({ t: 'welcome', id: 'x' })).toBeNull();
    expect(parseClientMsg({ t: 'HELLO', id: 'x', name: 'y' })).toBeNull();
    expect(parseClientMsg({ id: 'x', name: 'y' })).toBeNull();
    expect(parseClientMsg({ t: 1 })).toBeNull();
  });

  it('hello: campos faltando, tipos errados e strings enormes', () => {
    expect(parseClientMsg({ t: 'hello', id: 'x' })).toBeNull();
    expect(parseClientMsg({ t: 'hello', name: 'y' })).toBeNull();
    expect(parseClientMsg({ t: 'hello', id: 1, name: 'y' })).toBeNull();
    expect(parseClientMsg({ t: 'hello', id: 'x', name: null })).toBeNull();
    expect(parseClientMsg({ t: 'hello', id: 'x', name: ['y'] })).toBeNull();
    expect(parseClientMsg({ t: 'hello', id: LONG(65), name: 'y' })).toBeNull();
    expect(parseClientMsg({ t: 'hello', id: LONG(64), name: 'y' })).not.toBeNull();
    expect(parseClientMsg({ t: 'hello', id: 'x', name: LONG(41) })).toBeNull();
    expect(parseClientMsg({ t: 'hello', id: 'x', name: LONG(40) })).not.toBeNull();
    expect(parseClientMsg({ t: 'hello', id: 'x', name: LONG(1_000_000) })).toBeNull();
  });

  it('vote: números negativos, NaN, infinitos, quebrados, como texto ou faltando', () => {
    const bad: unknown[] = [-1, -0.5, 1.5, NaN, Infinity, -Infinity, '1', null, undefined, true, [1], 2 ** 60];
    for (const b of bad) {
      expect(parseClientMsg({ t: 'vote', seq: b, idx: 0 })).toBeNull();
      expect(parseClientMsg({ t: 'vote', seq: 0, idx: b })).toBeNull();
    }
    expect(parseClientMsg({ t: 'vote', seq: 1 })).toBeNull();
    expect(parseClientMsg({ t: 'vote', idx: 1 })).toBeNull();
  });

  it('pick (Draft): rodada, passada e índice inteiros >= 0; só os campos conhecidos', () => {
    expect(parseClientMsg({ t: 'pick', round: 1, att: 0, idx: 2 })).toEqual({ t: 'pick', round: 1, att: 0, idx: 2 });
    expect(parseClientMsg({ t: 'pick', round: 3, att: 7, idx: 0, id: 'outro', extra: 1 })).toEqual({ t: 'pick', round: 3, att: 7, idx: 0 });
    const bad: unknown[] = [-1, -0.5, 1.5, NaN, Infinity, -Infinity, '1', null, undefined, true, [1], 2 ** 60];
    for (const b of bad) {
      expect(parseClientMsg({ t: 'pick', round: b, att: 0, idx: 0 })).toBeNull();
      expect(parseClientMsg({ t: 'pick', round: 1, att: b, idx: 0 })).toBeNull();
      expect(parseClientMsg({ t: 'pick', round: 1, att: 0, idx: b })).toBeNull();
    }
    expect(parseClientMsg({ t: 'pick', att: 0, idx: 0 })).toBeNull();
    expect(parseClientMsg({ t: 'pick', round: 1, idx: 0 })).toBeNull();
    expect(parseClientMsg({ t: 'pick', round: 1, att: 0 })).toBeNull();
    // o host não aceita "skip" de quem não é host: nem existe como mensagem
    expect(parseClientMsg({ t: 'skip' })).toBeNull();
  });

  it('nunca lança, nem com getter que explode', () => {
    const evil = {
      get t(): string {
        throw new Error('bum');
      },
    };
    expect(() => parseClientMsg(evil)).not.toThrow();
    expect(parseClientMsg(evil)).toBeNull();
    const evilName = {
      t: 'hello',
      id: 'x',
      get name(): string {
        throw new Error('bum');
      },
    };
    expect(parseClientMsg(evilName)).toBeNull();
    expect(parseClientMsg(new Proxy({}, { get: () => { throw new Error('bum'); } }))).toBeNull();
  });
});

describe('parseHostMsg', () => {
  it('aceita as mensagens válidas', () => {
    expect(parseHostMsg({ t: 'welcome', id: 'p1' })).toEqual({ t: 'welcome', id: 'p1' });
    expect(parseHostMsg({ t: 'reject', reason: 'Sala cheia' })).toEqual({ t: 'reject', reason: 'Sala cheia' });
    expect(parseHostMsg({ t: 'kicked' })).toEqual({ t: 'kicked' });
    expect(parseHostMsg({ t: 'closed' })).toEqual({ t: 'closed' });
    expect(parseHostMsg({ t: 'ping' })).toEqual({ t: 'ping' });
  });

  it('state: a visão volta como veio', () => {
    const v = view();
    const m = parseHostMsg({ t: 'state', view: v });
    expect(m).toEqual({ t: 'state', view: v });
    expect(m && m.t === 'state' ? m.view : null).toBe(v);
  });

  it('state: visão em jogo, com game e vote preenchidos', () => {
    const v = view({
      phase: 'play',
      game: { mode: 'duel', frs: ['pokemon', 'digimon'], streak: [1, 0] },
      vote: { seq: 2, items: [{ name: 'A', img: '', fr: 'pokemon' }], extras: [''], mine: null, result: null },
      notice: 'Lista de JoJo ainda não carregou',
    });
    const m = parseHostMsg({ t: 'state', view: v });
    expect(m?.t).toBe('state');
    expect((m as { view: RoomView }).view).toBe(v);
  });

  it('recusa o que não é objeto', () => {
    for (const j of JUNK) expect(parseHostMsg(j)).toBeNull();
  });

  it('replaced', () => {
    expect(parseHostMsg({ t: 'replaced' })).toEqual({ t: 'replaced' });
  });

  it('state: recusa visão que derrubaria a tela (jogo ou votação tortos, configuração incompleta)', () => {
    const entry = { name: 'A', img: '', fr: 'pokemon' };
    const vote = { seq: 2, items: [entry, entry], extras: ['', ''], mine: null, result: null };
    const bad: Record<string, unknown>[] = [
      { phase: 'play', game: { mode: 'cup' } },
      { phase: 'play', game: { mode: 'quiz', frs: [] } },
      { phase: 'play', game: { mode: 'duel', frs: ['pokemon'], streak: ['1'] } },
      { phase: 'play', game: { mode: 'draft', frs: [] } },
      { phase: 'play', vote: { ...vote, items: [1] } },
      { phase: 'play', vote: { ...vote, mine: 5 } },
      { phase: 'play', vote: { ...vote, result: { counts: [1, 0], voters: null, win: 9, tie: null, how: 'votos', spin: null } } },
      { phase: 'play', vote: { ...vote, result: { counts: [1], voters: null, win: 0, tie: null, how: 'votos', spin: null } } },
      { phase: 'play', vote: { ...vote, result: { counts: [1, 1], voters: null, win: 0, tie: [0, 1], how: 'empate', spin: { id: 1, among: [], start: 0, total: 6, age: 0 } } } },
      { cfg: { mode: 'duel', secret: false } },
    ];
    for (const over of bad) expect(parseHostMsg({ t: 'state', view: view(over) }), JSON.stringify(over)).toBeNull();
    const ok = { ...vote, result: { counts: [1, 1], voters: [['Ana'], ['Beto']], win: 1, tie: [0, 1], how: 'empate', spin: { id: 3, among: [0, 1], start: 1, total: 7, at: 5, age: 12 } } };
    expect(parseHostMsg({ t: 'state', view: view({ phase: 'play', game: { mode: 'duel', frs: ['pokemon', 'digimon'], streak: [0, 0] }, vote: ok }) })).not.toBeNull();
  });

  it('recusa tipo desconhecido, campos faltando e strings enormes', () => {
    expect(parseHostMsg({ t: 'hello', id: 'x', name: 'y' })).toBeNull();
    expect(parseHostMsg({ t: 'welcome' })).toBeNull();
    expect(parseHostMsg({ t: 'welcome', id: 7 })).toBeNull();
    expect(parseHostMsg({ t: 'welcome', id: LONG(65) })).toBeNull();
    expect(parseHostMsg({ t: 'reject' })).toBeNull();
    expect(parseHostMsg({ t: 'reject', reason: { msg: 'x' } })).toBeNull();
    expect(parseHostMsg({ t: 'reject', reason: LONG(201) })).toBeNull();
    expect(parseHostMsg({ t: 'reject', reason: LONG(200) })).not.toBeNull();
    expect(parseHostMsg({ t: 'state' })).toBeNull();
  });

  it('state com visão torta', () => {
    const bad: Record<string, unknown>[] = [
      { code: undefined },
      { code: 12 },
      { code: LONG(65) },
      { me: null },
      { hostId: ['h1'] },
      { phase: 'fim' },
      { phase: undefined },
      { notice: 3 },
      { notice: undefined },
      { players: null },
      { players: {} },
      { players: [null] },
      { players: ['Ana'] },
      { players: [{ id: 'a', name: 'A', host: false, online: true }] },
      { players: [{ id: 'a', name: 'A', host: 'não', online: true, voted: false }] },
      { players: [{ id: 'a', name: 7, host: false, online: true, voted: false }] },
      { players: [{ id: 'a', name: LONG(41), host: false, online: true, voted: false }] },
      { players: [{ id: LONG(65), name: 'A', host: false, online: true, voted: false }] },
      { cfg: null },
      { cfg: [] },
      { cfg: 'duel' },
      { cfg: undefined },
      { game: undefined },
      { game: 'duel' },
      { game: [] },
      { vote: undefined },
      { vote: {} },
      { vote: { items: 'a,b' } },
      { vote: { items: null } },
      { vote: [] },
    ];
    for (const over of bad) expect(parseHostMsg({ t: 'state', view: view(over) }), JSON.stringify(over)).toBeNull();
    for (const j of JUNK) expect(parseHostMsg({ t: 'state', view: j })).toBeNull();
  });

  it('nunca lança, nem com visão que explode', () => {
    const v = view();
    Object.defineProperty(v, 'players', {
      get() {
        throw new Error('bum');
      },
    });
    expect(() => parseHostMsg({ t: 'state', view: v })).not.toThrow();
    expect(parseHostMsg({ t: 'state', view: v })).toBeNull();
  });
});

describe('cleanName', () => {
  it('tira espaço das pontas e junta espaços repetidos', () => {
    expect(cleanName('  Ana   Bia  ')).toBe('Ana Bia');
    expect(cleanName('Ana\t\n\r Bia')).toBe('Ana Bia');
    expect(cleanName('Ana 　Bia')).toBe('Ana Bia');
  });

  it('tira caracteres de controle e de direção de texto', () => {
    expect(cleanName('A\u0000n\u0007a\u001b\u007f\u0085')).toBe('Ana');
    expect(cleanName('Ana‮aiB')).toBe('AnaaiB');
    expect(cleanName('‎Bia⁦')).toBe('Bia');
  });

  it(`corta em ${MAX_NAME} caracteres`, () => {
    expect(MAX_NAME).toBe(16);
    expect(cleanName('abcdefghijklmnopqrstuvwxyz')).toBe('abcdefghijklmnop');
    expect(cleanName('a'.repeat(16))).toHaveLength(16);
    // o corte não deixa espaço sobrando no fim
    expect(cleanName('abcdefghijklmno pqrs')).toBe('abcdefghijklmno');
  });

  it('não parte emoji no meio', () => {
    const s = cleanName('😀'.repeat(20));
    expect(Array.from(s)).toHaveLength(16);
    expect(s).toBe('😀'.repeat(16));
  });

  it('só espaço ou controle vira vazio', () => {
    expect(cleanName('')).toBe('');
    expect(cleanName('   \t\n ')).toBe('');
    expect(cleanName('\u0000\u0001')).toBe('');
  });

  it('mantém acentos e pontuação', () => {
    expect(cleanName('João  Ção!')).toBe('João Ção!');
  });
});
