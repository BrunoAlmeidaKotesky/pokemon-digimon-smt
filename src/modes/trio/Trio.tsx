import { Fragment } from 'react';
import type { Entry } from '../../types';
import { app, setTrioFr, trioSkip } from '../../state/app';
import { Arena } from '../../components/Arena';
import { Crown } from '../../components/Card';
import { FranchiseSelect } from '../../components/FranchiseSelect';
import { SpinButton } from '../../components/SpinButton';

/** Trio: quem vence fica; os outros dois lados mandam novos desafiantes. */
export function Trio() {
  return (
    <section id="trio" hidden={app.mode !== 'trio'}>
      <div className="bar">
        {([0, 1, 2] as const).map(i => (
          <Fragment key={i}>
            {i > 0 && <>{' '}<span className="vsx">VS</span>{' '}</>}
            <FranchiseSelect id={'trio' + i} ariaLabel={'Franquia ' + (i + 1)} value={app.trioFr[i]} onChange={k => setTrioFr(i, k)} />
          </Fragment>
        ))}{' '}
        <button className="btn" id="trioSkip" onClick={trioSkip}>Trocar os três</button>
      </div>
      <Arena id="trioRow" className="arena three" row="trio" waiting={app.trioWaiting || !app.trio.slots}
        items={(app.trio.slots ?? []) as Entry[]} extras={app.trio.streak.map((s, i) => <Crown key={i} streak={s} />)} />
      <SpinButton />
      <p className="hint">Quem você escolhe fica; os outros dois lados mandam novos desafiantes. Teclas 1, 2 e 3 escolhem; R gira a roleta.</p>
    </section>
  );
}
