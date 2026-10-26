import { app, label, setRankCfg, setRankFr, rankStart, rankPlace, rankQuit, rankAgain } from '../../state/app';
import { RANK_SIZE, rankDone, rankEntry, rankTop } from '../../core/rank';
import { Card } from '../../components/Card';
import { FranchiseToggle, Stepper, Switch } from '../../components/Controls';
import { RankBoard, RankTops, topTitle } from '../../components/RankBoard';

const lista = (ns: string[]) => (ns.length <= 1 ? ns.join('') : ns.slice(0, -1).join(', ') + ' e ' + ns.at(-1));

/** Uma linha dizendo o que a configuração vai montar (só com as franquias já carregadas). */
function resumo(frs: string[], size: number, mix: boolean): string {
  if (!frs.length) return 'Marque pelo menos uma franquia.';
  const nomes = frs.map(label);
  if (!mix) return frs.length === 1 ? `${topTitle(frs[0]!, size)}.` : `${frs.length} tops de ${size}, um depois do outro: ${lista(nomes)}.`;
  if (frs.length === 1) return `${topTitle(frs[0]!, size)}.`;
  const base = Math.floor(size / frs.length);
  const cada = size % frs.length ? `${base} ou ${base + 1} de cada` : `${base} de cada`;
  return `Um top de ${size} com ${lista(nomes)} misturados (${cada}, em ordem sorteada).`;
}

/** Ranking às cegas: um personagem por vez vai pra uma posição do top e fica travado lá. */
export function Rank() {
  const r = app.rank;
  return (
    <section id="rank" hidden={app.mode !== 'rank'}>
      {!r ? <Setup /> : rankDone(r) ? <End /> : <Play />}
    </section>
  );
}

function Setup() {
  const c = app.rankCfg;
  const prontas = app.avail.filter(k => c.frs[k] && app.lists[k]?.length);
  return (
    <div id="rankSetup" className="panel stack">
      <h2 style={{ margin: 0 }}>Novo ranking</h2>
      <p className="mute" style={{ margin: 0 }}>Aparece um personagem por vez e você escolhe a posição dele no top, sem saber quem vem depois. Depois de colocado, ele não sai mais do lugar.</p>
      <div className="row-label"><span>Tamanho do top</span>
        <Stepper id="rankSize" ariaLabel="Tamanho do top" value={c.size} min={RANK_SIZE.min} max={RANK_SIZE.max} onChange={n => setRankCfg({ size: n })} />
      </div>
      <div className="fr-toggles" id="rankFr">
        {app.avail.map(k => <FranchiseToggle key={k} k={k} id={'rank_' + k} checked={!!c.frs[k]} onChange={on => setRankFr(k, on)} />)}
      </div>
      <Switch id="rankMix" title="Misturar as franquias" checked={c.mix} onChange={on => setRankCfg({ mix: on })}>
        Um top só com todas as franquias marcadas, com as vagas divididas igualmente. Desligado, cada franquia tem o próprio top, um depois do outro.
      </Switch>
      <p className="mute" id="rankResumo" style={{ margin: 0 }}>{resumo(prontas, c.size, c.mix)}</p>
      <div><button className="btn main big" id="rankStart" onClick={rankStart}>{app.rankStartLabel}</button></div>
    </div>
  );
}

function Play() {
  const r = app.rank!;
  const t = rankTop(r)!;
  const e = rankEntry(r)!;
  const placed = t.slots.filter(Boolean).length;
  return (
    <div id="rankPlay">
      <div className="bar">
        <h2 id="rankTitle" style={{ margin: 0 }}>{topTitle(t.fr, t.slots.length)}</h2>
        <span className="mute" id="rankCount">{placed + 1} de {t.slots.length}{r.tops.length > 1 && ` · top ${r.cur + 1} de ${r.tops.length}`}</span>
        <span className="grow" />
        <button className="btn" id="rankQuit" onClick={rankQuit}>Abandonar</button>
      </div>
      <div className="rank-play">
        <div className="rank-now" id="rankNow">
          <Card key={`${r.cur}:${placed}`} it={e} index={0} isStatic hideKey extra={<span>Qual posição?</span>} />
        </div>
        <RankBoard id="rankBoard" slots={t.slots} onPick={rankPlace} keys />
      </div>
      <p className="hint">Toque numa posição livre pra colocar o personagem (teclas 1 a 9, e 0 pra 10ª). Depois de colocado, não muda mais.</p>
      {r.cur > 0 && (
        <details className="panel" id="rankDoneTops">
          <summary><b>{r.cur === 1 ? 'Top pronto' : 'Tops prontos'}</b></summary>
          <RankTops tops={r.tops.slice(0, r.cur)} />
        </details>
      )}
    </div>
  );
}

function End() {
  const r = app.rank!;
  return (
    <div id="rankEnd" className="panel stack">
      <h2 style={{ margin: 0 }}>{r.tops.length > 1 ? 'Seus tops' : 'Seu top'}</h2>
      <RankTops id="rankTops" tops={r.tops} />
      <div className="bar" style={{ margin: 0 }}>
        <button className="btn main" id="rankAgain" onClick={rankAgain}>Jogar de novo</button>
        <button className="btn" id="rankSetupBtn" onClick={rankQuit}>Mudar configuração</button>
      </div>
    </div>
  );
}
