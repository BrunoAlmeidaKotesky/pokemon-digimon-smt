import { afterEach, describe, expect, it, vi } from 'vitest';
import { installStorage } from '../core/test-helpers';
import {
  iceServers,
  isValidTurn,
  JOIN_TIMEOUT_MS,
  loadTurn,
  PEER_PREFIX,
  PEERJS_DEFAULT_ICE,
  saveTurn,
  TURN_KEY,
  TURN_SERVERS,
} from './config';

afterEach(() => vi.unstubAllGlobals());

const TURN = { urls: 'turn:relay.exemplo.com:3478', username: 'ana', credential: 'segredo' };

describe('constantes', () => {
  it('valores combinados', () => {
    expect(PEER_PREFIX).toBe('qvp-sala-');
    expect(JOIN_TIMEOUT_MS).toBe(15000);
    expect(TURN_KEY).toBe('pdx-turn');
    expect(TURN_SERVERS).toEqual([]);
  });

  it('padrão do PeerJS 1.5.5', () => {
    expect(PEERJS_DEFAULT_ICE).toEqual([
      { urls: 'stun:stun.l.google.com:19302' },
      {
        urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'],
        username: 'peerjs',
        credential: 'peerjsp',
      },
    ]);
  });
});

describe('iceServers', () => {
  it('sem TURN guardado: só o padrão', () => {
    installStorage();
    expect(iceServers()).toEqual([...PEERJS_DEFAULT_ICE, ...TURN_SERVERS]);
  });

  it('com TURN guardado: vai no fim', () => {
    installStorage({ [TURN_KEY]: JSON.stringify(TURN) });
    const s = iceServers();
    expect(s).toHaveLength(PEERJS_DEFAULT_ICE.length + TURN_SERVERS.length + 1);
    expect(s.slice(0, PEERJS_DEFAULT_ICE.length)).toEqual(PEERJS_DEFAULT_ICE);
    expect(s.at(-1)).toEqual(TURN);
  });

  it('sem localStorage: só o padrão', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(iceServers()).toEqual(PEERJS_DEFAULT_ICE);
  });

  it('devolve cópias (mexer no resultado não muda o padrão)', () => {
    installStorage();
    const s = iceServers();
    (s[1]?.urls as string[]).push('turn:x');
    s.pop();
    expect(iceServers()).toEqual(PEERJS_DEFAULT_ICE);
    expect(PEERJS_DEFAULT_ICE[1]?.urls).toHaveLength(2);
  });
});

describe('loadTurn / saveTurn', () => {
  it('ida e volta', () => {
    const st = installStorage();
    saveTurn({ ...TURN, urls: `  ${TURN.urls} ` });
    expect(JSON.parse(st.getItem(TURN_KEY) as string)).toEqual(TURN);
    expect(loadTurn()).toEqual(TURN);
    saveTurn(null);
    expect(st.getItem(TURN_KEY)).toBeNull();
    expect(loadTurn()).toBeNull();
  });

  it('turns: e parâmetros na URL', () => {
    installStorage();
    const t = { urls: 'turns:relay.exemplo.com:443?transport=tcp', username: 'u', credential: 'c' };
    saveTurn(t);
    expect(loadTurn()).toEqual(t);
  });

  it('várias URLs separadas por vírgula viram lista', () => {
    installStorage();
    saveTurn({ urls: 'turn:a.exemplo.com:3478, turns:a.exemplo.com:443?transport=tcp', username: 'u', credential: 'c' });
    expect(loadTurn()).toEqual({
      urls: ['turn:a.exemplo.com:3478', 'turns:a.exemplo.com:443?transport=tcp'],
      username: 'u',
      credential: 'c',
    });
    saveTurn({ urls: 'turn:a.exemplo.com, http://x', username: 'u', credential: 'c' });
    expect(loadTurn()).toBeNull();
  });

  it('STUN guardado vira só urls', () => {
    installStorage({ [TURN_KEY]: JSON.stringify({ urls: 'stun:stun.exemplo.com:3478', username: '', credential: '' }) });
    expect(loadTurn()).toEqual({ urls: 'stun:stun.exemplo.com:3478' });
  });

  it('guardado inválido -> null', () => {
    const casos = [
      '{quebrado',
      'null',
      '"turn:x"',
      '[]',
      JSON.stringify({ ...TURN, urls: 'http://relay.exemplo.com' }),
      JSON.stringify({ ...TURN, urls: 'turn:' }),
      JSON.stringify({ ...TURN, urls: 'turn:a b' }),
      JSON.stringify({ ...TURN, urls: ['turn:x'] }),
      JSON.stringify({ ...TURN, username: '' }),
      JSON.stringify({ ...TURN, credential: undefined }),
      JSON.stringify({ ...TURN, credential: 5 }),
      JSON.stringify({ ...TURN, username: 'x'.repeat(501) }),
    ];
    for (const raw of casos) {
      installStorage({ [TURN_KEY]: raw });
      expect(loadTurn(), raw).toBeNull();
      expect(iceServers(), raw).toEqual(PEERJS_DEFAULT_ICE);
    }
  });

  it('localStorage que lança ou não existe: não quebra', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('negado');
      },
      setItem: () => {
        throw new Error('cheio');
      },
      removeItem: () => {
        throw new Error('negado');
      },
    });
    expect(loadTurn()).toBeNull();
    expect(() => saveTurn(TURN)).not.toThrow();
    expect(() => saveTurn(null)).not.toThrow();
    vi.stubGlobal('localStorage', undefined);
    expect(loadTurn()).toBeNull();
    expect(() => saveTurn(TURN)).not.toThrow();
  });

  it('isValidTurn', () => {
    expect(isValidTurn(TURN)).toBe(true);
    expect(isValidTurn({ urls: 'STUN:stun.exemplo.com', username: '', credential: '' })).toBe(true);
    expect(isValidTurn({ urls: 'turn:x', username: 'u', credential: '' })).toBe(false);
    expect(isValidTurn(null)).toBe(false);
    expect(isValidTurn('turn:x')).toBe(false);
  });
});
