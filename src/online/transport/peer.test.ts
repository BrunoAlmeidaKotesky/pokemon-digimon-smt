import { describe, expect, it } from 'vitest';
import { peerErrorKind, peerTransport } from './peer';

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
