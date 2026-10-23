// O que cada jogador recebe da sala: sem o saco de sorteio, com o próprio voto e, com voto secreto, sem os nomes de quem votou.
// No Draft: só as próprias opções e escolhas; dos outros, só se já terminaram (até a revelação).
import { roundName } from '../core/cup';
import { isBye } from './draft';
import type { DraftGame, DraftView, GameView, RoomState, RoomView, Vote, VoteView } from './types';

export function viewFor(s: RoomState, pid: string, now: number): RoomView {
  const v = s.vote;
  const open = s.phase === 'play' && !!v && !v.result;
  return {
    code: s.code,
    me: pid,
    hostId: s.hostId,
    phase: s.phase,
    cfg: structuredClone(s.cfg),
    notice: s.notice,
    players: s.players.map(p => ({
      id: p.id,
      name: p.name,
      host: p.host,
      online: p.online,
      voted: open && Object.hasOwn((v as Vote).ballots, p.id),
    })),
    game: gameView(s, pid),
    vote: v ? voteView(s, v, pid, now) : null,
  };
}

function gameView(s: RoomState, pid: string): GameView | null {
  const g = s.game;
  if (!g) return null;
  if (g.mode === 'cup') {
    const c = g.cup;
    return {
      mode: 'cup',
      cup: structuredClone(c),
      title: c.champ ? 'Campeão' : roundName(c.round.length),
      count: c.champ ? '' : `confronto ${c.i / 2 + 1} de ${c.round.length / 2}`,
    };
  }
  if (g.mode === 'draft') return draftView(s, g, pid);
  return { mode: g.mode, frs: [...g.frs], streak: [...g.streak] };
}

function draftView(s: RoomState, g: DraftGame, pid: string): DraftView {
  const t = Object.hasOwn(g.teams, pid) ? g.teams[pid] : undefined;
  const fi = t && g.step === 'pick' && !t.skipped ? (t.queue[0] ?? null) : null;
  const names = new Map(s.players.map(p => [p.id, p.name] as const));
  return {
    mode: 'draft',
    frs: [...g.frs],
    x: g.x,
    rounds: g.rounds,
    round: g.round,
    step: g.step,
    me: t
      ? {
          fi,
          opts: fi === null ? [] : (t.opts[fi] ?? []).map(e => ({ ...e })),
          picks: t.picks.map(p => (p ? { ...p } : null)),
          att: t.att,
          skipped: t.skipped,
        }
      : null,
    progress: g.order.flatMap(id => {
      const tm = Object.hasOwn(g.teams, id) ? g.teams[id] : undefined;
      if (!tm || !names.has(id)) return [];
      const state: DraftView['progress'][number]['state'] = tm.skipped ? 'pulado' : tm.queue.length ? 'escolhendo' : 'pronto';
      return [{ id, name: names.get(id) as string, state }];
    }),
    redo: g.redo ? g.redo.map(i => g.frs[i] as string) : null,
    reveal: g.reveal,
    qualified: structuredClone(g.qualified),
    final: g.final ? structuredClone(g.final) : null,
    ...finalTitle(g),
    champion: g.champion ? { ...g.champion } : null,
    history: g.step === 'end' ? structuredClone(g.history) : null,
  };
}

/** Rodada da final e "confronto X de Y" contando só os confrontos de verdade (sem bye); '' fora da final. */
function finalTitle(g: DraftGame): { title: string; count: string } {
  const c = g.final;
  if (g.step !== 'final' || !c || c.champ) return { title: '', count: '' };
  const real = (c.rounds[c.rounds.length - 1] ?? []).flatMap((m, i) => (isBye(m.a) || isBye(m.b) ? [] : [i]));
  return { title: roundName(c.round.length), count: `confronto ${real.indexOf(c.i / 2) + 1} de ${real.length}` };
}

function voteView(s: RoomState, v: Vote, pid: string, now: number): VoteView {
  const r = v.result;
  const names = new Map(s.players.map(p => [p.id, p.name] as const));
  return {
    seq: v.seq,
    items: v.items.map(e => ({ ...e })),
    extras: [...v.extras],
    mine: Object.hasOwn(v.ballots, pid) ? (v.ballots[pid] as number) : null,
    result: r
      ? {
          counts: [...r.counts],
          // quem saiu da sala depois de votar continua na contagem, mas some da lista de nomes
          voters: s.cfg.secret ? null : r.voters.map(ids => ids.flatMap(id => (names.has(id) ? [names.get(id) as string] : []))),
          win: r.win,
          tie: r.tie ? [...r.tie] : null,
          how: r.how,
          spin: r.spin ? { ...r.spin, among: [...r.spin.among], age: now - r.spin.at } : null,
        }
      : null,
  };
}
