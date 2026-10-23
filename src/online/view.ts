// O que cada jogador recebe da sala: sem o saco de sorteio, com o próprio voto e, com voto secreto, sem os nomes de quem votou.
import { roundName } from '../core/cup';
import type { Game, GameView, RoomState, RoomView, Vote, VoteView } from './types';

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
    game: gameView(s.game),
    vote: v ? voteView(s, v, pid, now) : null,
  };
}

function gameView(g: Game | null): GameView | null {
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
  return { mode: g.mode, frs: [...g.frs], streak: [...g.streak] };
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
