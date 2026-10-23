// Campeonato (mata-mata): montagem dos participantes, avanço das rodadas e a chave (colunas + linhas).
import type { Cup, Entry, Item, Match } from '../types';
import { rnd, shuffle } from './random';

const ROUND_NAMES: Record<number, string> = { 2: 'Final', 4: 'Semifinal', 8: 'Quartas de final' };

/** Nome da rodada pelo nº de participantes nela. */
export function roundName(n: number): string {
  return ROUND_NAMES[n] || `Rodada de ${n}`;
}

/**
 * Monta os pares sempre juntando a franquia com mais gente sobrando com a segunda maior,
 * o que deixa o mínimo possível de confrontos da mesma franquia. Devolve a lista achatada [a1, b1, a2, b2, ...].
 */
export function pairUp(list: Entry[]): Entry[] {
  const g: Record<string, Entry[]> = {};
  shuffle([...list]).forEach(x => (g[x.fr] = g[x.fr] || []).push(x));
  const pairs: (Entry | undefined)[][] = [];
  for (;;) {
    const ks = Object.keys(g)
      .filter(k => (g[k] as Entry[]).length)
      .sort((a, b) => (g[b] as Entry[]).length - (g[a] as Entry[]).length);
    if (!ks.length) break;
    const a = (g[ks[0] as string] as Entry[]).pop();
    const b = (g[(ks.length > 1 ? ks[1] : ks[0]) as string] as Entry[]).pop();
    pairs.push([a, b]);
  }
  return shuffle(pairs).flat() as Entry[];
}

/** [a1, b1, a2, b2, ...] -> confrontos ainda sem vencedor. */
export function toMatches(list: (Entry | null)[]): Match[] {
  const m: Match[] = [];
  for (let i = 0; i < list.length; i += 2) m.push({ a: list[i] ?? null, b: list[i + 1] ?? null, w: null });
  return m;
}

/**
 * Participantes do campeonato (o $('cupStart').onclick do antigo, sem a parte de tela).
 * `frs` = franquias marcadas e já carregadas, na ordem das franquias; `lists[k]` = lista completa de cada uma.
 */
export function buildEntrants(opts: { frs: string[]; size: number; even: boolean; mix: boolean; lists: Record<string, Item[]> }): Entry[] {
  const { frs, size, even, mix, lists } = opts;
  if (!frs.length) return [];
  const counts: Record<string, number> = {};
  frs.forEach(k => (counts[k] = 0));
  if (even) {
    frs.forEach(k => (counts[k] = Math.floor(size / frs.length)));
    shuffle([...frs])
      .slice(0, size % frs.length)
      .forEach(k => (counts[k] = (counts[k] as number) + 1));
  } else {
    for (let i = 0; i < size; i++) {
      const k = rnd(frs);
      counts[k] = (counts[k] as number) + 1;
    }
  }
  let entrants: Entry[] = [];
  const pools: Record<string, Item[]> = {};
  frs.forEach(k => {
    const pool = (pools[k] = shuffle([...(lists[k] as Item[])]));
    entrants.push(...pool.splice(0, counts[k] as number).map(p => ({ ...p, fr: k })));
  });
  // franquia com poucos personagens: completa as vagas com as outras
  for (let i = 0; entrants.length < size && frs.some(k => (pools[k] as Item[]).length); i++) {
    const k = frs[i % frs.length] as string;
    const pool = pools[k] as Item[];
    if (pool.length) entrants.push({ ...(pool.pop() as Item), fr: k });
  }
  let n = 2;
  while (n * 2 <= Math.min(size, entrants.length)) n *= 2;
  entrants = shuffle(entrants).slice(0, n);
  if (mix) entrants = pairUp(entrants);
  return entrants;
}

export function startCup(entrants: Entry[], mix: boolean): Cup {
  return { round: entrants, next: [], i: 0, rounds: [toMatches(entrants)], losers: {}, champ: null, mix };
}

/** Início do cupStep antigo: rodada acabou -> campeão (sobrou 1) ou próxima rodada (re-pareada se misto). */
export function cupSync(c: Cup): void {
  if (c.i >= c.round.length) {
    if (c.next.length === 1) {
      c.champ = c.next[0] as Entry;
      return;
    }
    c.round = c.mix ? pairUp(c.next) : c.next;
    c.next = [];
    c.i = 0;
    c.rounds.push(toMatches(c.round));
  }
}

/** Confronto da vez, ou null se já tem campeão. */
export function cupPair(c: Cup): [Entry, Entry] | null {
  if (c.champ) return null;
  return [c.round[c.i] as Entry, c.round[c.i + 1] as Entry];
}

/** Mesmo personagem: mesmo objeto, ou os dois com o mesmo `k` (objetos que atravessaram a rede). */
export function same(a: Entry | null | undefined, b: Entry | null | undefined): boolean {
  return a === b || (a != null && b != null && a.k !== undefined && a.k === b.k);
}

/** Escolha no confronto da vez (o callback do cupStep antigo) e avanço da rodada. */
export function cupChoose(c: Cup, w: Entry): void {
  if (c.champ) return;
  const a = c.round[c.i] as Entry;
  const b = c.round[c.i + 1] as Entry;
  const l = same(w, a) ? b : a;
  c.next.push(w);
  ((c.rounds[c.rounds.length - 1] as Match[])[c.i / 2] as Match).w = w;
  (c.losers[c.round.length] = c.losers[c.round.length] || []).push(l);
  c.i += 2;
  cupSync(c);
}

export interface BracketMatch {
  m: Match;
  /** ainda não chegou a vez: mostra "???" nos dois lados */
  hidden: boolean;
  /** confronto da vez */
  now: boolean;
}

export interface BracketColumn {
  title: string;
  matches: BracketMatch[];
  /** a última coluna, só com o campeão (m.a; m.b é sempre null) */
  champ: boolean;
}

/**
 * Colunas da chave (renderLog antigo): rodadas jogadas, rodadas futuras com placeholders
 * (na chave fixa a próxima já mostra quem passou; no modo misto os pares só se formam depois) e, por último, "Campeão".
 */
export function bracketColumns(c: Cup): BracketColumn[] {
  const last = c.rounds[c.rounds.length - 1] as Match[];
  const cols: { title: string; matches: Match[] }[] = c.rounds.map(r => ({ title: roundName(r.length * 2), matches: r }));
  let n = last.length / 2;
  if (!c.champ) {
    while (n >= 1) {
      const ms: Match[] = Array.from({ length: n }, () => ({ a: null, b: null, w: null }));
      if (n === last.length / 2 && !c.mix) c.next.forEach((w, i) => ((ms[i >> 1] as Match)[i % 2 ? 'b' : 'a'] = w));
      cols.push({ title: roundName(n * 2), matches: ms });
      n /= 2;
    }
  }
  const cur = c.rounds.length - 1;
  const out: BracketColumn[] = cols.map((col, ci) => ({
    title: col.title,
    champ: false,
    matches: col.matches.map((m, mi) => ({
      m,
      hidden: !c.champ && ci === cur && mi > c.i / 2,
      now: !c.champ && ci === cur && mi === c.i / 2,
    })),
  }));
  out.push({ title: 'Campeão', champ: true, matches: [{ m: { a: c.champ, b: null, w: null }, hidden: false, now: false }] });
  return out;
}

/**
 * Linhas da chave (parte lógica do drawLines antigo): cada confronto decidido (coluna r, confronto m)
 * liga ao confronto (tr, tm) em que o vencedor aparece. Índices de coluna = os de bracketColumns().
 */
export function bracketLinks(c: Cup): { r: number; m: number; tr: number; tm: number }[] {
  const cols = bracketColumns(c);
  const exists = (r: number, m: number) => r < cols.length && m < (cols[r] as BracketColumn).matches.length;
  const links: { r: number; m: number; tr: number; tm: number }[] = [];
  c.rounds.forEach((round, r) =>
    round.forEach((m, mi) => {
      if (!m.w) return;
      let tr: number | undefined;
      let tm: number | undefined;
      const nr = c.rounds[r + 1];
      if (nr) {
        tm = nr.findIndex(x => same(x.a, m.w) || same(x.b, m.w));
        tr = r + 1;
      } else if (same(c.champ, m.w)) {
        tr = r + 1;
        tm = 0;
      } else if (!c.mix) {
        tr = r + 1;
        tm = mi >> 1;
      }
      if (tr == null || tm == null || tm < 0) return;
      if (!exists(r, mi) || !exists(tr, tm)) return;
      links.push({ r, m: mi, tr, tm });
    }),
  );
  return links;
}

/** Altura da área dos confrontos (px). */
export function bracketHeight(c: Cup): number {
  return Math.max((c.rounds[0] as Match[]).length * 64, 160);
}
