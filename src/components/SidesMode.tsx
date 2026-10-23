import { Fragment } from 'react';
import type { Entry } from '../types';
import { app, multiSkip, setSideFr, type Multi } from '../state/app';
import { Arena } from './Arena';
import { Crown } from './Card';
import { FranchiseSelect } from './FranchiseSelect';
import { SpinButton } from './SpinButton';

/** Trio e Quarteto: um seletor por lado, a arena (rei do morro com N lados), a roleta e a dica. */
export function SidesMode({ m, arena, skip, hint }: { m: Multi; arena: string; skip: string; hint: string }) {
  const s = app[m];
  return (
    <section id={m} hidden={app.mode !== m}>
      <div className="bar">
        {s.fr.map((k, i) => (
          <Fragment key={i}>
            {i > 0 && <>{' '}<span className="vsx">VS</span>{' '}</>}
            <FranchiseSelect id={m + i} ariaLabel={'Franquia ' + (i + 1)} value={k} onChange={x => setSideFr(m, i, x)} />
          </Fragment>
        ))}{' '}
        <button className="btn" id={m + 'Skip'} onClick={() => multiSkip(m)}>{skip}</button>
      </div>
      <Arena id={m + 'Row'} className={'arena ' + arena} row={m} waiting={s.waiting || !s.slots}
        items={(s.slots ?? []) as Entry[]} extras={s.streak.map((n, i) => <Crown key={i} streak={n} />)} />
      <SpinButton />
      <p className="hint">{hint}</p>
    </section>
  );
}
