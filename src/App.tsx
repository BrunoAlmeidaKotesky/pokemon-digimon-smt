import { useApp, setMode, statusText, type Mode } from './state/app';
import { Duel } from './modes/duel/Duel';
import { Trio } from './modes/trio/Trio';
import { Cup } from './modes/cup/Cup';
import { Stats } from './modes/stats/Stats';
import { Online } from './modes/online/Online';

const TABS: [Mode, string][] = [['duel', 'Duelo'], ['trio', 'Trio'], ['cup', 'Campeonato'], ['stats', 'Placar'], ['online', 'Online']];

export function App() {
  const app = useApp();
  return (
    <div className="wrap">
      <header>
        <h1>
          <span className="p">Pokémon</span> x <span className="d">Digimon</span> x <span className="s">SMT</span> x <span className="j">JoJo</span> x <span className="y">Yu-Gi-Oh!</span> x <span className="b">Bakugan</span>
          <span id="h1suji" hidden={!app.sujiVisible}> x <span className="sj">Sujimon</span></span>
        </h1>
        <div id="status">{statusText()}</div>
      </header>
      <nav>
        {TABS.map(([m, t]) => <button key={m} data-mode={m} className={app.mode === m ? 'on' : undefined} onClick={() => setMode(m)}>{t}</button>)}
      </nav>
      <Duel />
      <Trio />
      <Cup />
      <Stats />
      <Online />
    </div>
  );
}
