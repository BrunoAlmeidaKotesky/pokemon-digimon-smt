// Estado do site e as ações dos modos solo. É um controlador imperativo de propósito: reproduz o fluxo do
// site antigo na mesma ordem (inclusive as chamadas a Math.random), e o React só desenha o que está aqui.
// Toda mudança chama emit(), que avisa os componentes (useApp).
import { useSyncExternalStore } from 'react';
import type { Cup, Entry, Item, Stats } from '../types';
import { SOURCES, KEYS, LABELS } from '../sources';
import { resolve } from '../sources/resolve';
import { Bags, localBagStore, memoryBagStore } from '../core/bags';
import * as customs from '../customs/store';
import { toItems, isCustomKey } from '../customs/model';
import { loadStats, saveStats, record, updateBest, emptyStats } from '../core/stats';
import { buildEntrants, startCup, cupSync, cupPair, cupChoose } from '../core/cup';
import { planSpin, spinDelay, spinIndex, PICK_MS, PICK_MS_CALM } from '../core/spin';

export type Mode = 'duel' | 'trio' | 'quartet' | 'cup' | 'stats' | 'customs' | 'online';
export type Row = 'duel' | 'trio' | 'quartet' | 'cup';
/** Trio e Quarteto: rei do morro com 3 ou 4 lados. */
export type Multi = 'trio' | 'quartet';
/** Um modo de N lados: franquia, carta na arena, sequência de vitórias e desafiante já sorteado de cada lado. */
export interface Sides {
  fr: string[];
  slots: (Entry | null)[] | null;
  streak: number[];
  queue: (Entry | null)[];
  /** alguma lista ainda não carregou */
  waiting: boolean;
}
const sides = (fr: string[]): Sides => ({ fr, slots: null, streak: fr.map(() => 0), queue: fr.map(() => null), waiting: true });

// ---------- assinatura (React) ----------
let version = 0;
const listeners = new Set<() => void>();
export function emit() { version++; listeners.forEach(l => l()); }
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export function useApp() { useSyncExternalStore(subscribe, () => version); return app; }

// ---------- estado ----------
export const app = {
  lists: Object.fromEntries(SOURCES.map(s => [s.key, s.initial ?? null])) as Record<string, Item[] | null>,
  /** contagem, 'carregando', 'falhou' ou null (franquia removida) */
  st: Object.fromEntries(SOURCES.map(s => [s.key, s.initial ? s.initial.length : 'carregando'])) as Record<string, string | number | null>,
  /** franquias que aparecem nos seletores: as fixas (Sujimon some se faltar a lista) e depois as minhas customizadas */
  avail: [...KEYS],
  sujiVisible: false,
  mode: 'duel' as Mode,

  // o que está na arena ativa e o que fazer ao escolher (teclado e roleta usam)
  current: [] as Entry[],
  onChoose: null as ((e: Entry) => void) | null,
  currentRow: null as Row | null,

  duelFr: ['pokemon', 'digimon'] as [string, string],
  duel: { slots: [null, null] as (Entry | null)[], streak: [0, 0], queue: [null, null] as (Entry | null)[] },
  duelWaiting: true,

  trio: sides(['pokemon', 'digimon', 'smt']),
  quartet: sides(['pokemon', 'digimon', 'smt', 'jojo']),

  cupCfg: { size: 16, frs: Object.fromEntries(KEYS.map(k => [k, true])) as Record<string, boolean>, even: true, mix: true },
  cup: null as Cup | null,
  cupStartLabel: 'Começar',
  cupHidden: { setup: false, play: true, end: true, log: true },

  stats: loadStats() as Stats,

  spinning: false,
  spinRow: null as Row | null,
  lit: null as number | null,
  picked: null as number | null,
};

const bags = new Bags(localBagStore);
/** franquias customizadas sorteiam com um saco só na memória (nada delas é salvo) */
const customBags = new Bags(memoryBagStore());
const ready = (k: string) => !!(app.lists[k] && app.lists[k]!.length);
const pick = (k: string, avoid: { name: string }[]) => (isCustomKey(k) ? customBags : bags).pick(k, app.lists[k]!, avoid);
const customOf = (k: string) => customs.getRoom()?.find(f => f.key === k) ?? customs.getMine().find(f => f.key === k);
export const label = (k: string) => LABELS[k] ?? customOf(k)?.label ?? '';
/** Cor da franquia pra CSS: as fixas têm variável (--pokemon...), as customizadas têm a cor do grupo. */
export const frColor = (k: string) => (isCustomKey(k) ? customOf(k)?.color ?? 'var(--line)' : `var(--${k})`);
/** Estilo com a cor da franquia customizada (as fixas usam o CSS por data-fr). */
export const frStyle = (k: string) => (isCustomKey(k) ? ({ '--c': frColor(k) } as Record<string, string>) : undefined);
function preload(items: Entry[]) { items.forEach(i => resolve(i).then(x => { if (x.img) { const im = new Image(); im.src = x.img; } })); }

function show(row: Row, items: Entry[], choose: (e: Entry) => void) {
  app.current = items; app.onChoose = choose; app.currentRow = row;
}
export function choose(it: Entry) { if (!app.spinning && app.onChoose) app.onChoose(it); }
/** Grava no Placar. Confronto com franquia customizada não entra (nada delas fica salvo). */
const hasCustom = (all: Entry[]) => all.some(x => isCustomKey(x.fr));
function record2(w: Entry, all: Entry[]) { if (hasCustom(all)) return; record(app.stats, w, all, label); saveStats(app.stats); }

// ---------- duelo (rei do morro) ----------
// Quem é escolhido fica no seu lado; o lado perdedor recebe um novo desafiante da mesma franquia.
const sideFr = (i: number) => app.duelFr[i]!;
function challenger(i: number): Entry {
  const q = app.duel.queue[i]; app.duel.queue[i] = null;
  if (q && q.fr === sideFr(i)) return q;
  return pick(sideFr(i), app.duel.slots.filter(Boolean) as Entry[]);
}
function queueNext(i: number) {
  if (ready(sideFr(i))) { const q = pick(sideFr(i), app.duel.slots.filter(Boolean) as Entry[]); app.duel.queue[i] = q; preload([q]); }
}
function renderDuel() {
  if (!ready(sideFr(0)) || !ready(sideFr(1))) { app.current = []; app.duelWaiting = true; return; }
  app.duelWaiting = false;
  for (const i of [0, 1]) if (!app.duel.slots[i]) { app.duel.slots[i] = challenger(i); app.duel.streak[i] = 0; }
  show('duel', app.duel.slots as Entry[], w => {
    const wi = app.duel.slots.indexOf(w), li = 1 - wi;
    record2(w, app.duel.slots as Entry[]);
    app.duel.streak[wi]!++;
    if (!isCustomKey(w.fr) && updateBest(app.stats, w, app.duel.streak[wi]!)) saveStats(app.stats);
    app.duel.slots[li] = null;
    renderDuel();
    queueNext(li);
    emit();
  });
}
function resetDuel() { app.duel = { slots: [null, null], streak: [0, 0], queue: [null, null] }; renderDuel(); queueNext(0); queueNext(1); }
export function setDuelFr(i: 0 | 1, k: string) {
  app.duelFr[i] = k; app.duel.slots[i] = null; app.duel.queue[i] = null; renderDuel(); queueNext(i); emit();
}
export function duelSkip() { resetDuel(); emit(); }

// ---------- trio e quarteto ----------
// Quem vence fica no lugar; os outros lados mandam novos desafiantes da sua franquia (sorteados na rodada anterior).
// O mesmo código serve pros dois e faz os sorteios na mesma ordem do Trio antigo.
function multiChallenger(m: Multi, i: number): Entry {
  const s = app[m];
  const q = s.queue[i]; s.queue[i] = null;
  return q && q.fr === s.fr[i] ? q : pick(s.fr[i]!, s.slots ? s.slots.filter(Boolean) as Entry[] : []);
}
function nextMulti(m: Multi) {
  const s = app[m];
  if (!s.fr.every(k => ready(k))) { app.current = []; s.waiting = true; return; }
  s.waiting = false;
  if (!s.slots) s.slots = s.fr.map(() => null);
  const slots = s.slots;
  s.fr.forEach((_, i) => { if (!slots[i]) { slots[i] = multiChallenger(m, i); s.streak[i] = 0; } });
  show(m, slots as Entry[], w => {
    const wi = s.slots!.indexOf(w);
    record2(w, s.slots as Entry[]);
    s.streak[wi]!++;
    s.slots = s.slots!.map((x, i) => i === wi ? x : null);
    nextMulti(m);
    s.fr.forEach((k, i) => {
      if (i !== wi && ready(k)) { const q = pick(k, s.slots as Entry[]); s.queue[i] = q; preload([q]); }
    });
    emit();
  });
}
function resetMulti(m: Multi) {
  const s = app[m];
  s.slots = null; s.streak = s.fr.map(() => 0); s.queue = s.fr.map(() => null);
  nextMulti(m);
}
/** Troca a franquia de um lado: só aquele lado recebe um desafiante novo (e perde a coroa). */
export function setSideFr(m: Multi, i: number, k: string) {
  const s = app[m];
  s.fr[i] = k;
  if (s.slots) s.slots[i] = null;
  s.queue[i] = null; s.streak[i] = 0; nextMulti(m); emit();
}
/** "Trocar os três" / "Trocar os quatro": recomeça com desafiantes novos em todos os lados. */
export function multiSkip(m: Multi) { resetMulti(m); emit(); }

// ---------- roleta ----------
// Acende as cartas em sequência, desacelerando, e escolhe a carta onde parar.
let spinTimer: ReturnType<typeof setTimeout> | null = null;
// body.spinning e os botões desabilitados mudam juntos, no mesmo instante (como no site antigo).
function setSpinning(on: boolean) {
  app.spinning = on;
  document.body.classList.toggle('spinning', on);
  document.querySelectorAll<HTMLButtonElement>('.spin').forEach(b => { b.disabled = on; });
}
export function spin() {
  if (app.spinning || !app.onChoose || !app.current.length) return;
  const row = ({ duel: 'duel', trio: 'trio', quartet: 'quartet', cup: 'cup' } as const)[app.mode as Row];
  if (!row || app.currentRow !== row) return;
  const items = app.current, chooseFn = app.onChoose, n = items.length;
  const { start, total } = planSpin(n);
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  setSpinning(true); app.spinRow = row; app.picked = null;
  let k = calm ? total : 0;
  const tick = () => {
    const idx = spinIndex(start, k, n);
    app.lit = idx;
    if (k >= total) {
      app.picked = idx; emit();
      spinTimer = setTimeout(() => {
        spinTimer = null; setSpinning(false); app.lit = null; app.picked = null; app.spinRow = null;
        if (app.onChoose === chooseFn) chooseFn(items[idx]!);
        emit();
      }, calm ? PICK_MS_CALM : PICK_MS);
      return;
    }
    emit();
    k++;
    spinTimer = setTimeout(tick, spinDelay(k, total));
  };
  tick();
}
function cancelSpin() {
  if (spinTimer) clearTimeout(spinTimer);
  spinTimer = null; setSpinning(false); app.lit = null; app.picked = null; app.spinRow = null;
}

// ---------- campeonato ----------
export function setCupCfg(patch: Partial<typeof app.cupCfg>) { Object.assign(app.cupCfg, patch); emit(); }
export function setCupFr(k: string, on: boolean) { app.cupCfg.frs[k] = on; emit(); }
let startLabelTimer: ReturnType<typeof setTimeout> | null = null;
export function cupStart() {
  const frs = app.avail.filter(k => app.cupCfg.frs[k] && ready(k));
  if (!frs.length) {
    app.cupStartLabel = 'Marque uma franquia já carregada'; emit();
    if (startLabelTimer) clearTimeout(startLabelTimer);
    startLabelTimer = setTimeout(() => { app.cupStartLabel = 'Começar'; emit(); }, 2000);
    return;
  }
  const lists = Object.fromEntries(frs.map(k => [k, app.lists[k]!]));
  const entrants = buildEntrants({ frs, size: app.cupCfg.size, even: app.cupCfg.even, mix: app.cupCfg.mix, lists });
  preload(entrants);
  app.cup = startCup(entrants, app.cupCfg.mix);
  app.cupHidden = { setup: true, end: true, play: false, log: false };
  cupStep();
  emit();
}
function cupStep() {
  const c = app.cup!;
  cupSync(c);
  if (c.champ) return cupFinish();
  show('cup', cupPair(c)!, w => { cupChoose(c, w); cupStep(); emit(); });
  resolveBracketImages();
}
function cupFinish() {
  app.current = []; app.onChoose = null; app.currentRow = null;
  app.cupHidden.play = true; app.cupHidden.end = false;
  resolveBracketImages();
}
export function cupAgain() { app.cupHidden.end = true; app.cupHidden.setup = false; app.cupHidden.log = true; app.cup = null; emit(); }
export function cupQuit() {
  app.cup = null; app.current = []; app.onChoose = null; app.currentRow = null;
  app.cupHidden.play = true; app.cupHidden.log = true; app.cupHidden.setup = false; emit();
}
// Digimon sem imagem: completa a miniatura quando a busca terminar
const resolving = new WeakSet<Entry>();
function resolveBracketImages() {
  app.cup?.rounds.flat().forEach(m => [m.a, m.b].forEach(it => {
    if (it && !it.img && it.href && !resolving.has(it)) { resolving.add(it); resolve(it).then(() => setTimeout(emit, 0)); }
  }));
}

// ---------- placar ----------
export function statsReset() { app.stats = emptyStats(); saveStats(app.stats); emit(); }

// ---------- navegação e teclado ----------
export function setMode(m: Mode) {
  app.mode = m;
  app.current = []; app.onChoose = null; app.currentRow = null; cancelSpin();
  if (m === 'duel') renderDuel();
  if (m === 'trio' || m === 'quartet') nextMulti(m);
  if (m === 'cup' && app.cup && !app.cupHidden.play) cupStep();
  emit();
}
let onlineKey: ((e: KeyboardEvent) => void) | null = null;
/** O modo online registra aqui o próprio teclado (votar com 1-9, R pra roleta do host). */
export function setOnlineKey(fn: (e: KeyboardEvent) => void) { onlineKey = fn; }
export function onKey(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null;
  if (t && ['SELECT', 'INPUT'].includes(t.tagName)) return;
  if (app.mode === 'online') { onlineKey?.(e); return; }
  const n = +e.key;
  if (app.spinning) return;
  if (n >= 1 && n <= app.current.length && app.onChoose) app.onChoose(app.current[n - 1]!);
  if (e.key === 'r' || e.key === 'R') spin();
}

// ---------- início ----------
/** franquias fixas que continuam disponíveis */
let base = [...KEYS];
/** Tira a franquia dos seletores; quem estava nela volta pra primeira da lista. */
function unselect(k: string) {
  const first = app.avail[0]!;
  ([0, 1] as const).forEach(i => { if (app.duelFr[i] === k) setDuelFr(i, first); });
  (['trio', 'quartet'] as const).forEach(m => app[m].fr.forEach((x, i) => { if (x === k) setSideFr(m, i, first); }));
}
function dropFranchise(k: string) {
  base = base.filter(x => x !== k);
  app.avail = app.avail.filter(x => x !== k);
  unselect(k);
  app.st[k] = null;
}
/** As franquias customizadas viram listas como as outras: minhas (solo e host) e as da sala (quando sou jogador). */
function syncCustoms() {
  const all = [...customs.getMine(), ...(customs.getRoom() ?? [])];
  for (const k of Object.keys(app.lists)) if (isCustomKey(k) && !all.some(f => f.key === k)) delete app.lists[k];
  for (const f of all) app.lists[f.key] = toItems(f);
  const mine = customs.getMine().map(f => f.key);
  const removed = app.avail.filter(k => isCustomKey(k) && !mine.includes(k));
  app.avail = [...base, ...mine];
  for (const k of mine) if (!(k in app.cupCfg.frs)) app.cupCfg.frs[k] = true;
  removed.forEach(unselect);
  // carta de franquia customizada na arena: pega o rótulo novo, ou sai se a imagem foi apagada
  const fresh = (e: Entry | null): Entry | null => {
    if (!e || !isCustomKey(e.fr)) return e;
    const it = app.lists[e.fr]?.find(x => x.img === e.img);
    return it ? (it.name === e.name ? e : { ...it, fr: e.fr }) : null;
  };
  app.duel.slots = app.duel.slots.map(fresh); app.duel.queue = app.duel.queue.map(fresh);
  for (const m of ['trio', 'quartet'] as const) {
    const sd = app[m];
    if (sd.slots) sd.slots = sd.slots.map(fresh);
    sd.queue = sd.queue.map(fresh);
  }
  // lado que ficou vazio: recebe um desafiante da lista nova
  if (app.mode === 'duel') renderDuel();
  if (app.mode === 'trio' || app.mode === 'quartet') nextMulti(app.mode);
  emit();
}
export function statusText() { return KEYS.filter(k => app.st[k] != null).map(k => `${label(k)}: ${app.st[k]}`).join(' · '); }

let started = false;
export function init() {
  if (started) return;
  started = true;
  SOURCES.filter(s => !s.initial).forEach(s => {
    s.load()
      .then(list => { app.lists[s.key] = list; app.st[s.key] = list.length; if (s.optional) app.sujiVisible = true; })
      .catch(() => { if (s.optional) dropFranchise(s.key); else app.st[s.key] = 'falhou'; })
      .finally(() => {
        if (app.mode === 'duel' && !app.current.length) resetDuel();
        if ((app.mode === 'trio' || app.mode === 'quartet') && !app.current.length) resetMulti(app.mode);
        emit();
      });
  });
  customs.subscribe(syncCustoms);
  if (new URLSearchParams(location.search).has('sala')) app.mode = 'online';
  renderDuel();
  document.addEventListener('keydown', e => { onKey(e); emit(); });
}
