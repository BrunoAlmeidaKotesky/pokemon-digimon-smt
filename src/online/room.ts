// Sala do modo online: o estado vive no navegador do host e só muda por reduce(estado, ação, ctx).
// Tudo puro: sorteio só com ctx.rand, relógio só com ctx.now, personagens só de ctx.lists (nada de Math.random, Date ou DOM).
// Cada escolha vira uma votação: quando todos da sala votam (ou o host encerra) ela é apurada; empate vira roleta entre os empatados.
import { buildEntrants, cupChoose, cupPair, startCup } from '../core/cup';
import { shuffle } from '../core/random';
import { planSpin } from '../core/spin';
import type { Entry, FranchiseKey, Item } from '../types';
import { draftDrop, type DraftIO, draftNext, draftPick, draftSkip, startDraft } from './draft';
import type { Action, Ctx, JoinCheck, KingGame, OnlineConfig, Player, RoomState, SpinPlan, Vote } from './types';

/** Máximo de jogadores na sala (host incluído). */
export const MAX_PLAYERS = 16;
/** Tamanho máximo do apelido (em caracteres). */
export const MAX_NAME = 16;

export const DEFAULT_CONFIG: OnlineConfig = {
  mode: 'duel',
  secret: false,
  roulette: false,
  duel: ['pokemon', 'digimon'],
  trio: ['pokemon', 'digimon', 'smt'],
  quartet: ['pokemon', 'digimon', 'smt', 'jojo'],
  cup: { size: 16, frs: ['pokemon', 'digimon', 'smt', 'jojo', 'ygo', 'bakugan', 'sujimon'], even: true, mix: true },
  draft: { frs: ['jojo', 'pokemon', 'digimon', 'smt'], x: 3, rounds: 1 },
};

const LABELS: Record<string, string> = {
  pokemon: 'Pokémon',
  digimon: 'Digimon',
  smt: 'SMT/Persona',
  jojo: 'JoJo',
  ygo: 'Yu-Gi-Oh!',
  bakugan: 'Bakugan',
  sujimon: 'Sujimon',
};

/** Rótulo da franquia nos avisos (franquia desconhecida: a própria chave). */
export function frLabel(k: FranchiseKey): string {
  return LABELS[k] ?? k;
}

/** Texto da coroa sobre a carta de quem vem ganhando seguido ('' se ainda não ganhou). */
export function crown(streak: number): string {
  if (streak <= 0) return '';
  return streak === 1 ? '♛ 1 vitória' : `♛ ${streak} vitórias`;
}

const missing = (k: FranchiseKey) => `Lista de ${frLabel(k)} ainda não carregou.`;

/** O que o Draft (draft.ts) usa daqui: a mesma votação e os mesmos rótulos. */
const DRAFT_IO: DraftIO = { openVote: (s, items, extras) => openVote(s, items, extras), label: frLabel };

export function createRoom(code: string, host: { id: string; name: string }, cfg: OnlineConfig = DEFAULT_CONFIG): RoomState {
  return {
    code,
    hostId: host.id,
    players: [{ id: host.id, name: host.name.trim(), host: true, online: true }],
    cfg: structuredClone(cfg),
    phase: 'lobby',
    game: null,
    vote: null,
    bags: {},
    nextSeq: 1,
    notice: '',
  };
}

/**
 * Quem pode entrar e com qual id: o mesmo id volta pro lugar; apelido de alguém que caiu (sem diferenciar maiúsculas)
 * recupera o lugar dele (outro aparelho); apelido de quem está online é recusado; sala cheia recusa quem é novo.
 */
export function canJoin(s: RoomState, id: string, name: string): JoinCheck {
  const n = typeof name === 'string' ? name.trim() : '';
  if (!n || [...n].length > MAX_NAME) return { ok: false, reason: 'Escolha um apelido.' };
  if (s.players.some(p => p.id === id)) return { ok: true, id };
  const low = n.toLowerCase();
  const twin = s.players.find(p => p.name.toLowerCase() === low);
  if (twin) return twin.online ? { ok: false, reason: 'Já tem alguém com esse apelido na sala.' } : { ok: true, id: twin.id };
  if (s.players.length >= MAX_PLAYERS) return { ok: false, reason: 'A sala está cheia (16 jogadores).' };
  return { ok: true, id };
}

/** Aplica a ação. Não muda `s`: devolve um estado novo, ou o próprio `s` se a ação não vale agora. */
export function reduce(s: RoomState, a: Action, ctx: Ctx): RoomState {
  const t = structuredClone(s);
  return apply(t, a, ctx) ? t : s;
}

/** Muda `s` (já clonado); false = ação ignorada. */
function apply(s: RoomState, a: Action, ctx: Ctx): boolean {
  switch (a.type) {
    case 'join':
      return join(s, a.id, a.name);
    case 'online': {
      const p = s.players.find(x => x.id === a.id);
      if (!p || p.online === !!a.online) return false;
      p.online = !!a.online;
      return true;
    }
    case 'leave':
    case 'kick':
      return remove(s, a.id, ctx);
    case 'config':
      return config(s, a.patch);
    case 'start':
      return start(s, ctx);
    case 'lobby':
      if (s.phase === 'lobby' && !s.game && !s.vote && !s.notice) return false;
      s.phase = 'lobby';
      s.game = null;
      s.vote = null;
      s.notice = '';
      return true;
    case 'vote':
      return vote(s, a.id, a.seq, a.idx, ctx);
    case 'close':
      if (!isOpen(s)) return false;
      tally(s, ctx);
      return true;
    case 'spin':
      return hostSpin(s, ctx);
    case 'next':
      return next(s, ctx);
    case 'pick':
      return draftPick(s, a, ctx, DRAFT_IO);
    case 'skip':
      return draftSkip(s, ctx, DRAFT_IO);
    default:
      return false;
  }
}

// ---------- jogadores ----------

function join(s: RoomState, id: string, name: string): boolean {
  const chk = canJoin(s, id, name);
  if (!chk.ok) return false;
  const p = s.players.find(x => x.id === chk.id);
  if (p) {
    if (p.online) return false;
    p.online = true;
    return true;
  }
  s.players.push({ id: chk.id, name: name.trim(), host: false, online: true });
  return true;
}

function remove(s: RoomState, id: string, ctx: Ctx): boolean {
  const i = s.players.findIndex(p => p.id === id);
  if (i < 0 || id === s.hostId || (s.players[i] as Player).host) return false;
  s.players.splice(i, 1);
  if (isOpen(s)) {
    delete s.vote.ballots[id];
    if (allVoted(s, s.vote)) tally(s, ctx);
  }
  // Draft: o time dele some e, se só faltava ele escolher, a rodada anda
  draftDrop(s, id, ctx, DRAFT_IO);
  return true;
}

function config(s: RoomState, patch: Partial<OnlineConfig> | null | undefined): boolean {
  if (s.phase !== 'lobby' || !patch || typeof patch !== 'object') return false;
  const cfg = s.cfg as unknown as Record<string, unknown>;
  let changed = false;
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined || !(k in cfg)) continue;
    cfg[k] = structuredClone(v);
    changed = true;
  }
  return changed;
}

// ---------- sorteio (saco de bolinhas da sala) ----------

function listOf(ctx: Ctx, k: FranchiseKey): Item[] | null {
  const l = ctx.lists[k];
  return l && l.length ? l : null;
}

/** Próximo nome do saco da franquia (refaz embaralhado quando esvazia; nomes que não estão na lista são ignorados). */
function draw(s: RoomState, ctx: Ctx, k: FranchiseKey, list: Item[]): Item {
  const byName = new Map(list.map(x => [x.name, x] as const));
  let bag = (s.bags[k] ?? []).filter(n => byName.has(n));
  if (!bag.length) bag = shuffle(list.map(x => x.name), ctx.rand);
  const name = bag.pop() as string;
  s.bags[k] = bag;
  return byName.get(name) as Item;
}

/** Sorteia evitando os nomes de `avoid` (quem está na tela), até 20 tentativas; depois aceita o que vier. */
function pick(s: RoomState, ctx: Ctx, k: FranchiseKey, list: Item[], avoid: Entry[]): Entry {
  const names = new Set(avoid.map(e => e.name));
  let it: Entry;
  let tries = 0;
  do {
    it = { ...draw(s, ctx, k, list), fr: k };
  } while (names.has(it.name) && ++tries < 20);
  return it;
}

// ---------- partida ----------

function notice(s: RoomState, msg: string): boolean {
  s.notice = msg;
  return true;
}

function start(s: RoomState, ctx: Ctx): boolean {
  if (s.phase !== 'lobby') return false;
  const cfg = s.cfg;
  if (cfg.mode === 'draft') {
    const frs: unknown[] = Array.isArray(cfg.draft?.frs) ? cfg.draft.frs : [];
    if (!frs.length) return notice(s, 'Escolha pelo menos uma franquia.');
    if (frs.some(k => typeof k !== 'string')) return notice(s, 'Franquia desconhecida no Draft.');
    if (new Set(frs).size !== frs.length) return notice(s, 'Cada franquia só pode aparecer uma vez no Draft.');
    const miss = (frs as FranchiseKey[]).find(k => !listOf(ctx, k));
    if (miss !== undefined) return notice(s, missing(miss));
    startDraft(s, ctx, DRAFT_IO);
    return true;
  }
  if (cfg.mode === 'cup') {
    const frs = cfg.cup.frs.filter(k => listOf(ctx, k));
    if (!frs.length) return notice(s, cfg.cup.frs.length ? missing(cfg.cup.frs[0] as string) : 'Escolha pelo menos uma franquia.');
    const lists: Record<string, Item[]> = {};
    frs.forEach(k => (lists[k] = listOf(ctx, k) as Item[]));
    const { size, even, mix } = cfg.cup;
    // `k` estável: a chave chega pela rede e `same()` ainda reconhece o mesmo personagem
    const entrants = buildEntrants({ frs, size, even, mix, lists, rand: ctx.rand }).map((e, i): Entry => ({ ...e, k: `c${i}` }));
    if (entrants.length < 2) return notice(s, 'Poucos personagens para o campeonato.');
    const cup = startCup(entrants, mix);
    s.game = { mode: 'cup', cup };
    s.phase = 'play';
    s.notice = '';
    openVote(s, [...(cupPair(cup) as [Entry, Entry])], ['', '']);
    return true;
  }
  // Duelo, Trio e Quarteto: o mesmo rei do morro, com um lado por franquia configurada
  if (cfg.mode !== 'duel' && cfg.mode !== 'trio' && cfg.mode !== 'quartet') return false;
  const frs: FranchiseKey[] = [...cfg[cfg.mode]];
  const miss = frs.find(k => !listOf(ctx, k));
  if (miss !== undefined) return notice(s, missing(miss));
  const slots: Entry[] = [];
  for (const k of frs) slots.push(pick(s, ctx, k, listOf(ctx, k) as Item[], slots));
  const g: KingGame = { mode: cfg.mode, frs, slots, streak: frs.map(() => 0) };
  s.game = g;
  s.phase = 'play';
  s.notice = '';
  openKingVote(s, g);
  return true;
}

function next(s: RoomState, ctx: Ctx): boolean {
  const g = s.game;
  const v = s.vote;
  if (s.phase !== 'play' || !g || !v || !v.result) return false;
  if (g.mode === 'draft') return draftNext(s, ctx, DRAFT_IO);
  const win = v.result.win;
  if (g.mode === 'cup') {
    const pair = cupPair(g.cup);
    if (!pair) return false;
    cupChoose(g.cup, pair[win === 1 ? 1 : 0], ctx.rand);
    s.notice = '';
    const nx = cupPair(g.cup);
    if (nx) openVote(s, [...nx], ['', '']);
    else s.vote = null;
    return true;
  }
  const lists = g.frs.map(k => listOf(ctx, k));
  const miss = g.frs.findIndex((_, i) => i !== win && !lists[i]);
  if (miss >= 0) return notice(s, missing(g.frs[miss] as string));
  g.streak[win] = (g.streak[win] ?? 0) + 1;
  const old = [...g.slots];
  const fresh: Entry[] = [];
  g.frs.forEach((k, i) => {
    if (i === win) return;
    const list = lists[i] as Item[];
    // evita quem está na tela (inclusive quem acabou de perder); se a lista for pequena demais pra isso,
    // evita só quem vai ficar na tela (o vencedor e os desafiantes já sorteados)
    const seen = [...old, ...fresh];
    const names = new Set(seen.map(e => e.name));
    const avoid = list.some(x => !names.has(x.name)) ? seen : [old[win] as Entry, ...fresh];
    const it = pick(s, ctx, k, list, avoid);
    fresh.push(it);
    g.slots[i] = it;
    g.streak[i] = 0;
  });
  s.notice = '';
  openKingVote(s, g);
  return true;
}

// ---------- votação ----------

function openVote(s: RoomState, items: Entry[], extras: string[]): void {
  s.vote = { seq: s.nextSeq++, items, extras, ballots: {}, result: null };
}

function openKingVote(s: RoomState, g: KingGame): void {
  openVote(s, [...g.slots], g.streak.map(crown));
}

function isOpen(s: RoomState): s is RoomState & { vote: Vote } {
  return s.phase === 'play' && !!s.vote && !s.vote.result;
}

function allVoted(s: RoomState, v: Vote): boolean {
  return s.players.every(p => Object.hasOwn(v.ballots, p.id));
}

function vote(s: RoomState, id: string, seq: number, idx: number, ctx: Ctx): boolean {
  if (!isOpen(s)) return false;
  const v = s.vote;
  if (seq !== v.seq || !Number.isInteger(idx) || idx < 0 || idx >= v.items.length) return false;
  if (!s.players.some(p => p.id === id)) return false;
  if (v.ballots[id] === idx) return false;
  v.ballots[id] = idx;
  if (allVoted(s, v)) tally(s, ctx);
  return true;
}

/** Votos por item e quem votou (na ordem dos jogadores). */
function count(s: RoomState, v: Vote): { counts: number[]; voters: string[][] } {
  const counts = v.items.map(() => 0);
  const voters: string[][] = v.items.map(() => []);
  for (const p of s.players) {
    if (!Object.hasOwn(v.ballots, p.id)) continue;
    const i = v.ballots[p.id] as number;
    counts[i] = (counts[i] as number) + 1;
    (voters[i] as string[]).push(p.id);
  }
  return { counts, voters };
}

/** Roleta entre `among` (índices de vote.items): para em among[(start + total) % m]. */
function roulette(s: RoomState, ctx: Ctx, among: number[]): { win: number; spin: SpinPlan } {
  const m = among.length;
  const { start, total } = planSpin(m, ctx.rand);
  return { win: among[(start + total) % m] as number, spin: { id: s.nextSeq++, among, start, total, at: ctx.now } };
}

/** Apura com os votos atuais: um mais votado ganha; empate (inclusive sem votos) vai pra roleta entre os empatados. */
function tally(s: RoomState, ctx: Ctx): void {
  const v = s.vote as Vote;
  const { counts, voters } = count(s, v);
  const max = Math.max(...counts);
  const top = counts.flatMap((c, i) => (c === max ? [i] : []));
  if (top.length === 1) {
    v.result = { counts, voters, win: top[0] as number, tie: null, how: 'votos', spin: null };
    return;
  }
  const r = roulette(s, ctx, [...top]);
  v.result = { counts, voters, win: r.win, tie: top, how: 'empate', spin: r.spin };
}

/** O host gira a roleta entre todos os itens (só com cfg.roulette); os votos já dados continuam na contagem. */
function hostSpin(s: RoomState, ctx: Ctx): boolean {
  if (!s.cfg.roulette || !isOpen(s)) return false;
  const v = s.vote;
  const { counts, voters } = count(s, v);
  const r = roulette(s, ctx, v.items.map((_, i) => i));
  v.result = { counts, voters, win: r.win, tie: null, how: 'roleta', spin: r.spin };
  return true;
}
