import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransportError } from '../types';
import { joinParaTeste, peerErrorKind, peerTransport } from './peer';

// PeerJS falso: cada Peer abre no servidor de convites e a conexão segue o roteiro (falha no ICE, abre, ou a sala sumiu).
const estado = vi.hoisted(() => ({ roteiro: [] as ('falha' | 'abre' | 'sumiu')[], criados: 0, destruidos: 0 }));
vi.mock('peerjs', () => {
  class Emissor {
    private h: Record<string, ((...a: unknown[]) => void)[]> = {};
    on(ev: string, cb: (...a: unknown[]) => void) { (this.h[ev] ??= []).push(cb); return this; }
    once(ev: string, cb: (...a: unknown[]) => void) { return this.on(ev, cb); }
    emit(ev: string, ...a: unknown[]) { for (const cb of this.h[ev] ?? []) cb(...a); }
  }
  class Conexao extends Emissor { open = false; send() {} close() {} }
  class Peer extends Emissor {
    destroyed = false;
    constructor() { super(); estado.criados++; queueMicrotask(() => this.emit('open')); }
    destroy() { this.destroyed = true; estado.destruidos++; }
    connect() {
      const c = new Conexao();
      const passo = estado.roteiro.shift() ?? 'falha';
      queueMicrotask(() => {
        if (passo === 'abre') { c.open = true; c.emit('open'); }
        else if (passo === 'sumiu') this.emit('error', { type: 'peer-unavailable', message: 'sem sala' });
        else c.emit('iceStateChanged', 'failed');
      });
      return c;
    }
  }
  return { Peer };
});

beforeEach(() => { estado.roteiro = []; estado.criados = 0; estado.destruidos = 0; });

describe('peerErrorKind', () => {
  it('código já usado', () => {
    expect(peerErrorKind('unavailable-id', false)).toBe('codigo-em-uso');
  });

  it('sala que não existe', () => {
    expect(peerErrorKind('peer-unavailable', false)).toBe('sala-nao-existe');
    expect(peerErrorKind('peer-unavailable', true)).toBe('sala-nao-existe');
  });

  it('navegador sem WebRTC', () => {
    expect(peerErrorKind('browser-incompatible', false)).toBe('navegador');
  });

  it('servidor de convites fora do ar ou sem rede', () => {
    for (const t of ['network', 'server-error', 'socket-error', 'socket-closed', 'ssl-unavailable', 'invalid-key', 'disconnected']) {
      expect(peerErrorKind(t, false), t).toBe('rede');
      expect(peerErrorKind(t, true), t).toBe('rede');
    }
  });

  it('erro de WebRTC: P2P bloqueado se o servidor respondeu, rede se não', () => {
    for (const t of ['webrtc', 'negotiation-failed', 'connection-closed', 'qualquer-outro']) {
      expect(peerErrorKind(t, true), t).toBe('p2p-bloqueado');
      expect(peerErrorKind(t, false), t).toBe('rede');
    }
  });
});

describe('peerTransport', () => {
  it('nome', () => {
    expect(peerTransport.name).toBe('peerjs');
  });
});

describe('entrar na sala com nova tentativa', () => {
  it('a conexão direta falha duas vezes e abre na terceira, com um Peer novo a cada vez', async () => {
    estado.roteiro = ['falha', 'falha', 'abre'];
    const link = await joinParaTeste('ABCD', 3, 0);
    expect(link).toBeTruthy();
    expect(estado.criados).toBe(3);
    expect(estado.destruidos).toBe(2);
  });

  it('desiste depois das tentativas, com o erro de conexão direta', async () => {
    estado.roteiro = ['falha', 'falha', 'falha'];
    const e = await joinParaTeste('ABCD', 3, 0).catch((x: unknown) => x);
    expect(e).toBeInstanceOf(TransportError);
    expect((e as TransportError).kind).toBe('p2p-bloqueado');
    expect(estado.criados).toBe(3);
  });

  it('sala que não existe não repete', async () => {
    estado.roteiro = ['sumiu'];
    const e = await joinParaTeste('ABCD', 3, 0).catch((x: unknown) => x);
    expect((e as TransportError).kind).toBe('sala-nao-existe');
    expect(estado.criados).toBe(1);
  });
});
