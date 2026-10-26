import type { Entry } from '../../types';
import type { RankView, RoomView, VoteView } from '../../online/types';
import { player } from '../../online/runtime';
import { label } from '../../state/app';
import { Card } from '../../components/Card';
import { RankBoard, RankTops, topTitle, lugar, type RankMark } from '../../components/RankBoard';
import { useSpinAnim } from './useSpinAnim';
import { Faltam, HostCtl, Tally, nomeLista, votos } from './Play';

/** Ranking online: cada personagem vira uma votação da posição (só as livres); a mais votada fica com ele. */
export function RankPlay({ v }: { v: RoomView }) {
  const g = v.game as RankView;
  const t = g.tops[g.cur];
  if (!t) return <RankEnd v={v} g={g} />;
  const placed = t.slots.filter(Boolean).length;
  return (
    <div className="stack" id="onRank">
      <p className="draft-round" id="onRankHead">
        <b id="onRankTitle">{topTitle(t.fr, t.slots.length)}</b>{' · '}
        <span id="onRankCount">{Math.min(placed + 1, t.slots.length)} de {t.slots.length}</span>
        {g.tops.length > 1 && <span className="mute"> · top {g.cur + 1} de {g.tops.length}</span>}
      </p>
      {v.vote && <RankVote v={v} vote={v.vote} slots={t.slots} />}
      {g.cur > 0 && (
        <details className="panel" id="onRankDone">
          <summary><b>{g.cur === 1 ? 'Top pronto' : 'Tops prontos'}</b></summary>
          <RankTops tops={g.tops.slice(0, g.cur)} />
        </details>
      )}
    </div>
  );
}

/** Votação da posição: a carta do personagem da vez e as posições, com as livres virando botões de voto. */
function RankVote({ v, vote, slots }: { v: RoomView; vote: VoteView; slots: (Entry | null)[] }) {
  const res = vote.result;
  const anim = useSpinAnim(res?.spin ?? null, v.code);
  const show = !!res && anim.done;
  const it = vote.items[0]!;
  const free = vote.pos?.free ?? slots.flatMap((e, i) => (e ? [] : [i]));
  const mark = (pos: number): RankMark | undefined => {
    if (!free.includes(pos)) return undefined;
    const cls = [vote.mine === pos && 'mine', anim.lit === pos && 'lit', anim.picked === pos && 'picked', show && (res!.win === pos ? 'win' : 'lose')];
    return {
      cls: cls.filter(Boolean).join(' '),
      tag: vote.mine === pos && !show ? <span className="mine-tag">seu voto</span> : undefined,
      tally: show ? <Tally res={res!} i={pos} /> : undefined,
    };
  };
  const empate = nomeLista((res?.tie ?? []).map(lugar));
  return (
    <>
      <div className="rank-play" id="onRankPlay" data-seq={vote.seq}>
        <div className="rank-now" id="onRankNow">
          <Card key={vote.seq} it={it} index={0} isStatic hideKey extra={<span>{show ? `${lugar(res!.win)} lugar` : 'Qual posição?'}</span>} />
        </div>
        <RankBoard id="onRankBoard" slots={slots} free={free} keys mark={mark}
          onPick={res ? undefined : pos => player.vote(vote.seq, pos)} ghost={show ? { pos: res!.win, it } : null} />
      </div>
      <div className="vote-info" id="onVoteInfo" role="status">
        {!res && <p style={{ margin: 0 }}>
          {vote.mine == null ? 'Vote numa posição livre.' : `Voto registrado no ${lugar(vote.mine)} lugar (dá pra trocar até todos votarem).`}{' '}
          <Faltam v={v} />
        </p>}
        {res && !show && <p style={{ margin: 0 }}><b>{res.how === 'roleta' ? 'O host girou a roleta…' : `Empate entre ${empate} lugar! A roleta decide…`}</b></p>}
        {show && <p style={{ margin: 0 }} id="onResult">
          <b>{it.name}</b> ({label(it.fr)}) fica no <b>{lugar(res!.win)} lugar</b>{' '}
          {res!.how === 'votos' && `com ${votos(res!.counts[res!.win] ?? 0)}.`}
          {res!.how === 'empate' && `pela roleta, depois de um empate entre ${empate} lugar.`}
          {res!.how === 'roleta' && 'pela roleta do host.'}
          {v.cfg.secret && <span className="mute"> Voto secreto: só a contagem aparece.</span>}
        </p>}
      </div>
      <HostCtl v={v} res={res} show={show} />
    </>
  );
}

function RankEnd({ v, g }: { v: RoomView; g: RankView }) {
  return (
    <div className="panel stack" id="onRankEnd">
      <h2 style={{ margin: 0 }}>{g.tops.length > 1 ? 'Tops prontos' : 'Top pronto'}</h2>
      <RankTops id="onRankTops" tops={g.tops} />
      {v.me === v.hostId && <p className="mute" style={{ margin: 0 }}>Pra jogar de novo, volte ao lobby e comece outra partida.</p>}
    </div>
  );
}
