import type { Entry } from '../../types';
import type { DraftView, OnlineConfig, Qualified, RoomView } from '../../online/types';
import { host, player } from '../../online/runtime';
import { label } from '../../state/app';
import { Card } from '../../components/Card';
import { Bracket } from '../../components/Bracket';
import { keyOf } from '../../components/Arena';
import { VoteBox } from './Play';

const X_OPTS = [2, 3, 4, 5, 6];
const ROUND_OPTS = [1, 2, 3, 4, 5];
const lista = (ns: string[]) => ns.length <= 1 ? ns.join('') : ns.slice(0, -1).join(', ') + ' e ' + ns.at(-1);
const quem = (e: Entry) => { const q = e as Partial<Qualified>; return q.byName ? `de ${q.byName} · R${q.round}` : undefined; };

/** Configuração do Draft no lobby: franquias na ordem, opções por franquia e nº de rodadas. */
export function DraftConfig({ c, isHost, set, frs }: { c: OnlineConfig; isHost: boolean; set: (p: Partial<OnlineConfig>) => void; frs: string[] }) {
  const d = c.draft;
  const mudar = (patch: Partial<OnlineConfig['draft']>) => set({ draft: { ...d, ...patch } });
  const mover = (i: number, dir: -1 | 1) => { const a = [...d.frs]; [a[i], a[i + dir]] = [a[i + dir]!, a[i]!]; mudar({ frs: a }); };
  const fora = frs.filter(k => !d.frs.includes(k));
  return (
    <div className="stack" id="onDraftCfg">
      <p className="mute" style={{ margin: 0 }}>Franquias, na ordem em que cada um monta o time:</p>
      <ol className="draft-frs" id="onDraftFrs">
        {d.frs.map((k, i) => (
          <li key={k} data-fr={k} style={{ borderLeftColor: `var(--${k})` }}>
            <span className="nm">{label(k) || k}</span>
            {isHost && <span className="acts">
              <button className="btn mini" aria-label={`Subir ${label(k)}`} disabled={i === 0} onClick={() => mover(i, -1)}>↑</button>
              <button className="btn mini" aria-label={`Descer ${label(k)}`} disabled={i === d.frs.length - 1} onClick={() => mover(i, 1)}>↓</button>
              <button className="btn mini" aria-label={`Tirar ${label(k)}`} disabled={d.frs.length === 1} onClick={() => mudar({ frs: d.frs.filter(x => x !== k) })}>×</button>
            </span>}
          </li>
        ))}
      </ol>
      {isHost && fora.length > 0 && (
        <div className="bar" id="onDraftAdd">
          {fora.map(k => <button key={k} className="btn mini" data-add={k} onClick={() => mudar({ frs: [...d.frs, k] })}>+ {label(k)}</button>)}
        </div>
      )}
      <div className="bar">
        <label>Opções por franquia <select id="onDraftX" value={d.x} disabled={!isHost} onChange={e => mudar({ x: +e.target.value })}>
          {X_OPTS.map(n => <option key={n} value={n}>{n}</option>)}
        </select></label>
        <label>Rodadas <select id="onDraftRounds" value={d.rounds} disabled={!isHost} onChange={e => mudar({ rounds: +e.target.value })}>
          {ROUND_OPTS.map(n => <option key={n} value={n}>{n}</option>)}
        </select></label>
      </div>
    </div>
  );
}

/** Partida do Draft: escolha secreta, revelação com votação por franquia, final e fim. */
export function DraftPlay({ v }: { v: RoomView }) {
  const g = v.game as DraftView;
  const F = g.frs.length;
  return (
    <div className="stack" id="onDraft" data-step={g.step}>
      <p className="draft-round" id="onDraftRound">
        {g.step === 'final' || g.step === 'end' ? 'Final' : <>Rodada {g.round} de {g.rounds}</>}
        {g.step === 'pick' && <> · <span className="mute">monte seu time em segredo</span></>}
        {g.step === 'reveal' && <> · Revelação: <b>{label(g.frs[g.reveal]!)}</b> <span className="mute">({g.reveal + 1} de {F})</span></>}
        {g.step === 'final' && g.title && <> · <b>{g.title}</b> <span className="mute">{g.count}</span></>}
      </p>
      {g.step === 'pick' && <DraftPick v={v} g={g} />}
      {(g.step === 'reveal' || g.step === 'final') && v.vote && <VoteBox v={v} vote={v.vote} />}
      {g.step === 'end' && <DraftEnd g={g} />}
      {g.final && (g.step === 'final' || g.step === 'end') && (
        <details className="panel" open id="onBracket">
          <summary><b>Chaveamento da final</b></summary>
          <div className="bracket"><Bracket cup={g.final} title={quem} /></div>
        </details>
      )}
      {g.qualified.length > 0 && g.step !== 'end' && <Classificados g={g} />}
    </div>
  );
}

function DraftPick({ v, g }: { v: RoomView; g: DraftView }) {
  const isHost = v.me === v.hostId;
  const me = g.me;
  const F = g.frs.length;
  const escolhendo = g.progress.filter(p => p.state === 'escolhendo');
  const prontos = g.progress.filter(p => p.state === 'pronto');
  return (
    <>
      {!me && <p className="note" id="onDraftWait">Você entrou no meio da rodada: monta o time na próxima. Enquanto isso, os outros escolhem.</p>}
      {me?.skipped && <p className="note" id="onDraftWait">O host seguiu sem você nesta rodada. Você volta na próxima.</p>}
      {me && !me.skipped && me.fi != null && (
        <>
          <p style={{ margin: 0 }} id="onDraftAsk">Escolha 1 de <b>{label(g.frs[me.fi]!)}</b> <span className="mute">({me.fi + 1} de {F})</span></p>
          <div className={me.opts.length === 2 ? 'arena two' : me.opts.length === 3 ? 'arena three' : 'arena grid'} id="onDraftOpts" data-att={me.att} data-fi={me.fi}>
            {me.opts.map((it, i) => (
              <Card key={keyOf(it) + ':' + me.att + ':' + me.fi} it={it} index={i} onClick={() => player.pick(g.round, me.att, i)} />
            ))}
          </div>
        </>
      )}
      {me && !me.skipped && me.fi == null && (
        <p className="note" id="onDraftDone">Seu time está pronto!{escolhendo.length > 0 && ` Esperando: ${lista(escolhendo.map(p => p.name))}.`}</p>
      )}
      {me && me.picks.some(Boolean) && (
        <div id="onMyTeam">
          <p className="mute" style={{ margin: '0 0 4px' }}>Seu time nesta rodada (só você vê):</p>
          <ul className="team">
            {me.picks.map((p, fi) => p && <li key={fi} data-fr={p.fr} style={{ borderLeftColor: `var(--${p.fr})` }}><span className="mute">{label(g.frs[fi]!)}:</span> {p.name}</li>)}
          </ul>
        </div>
      )}
      {isHost && escolhendo.length > 0 && prontos.length > 0 && (
        <div className="bar host-ctl">
          <button className="btn" id="onSkip" title="Quem ainda não terminou fica fora desta rodada" onClick={host.skip}>Seguir sem quem falta ({lista(escolhendo.map(p => p.name))})</button>
        </div>
      )}
    </>
  );
}

function Classificados({ g }: { g: DraftView }) {
  return (
    <div className="panel" id="onQualified">
      <h3 style={{ margin: '0 0 6px' }}>Classificados pra final ({g.qualified.length})</h3>
      <ul className="team">
        {g.qualified.map(q => (
          <li key={q.k ?? q.name} data-fr={q.fr} style={{ borderLeftColor: `var(--${q.fr})` }}>
            {q.img && <img src={q.img} alt="" loading="lazy" />} <b>{q.name}</b> <span className="mute">({label(q.fr)}) de {q.byName} · R{q.round}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DraftEnd({ g }: { g: DraftView }) {
  const c = g.champion;
  return (
    <div className="stack">
      {c && (
        <div className="panel stack" id="onDraftEnd">
          <h2 style={{ margin: 0 }}>Campeão do Draft</h2>
          <div className="arena two"><Card it={c} index={0} isStatic hideKey extra={<span className="crown">♛ campeão</span>} /></div>
          <p style={{ margin: 0 }} id="onDraftChampion">Escolhido por <b>{c.byName}</b> na rodada {c.round}.</p>
        </div>
      )}
      {g.history && (
        <div className="panel stack" id="onDraftHistory">
          <h3 style={{ margin: 0 }}>O que cada um escolheu</h3>
          {g.history.map(h => (
            <div key={h.round} data-round={h.round}>
              <h4 style={{ margin: '4px 0' }}>Rodada {h.round}</h4>
              <ul className="team hist">
                {h.teams.map(t => (
                  <li key={t.id} data-jogador={t.name}><b>{t.name}:</b> {t.picks.map((p, i) => <span key={i}>{i > 0 && ', '}{p.name} <span className="mute">({label(p.fr)})</span></span>)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
