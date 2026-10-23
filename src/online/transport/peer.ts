// Transporte de verdade: WebRTC pelo PeerJS (servidor de convites público do PeerJS + STUN/TURN).
// O PeerJS é carregado sob demanda (import dinâmico), pra não pesar no modo solo.
import type { DataConnection, Peer } from 'peerjs';
import { iceServers, JOIN_TIMEOUT_MS, PEER_PREFIX } from '../config';
import { TransportError, type HostEndpoint, type Link, type Transport, type TransportErrorKind } from '../types';
import { createLink, linkQueue } from './link';

/** tempo pra marca de fechamento chegar ao outro lado antes de derrubar a conexão de vez */
const LINGER_MS = 1000;
/** espera entre tentativas de voltar ao servidor de convites (dobra a cada falha) */
const RECONNECT_MIN_MS = 1000;
const RECONNECT_MAX_MS = 30000;

type Timer = ReturnType<typeof setTimeout>;

/** Traduz o `type` de um erro do PeerJS. `opened`: já tinha falado com o servidor de convites. */
export function peerErrorKind(type: string, opened: boolean): TransportErrorKind {
  switch (type) {
    case 'unavailable-id':
      return 'codigo-em-uso';
    case 'peer-unavailable':
      return 'sala-nao-existe';
    case 'browser-incompatible':
      return 'navegador';
    case 'network':
    case 'server-error':
    case 'socket-error':
    case 'socket-closed':
    case 'ssl-unavailable':
    case 'invalid-key':
    case 'disconnected':
      return 'rede';
    default:
      // 'webrtc', 'negotiation-failed', 'connection-closed'...: o servidor respondeu, mas a conexão direta não abriu
      return opened ? 'p2p-bloqueado' : 'rede';
  }
}

async function loadPeer(): Promise<typeof Peer> {
  try {
    return (await import('peerjs')).Peer;
  } catch (e) {
    throw new TransportError('rede', `não deu pra carregar o PeerJS: ${String(e)}`);
  }
}

function newPeer(PeerClass: typeof Peer, id: string | null): Peer {
  const options = { config: { iceServers: iceServers() } };
  try {
    return id === null ? new PeerClass(options) : new PeerClass(id, options);
  } catch (e) {
    throw new TransportError('navegador', String(e));
  }
}

/** Link sobre uma DataConnection já aberta. `after` roda quando ela termina (o convidado destrói o próprio Peer). */
function wrapConn(conn: DataConnection, after?: () => void): Link {
  let done = false;
  let linger: Timer | undefined;
  const teardown = (): void => {
    if (done) return;
    done = true;
    clearTimeout(linger);
    conn.close();
    after?.();
  };
  const core = createLink({
    send(msg) {
      const r = conn.send(msg);
      if (r instanceof Promise) r.catch((e: unknown) => console.warn('[online] falha ao enviar mensagem', e));
    },
    close() {
      // marca de fechamento do PeerJS: chega depois do que já foi enviado e faz o outro lado fechar
      conn.close({ flush: true });
      linger = setTimeout(teardown, LINGER_MS);
    },
  });
  const gone = (): void => {
    core.end();
    teardown();
  };
  conn.on('data', (d) => core.deliver(d));
  conn.on('close', gone);
  conn.on('error', gone);
  conn.on('iceStateChanged', (s) => {
    if (s === 'failed' || s === 'closed') gone();
  });
  return core.link;
}

async function host(code: string): Promise<HostEndpoint> {
  const peer = newPeer(await loadPeer(), PEER_PREFIX + code);
  return new Promise<HostEndpoint>((resolve, reject) => {
    let opened = false;
    let closed = false;
    let ok = true;
    let retry: Timer | undefined;
    let delay = RECONNECT_MIN_MS;
    const links = new Set<Link>();
    const queue = linkQueue();
    const troubleCbs: ((ok: boolean) => void)[] = [];

    const timer = setTimeout(() => fail('rede', 'o servidor de convites não respondeu'), JOIN_TIMEOUT_MS);

    function fail(kind: TransportErrorKind, message?: string): void {
      if (opened || closed) return;
      closed = true;
      clearTimeout(timer);
      peer.destroy();
      reject(new TransportError(kind, message));
    }

    function setOk(v: boolean): void {
      if (ok === v) return;
      ok = v;
      for (const cb of [...troubleCbs]) cb(v);
    }

    /** Volta ao servidor de convites com o mesmo id; se não abrir, derruba e tenta de novo mais tarde. */
    function attempt(): void {
      if (closed || peer.destroyed || peer.open) return;
      if (peer.disconnected) {
        try {
          peer.reconnect();
        } catch {
          return;
        }
      }
      retry = setTimeout(() => {
        if (closed || peer.destroyed || peer.open) return;
        if (peer.disconnected) schedule();
        else peer.disconnect(); // emite 'disconnected', que agenda a próxima
      }, JOIN_TIMEOUT_MS);
    }

    function schedule(): void {
      clearTimeout(retry);
      retry = setTimeout(attempt, delay);
      delay = Math.min(delay * 2, RECONNECT_MAX_MS);
    }

    const endpoint: HostEndpoint = {
      code,
      onLink: (cb) => queue.listen(cb),
      onTrouble: (cb) => {
        troubleCbs.push(cb);
      },
      close() {
        if (closed) return;
        closed = true;
        clearTimeout(timer);
        clearTimeout(retry);
        for (const l of [...links]) l.close();
        links.clear();
        try {
          peer.disconnect(); // libera o código no servidor já; as conexões ainda mandam a marca de fechamento
        } catch {
          /* já desconectado */
        }
        setTimeout(() => peer.destroy(), LINGER_MS);
      },
    };

    peer.on('error', (e) => {
      if (!opened) fail(peerErrorKind(e.type, false), e.message);
      // depois de aberto: queda do servidor também chega como 'disconnected' (tratada lá); o resto não derruba a sala
    });

    peer.on('open', () => {
      if (closed) return;
      if (!opened) {
        opened = true;
        clearTimeout(timer);
        resolve(endpoint);
        return;
      }
      clearTimeout(retry);
      delay = RECONNECT_MIN_MS;
      setOk(true);
    });

    peer.on('disconnected', () => {
      if (!opened || closed) return;
      setOk(false);
      schedule();
    });

    peer.on('connection', (conn) => {
      if (closed) {
        conn.close();
        return;
      }
      const wait = setTimeout(() => {
        if (!conn.open) conn.close();
      }, JOIN_TIMEOUT_MS);
      const accept = (): void => {
        clearTimeout(wait);
        if (closed) {
          conn.close();
          return;
        }
        const link = wrapConn(conn);
        links.add(link);
        link.onClose(() => links.delete(link));
        queue.push(link);
      };
      if (conn.open) accept();
      else conn.once('open', accept);
    });
  });
}

async function join(code: string): Promise<Link> {
  const peer = newPeer(await loadPeer(), null);
  return new Promise<Link>((resolve, reject) => {
    let opened = false;
    let settled = false;

    const timer = setTimeout(
      () => fail(opened ? 'p2p-bloqueado' : 'rede', opened ? 'a conexão direta não abriu' : 'o servidor de convites não respondeu'),
      JOIN_TIMEOUT_MS,
    );

    function fail(kind: TransportErrorKind, message?: string): void {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      peer.destroy();
      reject(new TransportError(kind, message));
    }

    peer.on('error', (e) => {
      if (!settled) fail(peerErrorKind(e.type, opened), e.message);
    });

    peer.on('open', () => {
      if (settled || opened) return;
      opened = true;
      const conn = peer.connect(PEER_PREFIX + code, { reliable: true }) as DataConnection | undefined;
      if (!conn) {
        fail('rede', 'sem conexão com o servidor de convites');
        return;
      }
      conn.on('error', (e) => {
        if (!settled) fail(peerErrorKind(e.type, true), e.message);
      });
      conn.on('iceStateChanged', (s) => {
        if (!settled && (s === 'failed' || s === 'closed')) fail('p2p-bloqueado', `ICE ${s}`);
      });
      conn.once('open', () => {
        if (settled) {
          conn.close();
          return;
        }
        settled = true;
        clearTimeout(timer);
        resolve(wrapConn(conn, () => peer.destroy()));
      });
    });
  });
}

export const peerTransport: Transport = { name: 'peerjs', host, join };
