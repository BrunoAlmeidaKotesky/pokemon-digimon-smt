// O que cada jogador recebe da sala: sem o saco de sorteio, com o próprio voto e, com voto secreto, sem os nomes de quem votou.
// No Draft: só as próprias opções e escolhas; dos outros, só se já terminaram (até a revelação).
// No Ranking: só o personagem da vez (na votação) e as posições já preenchidas, nunca a fila.
// No Adivinha: os chutes com as pistas e o que já foi revelado (emojis, imagem); o secreto só depois da rodada.
import { roundName } from '../core/cup';
import { emojisVisiveis } from '../adivinha/emoji';
import { isBye } from './draft';
import type { AdivinhaGame, AdivinhaView, DraftGame, DraftView, GameView, RankGame, RankView, RoomState, RoomView, Vote, VoteView } from './types';

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
    game: gameView(s, pid, now),
    vote: v ? voteView(s, v, pid, now) : null,
  };
}

function gameView(s: RoomState, pid: string, now: number): GameView | null {
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
  if (g.mode === 'rank') return rankView(g);
  if (g.mode === 'adivinha') return adivinhaView(s, g, now);
  return { mode: g.mode, frs: [...g.frs], streak: [...g.streak] };
}

/** Ranking às cegas: as posições de cada top e quantos faltam (contando o da vez); a fila não sai do host. */
function rankView(g: RankGame): RankView {
  const r = g.rank;
  return {
    mode: 'rank',
    size: r.size,
    mix: r.mix,
    cur: r.cur,
    tops: r.tops.map(t => ({ fr: t.fr, slots: t.slots.map(e => (e ? { ...e } : null)), left: t.queue.length })),
  };
}

/** Adivinha: o secreto (nome, imagem, emojis, informações) não vai pra ninguém enquanto a rodada está aberta. */
function adivinhaView(s: RoomState, g: AdivinhaGame, now: number): AdivinhaView {
  const aberta = g.passo === 'chute';
  const erros = g.chutes.filter(c => c.alvo && !c.certo).length;
  const emoji = g.submodo === 'emoji' ? (g.secreto.emoji ?? []) : [];
  const nome = (id: string) => s.players.find(p => p.id === id)?.name ?? g.nomes[id] ?? '?';
  const naSala = new Set(s.players.map(p => p.id));
  return {
    mode: 'adivinha',
    grupo: g.grupo,
    submodo: g.submodo,
    grupos: [...g.grupos],
    submodos: [...g.submodos],
    rodadas: g.rodadas,
    tempo: g.tempo,
    rodada: g.rodada,
    passo: g.passo,
    ordem: [...g.ordem],
    vez: g.vez,
    restante: aberta && g.vez && g.tempo > 0 ? Math.max(0, g.prazo - now) : 0,
    chutes: structuredClone(g.chutes),
    erros,
    emoji: emoji.slice(0, emojisVisiveis(emoji.length, erros, !aberta)),
    totalEmoji: emoji.length,
    // Imagem (recorte) e Blur: a imagem precisa ir pra aparecer
    imagem: g.submodo === 'imagem' || g.submodo === 'blur' ? g.secreto.img : '',
    foco: g.foco,
    recorte: g.recorte ? [...g.recorte] : null,
    secreto: aberta ? null : { name: g.secreto.name, img: g.secreto.img, fr: g.secreto.fr },
    vencedor: g.vencedor,
    // quem está na sala, mais quem saiu com ponto; mais pontos primeiro (empate: ordem da sala)
    placar: Object.keys(g.placar)
      .filter(id => naSala.has(id) || (g.placar[id] ?? 0) > 0)
      .map(id => ({ id, nome: nome(id), pontos: g.placar[id] ?? 0 }))
      .sort((a, b) => b.pontos - a.pontos),
    historico: g.historico.map(h => ({ ...h, secreto: { ...h.secreto }, vencedorNome: h.vencedor ? nome(h.vencedor) : '' })),
  };
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
    ...(v.pos ? { pos: { n: v.pos.n, free: [...v.pos.free] } } : {}),
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
