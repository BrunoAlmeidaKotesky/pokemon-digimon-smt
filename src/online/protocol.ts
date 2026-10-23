// Validação das mensagens que chegam pela rede. Nada aqui lança: o que não tiver o formato esperado vira null.
import type { ClientMsg, HostMsg, RoomView } from './types';

/** tamanho máximo do nome de um jogador depois de cleanName */
export const MAX_NAME = 16;
/** limites do que aceitamos pela rede (folgados de propósito: o host limpa o nome depois) */
export const MAX_ID = 64;
export const MAX_WIRE_NAME = 40;
export const MAX_REASON = 200;

type Rec = Record<string, unknown>;

const isRec = (x: unknown): x is Rec => typeof x === 'object' && x !== null && !Array.isArray(x);
const isStr = (x: unknown, max: number): x is string => typeof x === 'string' && x.length <= max;
/** inteiro finito >= 0 */
const isNat = (x: unknown): x is number => typeof x === 'number' && Number.isSafeInteger(x) && x >= 0;
const isBool = (x: unknown): x is boolean => typeof x === 'boolean';

/** Roda o validador; se algo lançar (objeto com getter estranho, Proxy...), devolve null. */
function safe<T>(fn: () => T | null): T | null {
  try {
    return fn();
  } catch {
    return null;
  }
}

/** Mensagem do jogador pro host. Devolve um objeto novo só com os campos conhecidos. */
export function parseClientMsg(x: unknown): ClientMsg | null {
  return safe((): ClientMsg | null => {
    if (!isRec(x)) return null;
    switch (x.t) {
      case 'hello':
        return isStr(x.id, MAX_ID) && isStr(x.name, MAX_WIRE_NAME) ? { t: 'hello', id: x.id, name: x.name } : null;
      case 'vote':
        return isNat(x.seq) && isNat(x.idx) ? { t: 'vote', seq: x.seq, idx: x.idx } : null;
      case 'leave':
        return { t: 'leave' };
      case 'ping':
        return { t: 'ping' };
      default:
        return null;
    }
  });
}

function isPlayerView(p: unknown): boolean {
  return (
    isRec(p) &&
    isStr(p.id, MAX_ID) &&
    isStr(p.name, MAX_WIRE_NAME) &&
    isBool(p.host) &&
    isBool(p.online) &&
    isBool(p.voted)
  );
}

/** Conferência rasa da visão: o que a tela usa direto tem o tipo certo; o resto (cfg, game, vote) passa como está. */
function isRoomView(v: unknown): v is RoomView {
  return (
    isRec(v) &&
    isStr(v.code, MAX_ID) &&
    isStr(v.me, MAX_ID) &&
    isStr(v.hostId, MAX_ID) &&
    (v.phase === 'lobby' || v.phase === 'play') &&
    typeof v.notice === 'string' &&
    Array.isArray(v.players) &&
    v.players.every(isPlayerView) &&
    isRec(v.cfg) &&
    (v.game === null || isRec(v.game)) &&
    (v.vote === null || (isRec(v.vote) && Array.isArray(v.vote.items)))
  );
}

/** Mensagem do host pro jogador. Em 'state', a visão volta como veio (já conferida). */
export function parseHostMsg(x: unknown): HostMsg | null {
  return safe((): HostMsg | null => {
    if (!isRec(x)) return null;
    switch (x.t) {
      case 'welcome':
        return isStr(x.id, MAX_ID) ? { t: 'welcome', id: x.id } : null;
      case 'state':
        return isRoomView(x.view) ? { t: 'state', view: x.view } : null;
      case 'reject':
        return isStr(x.reason, MAX_REASON) ? { t: 'reject', reason: x.reason } : null;
      case 'kicked':
        return { t: 'kicked' };
      case 'closed':
        return { t: 'closed' };
      case 'ping':
        return { t: 'ping' };
      default:
        return null;
    }
  });
}

/** caracteres de controle e de direção de texto (que bagunçam a exibição do nome) */
const INVISIBLE = /[\p{Cc}‎‏‪-‮⁦-⁩]/gu;

/** Nome de jogador: espaços viram um só, sem controle, sem sobra nas pontas, até MAX_NAME caracteres. */
export function cleanName(s: string): string {
  const flat = s.replace(/\s/g, ' ').replace(INVISIBLE, '').replace(/ +/g, ' ').trim();
  // Array.from conta por caractere (não corta emoji no meio)
  return Array.from(flat).slice(0, MAX_NAME).join('').trim();
}
