// Validação das mensagens que chegam pela rede. Nada aqui lança: o que não tiver o formato esperado vira null.
import type { ClientMsg, HostMsg, RoomView } from './types';
import type { CustomOp } from '../customs/types';
import { CUSTOM_LIMITS } from '../customs/types';
import { validateCustoms, isCustomKey } from '../customs/model';

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
      case 'pick':
        return isNat(x.round) && isNat(x.att) && isNat(x.idx) ? { t: 'pick', round: x.round, att: x.att, idx: x.idx } : null;
      case 'custom': {
        const op = parseCustomOp(x.op);
        return op ? { t: 'custom', op } : null;
      }
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

const isArr = (x: unknown, ok: (y: unknown) => boolean): boolean => Array.isArray(x) && x.every(ok);
const isText = (x: unknown): x is string => typeof x === 'string';
/** personagem: o que a carta usa (nome, imagem, franquia) */
const isEntry = (e: unknown): boolean => isRec(e) && isText(e.name) && isText(e.img) && isText(e.fr);
const isEntryOrNull = (e: unknown): boolean => e === null || isEntry(e);
const isMatch = (m: unknown): boolean => isRec(m) && isEntryOrNull(m.a) && isEntryOrNull(m.b) && isEntryOrNull(m.w);
const isCup = (c: unknown): boolean =>
  isRec(c) && isArr(c.round, isEntry) && isArr(c.next, isEntry) && isNat(c.i) &&
  isArr(c.rounds, r => isArr(r, isMatch)) && (c.rounds as unknown[]).length > 0 && isRec(c.losers) && isEntryOrNull(c.champ);

function isCfg(c: unknown): boolean {
  return isRec(c) && isText(c.mode) && isBool(c.secret) && isBool(c.roulette) &&
    isArr(c.duel, isText) && isArr(c.trio, isText) && isArr(c.quartet, isText) &&
    isRec(c.cup) && isArr(c.cup.frs, isText) && isNat(c.cup.size) &&
    isRec(c.draft) && isArr(c.draft.frs, isText) && isNat(c.draft.x) && isNat(c.draft.rounds) &&
    (c.customEdit === undefined || isBool(c.customEdit)) &&
    // host de versão anterior ao Ranking não manda `rank`
    (c.rank === undefined || (isRec(c.rank) && isArr(c.rank.frs, isText) && isNat(c.rank.size) && isBool(c.rank.mix)));
}

/** Pedido de mudança nas franquias customizadas (o host ainda confere tudo de novo ao aplicar). */
function parseCustomOp(o: unknown): CustomOp | null {
  if (!isRec(o) || !isCustomKey(o.key)) return null;
  const txt = (s: unknown): s is string => isStr(s, CUSTOM_LIMITS.label * 4);
  if (o.op === 'label') return isStr(o.id, 32) && txt(o.name) ? { op: 'label', key: o.key, id: o.id, name: o.name } : null;
  if (o.op === 'add' && Array.isArray(o.items) && o.items.length > 0 && o.items.length <= 50 &&
    o.items.every(i => isRec(i) && txt(i.name) && isStr(i.data, CUSTOM_LIMITS.dataChars)))
    return { op: 'add', key: o.key, items: (o.items as { name: string; data: string }[]).map(i => ({ name: i.name, data: i.data })) };
  return null;
}

/** O jogo, conferido pelo modo (o que a tela de cada modo usa direto). */
function isGame(g: unknown): boolean {
  if (!isRec(g)) return false;
  switch (g.mode) {
    case 'duel': case 'trio': case 'quartet':
      return isArr(g.frs, isText) && isArr(g.streak, isNat);
    case 'cup':
      return isCup(g.cup) && isText(g.title) && isText(g.count);
    case 'draft': {
      const me = g.me;
      const meOk = me === null || (isRec(me) && (me.fi === null || isNat(me.fi)) && isArr(me.opts, isEntry) &&
        isArr(me.picks, isEntryOrNull) && isNat(me.att) && isBool(me.skipped));
      return isArr(g.frs, isText) && isNat(g.x) && isNat(g.rounds) && isNat(g.round) && isNat(g.reveal) &&
        ['pick', 'reveal', 'final', 'end'].includes(g.step as string) && meOk &&
        isArr(g.progress, p => isRec(p) && isText(p.id) && isText(p.name) && isText(p.state)) &&
        (g.redo === null || isArr(g.redo, isText)) && isArr(g.qualified, isEntry) &&
        (g.final === null || isCup(g.final)) && isText(g.title) && isText(g.count) && isEntryOrNull(g.champion) &&
        (g.history === null || isArr(g.history, h => isRec(h) && isNat(h.round) &&
          isArr(h.teams, t => isRec(t) && isText(t.id) && isText(t.name) && isArr(t.picks, isEntry))));
    }
    case 'rank':
      return isNat(g.size) && isBool(g.mix) && isNat(g.cur) &&
        isArr(g.tops, t => isRec(t) && (t.fr === null || isText(t.fr)) && isArr(t.slots, isEntryOrNull) && isNat(t.left));
    default:
      return false;
  }
}

/** A votação aberta (ou com resultado). No Ranking (`pos`), os índices são posições de 0 a pos.n - 1. */
function isVote(v: unknown): boolean {
  if (!isRec(v)) return false;
  const p = v.pos;
  if (!(p === undefined || (isRec(p) && isNat(p.n) && isArr(p.free, i => isNat(i) && i < (p.n as number))))) return false;
  const n = isRec(p) ? (p.n as number) : Array.isArray(v.items) ? v.items.length : -1;
  const idx = (i: unknown) => isNat(i) && i < n;
  if (!isNat(v.seq) || !isArr(v.items, isEntry) || !isArr(v.extras, isText) || !(v.mine === null || idx(v.mine))) return false;
  const r = v.result;
  if (r === null) return true;
  if (!isRec(r) || !isArr(r.counts, isNat) || (r.counts as unknown[]).length !== n || !idx(r.win)) return false;
  if (!(r.voters === null || isArr(r.voters, x => isArr(x, isText)))) return false;
  if (!(r.tie === null || isArr(r.tie, idx)) || !['votos', 'empate', 'roleta'].includes(r.how as string)) return false;
  const s = r.spin;
  return s === null || (isRec(s) && isNat(s.id) && isArr(s.among, idx) && (s.among as unknown[]).length > 0 &&
    isNat(s.start) && isNat(s.total) && typeof s.age === 'number');
}

/** Conferência da visão: tudo o que a tela usa direto tem o tipo certo; visão torta é ignorada. */
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
    isCfg(v.cfg) &&
    (v.game === null || isGame(v.game)) &&
    (v.vote === null || isVote(v.vote))
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
      case 'replaced':
        return { t: 'replaced' };
      case 'customs': {
        const list = validateCustoms(x.list);
        return list ? { t: 'customs', list } : null;
      }
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
