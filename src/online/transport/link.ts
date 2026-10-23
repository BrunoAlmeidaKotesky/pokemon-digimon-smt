// Base comum dos Links dos dois transportes: guarda mensagens até alguém ouvir e dispara onClose uma vez só.
import type { Link } from '../types';

/** quantas mensagens guardamos enquanto ninguém chamou onMessage */
const MAX_PENDING = 256;

export interface LinkIO {
  /** manda pela rede (pode lançar: o Link engole e avisa no console) */
  send(msg: unknown): void;
  /** fechamento pedido por este lado: avisa o outro lado e solta os recursos */
  close(): void;
}

export interface LinkCore {
  readonly link: Link;
  /** chegou mensagem do outro lado */
  deliver(msg: unknown): void;
  /** o outro lado (ou a rede) fechou: dispara os onClose; false se já estava fechado */
  end(): boolean;
  isClosed(): boolean;
}

/** Erro de quem ouve não pode quebrar o transporte: relança fora da pilha atual. */
function call<A extends unknown[]>(cb: (...a: A) => void, ...a: A): void {
  try {
    cb(...a);
  } catch (e) {
    setTimeout(() => {
      throw e;
    }, 0);
  }
}

export function createLink(io: LinkIO): LinkCore {
  let closed = false;
  let pending: unknown[] = [];
  const msgCbs: ((msg: unknown) => void)[] = [];
  const closeCbs: (() => void)[] = [];

  const end = (): boolean => {
    if (closed) return false;
    closed = true;
    pending = [];
    for (const cb of closeCbs.splice(0)) call(cb);
    return true;
  };

  const link: Link = {
    send(msg) {
      if (closed) return;
      try {
        io.send(msg);
      } catch (e) {
        console.warn('[online] falha ao enviar mensagem', e);
      }
    },
    close() {
      if (closed) return;
      try {
        io.close();
      } catch (e) {
        console.warn('[online] falha ao fechar conexão', e);
      }
      end();
    },
    onMessage(cb) {
      msgCbs.push(cb);
      if (msgCbs.length === 1 && pending.length > 0) {
        const queued = pending;
        pending = [];
        for (const m of queued) call(cb, m);
      }
    },
    onClose(cb) {
      if (closed) queueMicrotask(() => call(cb));
      else closeCbs.push(cb);
    },
  };

  return {
    link,
    deliver(msg) {
      if (closed) return;
      if (msgCbs.length === 0) {
        if (pending.length < MAX_PENDING) pending.push(msg);
        return;
      }
      for (const cb of [...msgCbs]) call(cb, msg);
    },
    end,
    isClosed: () => closed,
  };
}

/** Fila de Links novos até alguém chamar onLink. */
export function linkQueue(): { push(link: Link): void; listen(cb: (link: Link) => void): void } {
  const cbs: ((link: Link) => void)[] = [];
  const waiting: Link[] = [];
  return {
    push(link) {
      if (cbs.length === 0) waiting.push(link);
      else for (const cb of [...cbs]) call(cb, link);
    },
    listen(cb) {
      cbs.push(cb);
      for (const l of waiting.splice(0)) call(cb, l);
    },
  };
}
