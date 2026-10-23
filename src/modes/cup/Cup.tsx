import type { Entry } from '../../types';
import { app, label, emit, setCupCfg, setCupFr, cupStart, cupQuit, cupAgain } from '../../state/app';
import { roundName } from '../../core/cup';
import { Arena } from '../../components/Arena';
import { Card } from '../../components/Card';
import { SpinButton } from '../../components/SpinButton';
import { Bracket } from '../../components/Bracket';

const SIZES = [8, 16, 32, 64, 128];
const line = (it: Entry | undefined) => it ? <>{it.name} <span className="mute">({label(it.fr)})</span></> : null;

/** Campeonato mata-mata de 8 a 128, com chaveamento visual. */
export function Cup() {
  const c = app.cup, h = app.cupHidden;
  const pair = c && !c.champ ? [c.round[c.i]!, c.round[c.i + 1]!] : [];
  const vice = c?.losers[2]?.[0], semis = c?.losers[4] ?? [];
  return (
    <section id="cup" hidden={app.mode !== 'cup'}>
      <div id="cupSetup" className="panel stack" hidden={h.setup}>
        <h2>Novo campeonato</h2>
        <label>Participantes <select id="cupSize" value={app.cupCfg.size} onChange={e => setCupCfg({ size: +e.target.value })}>
          {SIZES.map(n => <option key={n} value={n}>{n}</option>)}
        </select></label>
        <div className="bar" id="cupFr">
          {app.avail.map(k => (
            <label key={k}><input type="checkbox" id={'cup_' + k} checked={!!app.cupCfg.frs[k]} onChange={e => setCupFr(k, e.target.checked)} /> {label(k)}</label>
          ))}
        </div>
        <label><input type="checkbox" id="cupEven" checked={app.cupCfg.even} onChange={e => setCupCfg({ even: e.target.checked })} /> Dividir as vagas igualmente entre as franquias</label>
        <label><input type="checkbox" id="cupMix" checked={app.cupCfg.mix} onChange={e => setCupCfg({ mix: e.target.checked })} /> Evitar confronto entre a mesma franquia (os pares são refeitos a cada rodada)</label>
        <div><button className="btn main" id="cupStart" onClick={cupStart}>{app.cupStartLabel}</button></div>
      </div>
      <div id="cupPlay" hidden={h.play}>
        <div className="bar">
          <h2 id="cupRound" style={{ margin: 0 }}>{c && !c.champ ? roundName(c.round.length) : ''}</h2>{' '}
          <span className="mute" id="cupCount">{c && !c.champ ? `confronto ${c.i / 2 + 1} de ${c.round.length / 2}` : ''}</span>{' '}
          <button className="btn" id="cupQuit" onClick={cupQuit}>Abandonar</button>
        </div>
        <Arena id="cupRow" className="arena two" row="cup" items={pair} />
        <SpinButton />
      </div>
      <div id="cupEnd" hidden={h.end}>
        {c?.champ && (
          <div className="panel stack">
            <h2>Campeão</h2>
            <div className="arena two" id="champRow">
              <Card it={c.champ} index={0} isStatic hideKey extra={<span className="crown">♛ campeão</span>} />
            </div>
            <p style={{ margin: 0 }}>2º lugar: {line(vice)}</p>
            <p style={{ margin: 0 }}>Semifinalistas: {semis.map((s, i) => <span key={i}>{i > 0 && ', '}{line(s)}</span>)}</p>
            <div><button className="btn main" id="cupAgain" onClick={cupAgain}>Novo campeonato</button></div>
          </div>
        )}
      </div>
      <details id="cupLog" className="panel" hidden={h.log} open style={{ marginTop: 12 }} onToggle={() => emit()}>
        <summary><b>Chaveamento</b></summary>
        <div className="bracket" id="cupLogBody">{c && <Bracket cup={c} />}</div>
      </details>
    </section>
  );
}
