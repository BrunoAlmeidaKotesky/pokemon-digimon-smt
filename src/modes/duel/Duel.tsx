import type { Entry } from '../../types';
import { app, setDuelFr, duelSkip } from '../../state/app';
import { Arena } from '../../components/Arena';
import { Crown } from '../../components/Card';
import { FranchiseSelect } from '../../components/FranchiseSelect';
import { SpinButton } from '../../components/SpinButton';

/** Duelo, estilo rei do morro: quem é escolhido fica; o outro lado manda um novo desafiante. */
export function Duel() {
  return (
    <section id="duel" hidden={app.mode !== 'duel'}>
      <div className="bar">
        <FranchiseSelect id="duelA" ariaLabel="Franquia da esquerda" value={app.duelFr[0]} onChange={k => setDuelFr(0, k)} />{' '}
        <span className="vsx">VS</span>{' '}
        <FranchiseSelect id="duelB" ariaLabel="Franquia da direita" value={app.duelFr[1]} onChange={k => setDuelFr(1, k)} />
        <button className="btn" id="duelSkip" onClick={duelSkip}>Trocar os dois</button>
      </div>
      <Arena id="duelRow" className="arena two" row="duel" waiting={app.duelWaiting}
        items={app.duel.slots as Entry[]} extras={app.duel.streak.map((s, i) => <Crown key={i} streak={s} />)} />
      <SpinButton />
      <p className="hint">Quem você escolhe fica na arena; o outro lado manda um novo desafiante. Teclas 1 e 2 escolhem; R gira a roleta.</p>
    </section>
  );
}
