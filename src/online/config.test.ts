import { afterEach, describe, expect, it, vi } from 'vitest';
import { installStorage } from '../core/test-helpers';
import {
  iceServers,
  isValidTurn,
  JOIN_TENTATIVAS,
  JOIN_TIMEOUT_MS,
  loadTurn,
  PEER_PREFIX,
  ICE_PADRAO,
  saveTurn,
  TURN_KEY,
  TURN_SERVERS,
  turnDoAmbiente,
} from './config';

afterEach(() => vi.unstubAllGlobals());

const TURN = { urls: 'turn:relay.exemplo.com:3478', username: 'ana', credential: 'segredo' };

describe('constantes', () => {
  it('valores combinados', () => {
    expect(PEER_PREFIX).toBe('qvp-sala-');
    expect(JOIN_TIMEOUT_MS).toBe(15000);
    expect(JOIN_TENTATIVAS).toBe(3);
    expect(TURN_KEY).toBe('pdx-turn');
    // o TURN vem das variáveis do build (secrets no GitHub, .env.local no PC), nunca do código
    expect(TURN_SERVERS.length).toBeLessThanOrEqual(1);
  });

  it('STUN de quatro empresas e nenhum TURN morto (o do PeerJS não existe mais)', () => {
    const urls = ICE_PADRAO.flatMap(s => (Array.isArray(s.urls) ? s.urls : [s.urls]));
    expect(urls).toEqual(['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun.cloudflare.com:3478', 'stun:global.stun.twilio.com:3478']);
    expect(urls.some(u => u.includes('peerjs.com'))).toBe(false);
  });
});

describe('turnDoAmbiente (TURN fora do repositório)', () => {
  const ok = { VITE_TURN_URLS: 'turn:relay.exemplo.com:3478, turn:relay.exemplo.com:3478?transport=tcp', VITE_TURN_USERNAME: 'u', VITE_TURN_CREDENTIAL: 's' };
  it('monta o servidor com as URLs separadas por vírgula', () => {
    expect(turnDoAmbiente(ok)).toEqual([{ urls: ['turn:relay.exemplo.com:3478', 'turn:relay.exemplo.com:3478?transport=tcp'], username: 'u', credential: 's' }]);
  });
  it('sem alguma variável ou com URL estranha: nenhum (o navegador recusaria a configuração inteira)', () => {
    expect(turnDoAmbiente({})).toEqual([]);
    expect(turnDoAmbiente({ ...ok, VITE_TURN_CREDENTIAL: '' })).toEqual([]);
    expect(turnDoAmbiente({ ...ok, VITE_TURN_USERNAME: undefined })).toEqual([]);
    expect(turnDoAmbiente({ ...ok, VITE_TURN_URLS: 'http://x' })).toEqual([]);
  });
});

describe('iceServers', () => {
  it('sem TURN guardado: só o padrão', () => {
    installStorage();
    expect(iceServers()).toEqual([...ICE_PADRAO, ...TURN_SERVERS]);
  });

  it('com TURN guardado: vai no fim', () => {
    installStorage({ [TURN_KEY]: JSON.stringify(TURN) });
    const s = iceServers();
    expect(s).toHaveLength(ICE_PADRAO.length + TURN_SERVERS.length + 1);
    expect(s.slice(0, ICE_PADRAO.length)).toEqual(ICE_PADRAO);
    expect(s.at(-1)).toEqual(TURN);
  });

  it('sem localStorage: só o padrão', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(iceServers()).toEqual([...ICE_PADRAO, ...TURN_SERVERS]);
  });

  it('devolve cópias (mexer no resultado não muda o padrão)', () => {
    installStorage();
    const s = iceServers();
    (s[0]?.urls as string[]).push('turn:x');
    s.pop();
    expect(iceServers()).toEqual([...ICE_PADRAO, ...TURN_SERVERS]);
    expect(ICE_PADRAO[0]?.urls).toHaveLength(2);
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
      expect(iceServers(), raw).toEqual([...ICE_PADRAO, ...TURN_SERVERS]);
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
