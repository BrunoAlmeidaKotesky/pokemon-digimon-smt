// Draft online: cada jogador escolhe em segredo um personagem por franquia entre X opções só dele (saco próprio por
// jogador e franquia). Se duas ou mais pessoas escolhem o mesmo personagem numa franquia, todos refazem aquela franquia.
// Depois cada franquia vira uma votação (a de room.ts) e os vencedores vão pra final: mata-mata fixo, com "bye".
// Tudo puro como em room.ts: sorteio só com ctx.rand; estas funções recebem o estado JÁ CLONADO e mudam ele.
import { cupChoose, cupPair, same, startCup } from '../core/cup';
import { shuffle } from '../core/random';
import type { Cup, Entry, FranchiseKey, Item } from '../types';
import type { Action, Ctx, DraftGame, DraftTeam, OnlineConfig, Qualified, RoomState } from './types';

/** Opções por franquia: mínimo, máximo e padrão. */
export const DRAFT_X = { min: 2, max: 6, def: 3 } as const;
/** Rodadas: mínimo, máximo e padrão. */
export const DRAFT_ROUNDS = { min: 1, max: 5, def: 1 } as const;
/** Depois de tantas refações da mesma franquia numa rodada, o repetido é aceito (limite de segurança). */
export const MAX_REDOS = 5;

/** O que o Draft usa da sala (room.ts passa as dele, pra não ter import circular). */
export interface DraftIO {
  /** abre uma votação (a mesma dos outros modos) */
  openVote(s: RoomState, items: Entry[], extras: string[]): void;
  /** rótulo da franquia nos avisos */
  label(k: FranchiseKey): string;
}

type PickAction = Extract<Action, { type: 'pick' }>;

const clamp = (n: unknown, lo: number, hi: number, def: number): number =>
  typeof n === 'number' && Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : def;

/** Opções por franquia e nº de rodadas dentro dos limites (o que não for número vira o padrão). */
export function draftSettings(d: Partial<OnlineConfig['draft']> | null | undefined): { x: number; rounds: number } {
  return {
    x: clamp(d?.x, DRAFT_X.min, DRAFT_X.max, DRAFT_X.def),
    rounds: clamp(d?.rounds, DRAFT_ROUNDS.min, DRAFT_ROUNDS.max, DRAFT_ROUNDS.def),
  };
}

/** Lugar vazio na chave da final (quem cai contra ele passa sem votação). */
export function isBye(e: Entry | null | undefined): boolean {
  return !!e && e.fr === '' && typeof e.k === 'string' && e.k.startsWith('bye-');
}

/** Aviso da refação: diz só as franquias (nunca o personagem nem quem escolheu). */
export function redoNotice(labels: string[]): string {
  const many = labels.length > 1;
  const list = many ? `${labels.slice(0, -1).join(', ')} e ${labels[labels.length - 1]}` : (labels[0] ?? '');
  return `${list} ${many ? 'vão ser refeitas' : 'vai ser refeita'} por todos: duas ou mais pessoas escolheram o mesmo personagem. As opções são novas.`;
}

const own = <T>(r: Record<string, T>, k: string): T | undefined => (Object.hasOwn(r, k) ? r[k] : undefined);

const draftOf = (s: RoomState): DraftGame | null => (s.phase === 'play' && s.game?.mode === 'draft' ? s.game : null);

// ---------- início e rodadas ----------

/** Começa o Draft (franquias já conferidas por room.ts: não vazias, sem repetidas e carregadas) na rodada 1. */
export function startDraft(s: RoomState, ctx: Ctx, io: DraftIO): void {
  const frs = [...s.cfg.draft.frs];
  const g: DraftGame = {
    mode: 'draft',
    frs,
    ...draftSettings(s.cfg.draft),
    round: 1,
    step: 'pick',
    teams: {},
    order: [],
    used: Object.fromEntries(frs.map(k => [k, [] as string[]])),
    banned: {},
    redos: {},
    redo: null,
    reveal: 0,
    qualified: [],
    history: [],
    bags: {},
    final: null,
    champion: null,
  };
  s.game = g;
  s.phase = 'play';
  s.notice = '';
  s.vote = null;
  beginRound(s, g, ctx, io);
}

/** Passo 1: todo mundo que está na sala ganha um time com opções novas pra cada franquia. */
function beginRound(s: RoomState, g: DraftGame, ctx: Ctx, io: DraftIO): void {
  g.step = 'pick';
  g.teams = {};
  g.order = s.players.map(p => p.id);
  g.banned = {};
  g.redos = {};
  g.redo = null;
  g.reveal = 0;
  s.vote = null;
  for (const id of g.order) {
    const t: DraftTeam = { picks: g.frs.map(() => null), queue: [], opts: {}, att: 0, skipped: false };
    g.frs.forEach((_, fi) => {
      const o = deal(g, id, fi, ctx);
      t.opts[fi] = o;
      // sem ninguém pra escolher: a franquia é pulada pra este jogador
      if (o.length) t.queue.push(fi);
    });
    g.teams[id] = t;
  }
  settle(s, g, ctx, io);
}

/**
 * Até X opções da franquia `fi` pro jogador `id`, tiradas do saco dele (passa por todos antes de repetir), sem repetir,
 * fora quem já foi escolhido em rodadas anteriores (used) e quem repetiu nesta rodada (banned). Se ninguém sobrar,
 * ignora `used` (mas nunca `banned`); se nem assim, nenhuma opção.
 */
function deal(g: DraftGame, id: string, fi: number, ctx: Ctx): Entry[] {
  const k = g.frs[fi] as FranchiseKey;
  const list = ctx.lists[k] ?? [];
  const byName = new Map(list.map(x => [x.name, x] as const));
  const banned = new Set(g.banned[fi] ?? []);
  const used = new Set(own(g.used, k) ?? []);
  let ok = [...byName.keys()].filter(n => !banned.has(n) && !used.has(n));
  if (!ok.length) ok = [...byName.keys()].filter(n => !banned.has(n));
  if (!ok.length) return [];
  const eligible = new Set(ok);
  const want = Math.min(g.x, eligible.size);
  const bags = own(g.bags, id) ?? (g.bags[id] = {});
  let bag = (own(bags, k) ?? []).filter(n => byName.has(n));
  const out: string[] = [];
  // sorteado de novo depois de refazer o saco: volta pro fundo do saco novo (sai por último)
  const later: string[] = [];
  for (let refills = 0; out.length < want; ) {
    if (!bag.length) {
      // com want <= elegíveis, um saco cheio sempre basta; o limite é só segurança
      if (refills++ >= 2) break;
      bag = shuffle([...byName.keys()], ctx.rand);
    }
    const n = bag.pop() as string;
    if (out.includes(n)) later.push(n);
    else if (eligible.has(n)) out.push(n);
  }
  bags[k] = [...later, ...bag];
  return out.map(n => ({ ...(byName.get(n) as Item), fr: k }));
}

/** Times que contam nesta rodada (não pulados e de quem ainda está na sala), na ordem. */
function active(s: RoomState, g: DraftGame): [string, DraftTeam][] {
  const here = new Set(s.players.map(p => p.id));
  return g.order.flatMap((id): [string, DraftTeam][] => {
    const t = own(g.teams, id);
    return t && !t.skipped && here.has(id) ? [[id, t]] : [];
  });
}

// ---------- escolha secreta ----------

/** Escolha de um jogador na franquia da vez. */
export function draftPick(s: RoomState, a: PickAction, ctx: Ctx, io: DraftIO): boolean {
  const g = draftOf(s);
  if (!g || g.step !== 'pick' || a.round !== g.round) return false;
  const t = own(g.teams, a.id);
  if (!t || t.skipped || a.att !== t.att || !s.players.some(p => p.id === a.id)) return false;
  const fi = t.queue[0];
  if (fi === undefined) return false;
  const opts = t.opts[fi] ?? [];
  if (!Number.isInteger(a.idx) || a.idx < 0 || a.idx >= opts.length) return false;
  t.picks[fi] = { ...(opts[a.idx] as Entry) };
  t.queue.shift();
  settle(s, g, ctx, io);
  return true;
}

/** O host segue sem quem ainda não terminou (só se alguém já terminou). */
export function draftSkip(s: RoomState, ctx: Ctx, io: DraftIO): boolean {
  const g = draftOf(s);
  if (!g || g.step !== 'pick') return false;
  const act = active(s, g);
  const late = act.filter(([, t]) => t.queue.length);
  if (!late.length || late.length === act.length) return false;
  for (const [, t] of late) t.skipped = true;
  settle(s, g, ctx, io);
  return true;
}

/** Jogador saiu ou foi removido: o time dele some (e a rodada pode andar sem ele). */
export function draftDrop(s: RoomState, id: string, ctx: Ctx, io: DraftIO): void {
  const g = draftOf(s);
  if (!g) return;
  delete g.teams[id];
  g.order = g.order.filter(x => x !== id);
  if (g.step === 'pick') settle(s, g, ctx, io);
}

/** Todos os times ativos terminaram? Confere repetidos: refação (de novo até não repetir) ou revelação. */
function settle(s: RoomState, g: DraftGame, ctx: Ctx, io: DraftIO): void {
  while (g.step === 'pick') {
    const act = active(s, g);
    if (act.some(([, t]) => t.queue.length)) return;
    const rep = repeated(g, act);
    if (!rep.length) {
      finishPicks(s, g, act, ctx, io);
      return;
    }
    redo(s, g, act, rep, ctx, io);
  }
}

/** Franquias em que o mesmo personagem foi escolhido por 2+ times (com os nomes repetidos). */
function repeated(g: DraftGame, act: [string, DraftTeam][]): { fi: number; names: string[] }[] {
  const out: { fi: number; names: string[] }[] = [];
  g.frs.forEach((_, fi) => {
    if ((g.redos[fi] ?? 0) >= MAX_REDOS) return;
    const n = new Map<string, number>();
    for (const [, t] of act) {
      const p = t.picks[fi];
      if (p) n.set(p.name, (n.get(p.name) ?? 0) + 1);
    }
    const names = [...n].filter(([, c]) => c > 1).map(([name]) => name);
    if (names.length) out.push({ fi, names });
  });
  return out;
}

/** Repetidos ficam fora; todos os times ativos refazem essas franquias com opções novas (att sobe). */
function redo(s: RoomState, g: DraftGame, act: [string, DraftTeam][], rep: { fi: number; names: string[] }[], ctx: Ctx, io: DraftIO): void {
  for (const { fi, names } of rep) {
    const b = (g.banned[fi] ??= []);
    for (const n of names) if (!b.includes(n)) b.push(n);
    g.redos[fi] = (g.redos[fi] ?? 0) + 1;
  }
  const fis = rep.map(r => r.fi);
  for (const [id, t] of act) {
    t.att++;
    t.queue = [];
    for (const fi of fis) {
      t.picks[fi] = null;
      const o = deal(g, id, fi, ctx);
      t.opts[fi] = o;
      if (o.length) t.queue.push(fi);
    }
  }
  g.redo = fis;
  s.notice = redoNotice(fis.map(fi => io.label(g.frs[fi] as FranchiseKey)));
}

/** Sem repetidos: grava o histórico, tira os escolhidos das próximas rodadas e começa a revelação. */
function finishPicks(s: RoomState, g: DraftGame, act: [string, DraftTeam][], ctx: Ctx, io: DraftIO): void {
  const names = new Map(s.players.map(p => [p.id, p.name] as const));
  g.redo = null;
  s.notice = '';
  g.history.push({
    round: g.round,
    teams: act.map(([id, t]) => ({
      id,
      name: names.get(id) ?? id,
      picks: t.picks.flatMap(p => (p ? [{ ...p }] : [])),
    })),
  });
  for (const [, t] of act)
    t.picks.forEach((p, fi) => {
      if (!p) return;
      const k = g.frs[fi] as FranchiseKey;
      const u = own(g.used, k) ?? (g.used[k] = []);
      if (!u.includes(p.name)) u.push(p.name);
    });
  g.step = 'reveal';
  g.reveal = 0;
  openReveal(s, g, ctx, io);
}

// ---------- revelação ----------

/** Escolhas de cada jogador (da rodada atual) na franquia `fi`, prontas pra votação. */
function revealItems(g: DraftGame, fi: number): Qualified[] {
  const h = g.history.find(x => x.round === g.round);
  const k = g.frs[fi];
  if (!h) return [];
  return h.teams.flatMap(tm => {
    const p = tm.picks.find(e => e.fr === k);
    return p ? [{ ...p, k: `d${g.round}-${fi}-${tm.id}`, by: tm.id, byName: tm.name, round: g.round, fi }] : [];
  });
}

/** Abre a votação da franquia g.reveal (pula franquia sem ninguém); acabou a rodada: próxima rodada ou a final. */
function openReveal(s: RoomState, g: DraftGame, ctx: Ctx, io: DraftIO): void {
  for (; g.reveal < g.frs.length; g.reveal++) {
    const items = revealItems(g, g.reveal);
    if (items.length) {
      io.openVote(s, items, items.map(q => `de ${q.byName}`));
      return;
    }
  }
  s.vote = null;
  if (g.round < g.rounds) {
    g.round++;
    beginRound(s, g, ctx, io);
  } else startFinal(s, g, ctx, io);
}

/** Depois do resultado: o vencedor se classifica (revelação) ou avança na chave (final). */
export function draftNext(s: RoomState, ctx: Ctx, io: DraftIO): boolean {
  const g = draftOf(s);
  const r = s.vote?.result;
  if (!g || !s.vote || !r) return false;
  if (g.step === 'reveal') {
    const w = s.vote.items[r.win] as Qualified;
    g.qualified.push({ ...w, k: `q${g.round}-${g.reveal}` });
    g.reveal++;
    s.notice = '';
    openReveal(s, g, ctx, io);
    return true;
  }
  if (g.step === 'final' && g.final) {
    const pair = cupPair(g.final);
    if (!pair) return false;
    cupChoose(g.final, pair[r.win === 1 ? 1 : 0], ctx.rand);
    s.notice = '';
    nextMatch(s, g, ctx, io);
    return true;
  }
  return false;
}

// ---------- final ----------

/** Passo 3: 1 classificado é campeão direto; senão, chave fixa com byes em confrontos diferentes escolhidos ao acaso. */
function startFinal(s: RoomState, g: DraftGame, ctx: Ctx, io: DraftIO): void {
  g.redo = null;
  s.vote = null;
  const q = g.qualified;
  if (q.length <= 1) {
    g.champion = q[0] ? { ...q[0] } : null;
    g.step = 'end';
    return;
  }
  let size = 2;
  while (size < q.length) size *= 2;
  const matches = size / 2;
  const byes = new Set(shuffle([...Array(matches).keys()], ctx.rand).slice(0, size - q.length));
  const seeds = shuffle(q.map(e => ({ ...e })), ctx.rand);
  const list: Entry[] = [];
  let n = 0;
  let b = 0;
  for (let m = 0; m < matches; m++) {
    list.push(seeds[n++] as Entry);
    list.push(byes.has(m) ? { name: 'bye', img: '', fr: '', k: `bye-${++b}` } : (seeds[n++] as Entry));
  }
  g.final = startCup(list, false);
  g.step = 'final';
  nextMatch(s, g, ctx, io);
}

/** Confronto com bye avança sozinho; abre a votação do próximo confronto de verdade ou fecha com o campeão. */
function nextMatch(s: RoomState, g: DraftGame, ctx: Ctx, io: DraftIO): void {
  const c = g.final as Cup;
  for (let pair = cupPair(c); pair; pair = cupPair(c)) {
    const [a, b] = pair;
    if (!isBye(a) && !isBye(b)) {
      io.openVote(s, [a, b], [a, b].map(e => `de ${(e as Qualified).byName} · R${(e as Qualified).round}`));
      return;
    }
    cupChoose(c, isBye(a) ? b : a, ctx.rand);
  }
  s.vote = null;
  const champ = g.qualified.find(q => same(q, c.champ)) ?? (c.champ as Qualified | null);
  g.champion = champ ? { ...champ } : null;
  g.step = 'end';
}
