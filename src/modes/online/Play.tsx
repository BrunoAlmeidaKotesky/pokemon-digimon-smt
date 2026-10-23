import { Fragment } from 'react';
import type { Entry } from '../../types';
import type { RoomView, VoteView } from '../../online/types';
import { host, player } from '../../online/runtime';
import { label } from '../../state/app';
import { Card } from '../../components/Card';
import { SpinButton } from '../../components/SpinButton';
import { Bracket } from '../../components/Bracket';
import { useSpinAnim } from './useSpinAnim';
import { DraftPlay } from './Draft';

const MODE_TITLE = { duel: 'Duelo', trio: 'Trio', cup: 'Campeonato', draft: 'Draft' } as const;
const votos = (n: number) => `${n} ${n === 1 ? 'voto' : 'votos'}`;
const nomeLista = (ns: string[]) => ns.length <= 1 ? ns.join('') : ns.slice(0, -1).join(', ') + ' e ' + ns.at(-1);

/** Partida online: cartas da votação, quem já votou, resultado e os controles do host. */
export function Play({ v }: { v: RoomView }) {
  const isHost = v.me === v.hostId;
  const g = v.game;
  const champ = g?.mode === 'cup' ? g.cup.champ : null;
  return (
    <div className="stack" id="onPlay">
      <div className="bar">
        <h2 style={{ margin: 0 }} id="onTitle">{g?.mode === 'cup' ? (champ ? 'Campeão' : g.title) : MODE_TITLE[v.cfg.mode]}</h2>
        {g?.mode === 'cup' && !champ && <span className="mute" id="onCount">{g.count}</span>}
        <span className="grow" />
        {isHost && <button className="btn" id="onLobbyBtn" onClick={host.lobby}>Voltar ao lobby</button>}
      </div>
      {g?.mode === 'draft' ? <DraftPlay v={v} /> : v.vote && <VoteBox v={v} vote={v.vote} />}
      {champ && g?.mode === 'cup' && <CupEnd v={v} />}
      {g?.mode === 'cup' && (
        <details className="panel" open id="onBracket">
          <summary><b>Chaveamento</b></summary>
          <div className="bracket"><Bracket cup={g.cup} /></div>
        </details>
      )}
    </div>
  );
}

export function VoteBox({ v, vote }: { v: RoomView; vote: VoteView }) {
  const isHost = v.me === v.hostId;
  const res = vote.result;
  const anim = useSpinAnim(res?.spin ?? null, v.code);
  const show = !!res && anim.done;
  const n = vote.items.length;
  const cls = n === 2 ? 'arena two' : n === 3 ? 'arena three' : 'arena grid';
  const nameOf = (id: string) => v.players.find(p => p.id === id)?.name ?? '?';
  const faltam = v.players.filter(p => !p.voted);
  return (
    <>
      <div className={cls} id="onArena" data-seq={vote.seq}>
        {vote.items.map((it: Entry, i) => (
          <Fragment key={vote.seq + ':' + i}>
            {i > 0 && n <= 3 && <span className="vs">VS</span>}
            <Card it={it} index={i} lit={anim.lit === i} picked={anim.picked === i}
              extra={<>{vote.extras[i] && <span className="crown">{vote.extras[i]}</span>}{vote.mine === i && <span className="mine-tag">seu voto</span>}</>}
              cls={[vote.mine === i && 'mine', show && (res!.win === i ? 'win' : 'lose')].filter(Boolean).join(' ')}
              onClick={() => { if (!res) player.vote(vote.seq, i); }}>
              {show && (
                <span className="tally" data-votos={res!.counts[i]}>
                  <b>{votos(res!.counts[i] ?? 0)}</b>
                  {res!.voters && res!.voters[i]!.length > 0 && <span className="who">{res!.voters[i]!.join(', ')}</span>}
                </span>
              )}
            </Card>
          </Fragment>
        ))}
      </div>
      <div className="vote-info" id="onVoteInfo" role="status">
        {!res && <p style={{ margin: 0 }}>
          {vote.mine == null ? 'Escolha uma carta.' : 'Voto registrado (dá pra trocar até todos votarem).'}{' '}
          <span className="mute">Votaram {v.players.length - faltam.length} de {v.players.length}.{faltam.length > 0 && ` Falta: ${faltam.map(p => p.name + (p.online ? '' : ' (fora do ar)')).join(', ')}.`}</span>
        </p>}
        {res && !show && <p style={{ margin: 0 }}><b>{res.how === 'roleta' ? 'O host girou a roleta…' : `Empate entre ${nomeLista((res.tie ?? []).map(i => vote.items[i]!.name))}! A roleta decide…`}</b></p>}
        {show && <p style={{ margin: 0 }} id="onResult">
          <b>{vote.items[res!.win]!.name}</b> ({label(vote.items[res!.win]!.fr)}){' '}
          {res!.how === 'votos' && `venceu com ${votos(res!.counts[res!.win] ?? 0)}.`}
          {res!.how === 'empate' && `venceu na roleta, depois de um empate entre ${nomeLista((res!.tie ?? []).map(i => vote.items[i]!.name))}.`}
          {res!.how === 'roleta' && 'foi escolhido pela roleta do host.'}
          {v.cfg.secret && <span className="mute"> Voto secreto: só a contagem aparece.</span>}
        </p>}
      </div>
      {isHost && (
        <div className="bar host-ctl">
          {!res && faltam.length > 0 && <button className="btn" id="onClose" title="Fecha a votação com os votos que já tem" onClick={host.close}>Encerrar votação</button>}
          {!res && v.cfg.roulette && <SpinButton onSpin={host.spin} disabled={false} />}
          {show && <button className="btn main" id="onNext" onClick={host.next}>Próximo</button>}
          {res && !show && <span className="mute">girando…</span>}
        </div>
      )}
      {!isHost && show && <p className="mute" style={{ margin: 0 }}>Esperando {nameOf(v.hostId)} (host) continuar…</p>}
    </>
  );
}

function CupEnd({ v }: { v: RoomView }) {
  if (v.game?.mode !== 'cup' || !v.game.cup.champ) return null;
  const c = v.game.cup;
  const vice = c.losers[2]?.[0], semis = c.losers[4] ?? [];
  const line = (it: Entry | undefined) => it ? <>{it.name} <span className="mute">({label(it.fr)})</span></> : null;
  return (
    <div className="panel stack" id="onCupEnd">
      <div className="arena two"><Card it={c.champ!} index={0} isStatic hideKey extra={<span className="crown">♛ campeão</span>} /></div>
      <p style={{ margin: 0 }}>2º lugar: {line(vice)}</p>
      <p style={{ margin: 0 }}>Semifinalistas: {semis.map((s, i) => <span key={i}>{i > 0 && ', '}{line(s)}</span>)}</p>
    </div>
  );
}
