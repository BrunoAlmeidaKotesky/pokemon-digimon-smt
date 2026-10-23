import { KEYS } from '../../sources';
import { app, label, statsReset } from '../../state/app';
import { meter } from '../../core/stats';

/** Placar: taxa de vitória por franquia, maior sequência e últimas escolhas (Duelo, Trio e Quarteto). */
export function Stats() {
  const s = app.stats;
  return (
    <section id="stats" hidden={app.mode !== 'stats'}>
      <div className="stack">
        <div className="panel stack">
          <h3>Taxa de vitória por franquia</h3>
          <p className="mute" style={{ margin: 0, fontSize: 13 }}>Duelo, Trio e Quarteto. Salvo neste navegador.</p>
          <div id="statsList" className="stack">
            {KEYS.map(k => {
              const { w, n, pct } = meter(s, k);
              return (
                <div className="meter" key={k}>
                  <b>{label(k)}</b>
                  <div className="track"><div className="fill" style={{ width: `${pct}%`, background: `var(--${k})` }}></div></div>
                  <span className="n">{pct}% · {w}/{n}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="panel"><h3>Maior sequência no Duelo</h3><div id="bestStreak" className="records">
          {s.best
            ? <span><b>{s.best.name}</b> <span className="mute">({label(s.best.fr)})</span>: {s.best.streak} vitórias seguidas</span>
            : <span className="mute">Nenhuma sequência ainda.</span>}
        </div></div>
        <div className="panel"><h3>Últimas escolhas</h3><ol id="histList">
          {s.hist.length ? s.hist.map((h, i) => <li key={i}>{h}</li>) : <li className="mute">Nada ainda.</li>}
        </ol></div>
        <div><button className="btn" id="statsReset" onClick={statsReset}>Zerar placar</button></div>
      </div>
    </section>
  );
}
