// Estado do site e as ações dos modos solo. É um controlador imperativo de propósito: reproduz o fluxo do
// site antigo na mesma ordem (inclusive as chamadas a Math.random), e o React só desenha o que está aqui.
// Toda mudança chama emit(), que avisa os componentes (useApp).
import { useSyncExternalStore } from 'react';
import type { Cup, Entry, Item, Stats } from '../types';
import { SOURCES, KEYS, LABELS } from '../sources';
import { resolve } from '../sources/resolve';
import { Bags, localBagStore } from '../core/bags';
import { loadStats, saveStats, record, updateBest, emptyStats } from '../core/stats';
import { buildEntrants, startCup, cupSync, cupPair, cupChoose } from '../core/cup';
import { planSpin, spinDelay, spinIndex, PICK_MS, PICK_MS_CALM } from '../core/spin';

export type Mode = 'duel' | 'trio' | 'cup' | 'stats';
export type Row = 'duel' | 'trio' | 'cup';

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
  /** franquias que ainda aparecem nos seletores (Sujimon some se faltar a lista) */
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

  trioFr: ['pokemon', 'digimon', 'smt'] as [string, string, string],
  trio: { slots: null as (Entry | null)[] | null, streak: [0, 0, 0], queue: [null, null, null] as (Entry | null)[] },
  trioWaiting: true,

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
const ready = (k: string) => !!(app.lists[k] && app.lists[k]!.length);
const pick = (k: string, avoid: { name: string }[]) => bags.pick(k, app.lists[k]!, avoid);
export const label = (k: string) => LABELS[k] ?? '';
function preload(items: Entry[]) { items.forEach(i => resolve(i).then(x => { if (x.img) { const im = new Image(); im.src = x.img; } })); }

function show(row: Row, items: Entry[], choose: (e: Entry) => void) {
  app.current = items; app.onChoose = choose; app.currentRow = row;
}
export function choose(it: Entry) { if (!app.spinning && app.onChoose) app.onChoose(it); }
function record2(w: Entry, all: Entry[]) { record(app.stats, w, all, label); saveStats(app.stats); }

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
    if (updateBest(app.stats, w, app.duel.streak[wi]!)) saveStats(app.stats);
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

// ---------- trio ----------
// Quem vence fica no lugar; os outros dois lados mandam novos desafiantes da sua franquia.
const trioFr = (i: number) => app.trioFr[i]!;
function trioChallenger(i: number): Entry {
  const q = app.trio.queue[i]; app.trio.queue[i] = null;
  return q && q.fr === trioFr(i) ? q : pick(trioFr(i), app.trio.slots ? app.trio.slots.filter(Boolean) as Entry[] : []);
}
function nextTrio() {
  if (![0, 1, 2].every(i => ready(trioFr(i)))) { app.current = []; app.trioWaiting = true; return; }
  app.trioWaiting = false;
  if (!app.trio.slots) app.trio.slots = [null, null, null];
  const slots = app.trio.slots;
  [0, 1, 2].forEach(i => { if (!slots[i]) { slots[i] = trioChallenger(i); app.trio.streak[i] = 0; } });
  show('trio', slots as Entry[], w => {
    const wi = app.trio.slots!.indexOf(w);
    record2(w, app.trio.slots as Entry[]);
    app.trio.streak[wi]!++;
    app.trio.slots = app.trio.slots!.map((x, i) => i === wi ? x : null);
    nextTrio();
    [0, 1, 2].forEach(i => {
      if (i !== wi && ready(trioFr(i))) { const q = pick(trioFr(i), app.trio.slots as Entry[]); app.trio.queue[i] = q; preload([q]); }
    });
    emit();
  });
}
function resetTrio() { app.trio = { slots: null, streak: [0, 0, 0], queue: [null, null, null] }; nextTrio(); }
export function setTrioFr(i: 0 | 1 | 2, k: string) {
  app.trioFr[i] = k;
  if (app.trio.slots) app.trio.slots[i] = null;
  app.trio.queue[i] = null; app.trio.streak[i] = 0; nextTrio(); emit();
}
export function trioSkip() { resetTrio(); emit(); }

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
  const row = ({ duel: 'duel', trio: 'trio', cup: 'cup' } as const)[app.mode as Row];
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
  const frs = KEYS.filter(k => app.avail.includes(k) && app.cupCfg.frs[k] && ready(k));
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
  if (m === 'trio') nextTrio();
  if (m === 'cup' && app.cup && !app.cupHidden.play) cupStep();
  emit();
}
export function onKey(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null;
  if (t && ['SELECT', 'INPUT'].includes(t.tagName)) return;
  const n = +e.key;
  if (app.spinning) return;
  if (n >= 1 && n <= app.current.length && app.onChoose) app.onChoose(app.current[n - 1]!);
  if (e.key === 'r' || e.key === 'R') spin();
}

// ---------- início ----------
function dropFranchise(k: string) {
  app.avail = app.avail.filter(x => x !== k);
  const first = app.avail[0]!;
  ([0, 1] as const).forEach(i => { if (app.duelFr[i] === k) setDuelFr(i, first); });
  ([0, 1, 2] as const).forEach(i => { if (app.trioFr[i] === k) setTrioFr(i, first); });
  app.st[k] = null;
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
        if (app.mode === 'trio' && !app.current.length) resetTrio();
        emit();
      });
  });
  renderDuel();
  document.addEventListener('keydown', e => { onKey(e); emit(); });
}
